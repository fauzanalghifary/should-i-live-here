import { useEffect, useRef } from "react";

import { formatWalk, sortByDistance } from "./formatters";
import { PlaceDetails } from "./PlaceDetails";
import type { CategoryKey, Place } from "./types";

type CategorySectionProps = {
  categoryKey: CategoryKey;
  label: string;
  count: number;
  isExpanded: boolean;
  places: Place[];
  radiusMeters: number;
  selectedPlace: Place | null;
  onToggle: () => void;
  onPlaceSelect: (place: Place | null) => void;
};

export function CategorySection({
  categoryKey,
  count,
  isExpanded,
  label,
  onPlaceSelect,
  onToggle,
  places,
  radiusMeters,
  selectedPlace,
}: CategorySectionProps) {
  const sortedPlaces = sortByDistance(places);
  const sectionId = `report-section-${categoryKey}`;

  return (
    <section className="border-b border-[#17211c14] last:border-b-0">
      <h3 className="m-0">
        <button
          aria-controls={sectionId}
          aria-expanded={isExpanded}
          className={[
            "flex w-full items-baseline justify-between gap-2 px-6 py-3 text-left transition-colors",
            isExpanded
              ? "bg-[#17211c] text-[#fffdf6]"
              : "bg-[#fbf8ef] text-[#24352b] hover:bg-[#f0eadf]",
          ].join(" ")}
          onClick={onToggle}
          type="button"
        >
          <span className="font-mono text-[0.72rem] font-bold tracking-wider uppercase">
            {label}
          </span>
          <span className="flex items-baseline gap-2.5">
            <span
              className={`font-mono text-[0.7rem] ${isExpanded ? "text-[#fffdf6]/70" : "text-[#5a6a60]"}`}
            >
              {count} nearby
            </span>
            <Chevron expanded={isExpanded} />
          </span>
        </button>
      </h3>
      {isExpanded ? (
        <div id={sectionId}>
          {sortedPlaces.length === 0 ? (
            <p className="m-0 px-6 py-3 text-[0.85rem] text-[#5a6a60]">
              None within {radiusMeters}m.
            </p>
          ) : (
            <ol className="m-0 list-none p-0">
              {sortedPlaces.map((place, index) => {
                const isSelected = selectedPlace === place;
                return (
                  <PlaceRow
                    index={index}
                    isSelected={isSelected}
                    key={index}
                    onSelect={() => {
                      onPlaceSelect(isSelected ? null : place);
                    }}
                    place={place}
                  />
                );
              })}
            </ol>
          )}
        </div>
      ) : null}
    </section>
  );
}

type PlaceRowProps = {
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  place: Place;
};

function PlaceRow({ index, isSelected, onSelect, place }: PlaceRowProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isSelected) {
      return undefined;
    }
    const handle = window.requestAnimationFrame(() => {
      const button = buttonRef.current;
      if (!button) {
        return;
      }
      const container = findScrollContainer(button);
      if (!container) {
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;
      const buttonCenter = buttonRect.top + buttonRect.height / 2;
      container.scrollBy({
        top: buttonCenter - containerCenter,
        behavior: "smooth",
      });
    });
    return () => {
      window.cancelAnimationFrame(handle);
    };
  }, [isSelected]);

  return (
    <li className="relative m-0">
      {isSelected ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1 bg-[#216c2f]"
        />
      ) : null}
      <button
        aria-expanded={isSelected}
        className={[
          "flex w-full items-baseline gap-3 px-6 py-2.5 text-left transition-colors",
          isSelected ? "bg-[#eef4df] font-medium" : "hover:bg-[#f6f3ea]",
        ].join(" ")}
        onClick={onSelect}
        ref={buttonRef}
        type="button"
      >
        <span
          className={[
            "w-5 shrink-0 font-mono text-[0.75rem]",
            isSelected ? "text-[#216c2f]" : "text-[#5a6a60]",
          ].join(" ")}
        >
          {index + 1}
        </span>
        <span className="flex-1 truncate text-[0.92rem] text-[#24352b]">
          {place.name ?? "Unnamed"}
        </span>
        <span
          className={[
            "shrink-0 font-mono text-[0.7rem]",
            isSelected ? "text-[#216c2f]" : "text-[#5a6a60]",
          ].join(" ")}
        >
          {formatWalk(place.distance_meters)}
        </span>
      </button>
      {isSelected ? <PlaceDetails place={place} /> : null}
    </li>
  );
}

function findScrollContainer(el: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = el.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    if (style.overflowY === "auto" || style.overflowY === "scroll") {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
      fill="none"
      height="12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="12"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
