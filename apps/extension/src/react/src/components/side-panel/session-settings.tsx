import { TooltipConfigurer } from '@/components/ui/tooltip-configurer';
import { useAppSettings } from '@/hooks/use-app-settings';
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
import { TooltipProvider } from '@repo/ui/components/tooltip';
import { HelpCircle } from 'lucide-react';

export function SessionSettings() {
  const {
    hourlyRate,
    handleHourlyRateChange,
    projectName,
    handleProjectNameChange,
    projectDescription,
    handleProjectDescriptionChange,
  } = useAppSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Settings</CardTitle>
        <CardDescription>
          Set your hourly rate to track earnings. Make informed decisions about
          your work schedule based on your {"time's"} value.
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
                  handleHourlyRateChange(Number(e.target.value));
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
                  handleProjectNameChange(e.target.value);
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
                  handleProjectDescriptionChange(e.target.value);
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
