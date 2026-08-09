import pg from "pg";
import { resolvePgSslConfig } from "./import-ssl";

const { Pool } = pg;

export type DbQueryResult<T> = { rows: T[]; rowCount: number | null };

/** Minimal DB client surface (real pool or test mock). */
export interface DbClient {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<DbQueryResult<T>>;
}

export interface TransactionCapableClient extends DbClient {
  transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
  /** Close the underlying pool. Safe after all transactions complete. */
  end(): Promise<void>;
}

export type PgPoolOptions = {
  connectionString: string;
  /** When true, create a real pg Pool (live import only). */
  connect?: boolean;
};

export function createPgPool(options: PgPoolOptions): TransactionCapableClient {
  if (!options.connect) {
    throw new Error("createPgPool called without connect=true");
  }

  const pool = new Pool({
    connectionString: options.connectionString,
    max: 2,
    ssl: resolvePgSslConfig(options.connectionString),
  });

  return {
    async query<T extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params?: unknown[],
    ) {
      const result = await pool.query(sql, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount,
      };
    },

    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const txClient: DbClient = {
          query: async <T extends Record<string, unknown> = Record<string, unknown>>(
            sql: string,
            params?: unknown[],
          ) => {
            const result = await client.query(sql, params);
            return {
              rows: result.rows as T[],
              rowCount: result.rowCount,
            };
          },
        };
        const value = await fn(txClient);
        await client.query("COMMIT");
        return value;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },

    async end() {
      await pool.end();
    },
  };
}

/** In-memory mock for unit tests with transaction semantics. */
export function createMockDbClient(
  handlers: {
    query?: (sql: string, params?: unknown[]) => Promise<DbQueryResult<Record<string, unknown>>>;
    onBegin?: () => void;
    onCommit?: () => void;
    onRollback?: () => void;
  } = {},
): TransactionCapableClient {
  let inTransaction = false;

  const baseQuery = async <T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<DbQueryResult<T>> => {
    if (handlers.query) {
      const result = await handlers.query(sql, params);
      return result as DbQueryResult<T>;
    }
    return { rows: [] as T[], rowCount: 0 };
  };

  return {
    query: baseQuery,
    async transaction(fn) {
      if (inTransaction) throw new Error("Nested transactions are not supported in mock.");
      inTransaction = true;
      handlers.onBegin?.();
      try {
        const result = await fn({ query: baseQuery });
        handlers.onCommit?.();
        return result;
      } catch (err) {
        handlers.onRollback?.();
        throw err;
      } finally {
        inTransaction = false;
      }
    },
    async end() {
      /* no-op for mock */
    },
  };
}
