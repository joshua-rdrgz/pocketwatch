import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessage as Message,
  ExtensionMessageType as MessageType,
  ExtensionRuntimeResponse as RuntimeResponse,
} from '@repo/shared/types/extension-connection';
import { createAuthClient } from 'better-auth/client';

export class AuthService {
  private authClient: ReturnType<typeof createAuthClient>;

  constructor() {
    this.authClient = createAuthClient({
      // URL of ExpressJS Server
      baseURL: 'http://localhost:3001',
    });
  }

  async handleRuntimeMessage(msg: Message): Promise<RuntimeResponse | null> {
    switch (msg.type) {
      case MessageType.AUTH_GET_USER_SESSION:
        try {
          const { data } = await this.authClient.getSession();
          return { success: true, data };
        } catch (error) {
          return { success: false, error };
        }

      case MessageType.AUTH_GOOGLE_SIGN_IN: {
        this.broadcast(MessageType.AUTH_SET_OAUTH_LOADING, true);
        const { data: signInData } = await this.signIn();
        if (signInData?.url) {
          try {
            const data = await this.handleOAuthProcess(signInData.url);
            return { success: true, data };
          } catch (error) {
            return { success: false, error };
          }
        }
        return { success: false, error: 'No sign-in URL received' };
      }

      case MessageType.AUTH_GOOGLE_SIGN_OUT: {
        try {
          await this.authClient.signOut();
          this.broadcast(MessageType.AUTH_SIGNOUT_SUCCESSFUL);
          return {
            success: true,
            data: {
              message: 'Successfully signed out.  See you later!',
              redirectUrl: '/login',
            },
          };
        } catch (error) {
          return { success: false, error };
        }
      }

      default:
        return null; // Not handled by this service
    }
  }

  private async handleOAuthProcess(url: string) {
    const tab = await chrome.tabs.create({
      url,
      active: true,
    });

    return new Promise((resolve, reject) => {
      const handleTabUpdate = async (
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo
      ) => {
        // Tab is the OAuth Sign in Tab and has a redirect URL
        if (tabId === tab.id && changeInfo.url) {
          // Redirect URL is successful or failed
          if (
            changeInfo.url.includes('/overview') ||
            changeInfo.url.includes('/login')
          ) {
            chrome.tabs.remove(tabId);
            chrome.tabs.onUpdated.removeListener(handleTabUpdate);
            chrome.tabs.onRemoved.removeListener(handleTabRemove);

            // If Authentication Successful
            if (changeInfo.url.includes('/overview')) {
              this.broadcast(MessageType.AUTH_SET_OAUTH_LOADING, false);
              this.broadcast(MessageType.AUTH_SIGNIN_SUCCESSFUL);
              resolve('Authentication successful');
            } else {
              this.broadcast(MessageType.AUTH_SET_OAUTH_LOADING, false);
              reject('Authentication failed');
            }
          }
        }
      };

      const handleTabRemove = (tabId: number) => {
        // If tab is created OAuth Tab
        if (tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(handleTabUpdate);
          chrome.tabs.onRemoved.removeListener(handleTabRemove);
          this.broadcast(MessageType.AUTH_SET_OAUTH_LOADING, false);
          reject(new Error('Authentication cancelled - tab was closed'));
        }
      };

      chrome.tabs.onUpdated.addListener(handleTabUpdate);
      chrome.tabs.onRemoved.addListener(handleTabRemove);

      // Timeout Authentication after 5 Minutes
      setTimeout(
        () => {
          chrome.tabs.onUpdated.removeListener(handleTabUpdate);
          chrome.tabs.onRemoved.removeListener(handleTabRemove);
          this.broadcast(MessageType.AUTH_SET_OAUTH_LOADING, false);
          reject(new Error('Authentication timeout'));
        },
        5 * 60 * 1000 // 5 minutes
      );
    });
  }

  private broadcast(type: MessageType, payload?: unknown) {
    chrome.runtime.sendMessage(createExtensionMessage(type, payload));
  }

  private async signIn() {
    return await this.authClient.signIn.social({
      provider: 'google',
      callbackURL: '/overview',
      errorCallbackURL: '/login?error=social_auth_failed',
      disableRedirect: true,
    });
  }
}
