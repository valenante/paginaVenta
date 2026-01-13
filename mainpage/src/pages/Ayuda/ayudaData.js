import { ayudaDataRestaurante } from "./ayudaDataRestaurante";
import { ayudaDataShop } from "./ayudaDataShop";

export function getAyudaData(tipoNegocio) {
  return (tipoNegocio || "").toLowerCase() === "shop"
    ? ayudaDataShop
    : ayudaDataRestaurante;
}

export function getDefaultAyudaSection(dataObj) {
  const firstKey = Object.keys(dataObj)[0];
  return firstKey || "empezar";
}

export function buildAyudaSections(dataObj) {
  return Object.entries(dataObj).map(([key, val]) => ({
    key,
    label: val.menu || val.titulo || key,
  }));
}
