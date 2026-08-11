import os
import re
from pathlib import Path
from typing import Any, Dict, List

from dotenv import load_dotenv
from openai import OpenAI


# --- Configuration ---
load_dotenv()

AZURE_BASE_URL = "https://foundry-playwright-e2e-tests.services.ai.azure.com/openai/v1"
AZURE_API_KEY = os.getenv("AZURE_API_KEY")
MODEL_NAME = "deployment_gpt-5.4"
REASONING_EFFORT = "medium"
MAX_COMPLETION_TOKENS = 64 * 1024

STAGE = "stage_3_generated_ui_map"
NUM_RUNS = 50  # number of full generation passes; each pass -> tests/<stage>/run_NN/

SCRIPT_DIR = Path(__file__).parent
USE_CASES_FILE = SCRIPT_DIR / "use_cases.md"
SKILL_FILE = SCRIPT_DIR / "SKILL.md"
UI_MAP_FILE = SCRIPT_DIR / "generated-ui-map.md"
MAP_HELPERS_FILE = SCRIPT_DIR / "map-model-helpers.ts"
OUTPUT_DIR = SCRIPT_DIR / "tests" / STAGE
BASE_URL = "http://localhost:5173/ba-webgis-llm-e2e/"

if not AZURE_API_KEY:
    raise RuntimeError("AZURE_API_KEY is not set. Add it to your .env file.")

client = OpenAI(base_url=AZURE_BASE_URL, api_key=AZURE_API_KEY)


# Turns a title into a filesystem-safe, lowercase, hyphenated slug.
def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


# Parses use_cases.md into a list of dicts, split at each '## Use Case N: Title' heading.
def load_use_cases(file_path: Path) -> List[Dict[str, Any]]:
    """
    Reads the use cases from the markdown file.

    Each use case starts with a heading of the form
    '## Use Case <id>: <title>'. The complete markdown block is stored under
    the key 'markdown' so that it can be passed directly into the prompt.
    """
    text = file_path.read_text(encoding="utf-8")

    pattern = re.compile(r"^##\s+Use Case\s+(\d+):\s*(.+)$", re.MULTILINE)
    matches = list(pattern.finditer(text))
    if not matches:
        raise ValueError("No use cases found in markdown file.")

    use_cases: List[Dict[str, Any]] = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end].strip()

        use_cases.append({
            "id": int(match.group(1)),
            "title": match.group(2).strip(),
            "complexity": _extract_complexity(block),
            "markdown": block,
        })
    return use_cases


# Pulls the '**Complexity:** easy/medium/hard' value out of a use case block.
def _extract_complexity(block: str) -> str:
    match = re.search(r"\*\*Complexity:\*\*\s*(.+)", block)
    return match.group(1).strip() if match else "unknown"


# Reads the SKILL.md content used as the constant system prompt.
def load_skill(file_path: Path) -> str:
    return file_path.read_text(encoding="utf-8")


# =========================================================================
# UI context for this stage: auto-generated UI map + map model helpers.
# Both are read as file contents — no runtime scraping.
# The map model helper functions are passed for the first time in this stage (3).
# =========================================================================
# Reads ui-map.md and map-model-helpers.ts from disk and combines them into one context block.
def load_ui_context() -> str:
    ui_map = UI_MAP_FILE.read_text(encoding="utf-8")
    map_helpers = MAP_HELPERS_FILE.read_text(encoding="utf-8")

    return f"""\
## UI Map (auto-generated from source)

{ui_map}

## Map Model Helper Functions

The following TypeScript helper functions are available and must be imported
in the test from "../../../map-model-helpers" (relative to the generated test file).
Use them to assert map state that is not accessible through DOM locators.

map-model-helpers:
{map_helpers}
"""


# Builds the user prompt for Stage 3: use case + the auto-generated UI map + map model helpers.
def build_prompt(use_case: Dict[str, Any], base_url: str, ui_context: str) -> str:
    return f"""\
Generate a Playwright end-to-end test (TypeScript) for the following use case.

Base URL: {base_url}

UI context generated automatically from the application source:
{ui_context}

Use case:
{use_case["markdown"]}

Return only the test code."""


# Cleans the raw LLM response: strips a leftover <think> block (if any) and unwraps ```ts fences.
def extract_typescript_code(response_text: str) -> str:
    text = response_text.strip()
    # Defensive: strip any <think>...</think> reasoning block (in case thinking is active).
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE).strip()
    fenced = re.search(r"```(?:typescript|ts)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()
    return text


# Runs cheap sanity checks on the generated code and returns warnings only — never raises.
def check_generated_code(ts_code: str) -> List[str]:
    """Returns warnings — does NOT abort. All 10 use cases are always saved."""
    warnings = []
    if not ts_code.strip():
        warnings.append("empty output")
    if not re.search(r"from\s+['\"]@playwright/test['\"]", ts_code):
        warnings.append("missing Playwright import")
    if "test(" not in ts_code:
        warnings.append("missing test() block")
    if "page.goto(" not in ts_code:
        warnings.append("no navigation (page.goto)")
    if "SPDX-FileCopyrightText" not in ts_code:
        warnings.append("missing SPDX header")
    return warnings


# Sends the system (skill) + user (prompt) messages to the LLM endpoint and returns the raw text response.
def call_llm(skill: str, prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL_NAME,
        reasoning_effort=REASONING_EFFORT,
        max_completion_tokens=MAX_COMPLETION_TOKENS,
        messages=[
            {"role": "system", "content": skill},
            {"role": "user", "content": prompt},
        ],
    )
    content = response.choices[0].message.content
    if content is None:
        raise ValueError("Model returned no content.")
    return content


# Writes the .spec.ts, .prompt.txt, and .raw.txt files for one use case into the given run directory.
def save_outputs(run_dir: Path, use_case: Dict[str, Any],
                 ts_code: str, prompt: str, raw: str) -> Path:
    run_dir.mkdir(parents=True, exist_ok=True)
    slug = f"uc-{int(use_case['id']):02d}-{slugify(use_case['title'])}"
    spec = run_dir / f"{slug}.spec.ts"
    spec.write_text(ts_code + "\n", encoding="utf-8")
    (run_dir / f"{slug}.prompt.txt").write_text(prompt, encoding="utf-8")
    (run_dir / f"{slug}.raw.txt").write_text(raw, encoding="utf-8")  # unedited model response
    return spec


# Generates every use case once into a single run directory (tests/<stage>/run_NN/).
def generate_run(use_cases: List[Dict[str, Any]], skill: str,
                 ui_context: str, run_dir: Path) -> None:
    for use_case in use_cases:
        uc_id = use_case.get("id")
        try:
            print(f"  UC {uc_id:02d} ({use_case.get('complexity')}): {use_case['title']}")
            prompt = build_prompt(use_case, BASE_URL, ui_context)
            raw = call_llm(skill, prompt)
            ts_code = extract_typescript_code(raw)
            spec = save_outputs(run_dir, use_case, ts_code, prompt, raw)
            for w in check_generated_code(ts_code):
                print(f"    WARNING: {w}")
            print(f"    -> {spec}")
        except Exception as exc:
            print(f"    FAILED: {exc}")


# Main loop: repeat the full generation NUM_RUNS times, one run_NN/ directory per pass.
def generate_tests(use_cases: List[Dict[str, Any]], skill: str, ui_context: str) -> None:
    for run in range(1, NUM_RUNS + 1):
        run_dir = OUTPUT_DIR / f"run_{run:02d}"
        print(f"=== Run {run:02d}/{NUM_RUNS} -> {run_dir} ===")
        generate_run(use_cases, skill, ui_context, run_dir)


# Entry point: verify required files exist, load use cases/skill/context, then run the generation loop.
def main() -> None:
    for label, path in [("SKILL", SKILL_FILE), ("UI map", UI_MAP_FILE), ("map helpers", MAP_HELPERS_FILE)]:
        if not path.exists():
            raise SystemExit(f"{label} file not found: {path}")

    use_cases = load_use_cases(USE_CASES_FILE)
    skill = load_skill(SKILL_FILE)
    ui_context = load_ui_context()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "_stage_3_context.txt").write_text(ui_context, encoding="utf-8")
    print(f"UI context loaded ({len(ui_context)} chars), saved to _stage_3_context.txt")
    generate_tests(use_cases, skill, ui_context)


if __name__ == "__main__":
    main()