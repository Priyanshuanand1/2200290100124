interface AuthToken {
  token_type: string;
  access_token: string;
  expires_in: number;
}

interface AuthState {
  token: AuthToken;
  lastRefresh: number;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState;
  private readonly TOKEN_REFRESH_THRESHOLD = 300; // 5 minutes in seconds

  private constructor() {
    this.authState = {
      token: {
        token_type: "Bearer",
        access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ2ODA0NDY4LCJpYXQiOjE3NDY4MDQxNjgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjMxNjY3YTFmLWFkZjQtNGNjNC1hNDA1LTM2ZTk3YmJkNzBmOSIsInN1YiI6InByaXlhbnNodS4yMjI2Y3NlMTA5QGtpZXQuZWR1In0sImVtYWlsIjoicHJpeWFuc2h1LjIyMjZjc2UxMDlAa2lldC5lZHUiLCJuYW1lIjoicHJpeWFuc2h1IGFuYW5kIiwicm9sbE5vIjoiMjIwMDI5MDEwMDEyNCIsImFjY2Vzc0NvZGUiOiJTeFZlamEiLCJjbGllbnRJRCI6IjMxNjY3YTFmLWFkZjQtNGNjNC1hNDA1LTM2ZTk3YmJkNzBmOSIsImNsaWVudFNlY3JldCI6Ilp1QXJ0dk5IZEpZUlRiUWoifQ.Wal0NEBLTbNEjTBc4AFPqd3eRnc16B-4pBF6Suwyexk",
        expires_in: 1746804468
      },
      lastRefresh: Date.now()
    };
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private isTokenExpired(): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.authState.token.expires_in;
    return now >= expiresIn - this.TOKEN_REFRESH_THRESHOLD;
  }

  private async refreshToken(): Promise<void> {
    try {
      // In a real application, you would make an API call to refresh the token
      // For now, we'll just update the lastRefresh timestamp
      this.authState.lastRefresh = Date.now();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Authentication failed: Unable to refresh token');
    }
  }

  public async getAuthHeader(): Promise<Record<string, string>> {
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }

    return {
      Authorization: `${this.authState.token.token_type} ${this.authState.token.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  public getToken(): AuthToken {
    return { ...this.authState.token };
  }

  public async validateToken(): Promise<boolean> {
    try {
      if (this.isTokenExpired()) {
        await this.refreshToken();
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const authService = AuthService.getInstance();

export const getAuthHeader = async () => authService.getAuthHeader();
