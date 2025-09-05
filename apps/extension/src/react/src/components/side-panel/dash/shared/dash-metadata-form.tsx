import { zodResolver } from '@hookform/resolvers/zod';
import { type DashInfo, dashInfoSchema } from '@repo/shared/lib/dash';
import { Button } from '@repo/ui/components/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from '@repo/ui/components/switch';
import { Textarea } from '@repo/ui/components/textarea';
import { useForm } from 'react-hook-form';

interface DashMetadataFormProps {
  defaultValues: DashInfo;
  onSubmit: (data: DashInfo) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  showCancelButton?: boolean;
  validateChanges?: boolean;
}

export function DashMetadataForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitButtonText = 'Submit',
  showCancelButton = false,
  validateChanges = false,
}: DashMetadataFormProps) {
  const form = useForm<DashInfo>({
    resolver: zodResolver(dashInfoSchema),
    defaultValues,
  });

  const handleSubmit = (data: DashInfo) => {
    onSubmit(data);
    // Reset the form after successful submission to mark it as pristine
    form.reset(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dash Name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="bg-card"
                  placeholder="Enter dash name..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
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
                  rows={3}
                  placeholder="Add any notes or details..."
                  className="bg-card"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isMonetized"
          render={({ field }) => (
            <FormItem className="rounded-lg border border-2 p-4 space-y-4">
              <div className="flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Monetized</FormLabel>
                  <FormDescription>
                    Track billable time for this dash
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </div>

              {field.value && (
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field: rateField }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="25.00"
                          step="0.01"
                          min="0"
                          className="bg-card"
                          {...rateField}
                          onChange={(e) =>
                            rateField.onChange(Number(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </FormItem>
          )}
        />

        <div
          className={`flex gap-3 pt-4 ${!showCancelButton ? 'justify-end' : ''}`}
        >
          {showCancelButton && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className={showCancelButton ? 'flex-1' : 'w-full'}
            disabled={validateChanges && !form.formState.isDirty}
          >
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
