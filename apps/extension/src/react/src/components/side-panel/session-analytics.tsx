import { useSessionStore } from '@/stores/session-store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Coffee, Globe, LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

interface AnalyticsData {
  icon: LucideIcon;
  title: string;
  renderContent(params: {
    breaksTaken: number;
    forbiddenWebsitesVisited: number;
    totalWebsitesVisited: number;
  }): React.ReactNode;
}

const ANALYTICS_DATA: AnalyticsData[] = [
  {
    icon: Coffee,
    title: 'Breaks Taken',
    renderContent({ breaksTaken }) {
      return <div className="text-bold text-2xl">{breaksTaken}</div>;
    },
  },
  {
    icon: Globe,
    title: 'Website Activity',
    renderContent({ forbiddenWebsitesVisited, totalWebsitesVisited }) {
      return (
        <div className="flex flex-col gap-1 text-end min-[400px]:text-start">
          <strong className="text-2xl">
            <span className="text-red-500">{forbiddenWebsitesVisited}</span>
            <span className="text-muted-foreground text-sm ml-1">
              / {totalWebsitesVisited}
            </span>
          </strong>
          <small className="text-xs text-muted-foreground">
            Forbidden vs total sites
          </small>
        </div>
      );
    },
  },
];

export function SessionAnalytics() {
  const events = useSessionStore((state) => state.events);

  // Count breaks taken (break events)
  const breaksTaken = useMemo(() => {
    return events.filter(
      (event) => event.type === 'stopwatch' && event.action === 'break'
    ).length;
  }, [events]);

  // Hardcoded website metrics
  const forbiddenWebsitesVisited = 3;
  const totalWebsitesVisited = 15;

  return (
    <section className="grid gap-4 min-[400px]:grid-cols-2 sm:grid-cols-3">
      {ANALYTICS_DATA.map(({ title, icon: Icon, renderContent }) => (
        <Card
          key={title}
          className="flex flex-row justify-between items-center p-2 min-[400px]:block min-[400px]:items-start min-[400px]:p-0"
        >
          <CardHeader className="p-1 min-[400px]:p-3">
            <CardTitle className="flex items-center gap-2 min-w-max">
              <Icon className="h-4 w-4" />
              <span className="font-light text-muted-foreground">{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-1 flex items-center min-[400px]:p-3">
            {renderContent({
              breaksTaken,
              forbiddenWebsitesVisited,
              totalWebsitesVisited,
            })}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
