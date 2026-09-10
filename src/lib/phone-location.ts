import countryCodes from "../../public/country_codes.json"

type Country = {
  country: string
  iso_2: string
  iso_3: string
}

const COUNTRIES = countryCodes as Record<string, Country>
const MAX_CODE_LEN = 4

function lookupDigits(mobile: string) {
  let digits = mobile.replaceAll(" ", "")
  if (digits.startsWith("+")) return digits.slice(1)
  if (digits.startsWith("00")) return digits.slice(2)
  return digits
}

export function locationFromMobile(mobile: string) {
  const digits = lookupDigits(mobile)
  if (!digits) return undefined

  const max = Math.min(MAX_CODE_LEN, digits.length)
  for (let len = max; len >= 1; len--) {
    const country = COUNTRIES[digits.slice(0, len)]
    if (country) return country.country
  }

  return undefined
}
