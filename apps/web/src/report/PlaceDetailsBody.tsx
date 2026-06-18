import { useState } from "react";

import {
  formatCategoryTag,
  formatPriceLevel,
  formatWebsite,
  googleMapsUrl,
} from "./formatters";
import { PhotoLightbox } from "./PhotoLightbox";
import type { Place, PlaceDetails as PlaceDetailsData } from "./types";

type PlaceDetailsBodyProps = {
  details: PlaceDetailsData;
  place: Place;
};

export function PlaceDetailsBody({ details, place }: PlaceDetailsBodyProps) {
  const statusPill = renderStatusPill(details.open_now);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  return (
    <div className="grid gap-3">
      {details.photo_url ? (
        <div className="relative -mx-2 -mt-1">
          <button
            aria-label={`View photo of ${details.name ?? "this place"}`}
            className="block w-full cursor-zoom-in"
            onClick={() => {
              setIsPhotoOpen(true);
            }}
            type="button"
          >
            <img
              alt={details.name ?? "Place photo"}
              className="aspect-video w-full rounded-sm border border-[#17211c14] object-cover"
              loading="lazy"
              src={details.photo_url}
            />
          </button>
          {statusPill ? (
            <div className="pointer-events-none absolute top-2 right-2">
              {statusPill}
            </div>
          ) : null}
          {isPhotoOpen ? (
            <PhotoLightbox
              alt={details.name ?? "Place photo"}
              onClose={() => {
                setIsPhotoOpen(false);
              }}
              src={details.photo_url}
            />
          ) : null}
        </div>
      ) : statusPill ? (
        <div>{statusPill}</div>
      ) : null}

      <RatingRow details={details} />

      {place.address ? (
        <p className="m-0 line-clamp-2 text-[0.85rem] leading-snug text-[#405047]">
          {place.address}
        </p>
      ) : null}

      {details.weekday_hours && details.weekday_hours.length > 0 ? (
        <details className="m-0">
          <summary className="cursor-pointer font-mono text-[0.7rem] text-[#5a6a60] uppercase">
            Weekly hours
          </summary>
          <ul className="mt-1.5 list-none p-0 text-[0.8rem] text-[#405047]">
            {details.weekday_hours.map((line) => (
              <li className="leading-snug" key={line}>
                {line}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <ContactLinks details={details} place={place} />

      <CategoryTagsLine categories={place.categories} />
    </div>
  );
}

function RatingRow({ details }: { details: PlaceDetailsData }) {
  if (details.rating === undefined) {
    return null;
  }
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[1.05rem] text-[#c97a1c]">★</span>
      <span className="text-[1.05rem] font-medium">
        {details.rating.toFixed(1)}
      </span>
      {details.rating_count ? (
        <span className="font-mono text-[0.72rem] text-[#5a6a60]">
          ({details.rating_count})
        </span>
      ) : null}
      {details.price_level ? (
        <span className="font-mono text-[0.72rem] text-[#5a6a60]">
          · {formatPriceLevel(details.price_level)}
        </span>
      ) : null}
    </div>
  );
}

function renderStatusPill(openNow: boolean | undefined) {
  if (openNow === undefined) {
    return null;
  }
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-mono text-[0.62rem] font-bold tracking-wider uppercase shadow-sm",
        openNow ? "bg-[#216c2f] text-white" : "bg-[#9a2e1c] text-white",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-white/85"
      />
      {openNow ? "Open now" : "Closed"}
    </span>
  );
}

export function GoogleMapsLink({ place }: { place: Place }) {
  return (
    <a
      className="inline-flex min-w-0 items-center gap-1.5 text-[0.85rem] text-[#1d4ed8] hover:underline"
      href={googleMapsUrl(place)}
      rel="noopener noreferrer"
      target="_blank"
    >
      <MapPinIcon />
      Open in Google Maps
    </a>
  );
}

function ContactLinks({
  details,
  place,
}: {
  details: PlaceDetailsData;
  place: Place;
}) {
  return (
    <div className="grid gap-1.5">
      <GoogleMapsLink place={place} />
      {details.phone ? (
        <a
          className="inline-flex items-center gap-1.5 text-[0.85rem] text-[#1d4ed8] hover:underline"
          href={`tel:${details.phone}`}
        >
          <PhoneIcon />
          {details.phone}
        </a>
      ) : null}
      {details.website ? (
        <a
          className="inline-flex min-w-0 items-center gap-1.5 text-[0.85rem] text-[#1d4ed8] hover:underline"
          href={details.website}
          rel="noopener noreferrer"
          target="_blank"
        >
          <GlobeIcon />
          <span className="truncate">{formatWebsite(details.website)}</span>
        </a>
      ) : null}
    </div>
  );
}

export function CategoryTagsLine({
  categories,
}: {
  categories: string[] | undefined;
}) {
  if (!categories || categories.length === 0) {
    return null;
  }
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
      {categories.slice(0, 4).map((category) => (
        <li
          className="border border-[#17211c1f] bg-[#fffdf6] px-2 py-0.5 font-mono text-[0.66rem] text-[#24352b]"
          key={category}
        >
          {formatCategoryTag(category)}
        </li>
      ))}
    </ul>
  );
}

function PhoneIcon() {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function GlobeIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function MapPinIcon() {
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
      <path d="M20 10c0 4.99-5.52 10.54-7.39 12.24a.9.9 0 0 1-1.22 0C9.52 20.54 4 14.99 4 10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
