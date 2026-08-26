#!/usr/bin/env python3
"""
map_stage5_phase1.py — erzeugt für Stufe 5 eine _phase1_results.csv im
Schema der Stufen 1-4, OHNE erneute Testausführung.

Hintergrund: Bei Stufe 5 ist die Ausführung Teil des Self-Improvement-Loops;
jeder final_spec wurde bereits während der Generierung deterministisch gegen
die Live-App ausgeführt. Das Ausführungssignal (passed + Fehlermeldung der
letzten Iteration) liegt in _stage_5_all_runs.jsonl vor. Dieses Skript mappt
es auf die exec_category-Taxonomie der Stufen 1-4, damit Judge (Phase 2) und
plot_stage.py unverändert funktionieren.

Klassifikationslogik: identisch zu Stufen 1-4 — die Funktionen
classify_runtime_result() und scan_for_truncation() werden direkt aus
run_phase1_eval.py importiert (KEINE Kopie, keine Abweichung).

Nutzung (aus src/app/llm/ heraus):
    python map_stage5_phase1.py

Liest:    tests/stage_5_self_improvement_loop/_stage_5_all_runs.jsonl
Schreibt: tests/stage_5_self_improvement_loop/_phase1_results.csv

CSV-Spalten wie Stufen 1-4 (stage, run, uc_id, file, exec_category,
duration_s, error_summary, needs_review) plus stufenspezifische Zusatzspalten
(passed, iterations_used) als Metadaten für den Judge.
"""

import csv
import json
import re
import sys
from pathlib import Path

# Identische Klassifikationslogik wie Stufen 1-4 (gleiche Datei, gleicher Ordner)
from app.llm.run_phase1_eval import classify_runtime_result, scan_for_truncation

SCRIPT_DIR = Path(__file__).resolve().parent
STAGE_NAME = "stage_5_self_improvement_loop"
STAGE_DIR = SCRIPT_DIR / "tests" / STAGE_NAME
JSONL_PATH = STAGE_DIR / "_stage_5_all_runs.jsonl"
OUT_CSV = STAGE_DIR / "_phase1_results.csv"

# Ableitung des UC-Ordnernamens aus dem final_spec-Dateinamen:
# 'uc-04-iter-1-activate-the-uv-index-overlay.spec.ts'
#   -> Ordner 'uc-04-activate-the-uv-index-overlay'
ITER_RE = re.compile(r"-iter-\d+")


def uc_dir_from_spec(spec_name: str) -> str:
    return ITER_RE.sub("", spec_name, count=1).removesuffix(".spec.ts")


def main() -> None:
    if not JSONL_PATH.exists():
        sys.exit(f"[FEHLER] {JSONL_PATH} fehlt")

    entries = []
    with JSONL_PATH.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                entries.append(json.loads(line))
    print(f"[INFO] {len(entries)} Einträge aus {JSONL_PATH.name} geladen")

    rows = []
    missing_files = 0
    for e in entries:
        run = e["run"]
        uc_id = f"uc-{int(e['uc_id']):02d}"
        final_spec = e.get("final_spec") or ""
        iterations = e.get("iterations", [])
        last = iterations[-1] if iterations else {}

        # Pfad des bewerteten Original-Specs (relativ zu src/app/llm/)
        rel_file = ""
        spec_path = None
        if final_spec:
            spec_path = STAGE_DIR / run / uc_dir_from_spec(final_spec) / final_spec
            rel_file = spec_path.relative_to(SCRIPT_DIR).as_posix()

        row = {
            "stage": STAGE_NAME,
            "run": run,
            "uc_id": uc_id,
            "file": rel_file,
            "exec_category": None,
            "duration_s": "",  # keine Einzelmessung im Loop-Protokoll
            "error_summary": "",
            "needs_review": False,
            # Zusatzspalten (Metadaten für den Judge, brechen den Merge nicht)
            "passed": bool(e.get("passed")),
            "iterations_used": int(e.get("iterations_used", len(iterations))),
        }

        if not final_spec or spec_path is None or not spec_path.exists():
            row["exec_category"] = "GENERATION_ERROR"
            row["error_summary"] = ("final_spec fehlt oder Datei nicht gefunden: "
                                    f"{final_spec or '(leer)'}")
            row["needs_review"] = True
            missing_files += 1
        else:
            # Statischer Truncation-/Degenerations-Scan wie in Stufen 1-4
            is_trunc, trunc_reason, _hard = scan_for_truncation(spec_path)
            if is_trunc:
                row["exec_category"] = "GENERATION_ERROR"
                row["error_summary"] = trunc_reason
            elif e.get("passed"):
                row["exec_category"] = "PASS"
            else:
                # Klassifikation der letzten Iteration mit identischer Logik.
                # Status 'failed': ein Harness-Timeout (äußerer Guard) hätte
                # keine Playwright-Fehlermeldung; das Muster-Matching der
                # Fehlermeldung entscheidet wie in Stufen 1-4.
                msg = last.get("error_excerpt", "") or ""
                category, needs_review = classify_runtime_result("failed", msg)
                row["exec_category"] = category
                row["error_summary"] = msg[:500]
                row["needs_review"] = needs_review

        rows.append(row)

    fieldnames = ["stage", "run", "uc_id", "file", "exec_category",
                  "duration_s", "error_summary", "needs_review",
                  "passed", "iterations_used"]
    with OUT_CSV.open("w", newline="", encoding="utf-8") as f_out:
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    counts: dict = {}
    for r in rows:
        counts[r["exec_category"]] = counts.get(r["exec_category"], 0) + 1
    review = sum(1 for r in rows if r["needs_review"])

    print(f"\n[FERTIG] {len(rows)} Einträge klassifiziert -> {OUT_CSV}")
    for cat, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {cat:<18} {n:>4}")
    if missing_files:
        print(f"\n[WARNUNG] {missing_files} final_spec-Datei(en) nicht gefunden")
    if review:
        print(f"[HINWEIS] {review} Einträge mit needs_review=true -> manuell prüfen")


if __name__ == "__main__":
    main()