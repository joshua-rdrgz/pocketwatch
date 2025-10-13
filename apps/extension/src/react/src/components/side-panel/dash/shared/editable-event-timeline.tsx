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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import { ChartColumnBig, Save, X, RotateCcw, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { validateAndSortDashEvents } from '@repo/shared/lib/dash-validation';
import { EditableEventRow } from './editable-event-row';

interface EventFormData {
  events: DashEvent[];
}

export function EditableEventTimeline() {
  const { events, originalEvents, adjustEvents, revertEvents } = useDashStore();
  const lastEventsRef = useRef<DashEvent[]>([]);
  const [serverEvents, setServerEvents] = useState<DashEvent[]>([]);

  const { control, handleSubmit, reset, watch } = useForm<EventFormData>({
    defaultValues: {
      events: events,
    },
  });

  const { fields, update, append, remove } = useFieldArray({
    control,
    name: 'events',
  });

  const watchedEvents = watch('events');

  // Update form when events from server change
  useEffect(() => {
    if (events.length > 0) {
      const eventsChanged =
        JSON.stringify(events) !== JSON.stringify(lastEventsRef.current);
      if (eventsChanged) {
        toast.success('Timeline synced with server', { duration: 2000 });
        lastEventsRef.current = events;
        setServerEvents(events);
        reset({ events });
      }
    }
  }, [events, reset]);

  const handleEventChange = (
    index: number,
    updates: Partial<Pick<DashEvent, 'action' | 'timestamp'>>
  ) => {
    const currentEvent = fields[index];
    update(index, { ...currentEvent, ...updates });
  };

  const handleAddEvent = () => {
    append({
      id: `temp-${Date.now()}`,
      // We don't want a default action here, we want to let the user decide
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: undefined as any,
      timestamp: Date.now(),
    });
  };

  const handleDeleteEvent = (index: number) => {
    remove(index);
  };

  const onSubmit = (data: EventFormData) => {
    try {
      // Validate before sending
      validateAndSortDashEvents(data.events);
      adjustEvents(data.events);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Invalid events: ${error.message}`);
      } else {
        toast.error('Invalid event configuration');
      }
    }
  };

  const handleCancel = () => {
    reset({ events: serverEvents });
  };

  const handleRevert = () => {
    if (originalEvents?.length || 0 > 0) {
      revertEvents();
    }
  };

  const clientMatchesServer =
    JSON.stringify(watchedEvents) === JSON.stringify(serverEvents);
  const serverMatchesOriginal =
    originalEvents === null ||
    JSON.stringify(serverEvents) === JSON.stringify(originalEvents);

  const showCancelSave = !clientMatchesServer && serverMatchesOriginal;
  const showRevert = clientMatchesServer && !serverMatchesOriginal;
  const showAll = !clientMatchesServer && !serverMatchesOriginal;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>
            Review and adjust your dash events - click on actions or times to
            edit
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <>
            {(showCancelSave || showRevert || showAll) && (
              <div className="flex items-center justify-end gap-2 mb-4">
                <TooltipProvider>
                  {(showRevert || showAll) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRevert}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Revert
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-semibold">Revert</p>
                        <p className="text-xs">Reset to original events</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {(showCancelSave || showAll) && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">Cancel</p>
                          <p className="text-xs">Discard changes</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" onClick={handleSubmit(onSubmit)}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">Save</p>
                          <p className="text-xs">Apply changes to server</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </TooltipProvider>
              </div>
            )}
            <div className="overflow-hidden rounded-lg border">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs hidden min-[350px]:table-cell">
                      Details
                    </TableHead>
                    <TableHead className="text-xs text-right">Time</TableHead>
                    <TableHead className="text-xs w-12"></TableHead>
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
                      onDelete={() => handleDeleteEvent(index)}
                    />
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <Button
                        variant="ghost"
                        onClick={handleAddEvent}
                        className="w-full h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-none"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
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
