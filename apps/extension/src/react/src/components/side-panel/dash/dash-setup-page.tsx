import { useDashStore } from '@/stores/dash-store';
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
import { useNavigate } from 'react-router';

export function DashSetupPage() {
  const { cancelDash, logEvent, changeDashInfo } = useDashStore();
  const navigate = useNavigate();

  const dashSetupForm = useForm<DashInfo>({
    resolver: zodResolver(dashInfoSchema),
    defaultValues: {
      name: '',
      category: '',
      notes: '',
      isMonetized: false,
      hourlyRate: 0,
    },
  });

  const handleCancelDash = () => {
    cancelDash();
    navigate('/home');
  };

  const handleStartDash = (formValues: DashInfo) => {
    // Update Dash metadata
    changeDashInfo(formValues);

    // Begin the timer w/ start event
    logEvent({
      action: 'start',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Let's start a dash!</h1>
        <p className="text-sm text-muted-foreground">
          Add relevant details if you have them. Don't worry — you can always
          add this later!
        </p>
      </div>

      <Form {...dashSetupForm}>
        <form
          onSubmit={dashSetupForm.handleSubmit(handleStartDash)}
          className="space-y-4"
        >
          <FormField
            control={dashSetupForm.control}
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
            control={dashSetupForm.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
            control={dashSetupForm.control}
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
            control={dashSetupForm.control}
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
                    control={dashSetupForm.control}
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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDash}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Start Dash
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
