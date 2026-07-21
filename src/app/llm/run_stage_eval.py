#!/usr/bin/env python3
"""
run_stage_eval.py — Phase 1: deterministische Ausführung & Klassifikation
LLM-generierter Playwright-Tests.

Für alle 4 Stages identisch verwendbar. Klassifikationslogik entspricht
der in summary.md (Stage 1 Pilot) dokumentierten Methodik:

- PASS              : Teststatus "passed"
- GENERATION_ERROR  : Quelldatei syntaktisch nicht valide/abgeschnitten
                       (Testblock nicht geschlossen, unbalancierte Klammern,
                       degenerierte Wiederholungen) -> Ursache in .raw.txt
- COMPILE_ERROR     : TS-/Syntaxfehler, Datei aber NICHT als abgeschnitten
                       erkannt (z.B. echter Tippfehler des Modells)
- INFRA_FAIL        : Fehler beim Lokalisieren/Bedienen eines Elements vor
                       einer inhaltlichen Assertion (element(s) not found,
                       strict-mode violation, Action-Timeout, page.evaluate/
                       waitForFunction-Laufzeitfehler, web-first-Assertion
                       die nur an einem nie aufgelösten Selektor scheitert)
- ASSERTION_FAIL    : Element/Wert wurde aufgelöst, Matcher-Erwartung
                       schlug fehl (konkreter "Received:"-Wert vorhanden)
- TIMEOUT           : äußerer Prozess-Guard griff (Playwright selbst hängt)

Uneindeutige Fälle werden mit needs_review=true markiert und sollten
manuell geprüft werden (kein stiller Fallback-Fehlklassifikation).

Liegt in src/app/llm/ (neben generate_tests_stage_X.py) und löst alle
Pfade relativ zu SCRIPT_DIR auf, analog zu den Generierungsskripten.

Nutzung (aus src/app/llm/ heraus):
    python run_stage_eval.py --stage1
    python run_stage_eval.py --stage2
    python run_stage_eval.py --stage3
    python run_stage_eval.py --stage4

Erzeugt:
    tests/<stage>/_phase1_results.csv
    tests/<stage>/_playwright_report.json

Voraussetzung: Demo-App läuft unter der erwarteten URL. Wird vor dem
Playwright-Lauf per HTTP-Check geprüft; bei Nichterreichbarkeit bricht
das Skript ab (startet die App NICHT selbst).
"""

import argparse
import csv
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

APP_URL = "http://localhost:5173/ba-webgis-llm-e2e/"
UC_ID_RE = re.compile(r"(uc-\d+)")
RUN_ID_RE = re.compile(r"(run_\d+)")
ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")

# Skript liegt in src/app/llm/, analog zu generate_tests_stage_X.py
SCRIPT_DIR = Path(__file__).resolve().parent
PLAYWRIGHT_CWD = SCRIPT_DIR.parent  # src/app

STAGE_DIRS = {
    "stage1": "stage_1_baseline",
    "stage2": "stage_2_accessibility_snapshot",
    "stage3": "stage_3_auto_ui_map",
    "stage4": "stage_4_manual_ui_map",
}


def strip_ansi(text: str) -> str:
    return ANSI_RE.sub("", text or "")


# ---------------------------------------------------------------------------
# Voraussetzungs-Check
# ---------------------------------------------------------------------------

def check_app_reachable(url: str, timeout: float = 5.0) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return 200 <= resp.status < 400
    except Exception as exc:
        print(f"[FEHLER] App unter {url} nicht erreichbar: {exc}", file=sys.stderr)
        return False


# ---------------------------------------------------------------------------
# Statische Truncation-/Degenerations-Heuristik (für GENERATION_ERROR)
# ---------------------------------------------------------------------------

def scan_for_truncation(path: Path) -> tuple[bool, str]:
    """Prüft eine .spec.ts-Datei deterministisch auf Anzeichen einer
    abgeschnittenen/degenerierten LLM-Generierung. Gibt (is_truncated, reason)
    zurück. Wird nur für Dateien aufgerufen, die Playwright nicht laden konnte.
    """
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        return True, f"Datei nicht lesbar: {exc}"

    if not text.strip():
        return True, "Datei ist leer"

    # 1. Klammernbilanz (grobe Heuristik, ignoriert Strings/Kommentare bewusst
    #    nicht separat -- ausreichend robust für die Unterscheidung
    #    "eindeutig unterminiert" vs. "sieht vollständig aus")
    brace_balance = text.count("{") - text.count("}")
    paren_balance = text.count("(") - text.count(")")
    if brace_balance != 0 or paren_balance != 0:
        return True, (
            f"Unbalancierte Klammern (geschweift: {brace_balance:+d}, "
            f"rund: {paren_balance:+d}) -> Datei wahrscheinlich abgeschnitten"
        )

    # 2. Datei endet nicht mit einem geschlossenen Test-Block
    stripped = text.rstrip()
    if not stripped.endswith("});"):
        return True, "Datei endet nicht mit '});' -> letzter Testblock offen"

    # 3. Degenerierte Wiederholungen (z.B. endlose Platzhalter-Kommentare)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    tail = lines[-40:]
    comment_only = [l for l in tail if l.startswith("//") or l.startswith("*")]
    if len(comment_only) >= 25:
        return True, (
            f"{len(comment_only)}/{len(tail)} der letzten Zeilen sind reine "
            f"Kommentare -> Verdacht auf Degeneration (Platzhalter-Loop)"
        )

    return False, ""


# ---------------------------------------------------------------------------
# Klassifikation eines Playwright-Testergebnisses (Laufzeitfehler)
# ---------------------------------------------------------------------------

def classify_runtime_result(status: str, message: str) -> tuple[str, bool]:
    """Ordnet ein Playwright-Testergebnis einer Kategorie zu.
    Gibt (kategorie, needs_review) zurück.
    """
    msg = message or ""

    if status == "passed":
        return "PASS", False

    if status == "interrupted":
        return "TIMEOUT", False

    # strict-mode violation -> mehrdeutiger Selektor, nie eindeutig aufgelöst
    if "strict mode violation" in msg:
        return "INFRA_FAIL", False

    # Element existiert nicht / wurde nie gefunden
    if re.search(r"element\(s\) not found", msg, re.IGNORECASE):
        return "INFRA_FAIL", False

    # page.evaluate / waitForFunction Laufzeitfehler
    if re.search(r"page\.evaluate|waitForFunction", msg) and "Error" in msg:
        return "INFRA_FAIL", False

    # Web-first-Assertion: unterscheide "nie aufgelöst" vs "aufgelöst, aber
    # falscher Zustand" über das Vorhandensein einer konkreten Received-Zeile
    has_received_value = bool(
        re.search(r"Received:\s*\S", msg) and not re.search(
            r"Received:\s*<?element\(s\)? not found>?", msg, re.IGNORECASE
        )
    )
    resolved_marker = "locator resolved to" in msg or has_received_value

    if resolved_marker:
        return "ASSERTION_FAIL", False

    # Timeout beim Warten auf einen Selektor/eine Aktion (Klick/Check/Fill),
    # der Selektor wurde nie aufgelöst. Nach dem Zusammenführen aller
    # errors-Einträge (siehe collect_test_results) enthält msg bei einem
    # Action-Timeout i.d.R. "waiting for getByRole(...)" o.ä., auch wenn
    # der äußere Status nur "Test timeout of 30000ms exceeded." zeigt.
    if re.search(r"waiting for (getBy|locator)", msg, re.IGNORECASE):
        return "INFRA_FAIL", False

    # generischer Action-Timeout (click/uncheck/fill) ohne klare Auflösung
    if re.search(r"(click|uncheck|check|fill|hover)\b.*timeout", msg, re.IGNORECASE | re.DOTALL):
        return "INFRA_FAIL", False

    if status == "timedOut":
        # Kein spezifisches Muster erkannt -> nicht raten, sondern markieren
        return "INFRA_FAIL", True

    # Fallback: unbekanntes Fehlerbild -> zur manuellen Prüfung markieren
    return "ASSERTION_FAIL", True


# ---------------------------------------------------------------------------
# Playwright JSON-Report einlesen
# ---------------------------------------------------------------------------

def walk_specs(suite: dict):
    """Rekursiv alle Specs (Testdateien) aus dem Playwright-JSON-Report holen."""
    for spec in suite.get("specs", []):
        yield spec
    for sub in suite.get("suites", []):
        yield from walk_specs(sub)


def collect_test_results(report: dict) -> dict[str, list[dict]]:
    """Map: normalisierter Dateipfad -> Liste von {status, message, duration}.

    Playwright liefert bei manchen Fehlern (v.a. Timeouts) mehrere Einträge
    in results[].errors: der erste ist oft nur die generische Meldung
    ("Test timeout of 30000ms exceeded."), ein späterer enthält die
    eigentliche Detailinfo (z.B. "waiting for getByRole(...)"). Für die
    Klassifikation werden ALLE Einträge zusammengeführt, damit die Regex-
    Muster in classify_runtime_result() die Detailinfo sehen -- das
    entspricht der im Pilot manuell angewendeten Regel ("anhand der
    zweiten, detaillierten Fehlermeldung eingeordnet").
    """
    results_by_file = {}
    for suite in report.get("suites", []):
        for spec in walk_specs(suite):
            file_path = spec.get("file", "")
            for test in spec.get("tests", []):
                for res in test.get("results", []):
                    status = res.get("status", "unknown")
                    duration_s = round(res.get("duration", 0) / 1000, 2)

                    parts = []
                    err = res.get("error") or {}
                    if err.get("message"):
                        parts.append(err["message"])
                    for e in res.get("errors", []):
                        m = e.get("message", "")
                        if m and m not in parts:
                            parts.append(m)
                    message = strip_ansi("\n".join(parts))

                    results_by_file.setdefault(file_path, []).append(
                        {"status": status, "message": message, "duration_s": duration_s}
                    )
    return results_by_file


def collect_load_errors(report: dict) -> dict[str, str]:
    """Map: normalisierter Dateipfad -> Fehlermeldung für Dateien, die
    Playwright gar nicht erst laden konnte (Compile-/Syntaxfehler)."""
    load_errors = {}
    for err in report.get("errors", []):
        loc = err.get("location", {})
        file_path = loc.get("file", "")
        if file_path:
            load_errors[file_path] = strip_ansi(err.get("message", ""))
    return load_errors


def norm_path(p: str) -> str:
    return str(Path(p).as_posix())


# ---------------------------------------------------------------------------
# Hauptablauf
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--stage1", action="store_true", help="stage_1_baseline")
    group.add_argument("--stage2", action="store_true", help="stage_2_accessibility_snapshot")
    group.add_argument("--stage3", action="store_true", help="stage_3_auto_ui_map")
    group.add_argument("--stage4", action="store_true", help="stage_4_manual_ui_map")
    ap.add_argument("--timeout-ms", type=int, default=30000)
    ap.add_argument("--workers", type=int, default=1)
    ap.add_argument("--app-url", default=APP_URL)
    ap.add_argument("--skip-app-check", action="store_true")
    args = ap.parse_args()

    if args.stage1:
        stage_name = STAGE_DIRS["stage1"]
    elif args.stage2:
        stage_name = STAGE_DIRS["stage2"]
    elif args.stage3:
        stage_name = STAGE_DIRS["stage3"]
    else:
        stage_name = STAGE_DIRS["stage4"]

    stage_dir = SCRIPT_DIR / "tests" / stage_name
    out_dir = stage_dir  # Ergebnisse liegen direkt im Stage-Ordner
    out_dir.mkdir(parents=True, exist_ok=True)
    cwd = PLAYWRIGHT_CWD

    if not args.skip_app_check:
        if not check_app_reachable(args.app_url):
            sys.exit(1)

    spec_files = sorted(stage_dir.rglob("*.spec.ts"))
    if not spec_files:
        sys.exit(f"[FEHLER] keine .spec.ts-Dateien unter {stage_dir} gefunden")
    print(f"[INFO] {len(spec_files)} Testdateien gefunden unter {stage_dir}")

    # Vorab-Scan aller Dateien auf Truncation (wird nur bei Load-Errors genutzt).
    # Key = absoluter norm_path(f), identisch zum späteren Lookup weiter unten.
    truncation_info = {}
    for f in spec_files:
        is_trunc, reason = scan_for_truncation(f)
        truncation_info[norm_path(f)] = (is_trunc, reason)

    # Playwright ausführen
    report_path = out_dir / "_playwright_report.json"
    base_env = os.environ.copy()
    base_env["PLAYWRIGHT_JSON_OUTPUT_NAME"] = str(report_path)

    # Use pnpm exec to invoke the locally installed playwright binary,
    # avoiding npx which may resolve through inaccessible symlinks on this machine.
    pnpm = "pnpm.cmd" if sys.platform == "win32" else "pnpm"
    # Pass a relative (forward-slash) path so Playwright's regex matching works on Windows.
    stage_dir_rel = stage_dir.relative_to(cwd).as_posix()

    outer_guard_s = max(300, len(spec_files) * 40)

    # A single un-parseable spec file makes Playwright abort collection for the
    # WHOLE directory (0 tests executed). We therefore run iteratively: after
    # each attempt we add any file that failed to parse to an ignore list and
    # re-run, until no new broken file surfaces. Results and load-errors are
    # merged across attempts.
    results_by_file: dict[str, list[dict]] = {}
    load_errors: dict[str, str] = {}
    broken_ignore: list[str] = []  # absolute posix paths, passed via PW_TEST_IGNORE
    report: dict = {}

    max_attempts = len(spec_files) + 1
    for attempt in range(1, max_attempts + 1):
        env = base_env.copy()
        if broken_ignore:
            env["PW_TEST_IGNORE"] = json.dumps(broken_ignore)

        cmd = [
            pnpm,
            "exec",
            "playwright",
            "test",
            stage_dir_rel,
            f"--timeout={args.timeout_ms}",
            f"--workers={args.workers}",
            "--reporter=json",
        ]
        print(
            f"[INFO] Ausführung (Versuch {attempt}, {len(broken_ignore)} ignoriert): "
            f"{' '.join(cmd)}  (cwd={cwd})"
        )

        try:
            subprocess.run(cmd, cwd=cwd, env=env, timeout=outer_guard_s)
        except subprocess.TimeoutExpired:
            print(
                f"[WARNUNG] Äußerer Prozess-Guard ({outer_guard_s}s) ausgelöst. "
                f"Nicht erfasste Dateien werden als TIMEOUT markiert."
            )

        if not report_path.exists():
            sys.exit(f"[FEHLER] Kein Playwright-Report erzeugt unter {report_path}")

        report = json.loads(report_path.read_text(encoding="utf-8"))
        results_by_file.update(collect_test_results(report))

        attempt_load_errors = collect_load_errors(report)
        new_broken = False
        for file_path, message in attempt_load_errors.items():
            load_errors[file_path] = message
            abs_posix = Path(file_path).resolve().as_posix()
            if abs_posix not in broken_ignore:
                broken_ignore.append(abs_posix)
                new_broken = True

        # No new un-parseable file appeared -> the run was complete.
        if not new_broken:
            break
        print(
            f"[INFO] {len(attempt_load_errors)} nicht parsebare Datei(en) erkannt, "
            f"werden ausgeschlossen und Lauf wird wiederholt."
        )

    # Alle bekannten Report-Pfade normalisieren für robustes Matching
    def find_matching_key(mapping: dict, target: Path) -> str | None:
        target_norm = norm_path(target)
        for key in mapping:
            if norm_path(key).endswith(target_norm) or target_norm.endswith(norm_path(key)):
                return key
        return None

    rows = []
    for f in spec_files:
        uc_match = UC_ID_RE.search(f.name)
        run_match = RUN_ID_RE.search(str(f))
        uc_id = uc_match.group(1) if uc_match else "unknown"
        run_id = run_match.group(1) if run_match else "unknown"

        row = {
            "stage": stage_name,
            "run": run_id,
            "uc_id": uc_id,
            "file": norm_path(f),
            "exec_category": None,
            "duration_s": 0.0,
            "error_summary": "",
            "needs_review": False,
        }

        test_key = find_matching_key(results_by_file, f)
        load_key = find_matching_key(load_errors, f)

        if test_key is not None:
            # Datei wurde ausgeführt; ggf. mehrere Ergebnisse (Retries) ->
            # letztes Ergebnis ist maßgeblich
            res = results_by_file[test_key][-1]
            category, needs_review = classify_runtime_result(
                res["status"], res["message"]
            )
            row["exec_category"] = category
            row["duration_s"] = res["duration_s"]
            row["error_summary"] = res["message"][:500]
            row["needs_review"] = needs_review
        elif load_key is not None:
            # Datei konnte nicht geladen werden -> GENERATION_ERROR vs COMPILE_ERROR
            is_trunc, reason = truncation_info.get(norm_path(f), (False, ""))
            if is_trunc:
                row["exec_category"] = "GENERATION_ERROR"
                row["error_summary"] = reason
            else:
                row["exec_category"] = "COMPILE_ERROR"
                row["error_summary"] = load_errors[load_key][:500]
        else:
            # Weder ausgeführt noch als Load-Error erfasst -> vermutlich vom
            # äußeren Prozess-Guard abgeschnitten
            row["exec_category"] = "TIMEOUT"
            row["error_summary"] = "Nicht im Playwright-Report erfasst (Prozess-Guard?)"
            row["needs_review"] = True

        rows.append(row)

    # CSV schreiben
    out_csv = out_dir / "_phase1_results.csv"
    fieldnames = [
        "stage", "run", "uc_id", "file", "exec_category",
        "duration_s", "error_summary", "needs_review",
    ]
    with out_csv.open("w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # Konsolen-Zusammenfassung
    counts = {}
    for r in rows:
        counts[r["exec_category"]] = counts.get(r["exec_category"], 0) + 1
    review_count = sum(1 for r in rows if r["needs_review"])

    print(f"\n[FERTIG] {len(rows)} Dateien klassifiziert -> {out_csv}")
    for cat, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {cat:<18} {n:>4}")
    if review_count:
        print(
            f"\n[HINWEIS] {review_count} Datei(en) mit needs_review=true "
            f"-> manuell prüfen, keine automatische Kategorie vergeben."
        )
    print(f"\nRoh-Report: {report_path}")


if __name__ == "__main__":
    main()