import {
  REQUIRED_COLUMNS,
  type CsvRow,
  type MappedLead,
} from "@/types/csv"

export function normalizeHeader(header: string) {
  return header.replace(/^\uFEFF/, "").toLowerCase().trim()
}

function cellValue(row: CsvRow, header: string) {
  return String(row[header] ?? "").trim()
}

function isEmptyRow(row: CsvRow) {
  return Object.values(row).every((value) => String(value ?? "").trim() === "")
}

function headerMap(row: CsvRow) {
  return Object.fromEntries(
    Object.keys(row).map((header) => [normalizeHeader(header), header]),
  )
}

function optionalValue(value: string) {
  return value.length > 0 ? value : undefined
}

export function hasTemplateHeaders(rows: CsvRow[]) {
  const first = rows.find((row) => !isEmptyRow(row))
  if (!first) return false

  const headers = headerMap(first)
  return REQUIRED_COLUMNS.every((column) => headers[column])
}

export function mapRows(rows: CsvRow[]) {
  const valid: MappedLead[] = []
  let invalidCount = 0

  for (const row of rows) {
    if (isEmptyRow(row)) continue

    const headers = headerMap(row)
    const mapped: MappedLead = {
      name: cellValue(row, headers.name ?? "name"),
      mobile: cellValue(row, headers.mobile ?? "mobile"),
      email: optionalValue(cellValue(row, headers.email ?? "email")),
      location: optionalValue(cellValue(row, headers.location ?? "location")),
    }

    if (!mapped.name || !mapped.mobile) {
      invalidCount += 1
      continue
    }

    valid.push(mapped)
  }

  return { valid, invalidCount }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function sourceFromFileName(fileName: string) {
  return fileName.replace(/\.csv$/i, "").trim() || "CSV import"
}
