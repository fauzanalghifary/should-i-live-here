import {
  formatCategoryTag,
  formatPriceLevel,
  formatWalk,
  formatWebsite,
} from "./formatters";
import type { Place, PlaceDetails as PlaceDetailsData } from "./types";
import { usePlaceDetails } from "./usePlaceDetails";

type PlaceDetailsProps = {
  place: Place;
};

export function PlaceDetails({ place }: PlaceDetailsProps) {
  const detailsQuery = usePlaceDetails(place.id);
  const details = detailsQuery.data;

  return (
    <div className="border-y border-[#17211c14] bg-[#fbf8ef] px-6 py-3">
      {place.address ? (
        <p className="m-0 text-[0.82rem] leading-snug text-[#405047]">
          {place.address}
        </p>
      ) : null}
      <p className="m-0 mt-2 font-mono text-[0.7rem] font-bold text-[#24352b] uppercase">
        {formatWalk(place.distance_meters)} · {place.distance_meters}m
      </p>

      {detailsQuery.isLoading ? (
        <p className="m-0 mt-2 font-mono text-[0.7rem] text-[#5a6a60] uppercase">
          Loading details…
        </p>
      ) : null}
      {detailsQuery.error ? (
        <p className="m-0 mt-2 font-mono text-[0.7rem] text-[#a23a25] uppercase">
          Couldn't load details
        </p>
      ) : null}
      {details ? <PlaceDetailsBody details={details} /> : null}

      {place.categories && place.categories.length > 0 ? (
        <ul className="mt-2 flex list-none flex-wrap gap-1 p-0">
          {place.categories.slice(0, 4).map((category) => (
            <li
              className="border border-[#17211c1f] bg-[#fffdf6] px-2 py-0.5 font-mono text-[0.66rem] text-[#24352b]"
              key={category}
            >
              {formatCategoryTag(category)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PlaceDetailsBody({ details }: { details: PlaceDetailsData }) {
  return (
    <div className="mt-2 grid gap-2">
      {details.photo_url ? (
        <img
          alt={details.name ?? "Place photo"}
          className="h-40 w-full rounded-sm border border-[#17211c14] object-cover"
          loading="lazy"
          src={details.photo_url}
        />
      ) : null}
      {details.rating !== undefined ? (
        <div className="flex items-baseline gap-2">
          <span className="font-medium">★ {details.rating.toFixed(1)}</span>
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
      ) : null}

      {details.open_now !== undefined ? (
        <p
          className={[
            "m-0 font-mono text-[0.7rem] font-bold uppercase",
            details.open_now ? "text-[#2f7c2f]" : "text-[#a23a25]",
          ].join(" ")}
        >
          {details.open_now ? "Open now" : "Closed"}
        </p>
      ) : null}

      {details.weekday_hours && details.weekday_hours.length > 0 ? (
        <details className="m-0">
          <summary className="cursor-pointer font-mono text-[0.7rem] text-[#5a6a60] uppercase">
            Weekly hours
          </summary>
          <ul className="mt-1 list-none p-0 text-[0.78rem] text-[#405047]">
            {details.weekday_hours.map((line) => (
              <li className="leading-snug" key={line}>
                {line}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {details.phone ? (
        <a
          className="text-[0.82rem] text-[#1d4ed8] underline-offset-2 hover:underline"
          href={`tel:${details.phone}`}
        >
          {details.phone}
        </a>
      ) : null}

      {details.website ? (
        <a
          className="truncate text-[0.82rem] text-[#1d4ed8] underline-offset-2 hover:underline"
          href={details.website}
          rel="noopener noreferrer"
          target="_blank"
        >
          {formatWebsite(details.website)}
        </a>
      ) : null}
    </div>
  );
}
