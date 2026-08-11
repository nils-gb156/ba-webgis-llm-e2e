"""Gemeinsame Lade- und Aggregationsfunktionen für die Auswertung der
Evaluationsdaten (Stufen 1-5).

Alle Kennzahlen werden ausschließlich aus den Rohdaten berechnet:
  tests/<stage_dir>/_phase1_results.csv
  tests/<stage_dir>/_phase2_judge.csv
  tests/<stage_dir>/_phase2_judge.json
  tests/stage_5_self_improvement_loop/_stage_5_all_runs.jsonl
  tests/stage_5_self_improvement_loop/_stage_5_run_summary.json
  tests/<stage_dir>/run_XX/*.spec.ts

Die Klassifikationslogik wird NICHT nachgebaut, sondern aus
run_phase1_eval.py importiert (classify_runtime_result, scan_for_truncation,
strip_ansi). Ebenso werden load_and_merge/write_aggregates aus plot_stage.py
importiert, um die eigene Rechnung gegen die Referenzimplementierung zu
prüfen.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pandas as pd

# --- Import der bestehenden Logik aus dem llm-Verzeichnis ------------------
LLM_DIR = Path(__file__).resolve().parent.parent
if str(LLM_DIR) not in sys.path:
    sys.path.insert(0, str(LLM_DIR))

from run_phase1_eval import (  # noqa: E402
    classify_runtime_result,
    scan_for_truncation,
    strip_ansi,
)
import plot_stage  # noqa: E402

TESTS_DIR = LLM_DIR / "tests"
OUT_DIR = LLM_DIR.parent.parent.parent / "docs" / "eval"

STAGE_DIRS = {
    1: "stage_1_baseline",
    2: "stage_2_accessibility_snapshot",
    3: "stage_3_generated_ui_map",
    4: "stage_4_manual_ui_map",
    5: "stage_5_self_improvement_loop",
}

STAGE_LABELS = {
    1: "Stufe 1 – Baseline (kein UI-Kontext)",
    2: "Stufe 2 – Accessibility-Snapshot",
    3: "Stufe 3 – generierte UI-Map + Map-Model-Helfer",
    4: "Stufe 4 – manuelle UI-Map + Map-Model-Helfer",
    5: "Stufe 5 – Self-Improvement-Loop (Startkontext = Stufe 2)",
}

SCORE_DIMS = ["coverage_score", "selector_score",
              "map_interaction_score", "assertion_score"]

EXEC_ORDER = ["PASS", "ASSERTION_FAIL", "INFRA_FAIL", "COMPILE_ERROR",
              "GENERATION_ERROR", "TIMEOUT"]

UCS = [f"uc-{i:02d}" for i in range(1, 11)]
RUNS = [f"run_{i:02d}" for i in range(1, 51)]

# Karten-UCs laut Judge-Prompt (Regel 1: map_interaction nur für diese UCs)
# -> wird in check_map_ucs() gegen den Prompt und gegen die Daten geprüft.
MAP_UCS_FROM_PROMPT: set[str] = set()


# ---------------------------------------------------------------------------
# Laden
# ---------------------------------------------------------------------------

def stage_dir(stage: int) -> Path:
    return TESTS_DIR / STAGE_DIRS[stage]


def load_phase1(stage: int) -> pd.DataFrame:
    """_phase1_results.csv unverändert einlesen."""
    df = pd.read_csv(stage_dir(stage) / "_phase1_results.csv")
    df["error_summary"] = df["error_summary"].fillna("")
    return df


def load_phase2_csv(stage: int) -> pd.DataFrame:
    return pd.read_csv(stage_dir(stage) / "_phase2_judge.csv")


def load_phase2_json(stage: int) -> list[dict]:
    with (stage_dir(stage) / "_phase2_judge.json").open(encoding="utf-8") as f:
        return json.load(f)


def load_merged(stage: int) -> pd.DataFrame:
    """Merge Phase 1 + Phase 2 mit derselben Join-Logik wie plot_stage.py."""
    return plot_stage.load_and_merge(stage_dir(stage))


def load_loop_jsonl() -> list[dict]:
    p = stage_dir(5) / "_stage_5_all_runs.jsonl"
    out = []
    with p.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


def load_loop_summary() -> list[dict]:
    p = stage_dir(5) / "_stage_5_run_summary.json"
    with p.open(encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Spec-Dateien
# ---------------------------------------------------------------------------

def spec_files(stage: int) -> dict[tuple[str, str], Path]:
    """(run, uc_id) -> Pfad der generierten Spec-Datei.

    Stufen 1-4: run_XX/uc-YY-*.spec.ts
    Stufe 5:    die final_spec-Datei aus dem Loop-Protokoll (letzte Iteration)
    """
    out: dict[tuple[str, str], Path] = {}
    if stage != 5:
        for run_dir in sorted(stage_dir(stage).glob("run_*")):
            for f in sorted(run_dir.glob("uc-*.spec.ts")):
                m = re.match(r"(uc-\d+)", f.name)
                if m:
                    out[(run_dir.name, m.group(1))] = f
        return out

    for e in load_loop_summary():
        run = e["run"]
        uc = f"uc-{int(e['use_case_id']):02d}"
        final_spec = e.get("final_spec") or ""
        if not final_spec:
            continue
        uc_dir = re.sub(r"-iter-\d+", "", final_spec, count=1).removesuffix(".spec.ts")
        p = stage_dir(5) / run / uc_dir / final_spec
        if p.exists():
            out[(run, uc)] = p
    return out


def stage5_iteration_specs() -> dict[tuple[str, str, int], Path]:
    """(run, uc_id, iteration) -> Pfad des in dieser Iteration generierten Specs."""
    out: dict[tuple[str, str, int], Path] = {}
    for e in load_loop_summary():
        run = e["run"]
        uc = f"uc-{int(e['use_case_id']):02d}"
        for h in e.get("history", []):
            spec = h.get("spec") or ""
            if not spec:
                continue
            uc_dir = re.sub(r"-iter-\d+", "", spec, count=1).removesuffix(".spec.ts")
            p = stage_dir(5) / run / uc_dir / spec
            if p.exists():
                out[(run, uc, int(h["iteration"]))] = p
    return out


# ---------------------------------------------------------------------------
# Regelbasierte Gruppierung von error_summary
# ---------------------------------------------------------------------------

# Geordnete Regeltabelle: (Label, Regex). Erste passende Regel gewinnt.
# Bewusst grob gehalten -- die Gruppen sollen "identische oder nahezu
# identische" Meldungen zusammenfassen, nicht die Fehlerursache erklären.
#
# Die Reihenfolge folgt bewusst der Prüfreihenfolge in
# run_phase1_eval.py:classify_runtime_result(): spezifische Symptome
# ("element(s) not found", konkreter Received-Wert) vor den generischen
# Timeout-/Call-Log-Mustern, weil das Call-Log eines fehlgeschlagenen
# Matchers fast immer zusätzlich "waiting for getBy..." enthält.
ERROR_GROUP_RULES: list[tuple[str, str]] = [
    ("A_generierung_abgeschnitten",
     r"Unbalancierte Klammern|Datei ist leer|Datei endet nicht mit|Platzhalter-Loop|"
     r"'@playwright/test'-Import|Datei nicht lesbar"),
    ("B_cannot_find_module",
     r"Cannot find module"),
    ("C_strict_mode_violation",
     r"strict mode violation"),
    ("D_element_not_found",
     r"element\(s\) not found"),
    ("E_js_laufzeitfehler",
     r"is not a function|is not iterable|Cannot read propert(?:y|ies)|ReferenceError"),
    ("F_test_ended_offener_call",
     r":\s*Test ended\."),
    ("G_target_closed",
     r"Target page, context or browser has been closed"),
    ("H_pointer_events_abgefangen",
     r"intercepts pointer events"),
    ("I_element_nicht_stabil_sichtbar",
     r"element is not (stable|visible|enabled)"),
    # J und K bilden zusammen den resolved_marker aus
    # classify_runtime_result() ab (-> ASSERTION_FAIL); sie sind hier nur
    # feiner aufgeteilt, weil die beiden Symptome unterschiedlich aussehen.
    ("J_konkreter_received_wert",
     r"Received[^\n:]*:\s*\S|Expected pattern|Expected string"),
    ("K_locator_aufgeloest_aktion_scheitert",
     r"locator resolved to"),
    ("L_predicate_timeout",
     r"waiting on the predicate"),
    ("M_timeout_beim_warten_auf_locator",
     r"waiting for (getBy|locator)"),
    ("N_generischer_test_timeout",
     r"Test timeout of \d+ms exceeded"),
]

_COMPILED_RULES = [(lbl, re.compile(rx, re.IGNORECASE)) for lbl, rx in ERROR_GROUP_RULES]


def error_group(msg: str) -> str:
    """Regelbasierte Gruppe einer error_summary. Eigene Logik dieses
    Auswertungsskripts (in run_phase1_eval.py existiert keine solche
    Gruppierung) -- die Regeltabelle steht oben und ist im Bericht abgedruckt.
    """
    m = strip_ansi(msg or "")
    if not m.strip():
        return "Z_leer"
    for label, rx in _COMPILED_RULES:
        if rx.search(m):
            return label
    return "Y_sonstige"


_QUOTED = re.compile(r"(['\"])(?:\\.|(?!\1).)*\1")
_NUM = re.compile(r"\d+")


def error_headline(msg: str) -> str:
    """Normalisierte erste Fehlerzeile: Zeichenketten -> <s>, Zahlen -> <n>.
    Dient dazu, "nahezu identische" Meldungen exakt zusammenzufassen.
    """
    m = strip_ansi(msg or "")
    lines = [l.strip() for l in m.splitlines() if l.strip()]
    if not lines:
        return "(leer)"
    head = lines[0]
    # Bei generischem Timeout-Kopf die nächste, aussagekräftige Zeile anhängen
    if head.startswith("Test timeout of") and len(lines) > 1:
        head = head + " || " + lines[1]
    head = _QUOTED.sub("<s>", head)
    head = _NUM.sub("<n>", head)
    return head[:200]


# ---------------------------------------------------------------------------
# Code-Muster in den generierten Spec-Dateien (Schritt D)
# ---------------------------------------------------------------------------

HELPER_FUNCS = ["getActiveBaseLayerTitle", "isLayerRendered", "getMapZoomLevel",
                "getMapCenter", "getHighlightedCoordinate"]

CODE_PATTERNS: list[tuple[str, str]] = [
    ("getByTestId", r"getByTestId\s*\("),
    ("getByRole", r"getByRole\s*\("),
    ("getByText", r"getByText\s*\("),
    ("getByLabel", r"getByLabel(?:Text)?\s*\("),
    ("getByPlaceholder", r"getByPlaceholder\s*\("),
    ("locator_css", r"page\.locator\s*\("),
    ("__openPioneerMap", r"__openPioneerMap"),
    ("helper_any", r"\b(?:" + "|".join(HELPER_FUNCS) + r")\s*\("),
    ("helper_import", r"from\s+['\"][^'\"]*map-model-helpers[^'\"]*['\"]"),
    ("waitForTimeout", r"waitForTimeout\s*\("),
    ("expect_poll", r"expect\.poll\s*\("),
    ("waitFor", r"\.waitFor\s*\(|waitForFunction\s*\(|waitForSelector\s*\("),
    ("force_true", r"force\s*:\s*true"),
    ("assert_on_map_container",
     r"expect\s*\(\s*[^)]*getByTestId\s*\(\s*['\"]map-container['\"][^)]*\)[^)]*\)"),
    ("canvas_locator", r"locator\s*\(\s*['\"][^'\"]*canvas[^'\"]*['\"]"),
    ("mouse_api", r"page\.mouse\."),
]

_COMPILED_CODE = [(n, re.compile(rx)) for n, rx in CODE_PATTERNS]

for _f in HELPER_FUNCS:
    _COMPILED_CODE.append((f"helper_{_f}", re.compile(rf"\b{_f}\s*\(")))

TESTID_RE = re.compile(r"getByTestId\s*\(\s*['\"`]([^'\"`]+)['\"`]")
HELPER_IMPORT_PATH_RE = re.compile(
    r"""from\s+['"]([^'"]*map-model-helpers[^'"]*)['"]""")


def scan_code(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    row = {"lines": len(text.splitlines()), "chars": len(text)}
    for name, rx in _COMPILED_CODE:
        row[name] = len(rx.findall(text))
    row["_testids"] = TESTID_RE.findall(text)
    row["_helper_import_paths"] = HELPER_IMPORT_PATH_RE.findall(text)
    return row


def code_frame(stage: int) -> pd.DataFrame:
    rows = []
    for (run, uc), p in sorted(spec_files(stage).items()):
        r = scan_code(p)
        r.update({"stage": stage, "run": run, "uc_id": uc,
                  "path": p.relative_to(LLM_DIR).as_posix()})
        rows.append(r)
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Reale testids aus generated-ui-map.md
# ---------------------------------------------------------------------------

def real_testids() -> tuple[set[str], int]:
    """Liest die 39 realen data-testid-Werte aus generated-ui-map.md
    (Tabellenspalte 1). Gibt (Menge, im Kopf angegebene Anzahl) zurück."""
    md = (LLM_DIR / "generated-ui-map.md").read_text(encoding="utf-8")
    declared = 0
    m = re.search(r"(\d+)\s+unique\s+data-testid", md)
    if m:
        declared = int(m.group(1))
    ids = set()
    # Nur der Abschnitt "## Components" enthält die data-testid-Tabelle;
    # "## Layers" listet Layer-Titel und darf nicht mitgezählt werden.
    section = md.split("## Components", 1)[1].split("\n## ", 1)[0]
    for line in section.splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if not cells:
            continue
        v = cells[0]
        if not v or set(v) <= set("- ") or v == "data-testid":
            continue
        ids.add(v)
    return ids, declared


APP_SRC = LLM_DIR.parent  # src/app
_STATIC_TESTID = re.compile(r"""data-testid\s*=\s*["']([^"']+)["']""")
_DYN_TESTID_TPL = re.compile(r"""data-testid\s*=\s*\{\s*`([^`]+)`\s*\}""")
_TESTID_PROP = re.compile(r"""\btestId\s*=\s*["']([^"']+)["']""")


def real_testids_from_source() -> set[str]:
    """Grundwahrheit: alle data-testid-Werte im Anwendungsquelltext
    (src/app/**/*.tsx|ts, ohne das llm-Verzeichnis).

    Erfasst drei Schreibweisen:
      data-testid="x"          -> x
      data-testid={`x-${i}`}   -> x-${...} (dynamisches Präfix)
      testId="x" (Prop, das in StationInfo auf data-testid durchgereicht wird)
    """
    ids: set[str] = set()
    for p in list(APP_SRC.rglob("*.tsx")) + list(APP_SRC.rglob("*.ts")):
        rel = p.relative_to(APP_SRC).as_posix()
        if rel.startswith("llm/") or "node_modules" in rel:
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        ids.update(_STATIC_TESTID.findall(text))
        for tpl in _DYN_TESTID_TPL.findall(text):
            ids.add(re.sub(r"\$\{[^}]*\}", "${...}", tpl))
        ids.update(_TESTID_PROP.findall(text))
    return ids


def testid_matches_real(tid: str, real: set[str]) -> bool:
    """Ein im Code verwendetes testid gilt als real, wenn es exakt in der
    Liste steht oder das Präfix eines dynamischen Eintrags
    (z.B. 'geocoder-result-item-${index}') trifft."""
    if tid in real:
        return True
    for r in real:
        if "${" in r:
            prefix = r.split("${", 1)[0]
            if prefix and tid.startswith(prefix):
                return True
    return False


# ---------------------------------------------------------------------------
# Formatierung
# ---------------------------------------------------------------------------

def md_table(df: pd.DataFrame, floatfmt: str = "{:.2f}") -> str:
    def fmt(v):
        if isinstance(v, float):
            if pd.isna(v):
                return "–"
            return floatfmt.format(v)
        if v is None or (isinstance(v, float) and pd.isna(v)):
            return "–"
        return str(v)

    cols = list(df.columns)
    head = "| " + " | ".join(str(c) for c in cols) + " |"
    sep = "| " + " | ".join("---" for _ in cols) + " |"
    body = []
    for _, r in df.iterrows():
        body.append("| " + " | ".join(fmt(r[c]) for c in cols) + " |")
    return "\n".join([head, sep] + body)


def pct(n: int, total: int) -> str:
    if not total:
        return "–"
    return f"{100.0 * n / total:.1f}%"


def esc(s: str, maxlen: int = 160) -> str:
    """Fehlermeldung für eine Markdown-Tabellenzelle aufbereiten."""
    s = strip_ansi(s or "").replace("\n", " ⏎ ").replace("|", "\\|")
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > maxlen:
        s = s[:maxlen] + " …"
    return "`" + s + "`" if s else "–"
