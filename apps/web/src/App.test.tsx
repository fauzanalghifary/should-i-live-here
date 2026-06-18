import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { App } from "./App";
import type { LocationCoordinate } from "./location-map/types";

type MockLocationMapProps = {
  selectedLocation: LocationCoordinate | null;
  onLocationSelect: (location: LocationCoordinate) => void;
  onEaseEnd: (location: LocationCoordinate) => void;
};

vi.mock("./location-map/LocationMap", () => ({
  LocationMap({ onEaseEnd, onLocationSelect }: MockLocationMapProps) {
    const location = { lat: -6.2088, lng: 106.8456 };

    return (
      <>
        <button
          onClick={() => {
            onLocationSelect(location);
          }}
          type="button"
        >
          Select location
        </button>
        <button
          onClick={() => {
            onEaseEnd(location);
          }}
          type="button"
        >
          Finish zoom
        </button>
      </>
    );
  },
}));

describe("App", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders the product name", () => {
    renderWithQueryClient(<App />);

    expect(
      screen.getByRole("heading", { name: "Should I Live Here?" }),
    ).toBeInTheDocument();
  });

  it("waits for map zoom to finish before fetching the report", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          counts: {
            education: 0,
            food_cafe: 0,
            green_space: 0,
            healthcare: 0,
            transport: 0,
          },
          lat: -6.2088,
          lng: 106.8456,
          places: {
            education: [],
            food_cafe: [],
            green_space: [],
            healthcare: [],
            transport: [],
          },
          radius_meters: 2000,
          score: 0,
        }),
    });
    globalThis.fetch = fetchMock;

    renderWithQueryClient(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Select location" }));

    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Finish zoom" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});

function renderWithQueryClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  );
}
