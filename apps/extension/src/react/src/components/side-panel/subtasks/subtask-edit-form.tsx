import { zodResolver } from '@hookform/resolvers/zod';
import type { Subtask } from '@repo/shared/types/db';
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
import { Textarea } from '@repo/ui/components/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const subtaskSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  isComplete: z.boolean(),
});

type SubtaskFormData = z.infer<typeof subtaskSchema>;

interface SubtaskEditFormProps {
  subtask: Subtask;
  onSave: (subtask: Subtask) => void;
  onCancel: () => void;
}

export function SubtaskEditForm({
  subtask,
  onSave,
  onCancel,
}: SubtaskEditFormProps) {
  const form = useForm<SubtaskFormData>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: {
      name: subtask.name,
      notes: subtask.notes || '',
      isComplete: subtask.isComplete,
    },
  });

  const onSubmit = (data: SubtaskFormData) => {
    const updatedSubtask: Subtask = {
      ...subtask,
      ...data,
      notes: data.notes || null,
      updatedAt: new Date(),
    };
    onSave(updatedSubtask);
  };

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter subtask name..." {...field} />
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
                    placeholder="Add any additional notes or details..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isComplete"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Mark as complete</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
