const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5800';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vendly_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export function saveToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vendly_token', token);
    document.cookie = `vendly_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}
export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vendly_token');
    document.cookie = 'vendly_token=; path=/; max-age=0; SameSite=Lax';
  }
}
export function getToken() {
  if (typeof window !== 'undefined') return localStorage.getItem('vendly_token');
  return null;
}
export function saveUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vendly_user', JSON.stringify(user));
    window.dispatchEvent(new StorageEvent('storage', { key: 'vendly_user' }));
  }
}
export function getUser() {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('vendly_user');
  return u ? JSON.parse(u) : null;
}
export function removeUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vendly_user');
    window.dispatchEvent(new StorageEvent('storage', { key: 'vendly_user' }));
  }
}

export function getProductImage(images: any, fallback = ''): string {
  if (!images) return fallback;
  const arr = Array.isArray(images) ? images : [images];
  if (arr.length === 0) return fallback;
  return arr[0]?.url || arr[0]?.imageUrl || fallback;
}

export async function uploadFile(file: File): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vendly_token') : null;
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${BASE_URL}/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Upload failed');
  return data.url;
}
