"""Erzeugt alle Berichte unter docs/eval/ in der richtigen Reihenfolge.

Aufruf (aus diesem Verzeichnis):
    python run_all.py

Reihenfolge ist relevant:
  1. report_stages          -> stufe_1.md ... stufe_5.md
  2. report_stage5_loop     -> haengt Abschnitte 5-10 an stufe_5.md an
                               (erzeugt _out/stage5_iterations.pkl)
  3. report_patterns        -> codemuster.md + _out/patterns.json
  4. report_vergleich       -> vergleich.md   (braucht patterns.json)
  5. report_auffaelligkeiten-> auffaelligkeiten.md (braucht patterns.json)
  6. check_aggregates       -> _out/aggregates_diff.json
  7. report_pruefprotokoll  -> pruefprotokoll.md
"""

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

STEPS = [
    "report_stages.py",
    "report_stage5_loop.py",
    "report_patterns.py",
    "report_vergleich.py",
    "report_auffaelligkeiten.py",
    "check_aggregates.py",
    "report_pruefprotokoll.py",
]


def main():
    for step in STEPS:
        print(f"\n===== {step}")
        r = subprocess.run([sys.executable, str(HERE / step)], cwd=HERE)
        if r.returncode != 0:
            sys.exit(f"[FEHLER] {step} endete mit Code {r.returncode}")
    print("\n[FERTIG] alle Berichte in docs/eval/")


if __name__ == "__main__":
    main()
