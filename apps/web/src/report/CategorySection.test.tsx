import { fireEvent, render, screen } from "@testing-library/react";

import { CategorySection } from "./CategorySection";
import type { Place } from "./types";

vi.mock("./PlaceDetails", () => ({
  PlaceDetails() {
    return <div>Place details</div>;
  },
}));

describe("CategorySection", () => {
  it("collapses the selected place when a matching place id is clicked", () => {
    const place: Place = {
      categories: ["supermarket"],
      distance_meters: 320,
      id: "place-1",
      lat: -6.2,
      lng: 106.8,
      name: "Nearby Market",
    };
    const selectedPlace: Place = { ...place };
    const handlePlaceSelect = vi.fn();

    render(
      <CategorySection
        categoryKey="essentials"
        count={1}
        isExpanded
        label="Daily essentials"
        onPlaceSelect={handlePlaceSelect}
        onToggle={vi.fn()}
        places={[place]}
        radiusMeters={2000}
        selectedPlace={selectedPlace}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Nearby Market/i }));

    expect(handlePlaceSelect).toHaveBeenCalledWith(null);
  });
});
