import { CategoryTagsLine, PlaceDetailsBody } from "./PlaceDetailsBody";
import type { Place } from "./types";
import { usePlaceDetails } from "./usePlaceDetails";

type PlaceDetailsProps = {
  place: Place;
};

export function PlaceDetails({ place }: PlaceDetailsProps) {
  const detailsQuery = usePlaceDetails(place.id);
  const details = detailsQuery.data;

  return (
    <div className="border-y border-[#17211c14] bg-[#fbf8ef] px-6 py-4">
      {detailsQuery.isLoading ? (
        <p className="m-0 font-mono text-[0.7rem] text-[#5a6a60] uppercase">
          Loading details…
        </p>
      ) : null}
      {detailsQuery.error ? (
        <p className="m-0 font-mono text-[0.7rem] text-[#a23a25] uppercase">
          Couldn't load details
        </p>
      ) : null}

      {details ? <PlaceDetailsBody details={details} place={place} /> : null}

      {!details ? <FallbackBody place={place} /> : null}
    </div>
  );
}

function FallbackBody({ place }: { place: Place }) {
  return (
    <>
      {place.address ? (
        <p className="m-0 mt-1 line-clamp-2 text-[0.85rem] leading-snug text-[#405047]">
          {place.address}
        </p>
      ) : null}
      <CategoryTagsLine categories={place.categories} />
    </>
  );
}
