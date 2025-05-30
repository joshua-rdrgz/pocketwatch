import { createAuthClient } from 'better-auth/client';
// import { request } from './request';

export class AuthWorker {
  private authClient: ReturnType<typeof createAuthClient>;

  constructor() {
    this.authClient = createAuthClient({
      baseURL: 'http://localhost:3001', // URL of ExpressJS Server
    });

    this.registerListeners();
  }

  private registerListeners() {
    chrome.runtime.onMessage.addListener(
      async (message, _sender, sendResponse) => {
        switch (message.type) {
          case 'GET_USER_SESSION': {
            try {
              const { data } = await this.getSession();
              sendResponse({ success: true, data });
            } catch (error) {
              sendResponse({ success: false, error });
            }
            break;
          }
          case 'GOOGLE_SIGN_IN': {
            this.broadcast('SET_OAUTH_LOADING', true);
            const { data: signInData } = await this.signIn();
            if (signInData?.url) {
              this.handleOAuthProcess(signInData.url)
                .then((data) => sendResponse({ success: true, data }))
                .catch((error) => sendResponse({ success: false, error }));
            }
            break;
          }
          case 'GOOGLE_SIGN_OUT': {
            try {
              await this.signOut();
              this.broadcast('SIGNOUT_SUCCESSFUL');
              sendResponse({
                success: true,
                message: 'Successfully signed out.  See you later!',
                redirectUrl: '/login',
              });
            } catch (error) {
              sendResponse({ success: false, error });
            }
          }
        }

        // Return "true" for async responses
        return true;
      }
    );
  }

  private async getSession() {
    return await this.authClient.getSession();
  }

  private async signIn() {
    return await this.authClient.signIn.social({
      provider: 'google',
      callbackURL: '/overview',
      errorCallbackURL: '/login?error=social_auth_failed',
      disableRedirect: true,
    });
  }

  private async signOut() {
    return await this.authClient.signOut();
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
              this.broadcast('SET_OAUTH_LOADING', false);
              this.broadcast('SIGNIN_SUCCESSFUL');
              resolve('Authentication successful');
            } else {
              this.broadcast('SET_OAUTH_LOADING', false);
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
          this.broadcast('SET_OAUTH_LOADING', false);
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
          this.broadcast('SET_OAUTH_LOADING', false);
          reject(new Error('Authentication timeout'));
        },
        5 * 60 * 1000 // 5 minutes
      );
    });
  }

  private async broadcast(type: string, payload?: unknown) {
    chrome.runtime.sendMessage({ type, payload });
  }
}
