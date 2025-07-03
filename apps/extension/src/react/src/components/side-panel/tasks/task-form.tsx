import { useUpdateTask } from '@/hooks/tasks';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Textarea } from '@repo/ui/components/textarea';
import { DateTimePicker } from '@repo/ui/components/datetime-picker';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  notes: z.string().optional(),
  isBillable: z.boolean(),
  rate: z.string(),
  scheduledStart: z.date().optional(),
  scheduledEnd: z.date().optional(),
  status: z.enum(['not_started', 'in_progress', 'complete']),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task?: any; // Task type from your hooks
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TaskForm({
  task,
  projectId,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const { mutateAsync: updateTask, isPending: isUpdateTaskPending } =
    useUpdateTask();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: task?.name || '',
      notes: task?.notes || '',
      isBillable: task?.isBillable || false,
      rate: task?.rate || '0',
      scheduledStart: task?.scheduledStart
        ? new Date(task.scheduledStart)
        : undefined,
      scheduledEnd: task?.scheduledEnd
        ? new Date(task.scheduledEnd)
        : undefined,
      status: task?.status || 'not_started',
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        name: task.name,
        notes: task.notes || '',
        isBillable: task.isBillable,
        rate: task.rate,
        scheduledStart: task.scheduledStart
          ? new Date(task.scheduledStart)
          : undefined,
        scheduledEnd: task.scheduledEnd
          ? new Date(task.scheduledEnd)
          : undefined,
        status: task.status,
      });
    }
  }, [task, form]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (task) {
        await updateTask(
          {
            id: task.id,
            data: { ...data, projectId },
          },
          {
            onSuccess: () => onSuccess(),
          }
        );
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter task name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter task notes (optional)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isBillable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Billable</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduledStart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Start</FormLabel>
              <FormControl>
                <DateTimePicker {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduledEnd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled End</FormLabel>
              <FormControl>
                <DateTimePicker {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {field.value === 'not_started' && 'Todo'}
                      {field.value === 'in_progress' && 'Active'}
                      {field.value === 'complete' && 'Done'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Todo</SelectItem>
                    <SelectItem value="in_progress">Active</SelectItem>
                    <SelectItem value="complete">Done</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdateTaskPending}>
            {isUpdateTaskPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
