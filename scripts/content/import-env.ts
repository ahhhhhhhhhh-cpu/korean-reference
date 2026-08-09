import fs from "node:fs";
import path from "node:path";

const ENV_FILES = [".env.local", ".env"];

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) return null;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return [key, value];
}

/** Load DATABASE_URL and NEXT_PUBLIC_SUPABASE_URL without logging values. */
export function loadImportEnvironment(
  cwd = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): { databaseUrl?: string; supabaseUrl?: string } {
  const merged: Record<string, string> = {};

  for (const file of ENV_FILES) {
    const filePath = path.join(cwd, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (parsed) merged[parsed[0]] = parsed[1];
    }
  }

  return {
    databaseUrl: env.DATABASE_URL?.trim() || merged.DATABASE_URL?.trim(),
    supabaseUrl:
      env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      merged.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  };
}
