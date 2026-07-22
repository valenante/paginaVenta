import { useConfig } from "../context/ConfigContext";

const DEFAULTS = {
  country: "ES",
  currency: "EUR",
  currencySymbol: "€",
  locale: "es-ES",
  timezone: "Europe/Madrid",
};

const COUNTRY_META = {
  ES: {
    taxIdLabel: "NIF",
    taxAuthority: "Hacienda",
    taxAuthorityCode: "AEAT",
    currencyName: "euro",
    currencyEmoji: "💶",
    taxRates: { comida: 10, alcohol: 21, general: 21 },
    taxIdPlaceholder: "B12345678",
    addressPlaceholder: "Calle Ejemplo 1, Madrid",
    isSpain: true,
  },
  AR: {
    taxIdLabel: "CUIT",
    taxAuthority: "AFIP",
    taxAuthorityCode: "AFIP",
    currencyName: "peso",
    currencyEmoji: "💵",
    taxRates: { comida: 21, alcohol: 21, general: 21 },
    taxIdPlaceholder: "30-12345678-9",
    addressPlaceholder: "Av. Corrientes 1234, CABA",
    isSpain: false,
  },
};

export function useLocale() {
  const { config } = useConfig();
  const loc = config?.localization || DEFAULTS;

  const currencySymbol = loc.currencySymbol || DEFAULTS.currencySymbol;
  const locale = loc.locale || DEFAULTS.locale;
  const currency = loc.currency || DEFAULTS.currency;
  const country = loc.country || DEFAULTS.country;
  const timezone = loc.timezone || DEFAULTS.timezone;

  const formatMoney = (amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return `0.00 ${currencySymbol}`;
    return `${n.toFixed(2)} ${currencySymbol}`;
  };

  const meta = COUNTRY_META[country] || COUNTRY_META.ES;

  return {
    formatMoney,
    currencySymbol,
    locale,
    currency,
    country,
    timezone,
    taxIdLabel: meta.taxIdLabel,
    taxAuthority: meta.taxAuthority,
    taxAuthorityCode: meta.taxAuthorityCode,
    currencyName: meta.currencyName,
    currencyEmoji: meta.currencyEmoji,
    taxRates: meta.taxRates,
    taxIdPlaceholder: meta.taxIdPlaceholder,
    addressPlaceholder: meta.addressPlaceholder,
    isSpain: meta.isSpain,
  };
}
