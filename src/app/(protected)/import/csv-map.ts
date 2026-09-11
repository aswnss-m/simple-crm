import {
  REQUIRED_COLUMNS,
  type CsvRow,
  type InvalidMobileRow,
  type MappedLead,
} from "@/types/csv"
import {
  isNumericMobile,
  locationFromMobile,
  stripMobileSpaces,
} from "@/lib/phone-location"

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
  const invalidMobiles: InvalidMobileRow[] = []
  let invalidCount = 0

  for (const [index, row] of rows.entries()) {
    if (isEmptyRow(row)) continue

    const headers = headerMap(row)
    const name = cellValue(row, headers.name ?? "name")
    const mobileRaw = cellValue(row, headers.mobile ?? "mobile")
    const mobile = stripMobileSpaces(mobileRaw)

    if (!name || !mobile) {
      invalidCount += 1
      continue
    }

    if (!isNumericMobile(mobile)) {
      invalidMobiles.push({
        rowNumber: index + 2,
        name,
        mobile: mobileRaw,
      })
      continue
    }

    valid.push({
      name,
      mobile,
      email: optionalValue(cellValue(row, headers.email ?? "email")),
      location:
        optionalValue(cellValue(row, headers.location ?? "location")) ??
        locationFromMobile(mobile),
    })
  }

  return { valid, invalidCount, invalidMobiles }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function sourceFromFileName(fileName: string) {
  return fileName.replace(/\.csv$/i, "").trim() || "CSV import"
}
