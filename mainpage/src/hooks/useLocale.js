import { useConfig } from "../context/ConfigContext";

/**
 * Localización del restaurante para el PANEL.
 *
 * ⚠️ ESTE FICHERO NO INVENTA NADA: es el gemelo de `tpv/src/hooks/useLocale.js` y
 * `carta/src/hooks/useLocale.js`, que existen desde hace tiempo y leen lo mismo del mismo sitio
 * (`config.localization`, servido por `/configuracion`). El panel era el único de los tres que no
 * lo tenía, así que sus pantallas escribían el símbolo de moneda a mano.
 *
 * MEDIDO EN PRODUCCIÓN el 5-sep (lectura agregada, Art. 12): `tres-catorce` está configurado en
 * **`$` / ARS / es-AR**, y `zabor-feten` en `€` / EUR / es-ES. O sea que ya hay un restaurante
 * cuyo TPV y cuya carta dicen `$` mientras su panel decía `€`.
 *
 * ⚠️ Se mantiene el MISMO formato que los gemelos —`0.00 <símbolo>`, punto decimal y espacio—
 * a propósito. Cambiar además la separación decimal aquí haría que el panel divergiera del TPV
 * por otro lado, que es exactamente el problema que este fichero viene a cerrar. Si algún día se
 * pasa a `12,50`, se cambia en los tres a la vez.
 */

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
