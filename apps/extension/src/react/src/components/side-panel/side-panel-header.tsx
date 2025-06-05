import { SidePanelActions } from '@/components/side-panel/side-panel-actions';
import { useGoogleSignOut } from '@/hooks/auth/use-google-sign-out';
import { useSignoutListeners } from '@/hooks/auth/use-signout-listeners';
import { useUserSession } from '@/hooks/auth/use-user-session';
import { useAppSettings } from '@/hooks/use-app-settings';
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
import { LogOut } from 'lucide-react';

export function SidePanelHeader() {
  const { isSessionFinished } = useAppSettings();
  const { data: userSession, isPending } = useUserSession();
  const { mutate: signOutViaGoogle } = useGoogleSignOut();

  useSignoutListeners();

  const handleSignOut = () => {
    signOutViaGoogle();
  };

  return (
    <header
      className={cn(
        'w-full bg-primary/10 text-primary backdrop-blur-md rounded-b-3xl px-4 pt-6 border-b shadow-sm',
        isSessionFinished ? 'pb-2' : 'pb-4'
      )}
    >
      <div className="flex justify-between items-center gap-5">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Pocketwatch</h1>
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
              <DropdownMenuLabel className="text-xs">Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
