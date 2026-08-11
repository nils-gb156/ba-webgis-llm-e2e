"""Erzeugt alle Berichte unter docs/eval/ neu.

    cd src/app/llm
    python -m eval_extract.run_all

Reihenfolge ist beliebig; die Skripte sind voneinander unabhängig und lesen
ausschließlich. Es wird keine Datendatei verändert.
"""

from . import anomalies, compare, pruefprotokoll, stage_reports


def main():
    stage_reports.main()
    compare.main()
    anomalies.main()
    pruefprotokoll.main()


if __name__ == "__main__":
    main()
