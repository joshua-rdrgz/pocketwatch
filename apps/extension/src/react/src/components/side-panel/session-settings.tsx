import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { TooltipConfigurer } from '@/components/ui/tooltip-configurer';
import { TooltipProvider } from '@repo/ui/components/tooltip';
import { HelpCircle } from 'lucide-react';

interface SessionSettingsProps {
  hourlyRate: number;
  onHourlyRateChange(hourlyRate: number): void;
  projectName: string;
  onProjectNameChange(projectName: string): void;
  projectDescription: string;
  onProjectDescriptionChange(projectDescription: string): void;
}

export function SessionSettings({
  hourlyRate,
  onHourlyRateChange,
  projectName,
  onProjectNameChange,
  projectDescription,
  onProjectDescriptionChange,
}: SessionSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Settings</CardTitle>
        <CardDescription>
          Set your hourly rate to track earnings. Make informed decisions about
          your work schedule based on your time's value.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="hourly-rate" className="text-foreground">
                  Hourly Rate ($)
                </Label>
                <TooltipConfigurer
                  tooltipContent="Your hourly rate to calculate earnings from this work session."
                  side="top"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipConfigurer>
              </div>
              <Input
                id="hourly-rate"
                type="number"
                value={hourlyRate}
                onChange={(e) => {
                  onHourlyRateChange(Number(e.target.value));
                }}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="project-name" className="text-foreground">
                  Project Name
                </Label>
                <TooltipConfigurer
                  tooltipContent="Use a name to organize and keep track of this work session down the road."
                  side="top"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipConfigurer>
              </div>
              <Input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => {
                  onProjectNameChange(e.target.value);
                }}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="project-description"
                  className="text-foreground"
                >
                  Project Description
                </Label>
                <TooltipConfigurer
                  tooltipContent="Any additional details about your project or work session."
                  side="top"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipConfigurer>
              </div>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => {
                  onProjectDescriptionChange(e.target.value);
                }}
                className="w-full"
              />
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
