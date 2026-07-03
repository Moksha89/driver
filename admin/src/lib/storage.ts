export const AUTH_TOKEN_KEY = 'fleet-safety-admin-token';

export function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function storeToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}
