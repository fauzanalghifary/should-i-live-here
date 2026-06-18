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
        categoryKey="food_cafe"
        count={1}
        isExpanded
        label="Food, Cafe, and Groceries"
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

  it("sorts places by highest rating", () => {
    render(
      <CategorySection
        categoryKey="food_cafe"
        count={3}
        isExpanded
        label="Food, Cafe, and Groceries"
        onPlaceSelect={vi.fn()}
        onToggle={vi.fn()}
        places={[
          makePlace({ distance_meters: 80, id: "nearest", name: "Nearest" }),
          makePlace({
            distance_meters: 420,
            id: "best",
            name: "Best Rated",
            rating: 4.8,
            rating_count: 24,
          }),
          makePlace({
            distance_meters: 240,
            id: "okay",
            name: "Okay Rated",
            rating: 4.1,
            rating_count: 80,
          }),
        ]}
        radiusMeters={2000}
        selectedPlace={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Shortest distance/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Highest rating/i }));

    const rows = screen.getAllByRole("listitem");

    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Best Rated"),
      expect.stringContaining("Okay Rated"),
      expect.stringContaining("Nearest"),
    ]);
    expect(rows[0]).toHaveTextContent("★ 4.8");
  });

  it("does not scroll the selected place into view when sorting changes", () => {
    const scrollBy = vi.fn();
    const originalScrollByDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollBy",
    );
    Object.defineProperty(HTMLElement.prototype, "scrollBy", {
      configurable: true,
      value: scrollBy,
    });

    render(
      <CategorySection
        categoryKey="food_cafe"
        count={2}
        isExpanded
        label="Food, Cafe, and Groceries"
        onPlaceSelect={vi.fn()}
        onToggle={vi.fn()}
        places={[
          makePlace({
            distance_meters: 420,
            id: "selected",
            name: "Selected",
            rating: 4.8,
          }),
          makePlace({ distance_meters: 80, id: "nearest", name: "Nearest" }),
        ]}
        radiusMeters={2000}
        selectedPlace={makePlace({ id: "selected", name: "Selected" })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Shortest distance/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Highest rating/i }));

    expect(scrollBy).not.toHaveBeenCalled();

    if (originalScrollByDescriptor) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollBy",
        originalScrollByDescriptor,
      );
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollBy");
    }
  });
});

function makePlace(place: Partial<Place>): Place {
  return {
    distance_meters: 100,
    lat: -6.2,
    lng: 106.8,
    ...place,
  };
}
