import countryCodes from "../../public/country_codes.json"

type Country = {
  country: string
  iso_2: string
  iso_3: string
}

export type PhoneLocation = {
  country: string
  iso_2: string
}

const COUNTRIES = countryCodes as Record<string, Country>
const MAX_CODE_LEN = 4

function lookupDigits(mobile: string) {
  const digits = mobile.replaceAll(/[^\d+]/g, "")
  if (digits.startsWith("+")) return digits.slice(1)
  if (digits.startsWith("00")) return digits.slice(2)
  return digits.replaceAll("+", "")
}

function hasExplicitPrefix(mobile: string) {
  const trimmed = mobile.trim()
  return trimmed.startsWith("+") || trimmed.startsWith("00")
}

export function guessFromMobile(
  mobile: string,
  options?: { requireCountryPrefix?: boolean },
): PhoneLocation | undefined {
  if (options?.requireCountryPrefix && !hasExplicitPrefix(mobile)) {
    return undefined
  }

  const digits = lookupDigits(mobile)
  if (!digits) return undefined

  const max = Math.min(MAX_CODE_LEN, digits.length)
  for (let len = max; len >= 1; len--) {
    const country = COUNTRIES[digits.slice(0, len)]
    const nationalLength = digits.length - len
    if (country && nationalLength >= 6) {
      return { country: country.country, iso_2: country.iso_2 }
    }
  }

  return undefined
}

export function locationFromMobile(mobile: string) {
  return guessFromMobile(mobile)?.country
}

export function flagEmoji(iso2: string) {
  if (iso2.length !== 2) return ""
  return String.fromCodePoint(
    ...[...iso2.toUpperCase()].map((char) => 127397 + char.charCodeAt(0)),
  )
}
