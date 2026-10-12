type Row = Record<string, unknown>;
type Result = { data: Row | null; error: { message: string } | null };

const tokenKey = 'trade-journal-session';
const listeners = new Set<(event: string, session: unknown) => void>();

async function api(path: string, body?: unknown, method = 'POST'): Promise<Result> {
  const token = localStorage.getItem(tokenKey);
  try {
    const response = await fetch(path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json() as Row;
    return { data: response.ok ? data : null, error: response.ok ? null : { message: String(data.error || 'Request failed.') } };
  } catch { return { data: null, error: { message: 'Could not reach the workspace service.' } }; }
}

class Query {
  private filters: Record<string, unknown> = {};
  private operation = 'select';
  private payload: Row | null = null;
  private one = false;
  private maybe = false;
  private wantedOrder: { column: string; ascending?: boolean } | undefined;
  private countRequested = false;
  constructor(private table: string) {}
  select(_columns = '*', options?: { count?: string; head?: boolean }) { this.countRequested = !!options?.count; return this; }
  insert(value: Row | Row[]) { this.operation = 'insert'; this.payload = (Array.isArray(value) ? value[0] : value) as Row; return this; }
  upsert(value: Row | Row[]) { return this.insert(value); }
  update(value: Row) { this.operation = 'update'; this.payload = value; return this; }
  delete() { this.operation = 'delete'; return this; }
  eq(key: string, value: unknown) { this.filters[key] = value; return this; }
  is(key: string, value: unknown) { this.filters[key] = value; return this; }
  in(key: string, values: unknown[]) { this.filters[key] = values[0]; return this; }
  or(_value: string) { return this; }
  order(column: string, options?: { ascending?: boolean }) { this.wantedOrder = { column, ...options }; return this; }
  limit(_count: number) { return this; }
  single() { this.one = true; return this; }
  maybeSingle() { this.maybe = true; return this; }
  then<TResult1 = unknown, TResult2 = never>(resolve?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null, reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null) { return this.run().then(resolve, reject); }
  private async run() {
    if (this.table === 'profiles') {
      if (this.operation === 'select') { const result = await api('/api/me', undefined, 'GET'); const user = result.data?.user as Row | undefined; return { data: this.one || this.maybe ? user || null : user ? [user] : [], error: result.error, count: user ? 1 : 0 }; }
      if (this.operation === 'update') { const result = await api('/api/auth/profile', this.payload); return { data: result.data?.user ? [result.data.user as Row] : [], error: result.error }; }
    }
    const result = await api('/api/data', { action: this.operation, table: this.table, id: this.filters.id, payload: this.payload, filters: Object.fromEntries(Object.entries(this.filters).filter(([key]) => key !== 'id')), order: this.wantedOrder });
    if (result.error) return { data: null, error: result.error };
    const value = result.data?.data;
    const rows = Array.isArray(value) ? value as Row[] : value ? [value as Row] : [];
    if (this.one && rows.length !== 1) return { data: null, error: { message: 'Expected one record.' } };
    return { data: this.one || this.maybe ? rows[0] || null : rows, error: null, count: this.countRequested ? rows.length : null };
  }
}

const emit = (event: string, session: unknown) => listeners.forEach(listener => listener(event, session));
const sessionFrom = (token: string, user: Row) => ({ access_token: token, user });

export const supabase: any = {
  from: (table: string) => new Query(table),
  auth: {
    async getSession() {
      const token = localStorage.getItem(tokenKey);
      if (!token) return { data: { session: null } };
      const result = await api('/api/me', undefined, 'GET');
      if (result.error || !result.data?.user) { localStorage.removeItem(tokenKey); return { data: { session: null } }; }
      return { data: { session: sessionFrom(token, result.data.user as Row) } };
    },
    onAuthStateChange(callback: (event: string, session: unknown) => void) { listeners.add(callback); return { data: { subscription: { unsubscribe: () => { listeners.delete(callback); } } } }; },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const result = await api('/api/auth/signin', { email, password });
      if (result.error || !result.data) return { error: result.error };
      const token = String(result.data.token); const session = sessionFrom(token, result.data.user as Row); localStorage.setItem(tokenKey, token); emit('SIGNED_IN', session); return { error: null, data: { session, user: result.data.user } };
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { display_name?: string } } }) {
      const display_name = options?.data?.display_name || email.split('@')[0];
      const username = display_name.toLowerCase().replace(/[^a-z0-9_]+/g, '_').slice(0, 24) || 'trader';
      const result = await api('/api/auth/signup', { email, password, display_name, username });
      if (result.error || !result.data) return { error: result.error, data: { user: null } };
      const token = String(result.data.token); const session = sessionFrom(token, result.data.user as Row); localStorage.setItem(tokenKey, token); emit('SIGNED_IN', session); return { error: null, data: { user: result.data.user, session } };
    },
    async signOut() { await api('/api/auth/signout', {}); localStorage.removeItem(tokenKey); emit('SIGNED_OUT', null); },
    async updateUser({ password }: { password: string }) { const result = await api('/api/auth/password', { password }); return { error: result.error }; },
  },
  functions: { async invoke(name: string, { body }: { body: Row }) { if (name !== 'admin-user-management') return { data: null, error: { message: 'Unknown function.' } }; const result = await api('/api/admin', body); return { data: result.data, error: result.error }; } },
};
