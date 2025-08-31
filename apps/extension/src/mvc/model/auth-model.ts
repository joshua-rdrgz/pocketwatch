import { createAuthClient } from 'better-auth/client';
import { BaseModel } from './base';
import { oneTimeTokenClient } from 'better-auth/client/plugins';

export type UserSession = ReturnType<
  typeof createAuthClient
>['$Infer']['Session'];

interface AuthState {
  isAuthenticated: boolean;
  userSession: UserSession | null;
  error: string | null;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  userSession: null,
  error: null,
};

export class AuthModel extends BaseModel<AuthState> {
  private authClient: ReturnType<typeof createAuthClient>;

  constructor() {
    super(initialAuthState);

    this.authClient = createAuthClient({
      baseURL: 'http://localhost:3001',
      plugins: [oneTimeTokenClient()],
    });
  }

  async getSession() {
    this.setState({ error: null });

    try {
      const { data } = await this.authClient.getSession();

      const authState: Omit<AuthState, 'error'> = {
        isAuthenticated: !!data?.session.id,
        userSession: data,
      };

      this.setState(authState);
      return authState;
    } catch (error) {
      this.setState({
        isAuthenticated: false,
        userSession: null,
        error:
          error instanceof Error ? error.message : 'Session Retrieval Failed',
      });
    }
  }

  async signIn() {
    this.setState({ error: null });

    try {
      const result = await this.authClient.signIn.social({
        provider: 'google',
        callbackURL: '/home',
        errorCallbackURL: '/login?error=social_auth_failed',
        disableRedirect: true,
      });

      return result;
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Sign In Failed',
      });
      throw error;
    }
  }

  async signOut() {
    this.setState({ error: null });

    try {
      await this.authClient.signOut();
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Sign Out Failed',
      });
      throw error;
    }
  }

  async getOneTimeToken() {
    this.setState({ error: null });

    try {
      // @ts-expect-error For whatever reason "oneTimeToken" isn't getting picked up
      const { data } = await this.authClient.oneTimeToken.generate();
      return data?.token || null;
    } catch (error) {
      this.setState({
        error:
          error instanceof Error
            ? error.message
            : 'One Time Token Retrieval Failed',
      });
      throw error;
    }
  }
}
