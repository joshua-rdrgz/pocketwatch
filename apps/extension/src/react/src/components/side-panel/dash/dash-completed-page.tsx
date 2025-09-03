import { useDashStore } from '@/stores/dash-store';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

export function DashCompletedPage() {
  const completeDash = useDashStore((state) => state.completeDash);
  const navigate = useNavigate();

  const handleFinishDash = () => {
    completeDash();
    navigate('/home');
  };

  return (
    <div className="space-y-6">
      {/* Dash Summary Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-xl">Dash Complete</CardTitle>
          <CardDescription>
            Review your dash summary before finalizing
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Final Action Button */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={handleFinishDash} className="w-full" size="lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            Finish Dash
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            This will finalize your dash and save all data
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
