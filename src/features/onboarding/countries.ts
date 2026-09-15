export type CountryOption = {
  code: string;
  name: string;
  currency: string;
  locale: string;
  symbol: string;
};

const DEFAULT_COUNTRY: CountryOption = {
  code: 'IN',
  name: 'India',
  currency: 'INR',
  locale: 'en-IN',
  symbol: '₹',
};

export const COUNTRIES: readonly CountryOption[] = [
  DEFAULT_COUNTRY,
  { code: 'US', name: 'United States', currency: 'USD', locale: 'en-US', symbol: '$' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', symbol: '£' },
  { code: 'CA', name: 'Canada', currency: 'CAD', locale: 'en-CA', symbol: 'CA$' },
  { code: 'AU', name: 'Australia', currency: 'AUD', locale: 'en-AU', symbol: 'A$' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', locale: 'en-NZ', symbol: 'NZ$' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', locale: 'en-AE', symbol: 'د.إ' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', locale: 'en-SA', symbol: 'ر.س' },
  { code: 'QA', name: 'Qatar', currency: 'QAR', locale: 'en-QA', symbol: 'ر.ق' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', locale: 'en-SG', symbol: 'S$' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', locale: 'en-MY', symbol: 'RM' },
  { code: 'JP', name: 'Japan', currency: 'JPY', locale: 'ja-JP', symbol: '¥' },
  { code: 'CN', name: 'China', currency: 'CNY', locale: 'zh-CN', symbol: '¥' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', locale: 'ko-KR', symbol: '₩' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', locale: 'en-PH', symbol: '₱' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', locale: 'id-ID', symbol: 'Rp' },
  { code: 'TH', name: 'Thailand', currency: 'THB', locale: 'th-TH', symbol: '฿' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', locale: 'vi-VN', symbol: '₫' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', locale: 'en-PK', symbol: '₨' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT', locale: 'bn-BD', symbol: '৳' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR', locale: 'en-LK', symbol: 'Rs' },
  { code: 'NP', name: 'Nepal', currency: 'NPR', locale: 'en-NP', symbol: '₨' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', locale: 'en-ZA', symbol: 'R' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', locale: 'en-NG', symbol: '₦' },
  { code: 'KE', name: 'Kenya', currency: 'KES', locale: 'en-KE', symbol: 'KSh' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', locale: 'pt-BR', symbol: 'R$' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', locale: 'es-MX', symbol: 'MX$' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', locale: 'es-AR', symbol: 'AR$' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', locale: 'de-CH', symbol: 'CHF' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', locale: 'sv-SE', symbol: 'kr' },
  { code: 'NO', name: 'Norway', currency: 'NOK', locale: 'nb-NO', symbol: 'kr' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', locale: 'da-DK', symbol: 'kr' },
  { code: 'PL', name: 'Poland', currency: 'PLN', locale: 'pl-PL', symbol: 'zł' },
  { code: 'TR', name: 'Turkey', currency: 'TRY', locale: 'tr-TR', symbol: '₺' },
  { code: 'IL', name: 'Israel', currency: 'ILS', locale: 'he-IL', symbol: '₪' },
  { code: 'DE', name: 'Germany', currency: 'EUR', locale: 'de-DE', symbol: '€' },
  { code: 'FR', name: 'France', currency: 'EUR', locale: 'fr-FR', symbol: '€' },
  { code: 'ES', name: 'Spain', currency: 'EUR', locale: 'es-ES', symbol: '€' },
  { code: 'IT', name: 'Italy', currency: 'EUR', locale: 'it-IT', symbol: '€' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', locale: 'nl-NL', symbol: '€' },
] as const;

export function getCountry(code: string | null | undefined): CountryOption {
  return COUNTRIES.find((country) => country.code === code) ?? DEFAULT_COUNTRY;
}

export function getCurrencySymbol(code: string | null | undefined): string {
  return getCountry(code).symbol;
}
