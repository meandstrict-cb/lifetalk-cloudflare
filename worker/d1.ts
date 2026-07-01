// Thin wrapper around the native D1 binding so route code keeps the same
// `D1Client.query(sql, params)` shape it used before migration — no more
// HTTP calls, no more local JSON fallback. Cloudflare handles the connection.

export interface D1Response {
  results: any[];
  success: boolean;
}

export function createD1Client(db: D1Database) {
  return {
    async query(sql: string, params: any[] = []): Promise<D1Response> {
      const stmt = params.length ? db.prepare(sql).bind(...params) : db.prepare(sql);
      const result = await stmt.all();
      return { results: result.results ?? [], success: result.success };
    },
  };
}
