import { useDashStore } from '@/stores/dash-store';
import { DashEvent } from '@repo/shared/types/dash';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Button } from '@repo/ui/components/button';
import { ChartColumnBig, Save, X, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { validateAndSortDashEvents } from '@repo/shared/lib/dash-validation';
import { EditableEventRow } from './editable-event-row';

interface EventFormData {
  events: DashEvent[];
}

export function EditableEventTimeline() {
  const { events, adjustEvents } = useDashStore();
  const lastEventsRef = useRef<DashEvent[]>([]);
  const [originalEvents, setOriginalEvents] = useState<DashEvent[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const { control, handleSubmit, reset, watch } = useForm<EventFormData>({
    defaultValues: {
      events: events,
    },
  });

  const { fields, update } = useFieldArray({
    control,
    name: 'events',
  });

  const watchedEvents = watch('events');

  // Track when form becomes dirty
  useEffect(() => {
    const hasChanges = JSON.stringify(watchedEvents) !== JSON.stringify(events);
    setIsDirty(hasChanges);
  }, [watchedEvents, events]);

  // Update form when events from server change
  useEffect(() => {
    if (events.length > 0) {
      const eventsChanged =
        JSON.stringify(events) !== JSON.stringify(lastEventsRef.current);
      if (eventsChanged) {
        toast.success('Timeline synced with server', { duration: 2000 });
        lastEventsRef.current = events;
        reset({ events });
        // Store original events when first received
        if (originalEvents.length === 0) {
          setOriginalEvents(events);
        }
      }
    }
  }, [events, reset, originalEvents.length]);

  const handleEventChange = (
    index: number,
    updates: Partial<Pick<DashEvent, 'action' | 'timestamp'>>
  ) => {
    const currentEvent = fields[index];
    update(index, { ...currentEvent, ...updates });
  };

  const onSubmit = (data: EventFormData) => {
    try {
      // Validate before sending
      validateAndSortDashEvents(data.events);
      adjustEvents(data.events);
      setIsDirty(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Invalid events: ${error.message}`);
      } else {
        toast.error('Invalid event configuration');
      }
    }
  };

  const handleCancel = () => {
    reset({ events });
    setIsDirty(false);
  };

  const handleRevert = () => {
    if (originalEvents.length > 0) {
      reset({ events: originalEvents });
      toast.success('Reverted to original events');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Event Timeline</CardTitle>
            <CardDescription>
              Review and adjust your dash events - click on actions or times to
              edit
            </CardDescription>
          </div>
          {events.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRevert}
                disabled={
                  originalEvents.length === 0 ||
                  JSON.stringify(watchedEvents) ===
                    JSON.stringify(originalEvents)
                }
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Revert
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={!isDirty}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit(onSubmit)}
                disabled={!isDirty}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs hidden min-[350px]:table-cell">
                    Details
                  </TableHead>
                  <TableHead className="text-xs text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <EditableEventRow
                    key={field.id}
                    event={field}
                    onEventChange={(updates) =>
                      handleEventChange(index, updates)
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ChartColumnBig className="mb-2 h-10 w-10 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">
                        No events yet...
                      </h3>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
