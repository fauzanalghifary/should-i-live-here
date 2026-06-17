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

export function createRepickPopupElement(
  onConfirm: () => void,
  onCancel: () => void,
) {
  const root = document.createElement("div");

  const text = document.createElement("p");
  text.textContent = "Reset selection?";
  text.style.margin = "0 0 8px 0";
  text.style.fontWeight = "600";

  const actions = document.createElement("div");
  actions.style.display = "grid";
  actions.style.gap = "6px";

  const confirm = createPopupButton("Yes, reset", "primary", onConfirm);
  const cancel = createPopupButton("Cancel", "ghost", onCancel);

  actions.append(confirm, cancel);
  root.append(text, actions);
  return root;
}

function createPopupButton(
  label: string,
  variant: "primary" | "ghost",
  onClick: () => void,
) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.style.padding = "6px 12px";
  button.style.fontFamily = "ui-monospace, monospace";
  button.style.fontSize = "0.7rem";
  button.style.fontWeight = "700";
  button.style.textTransform = "uppercase";
  button.style.letterSpacing = "0.05em";
  button.style.cursor = "pointer";
  button.style.width = "100%";

  if (variant === "primary") {
    button.style.background = "#17211c";
    button.style.color = "#fffdf6";
    button.style.border = "1px solid #17211c";
  } else {
    button.style.background = "transparent";
    button.style.color = "#17211c";
    button.style.border = "1px solid #17211c33";
  }

  button.addEventListener("click", onClick);
  return button;
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
