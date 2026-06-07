const API_URL = import.meta.env.VITE_API_URL || 'https://marga-tour-api.celalla.workers.dev';

function getToken(): string | null {
  return localStorage.getItem('marga_token');
}

export function setToken(token: string) {
  localStorage.setItem('marga_token', token);
}

export function clearToken() {
  localStorage.removeItem('marga_token');
  localStorage.removeItem('marga_user');
}

export function getStoredUser(): Record<string, string> | null {
  const u = localStorage.getItem('marga_user');
  return u ? JSON.parse(u) : null;
}

export function setStoredUser(user: Record<string, string>) {
  localStorage.setItem('marga_user', JSON.stringify(user));
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  quotes: {
    list: (filters?: { status?: string; client_id?: string; date_from?: string; date_to?: string }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.client_id) params.set('client_id', filters.client_id);
      if (filters?.date_from) params.set('date_from', filters.date_from);
      if (filters?.date_to) params.set('date_to', filters.date_to);
      const qs = params.toString();
      return request(`/api/quotes${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request(`/api/quotes/${id}`),
    create: (data: unknown) => request('/api/quotes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => request(`/api/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      request(`/api/quotes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request(`/api/quotes/${id}`, { method: 'DELETE' }),
    nextNumber: () => request('/api/quotes/next-number'),
  },

  settings: {
    getExchangeRate: (): Promise<{ value: number }> => request('/api/settings/exchange-rate'),
    updateExchangeRate: (value: number) =>
      request('/api/settings/exchange-rate', { method: 'PUT', body: JSON.stringify({ value }) }),
  },

  auth: {
    login: (username: string, password: string) =>
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    me: () => request('/api/auth/me'),
    createUser: (data: { username: string; password: string; name?: string; role?: string }) =>
      request('/api/auth/create-user', { method: 'POST', body: JSON.stringify(data) }),
  },

  from: (table: string) => ({
    select: (_cols = '*') => ({
      then: (cb: (result: { data: unknown[]; error: null }) => void) => {
        request(`/api/${table}`).then(data => cb({ data, error: null })).catch(() => cb({ data: [], error: null }));
      },
      eq: (col: string, val: unknown) => ({
        then: (cb: (result: { data: unknown[]; error: null }) => void) => {
          request(`/api/${table}?${col}=${val}`).then(data => cb({ data, error: null })).catch(() => cb({ data: [], error: null }));
        },
        single: () => ({
          then: (cb: (result: { data: unknown; error: null }) => void) => {
            request(`/api/${table}?${col}=${val}`).then((data: unknown[]) => cb({ data: data?.[0] ?? null, error: null })).catch(() => cb({ data: null, error: null }));
          },
        }),
      }),
      order: (_col: string) => ({
        then: (cb: (result: { data: unknown[]; error: null }) => void) => {
          request(`/api/${table}`).then(data => cb({ data, error: null })).catch(() => cb({ data: [], error: null }));
        },
      }),
    }),
    insert: (rows: unknown[]) =>
      request(`/api/${table}`, { method: 'POST', body: JSON.stringify(rows[0]) })
        .then(() => ({ error: null }))
        .catch(e => ({ error: e })),
    update: (data: Record<string, unknown>) => ({
      eq: (col: string, val: unknown) =>
        request(`/api/${table}/${val}`, { method: 'PATCH', body: JSON.stringify(data) })
          .then(() => ({ error: null }))
          .catch(e => ({ error: e })),
    }),
    upsert: (data: Record<string, unknown>) =>
      request(`/api/${table}`, { method: 'PATCH', body: JSON.stringify(data) })
        .then(() => ({ error: null }))
        .catch(e => ({ error: e })),
    delete: () => ({
      eq: (col: string, val: unknown) =>
        request(`/api/${table}/${val}`, { method: 'DELETE' })
          .then(() => ({ error: null }))
          .catch(e => ({ error: e })),
    }),
  }),
};
