# Weather WebGIS Demo

A small web-based GIS demo application that combines weather information with
interactive map layers. It is the demo application (the "application under test")
of a bachelor thesis on **LLM-assisted generation of Playwright end-to-end tests
from use cases** — the influence of UI context, using WebGIS applications as an
example. It is built on the
[Open Pioneer Trails](https://github.com/open-pioneer) framework.

> **Live demo:** <https://nils-gb156.github.io/ba-webgis-llm-e2e/>

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

Vite will print the local address (usually <http://localhost:5173/ba-webgis-llm-e2e/>) — open it
in your browser.

### Environment variables

Configure these in `.env` (see `.env.example`):

## Scripts

| Command            | Description                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| `pnpm dev`         | Start the Vite development server                                                 |
| `pnpm build`       | Create an optimized production build in `./dist`                                  |
| `pnpm preview`     | Serve the built app locally (default: <http://localhost:4173/ba-webgis-llm-e2e/>) |
| `pnpm test`        | Run the test suite (Vitest)                                                       |
| `pnpm lint`        | Run ESLint over `src/` and `support/`                                             |
| `pnpm check-types` | Type-check the project without emitting files                                     |
| `pnpm prettier`    | Format the codebase                                                               |

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
    llm/                # Thesis test-generation tooling (use cases, skill, stage scripts, helpers)
    styles/             # Layer legend components
  packages/             # Local Open Pioneer packages
docs/                   # Documentation and tutorials
support/                # Build helpers (license report, SBOM, ...)
```

## Bachelor thesis & experiment artifacts

This repository serves a double purpose: it hosts the demo WebGIS application described
above and the experiment of the underlying bachelor thesis, which studies how the UI
context provided in a prompt influences the quality of LLM-generated Playwright E2E
tests.

The reusable test-generation tooling lives under [`src/app/llm/`](src/app/llm):

- `use_cases.md` — the ten use cases used as the functional input
- `SKILL.md` — the OPT Playwright skill given to the model in the system prompt
- `generate_tests_stage_1.py` … `generate_tests_stage_5.py` — the five context stages
- `map-model-helpers.ts`, `generate-ui-map.ts`, `manual-ui-map.json` — map-state helpers and UI maps
- `run_phase1_eval.py`, `phase2_judge_prompt.md`, `plot_stage.py` — the two-phase evaluation

The **full generation runs** — all generated tests, prompts, Phase 1/2 results and the
evaluation reports under `docs/eval/` — are kept on dedicated, frozen branches so this
branch stays focused on the application and the reusable tooling:

- [`qwen/test-generation`](https://github.com/nils-gb156/ba-webgis-llm-e2e/tree/qwen/test-generation) — main run (Qwen3.6-35B-A3B)
- [`gpt/test-generation`](https://github.com/nils-gb156/ba-webgis-llm-e2e/tree/gpt/test-generation) — secondary run for transferability (GPT-5.4, thesis appendix C)

## License

Apache-2.0 (see `LICENSE` file)
