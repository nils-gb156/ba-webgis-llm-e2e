import base64
import json
import re
import subprocess
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from openai import OpenAI
from playwright.sync_api import sync_playwright, Page


# --- Configuration ---
LLM_BASE_URL = "http://dgx01:8000/v1"
LLM_API_KEY = "lm-studio"  # any non-empty string; vLLM does not validate it
MODEL_NAME = "Qwen/Qwen3.6-35B-A3B-FP8"
MODEL_QUANTIZATION = "FP8"
TEMPERATURE = 0.6
MAX_TOKENS = 64 * 1024

STAGE = "stage_5_self_improvement_loop"
MAX_ITERATIONS = 10         # abort criterion: PASS or 10 iterations, whichever comes first
NUM_RUNS = 2              # number of full passes; each pass -> tests/<stage>/run_NN/

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

# Playwright writes per-test artifacts (incl. failure snapshot + screenshot
# written by the fixture) into this directory. Cleared before every run so
# that collected artifacts always belong to the CURRENT run.
TEST_RESULTS_DIR = PLAYWRIGHT_CWD / "test-results"

# Harness instrumentation: fixture that captures the application state at the
# point of failure (text snapshot + screenshot). The import in the EXECUTION
# COPY of a generated spec is rewritten from '@playwright/test' to this module.
# The generated spec itself (the file that is evaluated) is never modified.
# Location on disk: SCRIPT_DIR / "tests" / "failure-snapshot-fixture.ts"
# Exec specs live in tests/<stage>/run_NN/<uc-dir>/ -> three levels up.
FIXTURE_IMPORT = "../../../failure-snapshot-fixture"

# Max characters of Playwright error output fed back into the prompt.
# Keeps the feedback prompt small; full output is always saved to disk.
MAX_ERROR_CHARS = 3000
# Max characters of the failure-state snapshot fed back into the prompt.
# The data-testid list at the top of the snapshot is never truncated (it is
# small and carries the highest correction value); only the aria tree that
# follows is trimmed to the remaining budget.
MAX_SNAPSHOT_CHARS = 6000

# Screenshot channel: the model (Qwen3.6, natively multimodal) receives a
# screenshot of the application as image input — the only channel through
# which the canvas-rendered map state can reach the model. The initial
# screenshot accompanies iteration 0; the failure screenshot accompanies
# every feedback iteration.
SEND_SCREENSHOTS = True

# Viewport used for scraping / screenshots. Full HD so the model sees the
# layout at a realistic desktop resolution. Keep this in sync with the
# `viewport` in playwright.config.ts so scrape and failure screenshots match.
VIEWPORT = {"width": 1920, "height": 1080}

# The basemap is rendered by OpenLayers onto a <canvas> as tiles arrive over
# the network. A screenshot taken immediately after the app mounts shows an
# empty (white) map because no tiles have painted yet. After the DOM is ready
# we therefore wait for the network to go idle and then allow a short settle
# time for the tiles to be drawn onto the canvas before capturing.
MAP_SETTLE_MS = 2000

client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)


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
# aria tree) plus the map model helper file contents, plus an initial
# screenshot. Failing tests are then executed against the live app and the
# error output, a failure-state snapshot and a failure screenshot are fed
# back to the model.
# =========================================================================
# Scrapes testids + aria tree AND takes an initial screenshot.
# Returns (context_text, screenshot_png_bytes).
def scrape_app_context(base_url: str) -> Tuple[str, bytes]:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport=VIEWPORT)
        page.goto(base_url, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_selector("[data-testid]", timeout=10000)  # wait for the mounted app
        # Let the basemap tiles load and paint onto the canvas so the initial
        # screenshot actually shows the map instead of an empty white area.
        try:
            page.wait_for_load_state("networkidle", timeout=10000)
        except Exception:
            pass  # not fatal — capture whatever has rendered so far
        page.wait_for_timeout(MAP_SETTLE_MS)
        test_ids = _extract_test_ids(page)
        aria = _aria_snapshot(page)
        screenshot = page.screenshot()  # initial visual state (PNG bytes)
        browser.close()

    sections = []
    if test_ids:
        sections.append("data-testid attributes found in the app:\n"
                        + "\n".join(f"  - {t}" for t in test_ids))
    if aria:
        sections.append("Accessibility tree (roles, names, states):\n" + aria)
    return "\n\n".join(sections), screenshot


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
    # Specs live at tests/<stage>/run_NN/<uc-dir>/, hence four levels up to the helpers file.
    return f"""\
{scraped}

## Map Model Helper Functions

The following TypeScript helper functions are available and must be imported
in the test from "../../../../map-model-helpers" (relative to the generated test file).
Use them to assert map state that is not accessible through DOM locators.

map-model-helpers:
{map_helpers}
"""


# Builds the INITIAL user prompt (iteration 0): identical role to stage 2, plus helpers.
# If a screenshot accompanies the prompt, the text references it.
def build_initial_prompt(use_case: Dict[str, Any], base_url: str, ui_context: str,
                         has_screenshot: bool) -> str:
    screenshot_note = ""
    if has_screenshot:
        screenshot_note = ("\nA screenshot of the application's initial state is "
                           "attached as an image. Use it to understand the layout "
                           "and the visual map state.\n")

    return f"""\
Generate a Playwright end-to-end test (TypeScript) for the following use case.

Base URL: {base_url}
{screenshot_note}
UI context extracted automatically from the running application:
{ui_context}

Use case:
{use_case["markdown"]}

Return only the test code."""


# Builds the FEEDBACK prompt (iteration >= 1): previous code + trimmed Playwright
# errors + (if available) the application state captured at the point of failure
# (text snapshot; a failure screenshot is attached as image input if available).
# Stateless per iteration: no conversation history is carried over — the failed
# code, the error output and the failure state contain everything needed and
# keep the context small.
def build_feedback_prompt(use_case: Dict[str, Any], base_url: str, ui_context: str,
                          previous_code: str, error_report: str,
                          failure_snapshot: str, has_screenshot: bool) -> str:
    snapshot_section = ""
    if failure_snapshot.strip():
        snapshot_section = f"""

Application state at the point of failure (data-testids and accessibility tree
captured AFTER the test steps that did run — elements listed here may not exist
in the initial page state):
{failure_snapshot}"""

    screenshot_note = ""
    if has_screenshot:
        screenshot_note = ("\n\nA screenshot of the application at the point of "
                           "failure is attached as an image. It shows the visual "
                           "state including the canvas-rendered map, which is not "
                           "represented in the accessibility tree.")

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
{error_report}{snapshot_section}{screenshot_note}

Fix the test so that it correctly verifies the use case and passes.
Do not weaken or remove assertions just to make the test pass — the test must
still verify the behaviour described in the use case.
Return only the corrected test code."""


# Cleans the raw LLM response: strips the <think> block and unwraps ```ts fences.
# Robust against three observed failure modes:
#   1. Multiple fenced blocks (explanatory snippet + full test) -> take the LONGEST.
#   2. Unclosed fence (model stopped mid-output) -> strip the opening fence line.
#   3. Stray fence lines left in otherwise plain output -> drop fence-only lines.
def extract_typescript_code(response_text: str) -> str:
    text = response_text.strip()
    # Thinking is on by default for Qwen3; if the endpoint returns the reasoning
    # inline (instead of a separate reasoning_content field), strip it here.
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE).strip()

    blocks = re.findall(r"```(?:typescript|ts)?\s*\n?(.*?)```", text,
                        re.DOTALL | re.IGNORECASE)
    if blocks:
        return max(blocks, key=len).strip()

    # Unclosed fence: everything after the opening fence line is the code.
    unclosed = re.search(r"```(?:typescript|ts)?\s*\n(.*)$", text,
                         re.DOTALL | re.IGNORECASE)
    if unclosed:
        text = unclosed.group(1)

    # Drop any remaining fence-only lines (e.g. a trailing ``` that would
    # otherwise end up in the spec and cause a compile error).
    lines = [ln for ln in text.splitlines() if ln.strip() not in ("```", "```typescript", "```ts")]
    return "\n".join(lines).strip()


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


# Sends the system (skill) + user (prompt, optionally with an image) messages
# to the LLM endpoint and returns the raw text response.
# screenshot_png: raw PNG bytes attached as image input (multimodal), or None.
def call_llm(skill: str, prompt: str, screenshot_png: Optional[bytes] = None) -> str:
    if screenshot_png is not None:
        b64 = base64.b64encode(screenshot_png).decode("ascii")
        user_content: Any = [
            {"type": "text", "text": prompt},
            {"type": "image_url",
             "image_url": {"url": f"data:image/png;base64,{b64}"}},
        ]
    else:
        user_content = prompt

    response = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        messages=[
            {"role": "system", "content": skill},
            {"role": "user", "content": user_content},
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


# Clears the Playwright test-results directory so that collected failure
# artifacts always belong to the CURRENT run.
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


# Collects the failure screenshot written by the fixture (if any).
# Returns the PNG bytes, or None if no screenshot was captured.
def collect_failure_screenshot() -> Optional[bytes]:
    if not TEST_RESULTS_DIR.exists():
        return None
    candidates = sorted(TEST_RESULTS_DIR.rglob("failure-screenshot.png"),
                        key=lambda p: p.stat().st_mtime, reverse=True)
    if not candidates:
        return None
    return candidates[0].read_bytes()


# Collects the end screenshot written by the fixture on a passing test (if any).
# Returns the PNG bytes, or None if no screenshot was captured. Used purely for
# human visual verification of the final state — not fed back to the model.
def collect_end_screenshot() -> Optional[bytes]:
    if not TEST_RESULTS_DIR.exists():
        return None
    candidates = sorted(TEST_RESULTS_DIR.rglob("end-screenshot.png"),
                        key=lambda p: p.stat().st_mtime, reverse=True)
    if not candidates:
        return None
    return candidates[0].read_bytes()


# =========================================================================
# Playwright execution and error extraction
# =========================================================================
# Runs a single spec file with the JSON reporter; returns (passed, error_report, raw_json).
def run_playwright_test(spec: Path) -> Tuple[bool, str, str]:
    # Use `pnpm exec` rather than `npx`: on this machine npx resolves through an
    # nvm4w symlink into another user's protected profile and crashes with EPERM
    # ("Could not determine Node.js install directory") before producing any
    # reporter output, which would be misreported as a test failure. pnpm runs
    # from the current user's profile and invokes the locally installed
    # Playwright binary directly.
    pnpm = shutil.which("pnpm")
    if pnpm is None:
        raise RuntimeError("pnpm not found on PATH.")
    # Playwright treats the positional argument as a regex filter matched against
    # the test file paths (forward slashes, relative to rootDir). Passing an
    # absolute Windows path with backslashes never matches ("No tests found"),
    # which would be misreported as a test failure. Pass a forward-slash path
    # relative to the run directory instead.
    try:
        spec_arg = spec.resolve().relative_to(PLAYWRIGHT_CWD.resolve()).as_posix()
    except ValueError:
        spec_arg = spec.as_posix()
    cmd = [pnpm, "exec", "playwright", "test", spec_arg, "--reporter=json"]
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
    # The exec copy imports the failure-snapshot fixture instead of
    # '@playwright/test', which leaks the internal module name into stack
    # traces (e.g. "_failureSnapshotFixture.expect.poll(...)"). Strip it so
    # the feedback the model sees is free of harness instrumentation.
    report = report.replace("_failureSnapshotFixture.", "")
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


# Coarse error taxonomy for the per-iteration records. Purely descriptive
# metadata for the evaluation (error-class fix rates, oscillation analysis) —
# it does NOT influence the loop or the feedback prompt. Order matters:
# more specific patterns are checked before generic ones.
def classify_error(report: str) -> str:
    if not report.strip():
        return "none"
    checks = [
        ("generation_error", ("No tests found", "SyntaxError", "Unexpected token",
                              "Unterminated", "has already been declared")),
        ("api_misuse", ("is not a function", 'does not support "resolves"',
                        "expectedNumber: expected float, got object")),
        ("selector_ambiguity", ("strict mode violation",)),
        ("pointer_interception", ("intercepts pointer events",)),
        ("timeout", ("Test timeout", "exceeded the hard timeout")),
        ("matcher_type_error", ("Matcher error",)),
        ("element_not_found", ("element(s) not found",)),
        ("assertion_fail", ("expect(received)", "expect(locator)",
                            "Timeout 5000ms exceeded while waiting on the predicate")),
    ]
    for label, needles in checks:
        if any(n in report for n in needles):
            return label
    return "other"


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


# Appends one compact record per (use case × run) to the aggregate JSONL file.
# Contains exactly the fields the distribution analysis / judge step needs, so
# it never has to crawl the 500 per-UC directories.
def append_all_runs_record(all_runs_path: Path, summary: Dict[str, Any]) -> None:
    record = {
        "run": summary["run"],
        "uc_id": summary["use_case_id"],
        "complexity": summary["complexity"],
        "passed": summary["passed"],
        "iterations_used": summary["iterations_used"],
        "final_spec": summary["final_spec"],
        "iterations": [
            {
                "iteration": h["iteration"],
                "passed": h["passed"],
                "error_type": h.get("error_type", ""),
                "error_excerpt": h["error_excerpt"],
            }
            for h in summary["history"]
        ],
    }
    if summary.get("harness_error"):
        record["harness_error"] = summary["harness_error"]
    with all_runs_path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")


# Rebuilds the aggregate JSONL from all per-UC loop-summary files on disk.
# Returns the number of records written. Called once at startup so that a
# resumed session starts from a consistent aggregate (harness-error records
# from a previous session are intentionally dropped — those cells have no
# summary file and will simply be retried).
def rebuild_all_runs_file(all_runs_path: Path) -> int:
    summaries: List[Dict[str, Any]] = []
    for summary_file in sorted(OUTPUT_DIR.glob("run_*/*/*-loop-summary.json")):
        try:
            summaries.append(json.loads(summary_file.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError) as exc:
            print(f"  [warn] unreadable summary skipped: {summary_file} ({exc})")
    summaries.sort(key=lambda s: (s.get("run", ""), s.get("use_case_id", 0)))
    all_runs_path.write_text("", encoding="utf-8")
    for s in summaries:
        append_all_runs_record(all_runs_path, s)
    return len(summaries)


# =========================================================================
# Self-improvement loop per use case
# =========================================================================
def run_loop_for_use_case(use_case: Dict[str, Any], skill: str, ui_context: str,
                          initial_screenshot: Optional[bytes],
                          run_id: str, run_dir: Path) -> Dict[str, Any]:
    uc_prefix = f"uc-{int(use_case['id']):02d}"
    title_slug = slugify(use_case["title"])
    slug = f"{uc_prefix}-{title_slug}"
    uc_dir = run_dir / slug
    # Resume support: a completed loop-summary marks this (use case x run)
    # cell as done. Skip it so an interrupted session (crash, Ctrl+C) can be
    # continued without regenerating finished cells. The loaded summary is
    # marked "_resumed" so main() does not append it to the JSONL again (the
    # aggregate is rebuilt from all summary files at startup).
    summary_path = uc_dir / f"{slug}-loop-summary.json"
    if summary_path.exists():
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
        summary["_resumed"] = True
        print("  -> already completed in a previous session, skipping")
        return summary
    # Clear the UC directory for THIS run so no artifacts from an earlier,
    # INCOMPLETE execution linger (crash mid-loop leaves iterations without a
    # summary). Mandatory to prevent "ghost iterations" in the collected data.
    if uc_dir.exists():
        shutil.rmtree(uc_dir, ignore_errors=True)

    history: List[Dict[str, Any]] = []
    previous_code: Optional[str] = None
    error_report = ""
    failure_snapshot = ""
    failure_screenshot: Optional[bytes] = None
    passed = False

    for iteration in range(MAX_ITERATIONS):
        if iteration == 0:
            screenshot = initial_screenshot if SEND_SCREENSHOTS else None
            prompt = build_initial_prompt(use_case, BASE_URL, ui_context,
                                          has_screenshot=screenshot is not None)
        else:
            screenshot = failure_screenshot if SEND_SCREENSHOTS else None
            prompt = build_feedback_prompt(use_case, BASE_URL, ui_context,
                                           previous_code or "", error_report,
                                           failure_snapshot,
                                           has_screenshot=screenshot is not None)

        print(f"  iter {iteration}: generating"
              f"{' (with screenshot)' if screenshot is not None else ''}...")
        raw = call_llm(skill, prompt, screenshot_png=screenshot)
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

            failure_screenshot = collect_failure_screenshot()
            if failure_screenshot:
                (uc_dir / f"{base}.failure-screenshot.png").write_bytes(
                    failure_screenshot)
                print(f"    failure screenshot captured "
                      f"({len(failure_screenshot)} bytes)")
            else:
                print("    no failure screenshot available (page closed?)")
        else:
            failure_snapshot = ""
            failure_screenshot = None
            # Save an end screenshot of the passing state for visual review.
            end_screenshot = collect_end_screenshot()
            if end_screenshot:
                (uc_dir / f"{base}.end-screenshot.png").write_bytes(
                    end_screenshot)
                print(f"    end screenshot captured "
                      f"({len(end_screenshot)} bytes)")
            else:
                print("    no end screenshot available (page closed?)")

        history.append({
            "iteration": iteration,
            "spec": spec.name,
            "passed": passed,
            "failure_snapshot_captured": bool(failure_snapshot),
            "failure_screenshot_captured": failure_screenshot is not None,
            "error_type": "none" if passed else classify_error(error_report),
            "error_excerpt": error_report[:500],
        })
        print(f"  iter {iteration}: {'PASS' if passed else 'FAIL'}")

        if passed:
            break
        previous_code = ts_code

    summary = {
        "run": run_id,
        "use_case_id": use_case["id"],
        "title": use_case["title"],
        "complexity": use_case["complexity"],
        "passed": passed,
        "iterations_used": len(history),
        "max_iterations": MAX_ITERATIONS,
        "screenshots_enabled": SEND_SCREENSHOTS,
        "final_spec": history[-1]["spec"] if history else None,
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
        scraped, initial_screenshot = scrape_app_context(BASE_URL)
    except Exception as exc:
        raise SystemExit(f"Could not scrape app context: {exc}\n"
                         f"Stage 5 requires the running app — aborting.")

    if not scraped.strip():
        raise SystemExit("No UI context extracted (no testids / aria) — aborting.")

    ui_context = build_ui_context(scraped)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "_stage_5_initial_context.txt").write_text(ui_context, encoding="utf-8")
    (OUTPUT_DIR / "_stage_5_initial_screenshot.png").write_bytes(initial_screenshot)
    print(f"  Context captured ({len(ui_context)} chars), saved to _stage_5_initial_context.txt")
    print(f"  Initial screenshot saved ({len(initial_screenshot)} bytes)")

    # Compact machine-readable aggregate: one JSON line per (use case × run).
    # This is the file the plotting / judge step reads directly, without having
    # to crawl all per-UC directories. Rebuilt at startup from the per-UC
    # loop-summary files so that resuming an interrupted session never loses
    # records from completed cells.
    all_runs_path = OUTPUT_DIR / "_stage_5_all_runs.jsonl"
    n_existing = rebuild_all_runs_file(all_runs_path)
    if n_existing:
        print(f"Resuming: {n_existing} completed (use case x run) cells found, "
              f"aggregate rebuilt.")

    all_summaries: List[Dict[str, Any]] = []
    for run in range(1, NUM_RUNS + 1):
        run_id = f"run_{run:02d}"
        run_dir = OUTPUT_DIR / run_id
        print(f"=== {run_id} / run_{NUM_RUNS:02d} ===")
        for use_case in use_cases:
            print(f"UC {use_case['id']:02d} ({use_case['complexity']}): {use_case['title']}")
            try:
                summary = run_loop_for_use_case(use_case, skill, ui_context,
                                                initial_screenshot, run_id, run_dir)
                resumed = summary.pop("_resumed", False)
                all_summaries.append(summary)
                if not resumed:
                    append_all_runs_record(all_runs_path, summary)
                    status = "PASS" if summary["passed"] else "FAIL"
                    print(f"  -> {status} after {summary['iterations_used']} iteration(s)")
            except Exception as exc:
                # Never lose the data point: record the harness failure so the
                # (use case x run) grid stays complete for the evaluation. No
                # loop-summary file is written, so a resumed session retries
                # this cell.
                print(f"  FAILED (harness): {exc}")
                fail_summary = {
                    "run": run_id,
                    "use_case_id": use_case["id"],
                    "title": use_case["title"],
                    "complexity": use_case["complexity"],
                    "passed": False,
                    "iterations_used": 0,
                    "max_iterations": MAX_ITERATIONS,
                    "screenshots_enabled": SEND_SCREENSHOTS,
                    "final_spec": None,
                    "history": [],
                    "harness_error": str(exc),
                }
                all_summaries.append(fail_summary)
                append_all_runs_record(all_runs_path, fail_summary)

    (OUTPUT_DIR / "_stage_5_run_summary.json").write_text(
        json.dumps(all_summaries, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nRun summary saved to _stage_5_run_summary.json "
          f"({len(all_summaries)} UC×run records)")
    print(f"Aggregate saved to {all_runs_path.name}")


if __name__ == "__main__":
    main()