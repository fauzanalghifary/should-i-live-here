import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";

import {
  formatRating,
  formatWalk,
  sortPlaces,
  type PlaceSortKey,
} from "./formatters";
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
  const [sortKey, setSortKey] = useState<PlaceSortKey>("distance");
  const sortedPlaces = sortPlaces(places, sortKey);
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
            <>
              <div className="flex items-center justify-between gap-3 border-b border-[#17211c14] px-6 py-2.5">
                <span className="font-mono text-[0.66rem] font-bold text-[#5a6a60] uppercase">
                  Sort
                </span>
                <SortMenu onChange={setSortKey} value={sortKey} />
              </div>
              <ol className="m-0 list-none p-0">
                {sortedPlaces.map((place, index) => {
                  const isSelected = isSamePlace(selectedPlace, place);
                  return (
                    <PlaceRow
                      index={index}
                      isSelected={isSelected}
                      key={
                        place.id ||
                        `${place.name ?? "place"}-${index.toString()}`
                      }
                      onSelect={() => {
                        onPlaceSelect(isSelected ? null : place);
                      }}
                      place={place}
                      sortKey={sortKey}
                    />
                  );
                })}
              </ol>
            </>
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
  sortKey: PlaceSortKey;
};

function PlaceRow({
  index,
  isSelected,
  onSelect,
  place,
  sortKey,
}: PlaceRowProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const wasSelectedRef = useRef(isSelected);

  useEffect(() => {
    const becameSelected = isSelected && !wasSelectedRef.current;
    wasSelectedRef.current = isSelected;

    if (!becameSelected) {
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
        <PlaceMetric isSelected={isSelected} place={place} sortKey={sortKey} />
      </button>
      {isSelected ? <PlaceDetails place={place} /> : null}
    </li>
  );
}

type SortOption = {
  key: PlaceSortKey;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { key: "distance", label: "Shortest distance" },
  { key: "rating", label: "Highest rating" },
  { key: "reviews", label: "Most reviewed" },
];

const DEFAULT_SORT_OPTION: SortOption = {
  key: "distance",
  label: "Shortest distance",
};

function SortMenu({
  onChange,
  value,
}: {
  onChange: (value: PlaceSortKey) => void;
  value: PlaceSortKey;
}) {
  const selectedOption = getSortOption(value);

  return (
    <Menu as="div" className="relative">
      <MenuButton className="inline-flex min-w-44 items-center justify-between gap-2 border border-[#17211c24] bg-[#fffdf6] px-2.5 py-1.5 font-mono text-[0.72rem] text-[#24352b] transition-colors hover:bg-[#f6f3ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c] data-active:bg-[#f0eadf]">
        {selectedOption.label}
        <Chevron expanded={false} />
      </MenuButton>
      <MenuItems
        transition
        className="absolute top-[calc(100%+0.25rem)] right-0 z-30 w-52 origin-top-right border border-[#17211c24] bg-[#fffdf6] py-1 shadow-[0_16px_32px_-18px_rgba(23,33,28,0.45)] transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0"
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem key={option.key}>
            <button
              className={[
                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-mono text-[0.72rem] text-[#24352b] data-focus:bg-[#eef4df]",
                option.key === value ? "font-bold" : "",
              ].join(" ")}
              onClick={() => {
                onChange(option.key);
              }}
              type="button"
            >
              {option.label}
              {option.key === value ? <CheckIcon /> : null}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}

function PlaceMetric({
  isSelected,
  place,
  sortKey,
}: {
  isSelected: boolean;
  place: Place;
  sortKey: PlaceSortKey;
}) {
  const baseClass = isSelected ? "text-[#216c2f]" : "text-[#5a6a60]";
  const highlightClass = isSelected ? "text-[#216c2f]" : "text-[#8a5a12]";

  if (sortKey === "rating") {
    return (
      <span className="flex shrink-0 items-baseline gap-2 font-mono text-[0.7rem]">
        <span
          className={place.rating === undefined ? baseClass : highlightClass}
        >
          {place.rating === undefined
            ? "No rating"
            : `★ ${formatRating(place.rating)}`}
        </span>
        {place.rating_count !== undefined ? (
          <span className={baseClass}>({place.rating_count.toString()})</span>
        ) : null}
      </span>
    );
  }

  if (sortKey === "reviews") {
    return (
      <span className="flex shrink-0 items-baseline gap-2 font-mono text-[0.7rem]">
        <span
          className={
            place.rating_count === undefined ? baseClass : highlightClass
          }
        >
          {place.rating_count === undefined
            ? "No reviews"
            : `${place.rating_count.toString()} reviews`}
        </span>
        {place.rating !== undefined ? (
          <span className={baseClass}>★ {formatRating(place.rating)}</span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={`shrink-0 font-mono text-[0.7rem] ${baseClass}`}>
      {formatWalk(place.distance_meters)}
    </span>
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

function isSamePlace(selectedPlace: Place | null, place: Place) {
  if (!selectedPlace) {
    return false;
  }
  if (selectedPlace.id && place.id) {
    return selectedPlace.id === place.id;
  }
  return selectedPlace === place;
}

function getSortOption(value: PlaceSortKey) {
  return (
    SORT_OPTIONS.find((option) => option.key === value) ?? DEFAULT_SORT_OPTION
  );
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

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0"
      fill="none"
      height="13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="13"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
