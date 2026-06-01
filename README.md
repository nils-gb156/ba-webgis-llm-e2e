# Weather WebGIS Demo

A small web-based GIS demo application that combines weather information with
interactive map layers. It was developed as part of a bachelor thesis on the
end-to-end use of LLMs in web development, building on the
[Open Pioneer Trails](https://github.com/open-pioneer) framework.

## Features

- Interactive map with switchable base maps (Carto Light/Dark, OpenStreetMap)
- Live weather overlays from OpenWeatherMap (temperature, precipitation, clouds)
- DWD WMS layers: UV-Index forecast and UV-Index/EUCOS ground stations
- Click anywhere on the map to:
    - load a 24-step weather forecast for that location
    - query station details from the active WMS station layers
- Geocoder search (OpenStreetMap Nominatim) to jump to any place
- Layer switcher, legend panel and a draggable measurement tool

## Prerequisites

- [Node.js](https://nodejs.org/en/) 20 or later
- [pnpm](https://pnpm.io/) 10.x
- API key for [OpenWeatherMap](https://openweathermap.org/api) (free tier is enough)

## Quick start

```bash
git clone https://github.com/nils-gb156/ba-webgis-llm-e2e.git
cd ba-webgis-llm-e2e
cp .env.example .env        # then fill in your API key
pnpm install
pnpm run dev
```

Vite will print the local address (usually <http://localhost:5173/>) — open it
in your browser.

### Environment variables

Configure these in `.env` (see `.env.example`):

## Scripts

| Command            | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| `pnpm dev`         | Start the Vite development server                               |
| `pnpm build`       | Create an optimized production build in `./dist`                |
| `pnpm preview`     | Serve the built app locally (default: <http://localhost:4173/>) |
| `pnpm test`        | Run the test suite (Vitest)                                     |
| `pnpm lint`        | Run ESLint over `src/` and `support/`                           |
| `pnpm check-types` | Type-check the project without emitting files                   |
| `pnpm prettier`    | Format the codebase                                             |

## Deployment

To build and locally test the production bundle:

```bash
pnpm run build
pnpm preview
```

For deploying to a real server or cloud, see
[How to deploy an app](/docs/tutorials/HowToDeployAnApp.md).

## Project layout

```
src/
  app/                  # Application code (entry point, services, components)
    components/         # React components (map, info panel, geocoder, ...)
    styles/             # Layer legend components
  packages/             # Local Open Pioneer packages
docs/                   # Documentation and tutorials
support/                # Build helpers (license report, SBOM, ...)
```

## License

Apache-2.0 (see `LICENSE` file)
