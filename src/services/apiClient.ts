/**
 * @deprecated Use the API layer (src/api/*.ts) instead.
 * This stub exists to maintain backward compatibility with legacy tests.
 */

class ApiClient {
  private _userId: string | null = null;

  setAuthContext(userId: string | null): void {
    this._userId = userId;
  }

  getAuthContext(): string | null {
    return this._userId;
  }
}

export const apiClient = new ApiClient();
