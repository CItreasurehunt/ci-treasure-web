// Curated currency list for the pricing CurrencyPicker — covers every currency actually used
// across current events (checked live 2026-07-22: EUR/USD/GBP/THB/CAD/SEK/ARS/MXN/CHF/INR/IDR/
// AUD/COP/HUF/KRW/TWD/NOK/UAH/UYU/BRL/CNY/PLN) plus other major currencies likely to come up as
// the event list grows internationally. Same rationale as lib/countries.ts: a free-text
// "3-letter code" field let "Pound"/"pounds" through undetected (found live 2026-07-22, crashed
// both the event page and the Telegram announcers) — a picker removes the possibility entirely.
export const CURRENCIES: { code: string; name: string }[] = [
  { code: "EUR", name: "Euro" },
  { code: "USD", name: "US Dollar" },
  { code: "GBP", name: "British Pound" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "ISK", name: "Icelandic Krona" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "RON", name: "Romanian Leu" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "ZAR", name: "South African Rand" },
  { code: "INR", name: "Indian Rupee" },
  { code: "THB", name: "Thai Baht" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "TWD", name: "Taiwan Dollar" },
  { code: "KRW", name: "South Korean Won" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "COP", name: "Colombian Peso" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "UYU", name: "Uruguayan Peso" },
  { code: "BOB", name: "Bolivian Boliviano" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "AED", name: "UAE Dirham" },
].sort((a, b) => a.name.localeCompare(b.name));

export function currencyName(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.name ?? code;
}
