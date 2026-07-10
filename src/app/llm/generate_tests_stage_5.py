import json
import re
import subprocess
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from openai import OpenAI
from playwright.sync_api import sync_playwright, Page


# --- Configuration ---
LM_STUDIO_BASE_URL = "http://dgx01:8000/v1"
LM_STUDIO_API_KEY = "lm-studio"
MODEL_NAME = "Qwen/Qwen3.6-35B-A3B-FP8"
MODEL_QUANTIZATION = "FP8"
TEMPERATURE = 0.6
MAX_TOKENS = 16384         # thinking tokens count towards this token budget
# Qwen3 has thinking enabled by default; no explicit parameter is passed.

STAGE = "stage_5_self_improvement_loop"
MAX_ITERATIONS = 5         # abort criterion: PASS or 5 iterations, whichever comes first

SCRIPT_DIR = Path(__file__).parent
USE_CASES_FILE = SCRIPT_DIR / "use_cases.md"
SKILL_FILE = SCRIPT_DIR / "SKILL.md"
MAP_HELPERS_FILE = SCRIPT_DIR / "map-model-helpers.ts"
OUTPUT_DIR = SCRIPT_DIR / "tests" / STAGE
BASE_URL = "http://localhost:5173/ba-webgis-llm-e2e/"

# Directory from which `npx playwright test` is executed.
# Must be the directory containing playwright.config.ts / node_modules.
# The script lives in src/app/llm, so src/app is one level up.
PLAYWRIGHT_CWD = SCRIPT_DIR.parent  # -> src/app (contains package.json + tests)
PLAYWRIGHT_TIMEOUT_S = 180  # hard timeout per test run (subprocess level)

# Playwright writes per-test artifacts (incl. the failure snapshot written by
# the fixture) into this directory. Cleared before every run so that only the
# snapshot of the CURRENT run can be collected.
TEST_RESULTS_DIR = PLAYWRIGHT_CWD / "test-results"

# Harness instrumentation: fixture that captures the application state at the
# point of failure. The import in the EXECUTION COPY of a generated spec is
# rewritten from '@playwright/test' to this module. The generated spec itself
# (the file that is evaluated) is never modified.
# Location on disk: SCRIPT_DIR / "tests" / "failure-snapshot-fixture.ts"
# Exec specs live in tests/<stage>/<uc-dir>/ -> two levels up.
FIXTURE_IMPORT = "../../failure-snapshot-fixture"

# Max characters of Playwright error output fed back into the prompt.
# Keeps the feedback prompt small; full output is always saved to disk.
MAX_ERROR_CHARS = 3000
# Max characters of the failure-state snapshot fed back into the prompt.
# The data-testid list at the top of the snapshot is never truncated (it is
# small and carries the highest correction value); only the aria tree that
# follows is trimmed to the remaining budget.
MAX_SNAPSHOT_CHARS = 6000

client = OpenAI(base_url=LM_STUDIO_BASE_URL, api_key=LM_STUDIO_API_KEY)


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
# UI context: automatic snapshot of the initial page state (data-testid +
# aria tree) plus the map model helper file contents. Failing tests are then
# executed against the live app and the error output plus a failure-state
# snapshot are fed back to the model.
# =========================================================================
def scrape_app_context(base_url: str) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(base_url, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_selector("[data-testid]", timeout=10000)  # wait for the mounted app
        test_ids = _extract_test_ids(page)
        aria = _aria_snapshot(page)
        browser.close()

    sections = []
    if test_ids:
        sections.append("data-testid attributes found in the app:\n"
                        + "\n".join(f"  - {t}" for t in test_ids))
    if aria:
        sections.append("Accessibility tree (roles, names, states):\n" + aria)
    return "\n\n".join(sections)


# Walks the DOM (including shadow roots) and collects every distinct data-testid value.
def _extract_test_ids(page: Page) -> List[str]:
    """All data-testid values, incl. Shadow DOM (OPT renders as a web component)."""
    raw = page.evaluate("""
        () => {
            function collect(root, ids) {
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                let node = walker.nextNode();
                while (node) {
                    if (node.shadowRoot) collect(node.shadowRoot, ids);
                    const tid = node.getAttribute && node.getAttribute('data-testid');
                    if (tid) ids.add(tid);
                    node = walker.nextNode();
                }
            }
            const ids = new Set();
            collect(document.body, ids);
            return [...ids];
        }
    """)
    return sorted(raw) if raw else []


# Takes Playwright's built-in accessibility snapshot of the page body (YAML string), or "" on failure.
def _aria_snapshot(page: Page) -> str:
    """Current Playwright accessibility snapshot (YAML form)."""
    try:
        return page.locator("body").aria_snapshot()
    except Exception as exc:
        print(f"  [warn] aria snapshot failed: {exc}")
        return ""


# Combines the scraped snapshot with the map model helper file contents.
def build_ui_context(scraped: str) -> str:
    map_helpers = MAP_HELPERS_FILE.read_text(encoding="utf-8")
    # Specs live at tests/<stage>/<uc-dir>/, hence three levels up to the helpers file.
    return f"""\
{scraped}

## Map Model Helper Functions

The following TypeScript helper functions are available and must be imported
in the test from "../../../map-model-helpers" (relative to the generated test file).
Use them to assert map state that is not accessible through DOM locators.

map-model-helpers:
{map_helpers}
"""


# Builds the INITIAL user prompt (iteration 0): identical role to stage 2, plus helpers.
def build_initial_prompt(use_case: Dict[str, Any], base_url: str, ui_context: str) -> str:
    return f"""\
Generate a Playwright end-to-end test (TypeScript) for the following use case.

Base URL: {base_url}

UI context extracted automatically from the running application:
{ui_context}

Use case:
{use_case["markdown"]}

Return only the test code."""


# Builds the FEEDBACK prompt (iteration >= 1): previous code + trimmed Playwright
# errors + (if available) the application state captured at the point of failure.
# Stateless per iteration: no conversation history is carried over — the failed
# code, the error output and the failure snapshot contain everything needed and
# keep the context small.
def build_feedback_prompt(use_case: Dict[str, Any], base_url: str, ui_context: str,
                          previous_code: str, error_report: str,
                          failure_snapshot: str) -> str:
    snapshot_section = ""
    if failure_snapshot.strip():
        snapshot_section = f"""

Application state at the point of failure (data-testids and accessibility tree
captured AFTER the test steps that did run — elements listed here may not exist
in the initial page state):
{failure_snapshot}"""

    return f"""\
The following Playwright end-to-end test (TypeScript) was generated for the use case
below, but it FAILED when executed against the live application.

Base URL: {base_url}

UI context extracted automatically from the running application (initial page state):
{ui_context}

Use case:
{use_case["markdown"]}

Previous test code (failing):
```typescript
{previous_code}
```

Playwright error output:
{error_report}{snapshot_section}

Fix the test so that it correctly verifies the use case and passes.
Do not weaken or remove assertions just to make the test pass — the test must
still verify the behaviour described in the use case.
Return only the corrected test code."""


# Cleans the raw LLM response: strips the <think> block and unwraps ```ts fences.
def extract_typescript_code(response_text: str) -> str:
    text = response_text.strip()
    # Thinking is on by default for Qwen3; if the endpoint returns the reasoning
    # inline (instead of a separate reasoning_content field), strip it here.
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE).strip()
    fenced = re.search(r"```(?:typescript|ts)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()
    return text


# Runs cheap sanity checks on the generated code and returns warnings only — never raises.
def check_generated_code(ts_code: str) -> List[str]:
    """Returns warnings — does NOT abort. All use cases are always saved."""
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
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        messages=[
            {"role": "system", "content": skill},
            {"role": "user", "content": prompt},
        ],
    )
    content = response.choices[0].message.content
    if content is None:
        raise ValueError("Model returned no content.")
    return content


# =========================================================================
# Harness instrumentation: execution copy with injected fixture
# =========================================================================
# Creates an execution copy of the generated spec in which the import of
# '@playwright/test' is rewritten to the failure-snapshot fixture. The
# ORIGINAL spec (which is evaluated later) is never modified.
def make_exec_copy(spec: Path) -> Path:
    code = spec.read_text(encoding="utf-8")
    exec_code = re.sub(
        r"(from\s+)['\"]@playwright/test['\"]",
        rf"\1'{FIXTURE_IMPORT}'",
        code,
    )
    exec_spec = spec.with_name(spec.name.replace(".spec.ts", ".exec.spec.ts"))
    exec_spec.write_text(exec_code, encoding="utf-8")
    return exec_spec


# Clears the Playwright test-results directory so that a collected failure
# snapshot always belongs to the CURRENT run.
def clear_test_results() -> None:
    if TEST_RESULTS_DIR.exists():
        shutil.rmtree(TEST_RESULTS_DIR, ignore_errors=True)


# Collects the failure snapshot written by the fixture (if any).
# Truncation-safe: the data-testid list (head of the file) is always kept in
# full; only the aria tree is trimmed to the remaining character budget.
def collect_failure_snapshot() -> str:
    if not TEST_RESULTS_DIR.exists():
        return ""
    candidates = sorted(TEST_RESULTS_DIR.rglob("failure-snapshot.txt"),
                        key=lambda p: p.stat().st_mtime, reverse=True)
    if not candidates:
        return ""
    text = candidates[0].read_text(encoding="utf-8")
    if len(text) <= MAX_SNAPSHOT_CHARS:
        return text

    marker = "\n\nAccessibility tree at failure:\n"
    if marker in text:
        head, tree = text.split(marker, 1)  # head = testid list, always kept
        budget = max(MAX_SNAPSHOT_CHARS - len(head) - len(marker), 0)
        return head + marker + tree[:budget] + "\n[... truncated ...]"

    return text[:MAX_SNAPSHOT_CHARS] + "\n[... truncated ...]"


# =========================================================================
# Playwright execution and error extraction
# =========================================================================
# Runs a single spec file with the JSON reporter; returns (passed, error_report, raw_json).
def run_playwright_test(spec: Path) -> Tuple[bool, str, str]:
    npx = shutil.which("npx")
    if npx is None:
        raise RuntimeError("npx not found on PATH.")
    # Playwright treats the positional argument as a regex filter matched against
    # the test file paths (forward slashes, relative to rootDir). Passing an
    # absolute Windows path with backslashes never matches ("No tests found"),
    # which would be misreported as a test failure. Pass a forward-slash path
    # relative to the run directory instead.
    try:
        spec_arg = spec.resolve().relative_to(PLAYWRIGHT_CWD.resolve()).as_posix()
    except ValueError:
        spec_arg = spec.as_posix()
    cmd = [npx, "playwright", "test", spec_arg, "--reporter=json"]
    try:
        proc = subprocess.run(
            cmd,
            cwd=PLAYWRIGHT_CWD,
            capture_output=True,
            text=True,
            timeout=PLAYWRIGHT_TIMEOUT_S,
        )
    except subprocess.TimeoutExpired:
        return False, f"Test run exceeded the hard timeout of {PLAYWRIGHT_TIMEOUT_S}s.", ""

    raw_json = proc.stdout or ""
    passed, errors = _parse_json_report(raw_json)

    if passed:
        return True, "", raw_json

    # Fallback: if the JSON report could not be parsed (e.g. compile error),
    # use stderr/stdout directly as the error report.
    if not errors:
        fallback = (proc.stderr or "") + "\n" + raw_json
        errors = [fallback.strip() or "Unknown failure (no reporter output)."]

    report = "\n\n---\n\n".join(errors)
    if len(report) > MAX_ERROR_CHARS:
        report = report[:MAX_ERROR_CHARS] + "\n[... truncated ...]"
    return False, report, raw_json


# Parses the Playwright JSON reporter output; returns (all_passed, list_of_error_messages).
def _parse_json_report(raw_json: str) -> Tuple[bool, List[str]]:
    try:
        data = json.loads(raw_json)
    except (json.JSONDecodeError, ValueError):
        return False, []

    errors: List[str] = []
    statuses: List[str] = []

    def walk(suite: Dict[str, Any]) -> None:
        for child in suite.get("suites", []):
            walk(child)
        for spec_entry in suite.get("specs", []):
            for test in spec_entry.get("tests", []):
                for result in test.get("results", []):
                    statuses.append(result.get("status", "unknown"))
                    for err in result.get("errors", []):
                        msg = err.get("message", "")
                        if msg:
                            errors.append(_strip_ansi(msg))

    for suite in data.get("suites", []):
        walk(suite)

    # Also collect top-level errors (e.g. TypeScript compile errors).
    for err in data.get("errors", []):
        msg = err.get("message", "")
        if msg:
            errors.append(_strip_ansi(msg))

    all_passed = bool(statuses) and all(s in ("passed", "expected") for s in statuses)
    return all_passed, errors


# Removes ANSI colour codes from Playwright error messages.
def _strip_ansi(text: str) -> str:
    return re.sub(r"\x1b\[[0-9;]*m", "", text)


# =========================================================================
# Output handling
# =========================================================================
# Writes spec, prompt, and raw response for one iteration of one use case.
def save_iteration(uc_dir: Path, base: str,
                   ts_code: str, prompt: str, raw: str) -> Path:
    uc_dir.mkdir(parents=True, exist_ok=True)
    spec = uc_dir / f"{base}.spec.ts"
    spec.write_text(ts_code + "\n", encoding="utf-8")
    (uc_dir / f"{base}.prompt.txt").write_text(prompt, encoding="utf-8")
    (uc_dir / f"{base}.raw.txt").write_text(raw, encoding="utf-8")  # unedited model response
    return spec


# =========================================================================
# Self-improvement loop per use case
# =========================================================================
def run_loop_for_use_case(use_case: Dict[str, Any], skill: str, ui_context: str) -> Dict[str, Any]:
    uc_prefix = f"uc-{int(use_case['id']):02d}"
    title_slug = slugify(use_case["title"])
    slug = f"{uc_prefix}-{title_slug}"
    uc_dir = OUTPUT_DIR / slug

    history: List[Dict[str, Any]] = []
    previous_code: Optional[str] = None
    error_report = ""
    failure_snapshot = ""
    passed = False

    for iteration in range(MAX_ITERATIONS):
        if iteration == 0:
            prompt = build_initial_prompt(use_case, BASE_URL, ui_context)
        else:
            prompt = build_feedback_prompt(use_case, BASE_URL, ui_context,
                                           previous_code or "", error_report,
                                           failure_snapshot)

        print(f"  iter {iteration}: generating...")
        raw = call_llm(skill, prompt)
        ts_code = extract_typescript_code(raw)
        # File name scheme: uc-<id>-iter-<n>-<title-slug>
        base = f"{uc_prefix}-iter-{iteration}-{title_slug}"
        spec = save_iteration(uc_dir, base, ts_code, prompt, raw)
        for w in check_generated_code(ts_code):
            print(f"    WARNING: {w}")

        print(f"  iter {iteration}: running Playwright...")
        clear_test_results()
        exec_spec = make_exec_copy(spec)  # harness instrumentation, original untouched
        passed, error_report, raw_json = run_playwright_test(exec_spec)
        (uc_dir / f"{base}.result.json").write_text(
            raw_json or "{}", encoding="utf-8")

        if not passed:
            failure_snapshot = collect_failure_snapshot()
            if failure_snapshot:
                (uc_dir / f"{base}.failure-snapshot.txt").write_text(
                    failure_snapshot, encoding="utf-8")
                print(f"    failure snapshot captured ({len(failure_snapshot)} chars)")
            else:
                print("    no failure snapshot available (page closed?)")
        else:
            failure_snapshot = ""

        history.append({
            "iteration": iteration,
            "spec": spec.name,
            "passed": passed,
            "failure_snapshot_captured": bool(failure_snapshot),
            "error_excerpt": error_report[:500],
        })
        print(f"  iter {iteration}: {'PASS' if passed else 'FAIL'}")

        if passed:
            break
        previous_code = ts_code

    summary = {
        "use_case_id": use_case["id"],
        "title": use_case["title"],
        "complexity": use_case["complexity"],
        "passed": passed,
        "iterations_used": len(history),
        "max_iterations": MAX_ITERATIONS,
        "history": history,
    }
    (uc_dir / f"{slug}-loop-summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return summary


# Entry point: load inputs, scrape the live app once, then run the loop per use case.
def main() -> None:
    use_cases = load_use_cases(USE_CASES_FILE)
    skill = load_skill(SKILL_FILE)

    fixture = SCRIPT_DIR / "tests" / "failure-snapshot-fixture.ts"
    if not fixture.exists():
        raise SystemExit(f"Fixture not found: {fixture}\n"
                         f"Stage 5 requires the failure-snapshot fixture — aborting.")

    print("Scraping live app for UI context (initial page state)...")
    try:
        scraped = scrape_app_context(BASE_URL)
    except Exception as exc:
        raise SystemExit(f"Could not scrape app context: {exc}\n"
                         f"Stage 5 requires the running app — aborting.")

    if not scraped.strip():
        raise SystemExit("No UI context extracted (no testids / aria) — aborting.")

    ui_context = build_ui_context(scraped)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "_stage_5_context.txt").write_text(ui_context, encoding="utf-8")
    print(f"  Context captured ({len(ui_context)} chars), saved to _stage_5_context.txt")

    all_summaries: List[Dict[str, Any]] = []
    for use_case in use_cases:
        print(f"UC {use_case['id']:02d} ({use_case['complexity']}): {use_case['title']}")
        try:
            summary = run_loop_for_use_case(use_case, skill, ui_context)
            all_summaries.append(summary)
            status = "PASS" if summary["passed"] else "FAIL"
            print(f"  -> {status} after {summary['iterations_used']} iteration(s)")
        except Exception as exc:
            print(f"  FAILED: {exc}")

    (OUTPUT_DIR / "_stage_5_run_summary.json").write_text(
        json.dumps(all_summaries, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nRun summary saved to _stage_5_run_summary.json")


if __name__ == "__main__":
    main()