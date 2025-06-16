import { useParams } from 'react-router';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';

export function SPProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Project ID: {id}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Project detail view coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
