import type { StyleSpecification } from "maplibre-gl";

export const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    "osm-raster-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-raster-tiles",
      type: "raster",
      source: "osm-raster-tiles",
    },
  ],
};
