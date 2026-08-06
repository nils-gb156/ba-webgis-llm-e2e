"""Vergleicht die selbst gerechneten Kennzahlen mit plots/aggregates.csv.

aggregates.csv wird ausschliesslich hier gelesen - und nur zum Vergleich.
Ergebnis: _out/aggregates_diff.json (wird von report_pruefprotokoll.py
weiterverwendet).

Aufruf:  python src/app/llm/eval_extract/check_aggregates.py
"""

from __future__ import annotations

import pandas as pd

import common as c

TOL = 0.005  # aggregates.csv ist auf 2 Dezimalstellen gerundet


def check_stage(stage: int) -> dict:
    p1 = c.load_phase1(stage)
    p2 = c.load_phase2(stage)
    agg = c.load_aggregates(stage).set_index("uc_id")
    diffs = []
    ddof_note = []

    merged = p2.merge(p1[["run", "uc_id", "exec_category"]], on=["run", "uc_id"],
                      how="left", suffixes=("_p2", "_p1"))

    def cmp(uc, field, mine, theirs, tol=TOL):
        if mine is None and (theirs is None or pd.isna(theirs)):
            return
        if theirs is None or (isinstance(theirs, float) and pd.isna(theirs)):
            if mine is not None:
                diffs.append([uc, field, mine, "(leer)", "eigener Wert vorhanden, aggregates leer"])
            return
        if mine is None:
            diffs.append([uc, field, "(leer)", theirs, "aggregates hat Wert, eigener Wert leer"])
            return
        if abs(float(mine) - float(theirs)) > tol:
            diffs.append([uc, field, round(float(mine), 4), round(float(theirs), 4),
                          f"Abweichung {abs(float(mine) - float(theirs)):.4f}"])

    for uc in list(c.UC_IDS) + ["GESAMT"]:
        sub_p1 = p1 if uc == "GESAMT" else p1[p1.uc_id == uc]
        sub_p2 = p2 if uc == "GESAMT" else p2[p2.uc_id == uc]
        sub_m = merged if uc == "GESAMT" else merged[merged.uc_id == uc]
        if uc not in agg.index:
            diffs.append([uc, "Zeile", "vorhanden", "fehlt", "uc_id fehlt in aggregates.csv"])
            continue
        row = agg.loc[uc]
        cmp(uc, "n", len(sub_p1), row.get("n"), tol=0)
        for cat in c.EXEC_ORDER:
            if cat in row.index:
                cmp(uc, cat, int((sub_p1.exec_category == cat).sum()), row[cat], tol=0)
        for dim in c.SCORE_DIMS:
            s = sub_p2[dim]
            mine_mean = None if s.isna().all() else float(s.mean())
            mine_med = None if s.isna().all() else float(s.median())
            # plot_stage.py:251 rechnet std mit ddof=0 (Grundgesamtheit).
            # Verglichen wird daher ddof=0; der Stichproben-Wert (ddof=1), der
            # in den Stufenberichten steht, wird zusaetzlich protokolliert.
            mine_std0 = None if s.isna().all() else float(s.std(ddof=0))
            mine_std1 = None if s.notna().sum() < 2 else float(s.std(ddof=1))
            cmp(uc, dim + "_mean", mine_mean, row.get(dim + "_mean"))
            cmp(uc, dim + "_median", mine_med, row.get(dim + "_median"))
            cmp(uc, dim + "_std (ddof=0)", mine_std0, row.get(dim + "_std"))
            ddof_note.append([uc, dim, mine_std1, mine_std0,
                              row.get(dim + "_std")])
        cmp(uc, "vacuous_pass", int(sub_p2.vacuous_pass.astype(bool).sum()),
            row.get("vacuous_pass"), tol=0)

    n_ddof_gap = sum(1 for _, _, s1, s0, theirs in ddof_note
                     if s1 is not None and theirs is not None
                     and not pd.isna(theirs)
                     and abs(s1 - float(theirs)) > TOL)
    return {"stage": stage, "n_diffs": len(diffs), "diffs": diffs,
            "agg_rows": len(agg),
            "n_std_ddof_gap": n_ddof_gap,
            "n_std_compared": len(ddof_note)}


def main():
    out = {}
    for stage in range(1, 6):
        r = check_stage(stage)
        out[stage] = r
        print(f"Stufe {stage}: {r['n_diffs']} Abweichung(en) "
              f"({r['agg_rows']} Zeilen in aggregates.csv); "
              f"{r['n_std_ddof_gap']}/{r['n_std_compared']} std-Werte weichen "
              f"ab, wenn man ddof=1 statt ddof=0 vergleicht")
        for d in r["diffs"][:40]:
            print("   ", d)
    c.write_json("aggregates_diff.json", out)


if __name__ == "__main__":
    main()
