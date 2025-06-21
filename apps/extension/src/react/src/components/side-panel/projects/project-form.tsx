import { useCreateProject } from '@/hooks/projects/use-create-project';
import { useUpdateProject } from '@/hooks/projects/use-update-project';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectResponse } from '@repo/shared/types/project';
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
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  defaultBillable: z.boolean(),
  defaultRate: z.string(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: ProjectResponse['project'] | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProjectForm({
  project,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const { mutateAsync: createProject, isPending: isCreateProjectPending } =
    useCreateProject();
  const { mutateAsync: updateProject, isPending: isUpdateProjectPending } =
    useUpdateProject();

  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      defaultBillable: project?.defaultBillable || false,
      defaultRate: project?.defaultRate || '0',
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description || '',
        defaultBillable: project.defaultBillable,
        defaultRate: project.defaultRate,
      });
    }
  }, [project, form]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      if (project) {
        await updateProject({
          id: project.id,
          data,
        });
      } else {
        await createProject(data);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const isLoading = isCreateProjectPending || isUpdateProjectPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter project name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter project description (optional)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultBillable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Default Billable</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Rate</FormLabel>
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

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : project ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
