# Should I Live Here?

"Should I Live Here?" is a small map-based web app for quick neighborhood checks in Indonesia. Click a place on the map and it returns nearby food, cafe, grocery spots, transport, healthcare, education, green spaces, and place details.

## Live URL

- https://should-i-live-here.fauzanalghifary.id/

## Quick Demo

- https://www.youtube.com/watch?v=HqqD3vIwkDI

## How to run locally

Requirements: Go, Node.js, pnpm, and a Google Places API key.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Set `GOOGLE_PLACES_API_KEY` in `apps/api/.env`, then run:

```bash
pnpm dev
```

The web app runs on `http://localhost:5173` and the API runs on `http://localhost:8080`.

## Who it's for

This is for people who are considering a move, scouting a city, or comparing unfamiliar neighborhoods before doing deeper research.

## Why this problem

Deciding where to live usually means jumping between maps, search results, property listings, and local knowledge. I built this because the first research step should be faster: click a location, see what is nearby, and decide whether it deserves more time.

## What's already out there

Google Maps and OpenStreetMap are great for exploring raw map data, but they do not summarize a place around the specific question of livability. This app is for the earlier "should I even care about this spot?" moment.

## Scope

In scope: an interactive map, click-to-inspect flow, Indonesia-focused validation, nearby place lookup, sortable category results.

Out of scope: user accounts, saved searches, comprehensive report, AI Analyzer, and location comparisons.

## Assumptions

I assumed nearby services are a useful proxy for first-pass livability, and that a 2km radius is a reasonable starting point for neighborhood-level exploration.

## Questions for real users

1. What things matter most when you decide whether an area is livable?
2. Is a 2km radius useful, or should the app adapt based on city density and transport access?
3. What would make this report feel useful enough to act on?

## How I'd know it's working

The app is working if users can inspect a location in under a minute and leave with a clearer decision: research more, skip it, or compare another area. 

## What's Next?

Next, I would add user accounts and saved searches so people can keep track of areas they are considering.

After that, I would make the report more comprehensive. I would also explore an AI analyzer that summarizes tradeoffs in plain language, then add location comparisons so users can evaluate two or three areas side by side.
