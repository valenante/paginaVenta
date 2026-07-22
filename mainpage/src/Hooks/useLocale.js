import { useConfig } from "../context/ConfigContext";

const DEFAULTS = {
  country: "ES",
  currency: "EUR",
  currencySymbol: "€",
  locale: "es-ES",
  timezone: "Europe/Madrid",
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

  return { formatMoney, currencySymbol, locale, currency, country, timezone };
}
