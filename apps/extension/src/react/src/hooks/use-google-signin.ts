import { authClient } from '@/config/auth';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function useGoogleSignIn() {
  const [isPending, setIsPending] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    try {
      const { data } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/overview',
        errorCallbackURL: '/login?error=social_auth_failed',
        disableRedirect: true, // Handle redirect manually
      });

      if (data?.url) {
        // Open the OAuth URL in a new tab
        const tab = await chrome.tabs.create({
          url: data.url,
          active: true,
        });

        // Listen for tab updates to detect when the OAuth flow completes
        const updateListener = (
          tabId: number,
          changeInfo: chrome.tabs.TabChangeInfo
        ) => {
          if (tabId === tab.id && changeInfo.url) {
            // Check if the URL contains our callback
            if (
              changeInfo.url.includes('/overview') ||
              changeInfo.url.includes('/login')
            ) {
              // OAuth flow completed, close the tab and refresh the extension
              chrome.tabs.remove(tabId);
              chrome.tabs.onUpdated.removeListener(updateListener);

              // Refresh the current extension page to check auth status
              window.location.reload();
              toast.success('Signed in.  Welcome!');
            }
          }
        };

        // Listen for tab removal to set isPending to false
        const removeListener = (tabId: number) => {
          if (tabId === tab.id) {
            setIsPending(false);
            chrome.tabs.onRemoved.removeListener(removeListener);
            chrome.tabs.onUpdated.removeListener(updateListener);
          }
        };

        chrome.tabs.onUpdated.addListener(updateListener);
        chrome.tabs.onRemoved.addListener(removeListener);

        // Clean up listeners after 5 minutes to prevent memory leaks
        setTimeout(
          () => {
            chrome.tabs.onUpdated.removeListener(updateListener);
            chrome.tabs.onRemoved.removeListener(removeListener);
            setIsPending(false);
          },
          5 * 60 * 1000
        );
      }
    } catch (error) {
      console.error('OAuth sign-in error:', error);
      setIsPending(false);
      // Handle error appropriately
    }
  };

  return { handleGoogleSignIn, isPending };
}
