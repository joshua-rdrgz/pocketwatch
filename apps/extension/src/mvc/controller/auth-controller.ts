/* eslint-disable @typescript-eslint/no-explicit-any */
import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessage,
  ExtensionMessageType,
  ExtensionRuntimeResponse,
} from '@repo/shared/types/extension-connection';
import { AuthModel } from '../model/auth-model';
import { BaseRuntimeController } from './base-runtime';

interface AuthControllerOptions {
  onLogin?(): void;
  onLogout?(): void;
}

export class AuthController extends BaseRuntimeController {
  private authModel: AuthModel;
  private onLogin?: () => void;
  private onLogout?: () => void;

  constructor(options: AuthControllerOptions = {}) {
    super();

    this.authModel = this.registerModel('auth', new AuthModel());

    this.onLogin = options.onLogin;
    this.onLogout = options.onLogout;
  }

  protected async handleMessage(
    msg: ExtensionMessage,
    _sender: chrome.runtime.MessageSender
  ): Promise<ExtensionRuntimeResponse | null> {
    switch (msg.type) {
      case ExtensionMessageType.AUTH_GET_USER_SESSION:
        try {
          const data = await this.authModel.getSession();
          return { success: true, data: data?.userSession };
        } catch (error) {
          return { success: false, error };
        }

      case ExtensionMessageType.AUTH_GOOGLE_SIGN_IN: {
        this.broadcastAuthMessage(
          ExtensionMessageType.AUTH_SET_OAUTH_LOADING,
          true
        );
        const { data: signInData } = await this.authModel.signIn();
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

      case ExtensionMessageType.AUTH_GOOGLE_SIGN_OUT: {
        try {
          await this.authModel.signOut();
          this.broadcastAuthMessage(
            ExtensionMessageType.AUTH_SIGNOUT_SUCCESSFUL
          );
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
        return null;
    }
  }

  protected onModelChange(_modelName: string, _state: any): void {
    // Auth controller doesn't use models yet
  }

  async isSignedIn(): Promise<boolean> {
    try {
      const data = await this.authModel.getSession();
      return !!data?.userSession?.session.id;
    } catch {
      return false;
    }
  }

  async getOneTimeToken(): Promise<string | null> {
    console.log('[auth-controller] getOneTimeToken called!');
    try {
      const oneTimeToken = await this.authModel.getOneTimeToken();
      return oneTimeToken || null;
    } catch (error) {
      console.error('Failed to get session token:', error);
      return null;
    }
  }

  private async handleOAuthProcess(url: string): Promise<string> {
    const tab = await chrome.tabs.create({
      url,
      active: true,
    });

    return new Promise((resolve, reject) => {
      const handleTabUpdate = async (
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo
      ) => {
        if (tabId === tab.id && changeInfo.url) {
          if (
            changeInfo.url.includes('/overview') ||
            changeInfo.url.includes('/login')
          ) {
            chrome.tabs.remove(tabId);
            chrome.tabs.onUpdated.removeListener(handleTabUpdate);
            chrome.tabs.onRemoved.removeListener(handleTabRemove);

            if (changeInfo.url.includes('/overview')) {
              this.broadcastAuthMessage(
                ExtensionMessageType.AUTH_SET_OAUTH_LOADING,
                false
              );
              this.broadcastAuthMessage(
                ExtensionMessageType.AUTH_SIGNIN_SUCCESSFUL
              );
              resolve('Authentication successful');
            } else {
              this.broadcastAuthMessage(
                ExtensionMessageType.AUTH_SET_OAUTH_LOADING,
                false
              );
              reject('Authentication failed');
            }
          }
        }
      };

      const handleTabRemove = (tabId: number) => {
        if (tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(handleTabUpdate);
          chrome.tabs.onRemoved.removeListener(handleTabRemove);
          this.broadcastAuthMessage(
            ExtensionMessageType.AUTH_SET_OAUTH_LOADING,
            false
          );
          reject(new Error('Authentication cancelled - tab was closed'));
        }
      };

      chrome.tabs.onUpdated.addListener(handleTabUpdate);
      chrome.tabs.onRemoved.addListener(handleTabRemove);

      setTimeout(
        () => {
          chrome.tabs.onUpdated.removeListener(handleTabUpdate);
          chrome.tabs.onRemoved.removeListener(handleTabRemove);
          this.broadcastAuthMessage(
            ExtensionMessageType.AUTH_SET_OAUTH_LOADING,
            false
          );
          reject(new Error('Authentication timeout'));
        },
        5 * 60 * 1000
      );
    });
  }

  private broadcastAuthMessage(
    type: ExtensionMessageType,
    payload?: unknown
  ): void {
    this.broadcast(createExtensionMessage(type, payload));

    switch (type) {
      case ExtensionMessageType.AUTH_SIGNIN_SUCCESSFUL:
        this.onLogin?.();
        break;
      case ExtensionMessageType.AUTH_SIGNOUT_SUCCESSFUL:
        console.log('[auth-controller] Auth Signout Successful, logging out!');
        this.onLogout?.();
        break;
    }
  }
}
