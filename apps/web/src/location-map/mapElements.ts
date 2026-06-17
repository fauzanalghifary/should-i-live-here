import { isWithinIndonesiaViewBounds } from "./indonesiaBoundary";

type UnsupportedLocationPopupCopy = {
  title: string;
  detail: string;
};

export function createSelectedMarkerElement() {
  const element = document.createElement("div");
  element.style.width = "22px";
  element.style.height = "22px";
  element.style.border = "3px solid #fffdf6";
  element.style.borderRadius = "999px";
  element.style.background = "#f05d3b";
  element.style.boxShadow = "0 0 0 3px rgba(240, 93, 59, 0.2)";

  return element;
}

export function createUnsupportedLocationPopupElement(
  lng: number,
  lat: number,
) {
  const popupCopy = getUnsupportedLocationPopupCopy(lng, lat);
  const element = document.createElement("div");
  const title = document.createElement("strong");
  const detail = document.createElement("span");

  title.textContent = popupCopy.title;
  detail.textContent = popupCopy.detail;

  element.append(title, detail);

  return element;
}

function getUnsupportedLocationPopupCopy(
  lng: number,
  lat: number,
): UnsupportedLocationPopupCopy {
  if (isWithinIndonesiaViewBounds(lng, lat)) {
    return {
      title: "Invalid location",
      detail: "Please pick other location.",
    };
  }

  return {
    title: "Indonesia only for now",
    detail: "Please pick a location inside Indonesia.",
  };
}
