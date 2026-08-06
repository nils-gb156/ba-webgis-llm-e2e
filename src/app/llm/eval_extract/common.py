"""Gemeinsame Lade- und Hilfsfunktionen fuer die Ergebnis-Extraktion.

Alle Kennzahlen der Berichte unter docs/eval/ werden ausschliesslich aus den
Rohdaten berechnet:

  * src/app/llm/tests/stage_<n>_*/_phase1_results.csv   (Phase 1)
  * src/app/llm/tests/stage_<n>_*/_phase2_judge.json    (Phase 2, inkl. reasoning)
  * src/app/llm/tests/stage_5_*/_stage_5_run_summary.json  (Loop-Protokoll)
  * src/app/llm/tests/stage_5_*/run_*/uc-*/*.result.json   (Playwright-Report je Iteration)
  * die generierten *.spec.ts-Dateien selbst (Code-Muster)

plots/aggregates.csv wird NUR zum Vergleich gelesen (check_aggregates.py),
nie als Datenquelle.

Die Fehlerklassifikation wird aus run_phase1_eval.py importiert
(classify_runtime_result, collect_test_results, collect_load_errors,
scan_for_truncation) und nicht nachgebaut.
"""

from __future__ import annotations

import importlib.util
import json
import re
import statistics
from pathlib import Path

import pandas as pd

# --------------------------------------------------------------------------
# Pfade
# --------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
LLM_DIR = SCRIPT_DIR.parent                       # src/app/llm
TESTS_DIR = LLM_DIR / "tests"
REPO_ROOT = LLM_DIR.parent.parent.parent          # Repo-Wurzel
DOCS_DIR = REPO_ROOT / "docs" / "eval"
OUT_DIR = SCRIPT_DIR / "_out"                     # Zwischenergebnisse (JSON)

STAGE_DIRS = {
    1: "stage_1_baseline",
    2: "stage_2_accessibility_snapshot",
    3: "stage_3_generated_ui_map",
    4: "stage_4_manual_ui_map",
    5: "stage_5_self_improvement_loop",
}

STAGE_LABELS = {
    1: "Stufe 1 - Baseline (nur UC-Text)",
    2: "Stufe 2 - Accessibility-Snapshot",
    3: "Stufe 3 - generierte UI-Map + Map-Model-Helfer",
    4: "Stufe 4 - manuelle UI-Map + Map-Model-Helfer",
    5: "Stufe 5 - Self-Improvement-Loop (Kontext von Stufe 2)",
}

EXEC_ORDER = ["PASS", "ASSERTION_FAIL", "INFRA_FAIL", "COMPILE_ERROR",
              "GENERATION_ERROR", "TIMEOUT"]

SCORE_DIMS = ["coverage_score", "selector_score", "map_interaction_score",
              "assertion_score"]

DIM_SHORT = {
    "coverage_score": "coverage",
    "selector_score": "selector",
    "map_interaction_score": "map_interaction",
    "assertion_score": "assertion",
}

# MAP_UCS laut phase2_judge_prompt.md Zeile 16
MAP_UCS = ["uc-04", "uc-06", "uc-07", "uc-08", "uc-10"]

UC_IDS = [f"uc-{i:02d}" for i in range(1, 11)]
RUN_IDS = [f"run_{i:02d}" for i in range(1, 51)]

SOLL_RUNS = 50
SOLL_UCS = 10
SOLL_FILES = SOLL_RUNS * SOLL_UCS


# --------------------------------------------------------------------------
# Import der Klassifikationslogik aus run_phase1_eval.py
# --------------------------------------------------------------------------

def load_phase1_module():
    """Laedt run_phase1_eval.py als Modul (Dateiname ist kein Paketname).

    sys.dont_write_bytecode verhindert, dass beim Import ein __pycache__ im
    Quellverzeichnis geschrieben bzw. eine dort eingecheckte .pyc-Datei
    ueberschrieben wird.
    """
    import sys
    prev = sys.dont_write_bytecode
    sys.dont_write_bytecode = True
    path = LLM_DIR / "run_phase1_eval.py"
    spec = importlib.util.spec_from_file_location("run_phase1_eval", path)
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    finally:
        sys.dont_write_bytecode = prev
    return mod


P1 = load_phase1_module()
classify_runtime_result = P1.classify_runtime_result
collect_test_results = P1.collect_test_results
collect_load_errors = P1.collect_load_errors
scan_for_truncation = P1.scan_for_truncation
strip_ansi = P1.strip_ansi


# --------------------------------------------------------------------------
# Laden
# --------------------------------------------------------------------------

def stage_dir(stage: int) -> Path:
    return TESTS_DIR / STAGE_DIRS[stage]


def load_phase1(stage: int) -> pd.DataFrame:
    df = pd.read_csv(stage_dir(stage) / "_phase1_results.csv")
    df["stage_no"] = stage
    return df


def _as_bool(v) -> bool:
    """Normalisiert Boolean-Werte, die je Stufe als bool oder als String
    "true"/"false" vorliegen."""
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.strip().lower() == "true"
    return False


def load_phase2(stage: int) -> pd.DataFrame:
    """Phase-2-JSON (enthaelt zusaetzlich die reasoning-Texte) als DataFrame.

    Score-Spalten: "n/a" und leere Werte -> NaN (numerisch), zusaetzlich wird
    je Dimension eine *_raw-Spalte mit dem Originalwert behalten, damit
    n/a von "fehlt" unterschieden werden kann.
    """
    path = stage_dir(stage) / "_phase2_judge.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    rows = []
    for e in data:
        row = {
            "stage_no": stage,
            "stage": e.get("stage"),
            "run": e.get("run"),
            "uc_id": e.get("uc_id"),
            "file": e.get("file"),
            "exec_category": e.get("exec_category"),
            # ACHTUNG: vacuous_pass ist je Stufe unterschiedlich typisiert -
            # Stufen 1/2/5 JSON-Boolean, Stufen 3/4 die Strings "true"/"false".
            # vacuous_pass_raw behaelt den Originalwert, vacuous_pass ist
            # normalisiert.
            "vacuous_pass_raw": e.get("vacuous_pass"),
            "vacuous_pass": _as_bool(e.get("vacuous_pass")),
        }
        for dim in SCORE_DIMS:
            raw = e.get(dim, None)
            row[dim + "_raw"] = raw
            row[dim] = pd.to_numeric(raw, errors="coerce")
            # Zustand: num = numerischer Score, n/a = literal "n/a",
            # missing = null, leerer String oder Schluessel nicht vorhanden.
            if isinstance(raw, str) and raw.strip() == "n/a":
                state = "n/a"
            elif raw is None or (isinstance(raw, str) and not raw.strip()):
                state = "missing"
            elif pd.notna(row[dim]):
                state = "num"
            else:
                state = "missing"
            row[dim + "_state"] = state
        reasoning = e.get("reasoning") or {}
        for short in DIM_SHORT.values():
            row["r_" + short] = reasoning.get(short, "")
        row["_reasoning_keys"] = ",".join(sorted(reasoning.keys()))
        rows.append(row)
    return pd.DataFrame(rows)


def load_phase2_csv(stage: int) -> pd.DataFrame:
    return pd.read_csv(stage_dir(stage) / "_phase2_judge.csv")


def load_aggregates(stage: int) -> pd.DataFrame:
    return pd.read_csv(stage_dir(stage) / "plots" / "aggregates.csv")


def load_stage5_summary() -> list[dict]:
    path = stage_dir(5) / "_stage_5_run_summary.json"
    return json.loads(path.read_text(encoding="utf-8"))


def load_stage5_jsonl() -> list[dict]:
    path = stage_dir(5) / "_stage_5_all_runs.jsonl"
    out = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


def spec_files(stage: int) -> list[Path]:
    """Alle generierten Testdateien einer Stufe.

    Stufen 1-4: run_NN/uc-XX-*.spec.ts
    Stufe 5:    run_NN/uc-XX-*/uc-XX-iter-K-*.spec.ts (ohne .exec.spec.ts)
    """
    d = stage_dir(stage)
    if stage == 5:
        return sorted(p for p in d.rglob("*.spec.ts")
                      if not p.name.endswith(".exec.spec.ts"))
    return sorted(d.rglob("*.spec.ts"))


UC_RE = re.compile(r"(uc-\d+)")
RUN_RE = re.compile(r"(run_\d+)")
ITER_RE = re.compile(r"iter-(\d+)")


def key_of(path: Path) -> tuple[str, str]:
    """(run, uc_id) aus einem Dateipfad."""
    run = RUN_RE.search(str(path).replace("\\", "/"))
    uc = UC_RE.search(path.name)
    return (run.group(1) if run else "?", uc.group(1) if uc else "?")


# --------------------------------------------------------------------------
# error_summary: regelbasierte Gruppierung
# --------------------------------------------------------------------------

# Zeilen, die nur Kontext transportieren und fuer die Gruppierung entfernt
# werden (Call-Log, Code-Frame, Stacktrace, Log-Trenner).
_NOISE_LINE = re.compile(
    r"^\s*(?:-\s|\d+\s*\||>\s*\d+\s*\||\||at\s|=+\s*logs|=====|Call log:|"
    r"Call Log:|logs =)", re.IGNORECASE
)

_QUOTED = re.compile(r"'[^']{0,120}'|\"[^\"]{0,120}\"|`[^`]{0,120}`")
_NUM = re.compile(r"\b\d+(?:\.\d+)?\b")
_PATH = re.compile(r"[A-Za-z]:[\\/][^\s'\"]+|/[A-Za-z0-9_./-]{8,}")


# Zeilen, die die Fehlerursache konkretisieren und daher in die Signatur
# uebernommen werden (zusaetzlich zur ersten Zeile).
_DETAIL_LINE = re.compile(
    r"^(?:Error:|Locator:|Matcher error|Received|Expected (?:pattern|string|substring)|"
    r"Cannot find module|waiting for )", re.IGNORECASE
)


def error_signature(msg: str, keep_quoted: bool = False) -> str:
    """Regelbasierte Signatur einer Fehlermeldung fuer die Gruppierung.

    Schritte (deterministisch, dokumentiert):
      1. ANSI-Codes entfernen (strip_ansi aus run_phase1_eval.py)
      2. Zeilen entfernen, die Call-Log / Code-Frame / Stacktrace sind
      3. erste verbleibende Zeile behalten, danach bis zu 3 weitere Zeilen,
         die die Ursache konkretisieren (_DETAIL_LINE), Duplikate entfernen
      4. Pfade -> <PATH>, Zahlen -> <N>, gequotete Literale -> <Q>
         (bei keep_quoted=True bleiben Literale erhalten -> feinere Gruppen)
      5. Whitespace normalisieren, auf 200 Zeichen kuerzen
    """
    if not isinstance(msg, str) or not msg.strip():
        return "(leer)"
    text = strip_ansi(msg)
    clean = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or _NOISE_LINE.match(line):
            continue
        clean.append(line)
    lines = []
    for i, line in enumerate(clean):
        if i == 0 or _DETAIL_LINE.match(line):
            if line not in lines:
                lines.append(line)
        if len(lines) >= 4:
            break
    sig = " | ".join(lines) if lines else text.strip()[:200]
    sig = _PATH.sub("<PATH>", sig)
    if not keep_quoted:
        sig = _QUOTED.sub("<Q>", sig)
    sig = _NUM.sub("<N>", sig)
    sig = re.sub(r"\s+", " ", sig).strip()
    return sig[:200]


def group_errors(series, keep_quoted: bool = False) -> pd.Series:
    return series.fillna("").map(lambda m: error_signature(m, keep_quoted))


# --------------------------------------------------------------------------
# Judge-Begruendungen: Textmuster
# --------------------------------------------------------------------------
# Die Muster sind Substring-/Regex-Suchen ueber die reasoning-Texte des Judge
# (ASCII-Transliteration: ue/oe/ae). Sie werden je Datei EINMAL gezaehlt
# (Treffer in mindestens einer der vier Dimensionen), sofern nicht anders
# angegeben.

# Verneinte Aussagen ("keine erfundenen Selektoren", "nicht erfunden") wuerden
# die positiven Muster faelschlich treffen. Sie werden vor der Suche aus dem
# Text entfernt.
NEGATION_RE = re.compile(
    r"[Kk]eine?[nrs]?\s+(?:erfunden\w*|halluzinier\w*|nicht\s+existierend\w*)"
    r"(?:\s+\w+)?"
    r"|nicht\s+erfunden\w*"
    r"|(?:ist|sind)\s+nicht\s+halluzinier\w*"
    # "erfundene Selektoren kommen nicht vor"
    r"|erfunden\w*(?:\s+\w+){0,2}\s+kommen\s+nicht\s+vor",
)


def strip_negations(text: str) -> str:
    if not isinstance(text, str):
        return ""
    return NEGATION_RE.sub(" ", text)


REASONING_PATTERNS = {
    "Selektor erfunden / existiert nicht": (
        r"erfunden|existiert (?:in der App )?(?:jedoch )?nicht|"
        r"nicht existierend|halluziniert"
    ),
    "erfundene Test-ID (getByTestId)": r"erfundene? Test-ID|getByTestId\([^)]*\) (?:existiert|ist erfunden)",
    "Importpfad / Modul nicht auflösbar": r"Importpfad|Cannot find module|Import(?:e|s)? auf|import(?:iert)? (?:eine|einen) nicht",
    "kein Zugriff auf das Kartenmodell": (
        r"kein(?:e)? (?:Lauf |Test )?(?:fasst|greift)[^.]*Kartenzustand|"
        r"kein Zugriff auf (?:das|die) (?:Kartenmodell|Map)|"
        r"weder .*__openPioneerMap|"
        r"keine kartenspezifische (?:Pruefung|Interaktion) (?:statt|findet)"
    ),
    "__openPioneerMap erwähnt": r"__openPioneerMap",
    "fehlende Wartebedingung": (
        r"fehlende(?:s|r)? (?:Warte|Wart)|ohne Wartebedingung|kein(?:e)? Wartebedingung|"
        r"waitForTimeout|feste(?:s|r)? (?:Timeout|Sleep)|starre(?:s|r)? Warten"
    ),
    "Assertion prüft das falsche Element": (
        r"falsche(?:s|n)? Element|prueft (?:nur )?(?:das|den|die) (?:Container|Canvas|"
        r"Kartencontainer)|am falschen Element|nicht am (?:Panel|Ziel)"
    ),
    "Assertion trivial / immer wahr": (
        r"trivial|(?:immer|stets) (?:wahr|erfuellt)|wuerde auch (?:ohne|bei)|"
        r"kann nicht fehlschlagen|beweist nichts|tautolog"
    ),
    "map-container / Canvas in der Begründung erwähnt": r"map-container|canvas",
    "Vorbedingung nicht geprüft (Regel 22)": r"Regel 22|Vorbedingung(?:s-Check)? fehlt|kein(?:e)? Vorbedingung",
    "strict-mode / mehrdeutiger Selektor": r"strict.mode|mehrdeutig|nicht eindeutig",
    "force: true / erzwungener Klick": r"force: ?true|erzwungen",
    "Assertion entfernt / abgeschwächt": r"abgeschwaecht|entfernt|weggelassen|verzichtet",
    "Netzwerk-/Request-Nachweis erwähnt": r"Netzwerk|GetMap|waitForResponse|Request|Response",
}


def count_reasoning_patterns(df: pd.DataFrame) -> dict[str, dict]:
    """Zaehlt je Muster, in wie vielen Dateien es in irgendeiner
    reasoning-Dimension vorkommt. Gibt Häufigkeit, Anteil und ein Beispiel
    (Dateipfad + Dimension) zurueck.
    """
    cols = ["r_" + s for s in DIM_SHORT.values()]
    # Verneinungen vorab entfernen (siehe strip_negations)
    cleaned = {c: df[c].fillna("").map(strip_negations) for c in cols}
    out = {}
    n = len(df)
    for name, pat in REASONING_PATTERNS.items():
        rx = re.compile(pat, re.IGNORECASE)
        hit_mask = pd.Series(False, index=df.index)
        per_dim = {}
        for c in cols:
            m = cleaned[c].str.contains(rx)
            per_dim[c[2:]] = int(m.sum())
            hit_mask |= m
        example = None
        if hit_mask.any():
            row = df[hit_mask].iloc[0]
            for c in cols:
                if isinstance(row[c], str) and rx.search(row[c]):
                    example = {
                        "file": row["file"],
                        "dim": c[2:],
                        "text": rx.sub(lambda m: m.group(0), row[c])[:220],
                    }
                    break
        out[name] = {
            "n_files": int(hit_mask.sum()),
            "pct": round(100.0 * hit_mask.sum() / n, 1) if n else 0.0,
            "per_dim": per_dim,
            "example": example,
        }
    return out


# --------------------------------------------------------------------------
# Code-Muster (Schritt D)
# --------------------------------------------------------------------------

# Ground truth: alle real im App-Quellcode vergebenen data-testid-Werte.
# Ermittelt mit:
#   grep -rno 'data-testid=("[^"]*"|{[^}]*})' src/app --include=*.tsx --include=*.ts
#   | grep -v llm/tests   (generate-ui-map.ts enthaelt nur Platzhalter)
# 37 literale Werte + 2 ueber die testId-Prop von StationInfo gesetzte Werte
# (EucosStationInfo.tsx: "eucos-station-info", UviStationInfo.tsx:
# "uvi-station-info") = 39 real existierende testids.
# Zusaetzlich existiert die indizierte Familie geocoder-result-item-<N>
# (GeocoderSearch.tsx, Template-Literal) - als Praefix behandelt.
REAL_TESTIDS = {
    # Footer.tsx
    "coordinate-viewer", "footer", "scale-bar", "scale-viewer",
    # GeocoderSearch.tsx
    "geocoder-clear-button", "geocoder-input", "geocoder-results",
    # InfoPanel.tsx
    "eucos-station-section", "uvi-station-section", "weather-forecast-section",
    # MapComponent.tsx
    "geocoder-panel", "info-panel", "info-panel-toggle",
    "initial-extent-button", "layer-switcher", "layer-switcher-toggle",
    "legend", "legend-toggle", "map-container", "map-controls-panel",
    "map-toolbar", "measurement", "measurement-panel", "measurement-toggle",
    "print-toggle", "printing", "printing-panel",
    "zoom-in-button", "zoom-out-button",
    # WeatherForecast.tsx
    "weather-forecast", "weather-forecast-entry",
    # styles/*Legend.tsx
    "clouds-legend", "eucos-stations-legend", "precipitation-legend",
    "temperature-legend", "uv-index-legend", "uvi-stations-legend",
    # StationInfo.tsx via testId-Prop
    "eucos-station-info", "uvi-station-info",
}

REAL_TESTID_PREFIXES = ("geocoder-result-item-",)

HELPER_FUNCS = [
    "getActiveBaseLayerTitle", "isLayerRendered", "getMapZoomLevel",
    "getMapCenter", "getHighlightedCoordinate",
]

TESTID_CALL_RE = re.compile(r"getByTestId\(\s*[`'\"]([^`'\"]+)[`'\"]")
# Erfasst auch mehrzeilige Importe (import {\n a,\n b\n} from "...").
IMPORT_RE = re.compile(
    r"""(?:import|require)\s*\(?\s*(?:type\s+)?"""
    r"""(?:\{[^}]*\}|[\w*$,\s]+)?\s*(?:from\s*)?['"]([^'"]+)['"]""",
    re.DOTALL)


CODE_PATTERNS = {
    "getByTestId": r"getByTestId\(",
    "getByRole": r"getByRole\(",
    "getByText": r"getByText\(",
    "getByLabel": r"getByLabel(?:Text)?\(",
    "locator(": r"\.locator\(",
    "__openPioneerMap": r"__openPioneerMap",
    "Helferfunktion (irgendeine)": "|".join(HELPER_FUNCS),
    "getActiveBaseLayerTitle": r"getActiveBaseLayerTitle",
    "isLayerRendered": r"isLayerRendered",
    "getMapZoomLevel": r"getMapZoomLevel",
    "getMapCenter": r"getMapCenter",
    "getHighlightedCoordinate": r"getHighlightedCoordinate",
    # statischer Import, require(...) und dynamisches await import(...)
    "Import map-model-helpers":
        r"(?:from|require\(|import\()\s*['\"][^'\"]*map-model-helpers[^'\"]*['\"]",
    "page.evaluate": r"page\.evaluate\(",
    "waitForTimeout": r"waitForTimeout\(",
    "expect.poll": r"expect\.poll\(",
    "waitFor (Locator/Page)": r"\.waitFor\(|waitForFunction\(|waitForSelector\(",
    "force: true": r"force:\s*true",
    "getByTestId('map-container')": r"getByTestId\(\s*[`'\"]map-container[`'\"]",
    "locator('canvas'/.ol-viewport)":
        r"locator\(\s*[`'\"][^`'\"]*(?:canvas|ol-viewport)[^`'\"]*[`'\"]",
}

# Locator-Ausdruecke, die auf das Karten-Canvas zeigen.
_MAP_LOCATOR = (r"getByTestId\(\s*[`'\"]map-container[`'\"]\s*\)"
                r"|locator\(\s*[`'\"][^`'\"]*(?:canvas|ol-viewport)[^`'\"]*[`'\"]\s*\)")
_MAP_VAR_ASSIGN = re.compile(
    r"(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*[^;\n]*?(?:"
    + _MAP_LOCATOR + r")")
_DIRECT_MAP_EXPECT = re.compile(r"expect\(\s*[^)]{0,120}?(?:" + _MAP_LOCATOR + r")")


def asserts_on_map_container(text: str) -> bool:
    """True, wenn eine Assertion direkt auf dem Karten-Canvas/map-container
    steht - entweder als Inline-Ausdruck in `expect(...)` oder ueber eine
    Variable, die aus einem map-container-/canvas-Locator zugewiesen wurde.
    """
    if _DIRECT_MAP_EXPECT.search(text):
        return True
    for var in set(_MAP_VAR_ASSIGN.findall(text)):
        if re.search(r"expect\(\s*" + re.escape(var) + r"\s*[),.]", text):
            return True
    return False


def scan_code(stage: int) -> pd.DataFrame:
    """Liest alle Testdateien einer Stufe und wertet die Code-Muster aus.

    Eine Zeile je Datei. Bool-Spalten je Muster, plus Kennzahlen
    (Zeilenzahl, Anzahl expect(), verwendete testids, halluzinierte testids,
    Importpfade der Helferdatei).
    """
    rows = []
    for f in spec_files(stage):
        text = f.read_text(encoding="utf-8", errors="replace")
        run, uc = key_of(f)
        rec = {
            "stage_no": stage, "run": run, "uc_id": uc,
            "file": f.as_posix(),
            "n_lines": len(text.splitlines()),
            "n_expect": len(re.findall(r"\bexpect\s*\(|\bexpect\.poll\(", text)),
            "n_chars": len(text),
        }
        m = ITER_RE.search(f.name)
        rec["iteration"] = int(m.group(1)) if m else None
        for name, pat in CODE_PATTERNS.items():
            rec[name] = bool(re.search(pat, text))
        rec["Assertion auf map-container/Canvas"] = asserts_on_map_container(text)
        rec["nur getByTestId (kein Role/Text/Label)"] = (
            rec["getByTestId"] and not (rec["getByRole"] or rec["getByText"]
                                        or rec["getByLabel"]))
        rec["nur Role/Text/Label (kein getByTestId)"] = (
            not rec["getByTestId"] and (rec["getByRole"] or rec["getByText"]
                                        or rec["getByLabel"]))
        rec["Wartestrategie: nur waitForTimeout"] = (
            rec["waitForTimeout"] and not (rec["expect.poll"]
                                           or rec["waitFor (Locator/Page)"]))
        testids = TESTID_CALL_RE.findall(text)
        rec["testids"] = sorted(set(testids))
        halluc = sorted({t for t in set(testids)
                         if t not in REAL_TESTIDS
                         and not t.startswith(REAL_TESTID_PREFIXES)})
        rec["halluc_testids"] = halluc
        rec["n_testids"] = len(set(testids))
        rec["n_halluc_testids"] = len(halluc)
        all_imports = [g for m in IMPORT_RE.findall(text) for g in m if g]             if IMPORT_RE.groups > 1 else list(IMPORT_RE.findall(text))
        helper_imports = [p for p in all_imports if "map-model" in p]
        rec["helper_imports"] = sorted(set(helper_imports))
        rec["text"] = text
        rows.append(rec)
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------
# Markdown-Helfer
# --------------------------------------------------------------------------

def md_cell(v) -> str:
    """Zellinhalt fuer eine Markdown-Tabelle.

    Fehlersignaturen enthalten das Zeichen `|` (Trenner zwischen den
    uebernommenen Zeilen). Unmaskiert wuerde es die Tabellenspalten zerlegen,
    daher wird es escaped. Zeilenumbrueche werden zu Leerzeichen.
    """
    if v is None:
        return ""
    s = str(v).replace("\r", " ").replace("\n", " ")
    return s.replace("|", "\\|")


def md_table(headers: list[str], rows: list[list]) -> str:
    head = "| " + " | ".join(md_cell(h) for h in headers) + " |"
    sep = "| " + " | ".join("---" for _ in headers) + " |"
    body = ["| " + " | ".join(md_cell(x) for x in r) + " |" for r in rows]
    return "\n".join([head, sep] + body)


def fmt(x, nd=2):
    if x is None:
        return "-"
    if isinstance(x, float):
        if pd.isna(x):
            return "-"
        return f"{x:.{nd}f}".replace(".", ",") if False else f"{x:.{nd}f}"
    return str(x)


def pct(part, total, nd=1):
    if not total:
        return "-"
    return f"{100.0 * part / total:.{nd}f}"


def median_or_none(values):
    vals = [v for v in values if v is not None and not pd.isna(v)]
    return statistics.median(vals) if vals else None


def ensure_dirs():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)


def write_json(name: str, obj) -> Path:
    ensure_dirs()
    p = OUT_DIR / name
    p.write_text(json.dumps(obj, indent=1, ensure_ascii=False, default=str),
                 encoding="utf-8")
    return p


def write_doc(name: str, text: str) -> Path:
    ensure_dirs()
    p = DOCS_DIR / name
    p.write_text(text.rstrip() + "\n", encoding="utf-8")
    print(f"[geschrieben] {p}")
    return p
