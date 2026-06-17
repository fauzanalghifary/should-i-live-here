import type { LocationCoordinate } from "../location-map/types";

type ReportCardProps = {
  location: LocationCoordinate;
  onClose: () => void;
};

export function ReportCard({ location, onClose }: ReportCardProps) {
  return (
    <aside
      aria-label="Neighborhood report"
      className="absolute bottom-4 left-4 z-10 w-[min(22rem,calc(100vw-2rem))] border border-[#17211c21] bg-[#fffdf6] p-5 shadow-[0_18px_40px_-18px_rgba(23,33,28,0.45)] sm:bottom-6 sm:left-6 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 font-mono text-xs font-bold tracking-normal text-[#5a6a60] uppercase">
          Report
        </p>
        <button
          aria-label="Dismiss report"
          className="-m-1 border-0 bg-transparent p-1 text-[#5a6a60] hover:text-[#17211c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]"
          onClick={onClose}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
          >
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>

      <h2 className="mt-1.5 mb-3 text-[1.5rem] leading-tight font-medium">
        Location selected
      </h2>
      <dl className="mt-2 mb-3 grid grid-cols-2 gap-2 border-y border-[#17211c21] py-3">
        <div>
          <dt className="font-mono text-[0.7rem] font-bold text-[#5a6a60] uppercase">
            Latitude
          </dt>
          <dd className="m-0 text-base">{formatCoordinate(location.lat)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.7rem] font-bold text-[#5a6a60] uppercase">
            Longitude
          </dt>
          <dd className="m-0 text-base">{formatCoordinate(location.lng)}</dd>
        </div>
      </dl>
      <p className="m-0 text-[0.92rem] leading-[1.55] text-[#405047]">
        Next: this card will show counts and nearby places from the API.
      </p>
    </aside>
  );
}

function formatCoordinate(value: number) {
  return value.toFixed(5);
}
