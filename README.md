# Weather WebGIS Demo

A small web-based GIS demo application that combines weather information with
interactive map layers. It is the demo application (the "application under test")
of a bachelor thesis on **LLM-assisted generation of Playwright end-to-end tests
from use cases** — the influence of UI context, using WebGIS applications as an
example. It is built on the
[Open Pioneer Trails](https://github.com/open-pioneer) framework.

> **Live demo:** <https://nils-gb156.github.io/ba-webgis-llm-e2e/>
>
> **This is the `gpt/test-generation` branch** — a frozen snapshot of the thesis'
> secondary transferability run (GPT-5.4, thesis appendix C). See
> [Bachelor thesis & experiment artifacts](#bachelor-thesis--experiment-artifacts).

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

| Variable                   | Description                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `VITE_OPENWEATHER_API_KEY` | API key for the OpenWeatherMap weather overlays (temperature, precipitation, clouds) |
| `VITE_CARTO_API_KEY`       | API key for the CARTO basemaps (Carto Light/Dark); required for the deployed site    |

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
docs/                   # Documentation and tutorials (incl. docs/eval evaluation reports)
support/                # Build helpers (license report, SBOM, ...)
```

## Bachelor thesis & experiment artifacts

This repository has a double purpose: it hosts the demo WebGIS application described
above and the experiment of the underlying bachelor thesis, which studies how the UI
context provided in a prompt influences the quality of LLM-generated Playwright E2E
tests.

**This `gpt/test-generation` branch is a frozen snapshot of the thesis' secondary
transferability run (thesis appendix C).** It repeats the full generation run with a
different model to check whether the effect of the UI-context stages is model-independent.
Alongside the reusable tooling it contains all generated tests, prompts, Phase 1/2
results and the evaluation reports.

### Run configuration

| Aspect                   | Value                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Model                    | GPT-5.4 (`deployment_gpt-5.4`) via the OpenAI-compatible Azure AI Foundry API               |
| Sampling                 | `reasoning_effort=medium`, no temperature control, 65,536-token max output                  |
| Generation               | 5 context stages × 50 runs × 10 use cases (2,500 tests; stage 1 has one `GENERATION_ERROR`) |
| Phase 1 (execution)      | Playwright / Chromium against the local demo app                                            |
| Phase 2 (LLM-as-a-judge) | Claude Opus 5                                                                               |

### Where to find things

- **Reusable tooling** — [`src/app/llm/`](src/app/llm): `use_cases.md` (the ten use cases),
  `SKILL.md` (the OPT Playwright skill in the system prompt),
  `generate_tests_stage_1.py` … `generate_tests_stage_5.py` (the five context stages),
  `map-model-helpers.ts`, `generate-ui-map.ts`, `manual-ui-map.json` (map-state helpers and
  UI maps), and the two-phase evaluation (`run_phase1_eval.py`, `phase2_judge_prompt.md`,
  `plot_stage.py`).
- **Generated tests, prompts and per-stage results** — [`src/app/llm/tests/`](src/app/llm/tests):
  `stage_1_baseline` … `stage_5_self_improvement_loop`, each with 50 runs plus the
  `_phase1_results.csv` / `_phase2_judge.csv` result files.
- **Evaluation reports** — [`docs/eval/`](docs/eval).

### Citing this run

This branch is tagged **`gpt-v1.0`** for a stable, citable snapshot:
<https://github.com/nils-gb156/ba-webgis-llm-e2e/tree/gpt-v1.0>

The main generation run (Qwen3.6-35B-A3B) lives on the
[`qwen/test-generation`](https://github.com/nils-gb156/ba-webgis-llm-e2e/tree/qwen/test-generation)
branch, tagged `qwen-v1.0`.

## License

Apache-2.0 (see `LICENSE` file)
