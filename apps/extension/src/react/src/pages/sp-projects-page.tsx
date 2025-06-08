import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';

export function SPProjectsPage() {
  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projects</CardTitle>
          <CardDescription>View and manage your projects</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Project management features coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
