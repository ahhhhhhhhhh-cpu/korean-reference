export type DataSource = "mock" | "supabase";

/**
 * Resolve active data source.
 * DATA_SOURCE env takes precedence; else USE_MOCK_DATA=false → supabase; default mock.
 */
export function getDataSource(): DataSource {
  const explicit = process.env.DATA_SOURCE?.trim().toLowerCase();
  if (explicit === "mock" || explicit === "supabase") {
    return explicit;
  }

  if (process.env.USE_MOCK_DATA === "false") {
    return "supabase";
  }

  return "mock";
}
