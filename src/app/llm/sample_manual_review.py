#!/usr/bin/env python3
"""
sample_manual_review.py — Stichprobe für die manuelle Kontrolle der
maschinellen Bewertung (Judge-Validierung).

Zieht mit festem Seed aus jeder der fünf Kontextstufen pro Use Case genau
eine Generierung (10 UCs x 5 Stufen = 50 Testdateien). Die Ziehung ist
nach Use Cases geschichtet: aus jedem UC wird pro Stufe eine Zeile aus
_phase2_judge.csv gezogen. Ausgegeben werden Judge-Scores und die
zugehörigen Begründungen aus _phase2_judge.json sowie leere Spalten für
das manuelle Urteil je Dimension.

Nutzung (aus src/app/llm/ heraus):
    python sample_manual_review.py

Erzeugt:
    tests/_review_sample.csv

Die Datei ist vor Beginn der manuellen Prüfung zu committen, damit die
Stichprobe nachvollziehbar vorab festgelegt ist. Bei gleichem Seed und
gleichen Eingabedaten ist der Lauf reproduzierbar.
"""

import json
import random
import sys
from pathlib import Path

import pandas as pd

SCRIPT_DIR = Path(__file__).resolve().parent
TESTS_DIR = SCRIPT_DIR / "tests"

SEED = 20260809

STAGE_DIRS = [
    "stage_1_baseline",
    "stage_2_accessibility_snapshot",
    "stage_3_generated_ui_map",
    "stage_4_manual_ui_map",
    "stage_5_self_improvement_loop",
]

# Bewertungsdimensionen der Rubrik; Reihenfolge bestimmt die Spalten.
DIMENSIONS = ["coverage", "selector", "map_interaction", "assertion"]

JUDGE_CSV = "_phase2_judge.csv"
JUDGE_JSON = "_phase2_judge.json"
OUT_CSV = TESTS_DIR / "_review_sample.csv"


def load_stage(stage_dir: str) -> pd.DataFrame:
    """Liest Scores (CSV) und Begründungen (JSON) einer Stufe zusammen."""
    csv_path = TESTS_DIR / stage_dir / JUDGE_CSV
    json_path = TESTS_DIR / stage_dir / JUDGE_JSON

    if not csv_path.exists():
        sys.exit(f"Fehlt: {csv_path}")

    df = pd.read_csv(csv_path, dtype=str).fillna("")

    reasoning = {}
    if json_path.exists():
        with json_path.open(encoding="utf-8") as fh:
            for entry in json.load(fh):
                key = (entry.get("stage"), entry.get("run"), entry.get("uc_id"))
                reasoning[key] = entry.get("reasoning") or {}
    else:
        print(f"Hinweis: {json_path.name} fehlt in {stage_dir}, "
              f"Begründungen bleiben leer.")

    for dim in DIMENSIONS:
        df[f"{dim}_reasoning"] = [
            reasoning.get((s, r, u), {}).get(dim, "")
            for s, r, u in zip(df["stage"], df["run"], df["uc_id"])
        ]
    return df


def sample_stage(df: pd.DataFrame, stage_dir: str, rng: random.Random) -> list:
    """Zieht je Use Case genau eine Zeile (geschichtete Stichprobe)."""
    rows = []
    for uc_id in sorted(df["uc_id"].unique()):
        # Nach run sortieren, damit die Auswahl nicht von der Zeilen-
        # reihenfolge in der CSV abhängt.
        candidates = df[df["uc_id"] == uc_id].sort_values("run")
        if candidates.empty:
            print(f"Warnung: keine Zeile für {stage_dir}/{uc_id}")
            continue
        idx = rng.randrange(len(candidates))
        rows.append(candidates.iloc[idx])
    return rows


def main() -> None:
    rng = random.Random(SEED)
    picked = []

    for stage_dir in STAGE_DIRS:
        df = load_stage(stage_dir)
        stage_rows = sample_stage(df, stage_dir, rng)
        picked.extend(stage_rows)
        print(f"{stage_dir}: {len(stage_rows)} von {len(df)} Zeilen gezogen")

    if not picked:
        sys.exit("Keine Stichprobe erzeugt.")

    sample = pd.DataFrame(picked).reset_index(drop=True)
    sample.insert(0, "sample_id", range(1, len(sample) + 1))

    # Leere Spalten für das manuelle Urteil: bestaetigt / abweichung,
    # plus je Dimension ein Feld für die Begründung der Abweichung.
    for dim in DIMENSIONS:
        sample[f"{dim}_manual_verdict"] = ""
        sample[f"{dim}_manual_note"] = ""
    sample["review_note"] = ""

    columns = [
        "sample_id", "stage", "run", "uc_id", "file",
        "exec_category", "vacuous_pass",
    ]
    for dim in DIMENSIONS:
        columns += [
            f"{dim}_score",
            f"{dim}_reasoning",
            f"{dim}_manual_verdict",
            f"{dim}_manual_note",
        ]
    columns.append("review_note")

    missing = [c for c in columns if c not in sample.columns]
    if missing:
        sys.exit(f"Erwartete Spalten fehlen in den Judge-Daten: {missing}")

    sample = sample[columns]
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    sample.to_csv(OUT_CSV, index=False, encoding="utf-8-sig")

    print(f"\nSeed: {SEED}")
    print(f"Stichprobe: {len(sample)} Dateien -> {OUT_CSV}")


if __name__ == "__main__":
    main()
