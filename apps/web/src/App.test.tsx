import { render, screen } from "@testing-library/react";

import { App } from "./App";
import type { LocationCoordinate } from "./LocationMap";

type MockLocationMapProps = {
  selectedLocation: LocationCoordinate | null;
  onLocationSelect: (location: LocationCoordinate) => void;
};

vi.mock("./LocationMap", () => ({
  LocationMap({ onLocationSelect }: MockLocationMapProps) {
    return (
      <button
        onClick={() => {
          onLocationSelect({ lat: -6.2088, lng: 106.8456 });
        }}
        type="button"
      >
        Mock map
      </button>
    );
  },
}));

describe("App", () => {
  it("renders the product name", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Should I Live Here?" }),
    ).toBeInTheDocument();
  });
});
