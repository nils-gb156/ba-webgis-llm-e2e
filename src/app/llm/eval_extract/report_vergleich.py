"""Erzeugt docs/eval/vergleich.md (Stufenvergleich 1-5).

Aufruf:  python src/app/llm/eval_extract/report_vergleich.py
"""

from __future__ import annotations

import json

import pandas as pd

import common as c
import notes
import report_stage5_loop as loop

STAGES = [1, 2, 3, 4, 5]


def main():
    p1 = {s: c.load_phase1(s) for s in STAGES}
    p2 = {s: c.load_phase2(s) for s in STAGES}
    it5 = loop.load_iterations()

    out = ["# Stufenvergleich", "",
           "Erzeugt von `src/app/llm/eval_extract/report_vergleich.py`. "
           "Alle Werte aus `_phase1_results.csv` bzw. `_phase2_judge.json` der "
           "jeweiligen Stufe; Stufe-5-Iterationsdaten aus "
           "`_stage_5_run_summary.json` und den `*.result.json` der Iterationen.",
           "",
           c.md_table(["Stufe", "Bezeichnung", "Dateien in Phase 1",
                       "Dateien in Phase 2"],
                      [[s, c.STAGE_LABELS[s], len(p1[s]), len(p2[s])]
                       for s in STAGES]),
           ""]

    # 1) Stufe x exec_category in Prozent
    rows = []
    for s in STAGES:
        n = len(p1[s])
        vc = p1[s].exec_category.value_counts()
        rows.append([f"Stufe {s}", n]
                    + [c.pct(int(vc.get(cat, 0)), n) for cat in c.EXEC_ORDER])
    out += ["## 1 Stufe × `exec_category` (in Prozent der Stufengrundmenge)", "",
            c.md_table(["Stufe", "n"] + c.EXEC_ORDER, rows), ""]
    rows = []
    for s in STAGES:
        vc = p1[s].exec_category.value_counts()
        rows.append([f"Stufe {s}", len(p1[s])]
                    + [int(vc.get(cat, 0)) for cat in c.EXEC_ORDER])
    out += ["Dieselbe Tabelle in absoluten Zahlen:", "",
            c.md_table(["Stufe", "n"] + c.EXEC_ORDER, rows), ""]

    # 2) Stufe x Dimension: Median und Mittelwert
    rows = []
    for s in STAGES:
        r = [f"Stufe {s}"]
        for dim in c.SCORE_DIMS:
            sc = p2[s][dim]
            r += [f"{sc.median():.1f}" if sc.notna().any() else "-",
                  f"{sc.mean():.2f}" if sc.notna().any() else "-",
                  int(sc.notna().sum())]
        rows.append(r)
    hdr = ["Stufe"]
    for dim in c.SCORE_DIMS:
        short = c.DIM_SHORT[dim]
        hdr += [f"{short} Md", f"{short} Ø", f"{short} n"]
    out += ["## 2 Stufe × Bewertungsdimension (Median, Mittelwert)", "",
            c.md_table(hdr, rows), "",
            "`n` = Anzahl numerisch bewerteter Dateien (bei `map_interaction` "
            "nur die MAP_UCS uc-04/06/07/08/10).", ""]

    # Score-Verteilung je Stufe
    rows = []
    for s in STAGES:
        for dim in c.SCORE_DIMS:
            sc = p2[s][dim]
            cnt = sc.value_counts()
            rows.append([f"Stufe {s}", c.DIM_SHORT[dim]]
                        + [int(cnt.get(float(k), 0)) for k in (1, 2, 3, 4)]
                        + [int(sc.notna().sum())])
    out += ["Verteilung der Einzelwerte:", "",
            c.md_table(["Stufe", "Dimension", "1", "2", "3", "4", "n"], rows), ""]

    # 3) PASS-Rate Matrix UC x Stufe
    rows = []
    for uc in c.UC_IDS:
        r = [uc]
        for s in STAGES:
            sub = p1[s][p1[s].uc_id == uc]
            r.append(f"{100.0 * (sub.exec_category == 'PASS').mean():.0f}"
                     if len(sub) else "-")
        vals = [100.0 * (p1[s][p1[s].uc_id == uc].exec_category == "PASS").mean()
                for s in STAGES]
        r += [f"{min(vals):.0f}", f"{max(vals):.0f}",
              f"{vals[-1] - vals[0]:+.0f}", f"{vals[3] - vals[0]:+.0f}"]
        rows.append(r)
    tot = [f"{100.0 * (p1[s].exec_category == 'PASS').mean():.1f}" for s in STAGES]
    rows.append(["**gesamt**"] + tot + ["-", "-", "-", "-"])
    out += ["## 3 PASS-Rate-Matrix Use Case × Stufe (in Prozent)", "",
            c.md_table(["uc_id"] + [f"St. {s}" for s in STAGES]
                       + ["Min", "Max", "Δ St.5−St.1", "Δ St.4−St.1"], rows), "",
            "Zellwert = Anteil `exec_category == PASS` an den Läufen des UC in "
            "der Stufe (Nenner 50, in Stufe 3 für uc-02 49).", ""]

    # 4) vacuous_pass je Stufe
    rows = []
    for s in STAGES:
        vp = p2[s].vacuous_pass.astype(bool)
        n_pass = int((p1[s].exec_category == "PASS").sum())
        rows.append([f"Stufe {s}", len(p2[s]), int(vp.sum()),
                     c.pct(int(vp.sum()), len(p2[s])),
                     n_pass, c.pct(int(vp.sum()), n_pass),
                     ", ".join(f"{uc}: {int(v)}" for uc, v in
                               p2[s].assign(vp=vp).groupby("uc_id").vp.sum().items()
                               if v)])
    out += ["## 4 `vacuous_pass` je Stufe", "",
            c.md_table(["Stufe", "n", "vacuous_pass", "% der Stufe",
                        "PASS in Phase 1", "% der PASS", "Verteilung je UC"],
                       rows), "",
            "Definition (`phase2_judge_prompt.md`): `exec_category == PASS` "
            "**und** `assertion_score ≤ 2`.", ""]

    # 5) Wanderung der Fehlerklassen
    rows = []
    for cat in c.EXEC_ORDER:
        r = [cat]
        prev = None
        for s in STAGES:
            v = int((p1[s].exec_category == cat).sum())
            r.append(v)
            prev = v
        vals = [int((p1[s].exec_category == cat).sum()) for s in STAGES]
        r += [f"{vals[1] - vals[0]:+d}", f"{vals[2] - vals[1]:+d}",
              f"{vals[3] - vals[2]:+d}", f"{vals[4] - vals[3]:+d}"]
        rows.append(r)
    out += ["## 5 Wanderung der Fehlerklassen zwischen den Stufen", "",
            c.md_table(["Kategorie"] + [f"St. {s}" for s in STAGES]
                       + ["Δ 1→2", "Δ 2→3", "Δ 3→4", "Δ 4→5"], rows), ""]

    # INFRA -> ASSERTION je UC
    rows = []
    for uc in c.UC_IDS:
        r = [uc]
        for s in STAGES:
            sub = p1[s][p1[s].uc_id == uc]
            r.append(f"{int((sub.exec_category == 'INFRA_FAIL').sum())} / "
                     f"{int((sub.exec_category == 'ASSERTION_FAIL').sum())}")
        rows.append(r)
    out += ["INFRA_FAIL / ASSERTION_FAIL je Use Case und Stufe "
            "(Zellwert `INFRA_FAIL / ASSERTION_FAIL`):", "",
            c.md_table(["uc_id"] + [f"St. {s}" for s in STAGES], rows), ""]

    # COMPILE_ERROR + Helfernutzung
    pats = json.loads((c.OUT_DIR / "patterns.json").read_text(encoding="utf-8"))
    keys = ["Stufe 1", "Stufe 2", "Stufe 3", "Stufe 4",
            "Stufe 5 (Iter. 0)", "Stufe 5 (Endstand)", "Stufe 5 (alle Iter.)"]
    rows = []
    for k in keys:
        st = int(k.split()[1].rstrip(")"))
        d = pats[k]
        n = d["n"]
        ce = int((p1[st].exec_category == "COMPILE_ERROR").sum())
        ge = int((p1[st].exec_category == "GENERATION_ERROR").sum())
        rows.append([k, n, d["Import map-model-helpers"],
                     c.pct(d["Import map-model-helpers"], n),
                     d["Helferfunktion (irgendeine)"],
                     c.pct(d["Helferfunktion (irgendeine)"], n),
                     d["__openPioneerMap"], c.pct(d["__openPioneerMap"], n),
                     f"{ce} (Stufe {st}, Phase 1)", f"{ge} (Stufe {st}, Phase 1)"])
    out += ["Helfernutzung gegen COMPILE_ERROR/GENERATION_ERROR "
            "(Spalten 2-7 aus dem Codescan der jeweiligen Grundmenge, "
            "Spalten 8-9 aus Phase 1 der zugehörigen Stufe):", "",
            c.md_table(["Grundmenge", "Dateien", "Import der Helferdatei", "%",
                        "Helferfunktion verwendet", "%", "`__openPioneerMap`",
                        "%", "COMPILE_ERROR", "GENERATION_ERROR"], rows), ""]

    # 6) Use Cases gegen den Gesamttrend
    trend = {s: 100.0 * (p1[s].exec_category == "PASS").mean() for s in STAGES}
    rows = []
    for uc in c.UC_IDS:
        vals = [100.0 * (p1[s][p1[s].uc_id == uc].exec_category == "PASS").mean()
                for s in STAGES]
        gegen = []
        for i in range(len(STAGES) - 1):
            d_uc = vals[i + 1] - vals[i]
            d_all = trend[STAGES[i + 1]] - trend[STAGES[i]]
            if d_all > 0 and d_uc < 0:
                gegen.append(f"{STAGES[i]}→{STAGES[i + 1]} ({d_uc:+.0f} pp "
                             f"vs. Stufentrend {d_all:+.1f} pp)")
            elif d_all < 0 and d_uc > 0:
                gegen.append(f"{STAGES[i]}→{STAGES[i + 1]} ({d_uc:+.0f} pp "
                             f"vs. Stufentrend {d_all:+.1f} pp)")
        if gegen:
            rows.append([uc, ", ".join(f"{v:.0f}" for v in vals),
                         "; ".join(gegen)])
    out += ["## 6 Use Cases gegen den Gesamttrend", "",
            "Stufen-PASS-Rate gesamt: "
            + ", ".join(f"Stufe {s} = {trend[s]:.1f} %" for s in STAGES) + ".",
            "",
            c.md_table(["uc_id", "PASS % Stufen 1-5",
                        "Übergänge gegen die Richtung des Stufentrends"], rows),
            "",
            "Kriterium: Vorzeichen der UC-Änderung von Stufe k zu k+1 ist "
            "entgegengesetzt zum Vorzeichen der Änderung der "
            "Gesamt-PASS-Rate.", ""]

    # 7) Stufe 5 gegen Stufe 2 und 2-4
    it5 = it5.sort_values(["run", "uc_id", "iteration"])
    first = it5[it5.iteration == 0]
    rows = []
    n2 = len(p1[2])
    vc2 = p1[2].exec_category.value_counts()
    vcf = first.exec_category.value_counts()
    for cat in c.EXEC_ORDER:
        rows.append([cat, int(vc2.get(cat, 0)), c.pct(int(vc2.get(cat, 0)), n2),
                     int(vcf.get(cat, 0)), c.pct(int(vcf.get(cat, 0)), len(first)),
                     f"{int(vcf.get(cat, 0)) - int(vc2.get(cat, 0)):+d}"])
    out += ["## 7 Stufe 5 gegen Stufe 2", "",
            "Verglichen wird die **erste Iteration** von Stufe 5 (vor jedem "
            "Reparaturschritt) mit dem Ergebnis von Stufe 2. "
            "**Einschränkung:** Der Startkontext der Stufe 5 ist nicht "
            "identisch mit dem der Stufe 2. Er enthält denselben "
            "Accessibility-Snapshot und dieselbe Liste von 24 testids, "
            "zusätzlich aber den vollständigen Quelltext von "
            "`map-model-helpers.ts` samt Importanweisung "
            "(`_stage_5_initial_context.txt`, Zeilen 100-234). Stufe 5 hat "
            "damit in der ersten Iteration mehr Kontext als Stufe 2; siehe "
            "pruefprotokoll.md, Abschnitt 6.", "",
            "### 7.1 Erste Iteration Stufe 5 gegen Stufe 2 "
            "(Phase-1-Kategorien)", "",
            c.md_table(["Kategorie", "Stufe 2 n", "Stufe 2 %",
                        "Stufe 5 Iter. 0 n", "Stufe 5 Iter. 0 %", "Δ n"], rows),
            "",
            "Die Klassifikation der Stufe-5-Iteration 0 erfolgt mit derselben "
            "Funktion `classify_runtime_result()` auf dem "
            "`*.result.json`-Report dieser Iteration.", ""]

    # PASS-Rate je UC: Stufe 2 vs Stufe 5 Iter 0 vs Endstand
    rows = []
    for uc in c.UC_IDS:
        s2 = 100.0 * (p1[2][p1[2].uc_id == uc].exec_category == "PASS").mean()
        f0 = 100.0 * (first[first.uc_id == uc].exec_category == "PASS").mean()
        s5 = 100.0 * (p1[5][p1[5].uc_id == uc].exec_category == "PASS").mean()
        rows.append([uc, f"{s2:.0f}", f"{f0:.0f}", f"{f0 - s2:+.0f}",
                     f"{s5:.0f}", f"{s5 - s2:+.0f}"])
    rows.append(["**gesamt**",
                 f"{100.0 * (p1[2].exec_category == 'PASS').mean():.1f}",
                 f"{100.0 * (first.exec_category == 'PASS').mean():.1f}",
                 f"{100.0 * (first.exec_category == 'PASS').mean() - 100.0 * (p1[2].exec_category == 'PASS').mean():+.1f}",
                 f"{100.0 * (p1[5].exec_category == 'PASS').mean():.1f}",
                 f"{100.0 * (p1[5].exec_category == 'PASS').mean() - 100.0 * (p1[2].exec_category == 'PASS').mean():+.1f}"])
    out += ["PASS-Rate je Use Case:", "",
            c.md_table(["uc_id", "Stufe 2 %", "Stufe 5 Iter. 0 %", "Δ",
                        "Stufe 5 Endstand %", "Δ zu Stufe 2"], rows), ""]

    # Endergebnis Stufe 5 gegen Stufen 2-4
    rows = []
    for s in [2, 3, 4, 5]:
        n = len(p1[s])
        vc = p1[s].exec_category.value_counts()
        rows.append([f"Stufe {s}", n]
                    + [f"{int(vc.get(cat, 0))} ({c.pct(int(vc.get(cat, 0)), n)} %)"
                       for cat in c.EXEC_ORDER])
    out += ["### 7.2 Endergebnis Stufe 5 gegen die Stufen 2-4", "",
            c.md_table(["Stufe", "n"] + c.EXEC_ORDER, rows), ""]
    rows = []
    for s in [2, 3, 4, 5]:
        r = [f"Stufe {s}"]
        for dim in c.SCORE_DIMS:
            sc = p2[s][dim]
            r += [f"{sc.median():.1f}" if sc.notna().any() else "-",
                  f"{sc.mean():.2f}" if sc.notna().any() else "-"]
        rows.append(r)
    hdr = ["Stufe"]
    for dim in c.SCORE_DIMS:
        hdr += [f"{c.DIM_SHORT[dim]} Md", f"{c.DIM_SHORT[dim]} Ø"]
    out += ["Judge-Dimensionen (Stufe 5 wird nur im Endstand bewertet - es gibt "
            "keine Judge-Bewertung der ersten Iteration):", "",
            c.md_table(hdr, rows), ""]

    # 8) Map-Model-Helfer-Nutzung
    rows = []
    for k in keys:
        d = pats[k]
        n = d["n"]
        any_helper = d["Helferfunktion (irgendeine)"]
        both = d["__openPioneerMap"]
        rows.append([k, n,
                     f"{any_helper} ({c.pct(any_helper, n)} %)",
                     f"{both} ({c.pct(both, n)} %)",
                     f"{d['isLayerRendered']} ({c.pct(d['isLayerRendered'], n)} %)",
                     f"{d['getMapZoomLevel']} ({c.pct(d['getMapZoomLevel'], n)} %)",
                     f"{d['getMapCenter']} ({c.pct(d['getMapCenter'], n)} %)",
                     f"{d['getActiveBaseLayerTitle']} ({c.pct(d['getActiveBaseLayerTitle'], n)} %)",
                     f"{d['getHighlightedCoordinate']} ({c.pct(d['getHighlightedCoordinate'], n)} %)"])
    out += ["## 8 Nutzung der Map-Model-Helfer je Stufe", "",
            c.md_table(["Grundmenge", "Dateien", "irgendeine Helferfunktion",
                        "`__openPioneerMap`", "`isLayerRendered`",
                        "`getMapZoomLevel`", "`getMapCenter`",
                        "`getActiveBaseLayerTitle`",
                        "`getHighlightedCoordinate`"], rows), "",
            "Die Helferdatei und `globalThis.__openPioneerMap` stehen in den "
            "Stufen 3 und 4 im Kontext, in den Stufen 1 und 2 nicht. Der "
            "Startkontext der Stufe 5 enthält sie ebenfalls "
            "(`_stage_5_initial_context.txt`, Abschnitt „Map Model Helper "
            "Functions“) - anders als der Kontext der Stufe 2, auf dem er "
            "sonst aufbaut. Werte = Dateien mit mindestens einem Vorkommen. "
            "Vollständige Mustertabelle in [codemuster.md](codemuster.md).", ""]

    out += ["",
            notes.md_bullets("9 Auffälligkeiten (Stichpunkte)",
                             notes.VERGLEICH_AUFFAELLIG),
            notes.md_bullets("10 Hypothesen (unbelegt)",
                             notes.VERGLEICH_HYPOTHESEN)]
    c.write_doc("vergleich.md", "\n".join(out))


if __name__ == "__main__":
    main()
