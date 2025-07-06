import { SidePanelActions } from '@/components/side-panel/side-panel-actions';
import { useGoogleSignOut } from '@/hooks/auth/use-google-sign-out';
import { useSignoutListeners } from '@/hooks/auth/use-signout-listeners';
import { useUserSession } from '@/hooks/auth/use-user-session';
import { useAppSettings } from '@/hooks/use-app-settings';
import { formatCurrentDate } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@repo/ui/lib/utils';
import { LogOut, PanelRightClose } from 'lucide-react';
import { useEffect, useState } from 'react';

export function SidePanelHeader() {
  const { isSessionFinished } = useAppSettings();
  const { data: userSession, isPending } = useUserSession();
  const { mutate: signOutViaGoogle } = useGoogleSignOut();
  const [currentDate, setCurrentDate] = useState('');

  useSignoutListeners();

  // Update current date every minute
  useEffect(() => {
    const ONE_MINUTE = 60000; // 1 min in milliseconds

    const updateCurrentDate = () => {
      const currDate = formatCurrentDate();
      setCurrentDate(currDate);
    };

    updateCurrentDate();

    const interval = setInterval(updateCurrentDate, ONE_MINUTE);

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    signOutViaGoogle();
  };

  const handleClosePanel = () => {
    window.close();
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 w-full bg-card text-foreground px-4 pt-6 border-b border-muted shadow-sm z-50',
        isSessionFinished ? 'pb-2' : 'pb-4'
      )}
    >
      <div className="flex justify-between items-center gap-5">
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground">Pocketwatch</p>
          <h1 className="text-lg min-[325px]:text-2xl font-bold">
            {currentDate}
          </h1>
        </div>
        {isPending ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                <AvatarImage
                  src={userSession?.user.image as string | undefined}
                />
                <AvatarFallback>
                  {userSession?.user.name
                    .split(' ')
                    .map((word) => word[0]) // first letter of each word
                    .join('')
                    .toLocaleUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuLabel className="text-xs">
                Settings
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={handleClosePanel} className="text-xs">
                <PanelRightClose className="h-3 w-3" />
                Close panel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Account</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={handleSignOut}
                variant="destructive"
                className="text-xs"
              >
                <LogOut className="h-3 w-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <SidePanelActions />
    </header>
  );
}
