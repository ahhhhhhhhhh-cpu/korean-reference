import fs from "node:fs";
import path from "node:path";

export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  file: string;
  headers: string[];
  rows: CsvRow[];
};

export type ParseIssue = {
  file: string;
  line?: number;
  message: string;
  severity: "error" | "warning";
};

/**
 * Minimal RFC4180-ish CSV parser (comma delimiter, UTF-8, quoted fields).
 */
export function parseCsvContent(content: string, file: string): ParsedCsv {
  const lines = splitCsvLines(content);
  if (lines.length === 0) {
    return { file, headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]!);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim() === "") continue;
    const values = parseCsvLine(line);
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return { file, headers, rows };
}

export function readCsvFile(dir: string, filename: string): ParsedCsv | null {
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) return null;

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    throw new Error(`Cannot read ${filename} as UTF-8`);
  }

  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  return parseCsvContent(content, filename);
}

export function loadContentDirectory(dir: string): Map<string, ParsedCsv> {
  const result = new Map<string, ParsedCsv>();
  if (!fs.existsSync(dir)) {
    throw new Error(`Content directory not found: ${dir}`);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".csv"));
  for (const file of files) {
    const parsed = readCsvFile(dir, file);
    if (parsed) result.set(file, parsed);
  }
  return result;
}

function splitCsvLines(content: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]!;
    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && content[i + 1] === "\n") i++;
      if (current.length > 0 || lines.length === 0) lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

export function rowNumber(dataRowIndex: number): number {
  return dataRowIndex + 2;
}
