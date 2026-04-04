export const SANSKRIT_SIGNS = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
] as const

export const SIGN_ENGLISH: Record<string, string> = {
  Mesha: "Aries", Vrishabha: "Taurus", Mithuna: "Gemini",
  Karka: "Cancer", Simha: "Leo", Kanya: "Virgo",
  Tula: "Libra", Vrishchika: "Scorpio", Dhanu: "Sagittarius",
  Makara: "Capricorn", Kumbha: "Aquarius", Meena: "Pisces",
}

export const SIGN_NAKSHATRAS: Record<string, string[]> = {
  Mesha: ["Ashwini", "Bharani", "Krittika"],
  Vrishabha: ["Krittika", "Rohini", "Mrigashira"],
  Mithuna: ["Mrigashira", "Ardra", "Punarvasu"],
  Karka: ["Punarvasu", "Pushya", "Ashlesha"],
  Simha: ["Magha", "Purva Phalguni", "Uttara Phalguni"],
  Kanya: ["Uttara Phalguni", "Hasta", "Chitra"],
  Tula: ["Chitra", "Swati", "Vishakha"],
  Vrishchika: ["Vishakha", "Anuradha", "Jyeshtha"],
  Dhanu: ["Mula", "Purva Ashadha", "Uttara Ashadha"],
  Makara: ["Uttara Ashadha", "Shravana", "Dhanishta"],
  Kumbha: ["Dhanishta", "Shatabhisha", "Purva Bhadrapada"],
  Meena: ["Purva Bhadrapada", "Uttara Bhadrapada", "Revati"],
}

export const ALL_NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
  "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
  "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
  "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati",
] as const
