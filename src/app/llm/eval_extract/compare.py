"""Erzeugt docs/eval/vergleich.md (Stufenvergleich 1-5).

Aufruf:  python -m eval_extract.compare      (aus src/app/llm/)
"""

from __future__ import annotations

from collections import Counter, defaultdict

import pandas as pd

from . import common as C
from . import stage5_loop

DIMS = C.SCORE_DIMS
SHORT = {d: d.replace("_score", "") for d in DIMS}
STAGES = [1, 2, 3, 4, 5]


def _p1(stage):
    return C.load_phase1(stage)


def _p2(stage):
    return C.load_phase2_csv(stage)


def exec_matrix() -> str:
    out = ["## 1 Stufe × `exec_category`\n"]
    out.append("Quelle: `_phase1_results.csv` je Stufe, Spalte "
               "`exec_category`, alle 500 Zeilen. Prozent = Anteil an den "
               "500 Dateien der Stufe.\n")
    cats = []
    data = {}
    for s in STAGES:
        vc = _p1(s)["exec_category"].value_counts()
        data[s] = vc
        for c in vc.index:
            if c not in cats:
                cats.append(c)
    cats = [c for c in C.EXEC_ORDER if c in cats] + \
           [c for c in cats if c not in C.EXEC_ORDER]

    rows = []
    for s in STAGES:
        r = {"Stufe": s, "n": int(data[s].sum())}
        for c in cats:
            r[c] = C.pct(int(data[s].get(c, 0)), int(data[s].sum()))
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))

    out.append("\nDieselbe Tabelle absolut:\n")
    rows = []
    for s in STAGES:
        r = {"Stufe": s, "n": int(data[s].sum())}
        for c in cats:
            r[c] = int(data[s].get(c, 0))
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


def dim_matrix() -> str:
    out = ["## 2 Stufe × Bewertungsdimension\n"]
    out.append("Quelle: `_phase2_judge.csv` je Stufe. Median und Mittelwert "
               "nur über die numerischen Werte (`n/a` ausgeschlossen).\n")
    rows = []
    for s in STAGES:
        p2 = _p2(s)
        r = {"Stufe": s}
        for d in DIMS:
            v = pd.to_numeric(p2[d], errors="coerce").dropna()
            r[f"{SHORT[d]} Md"] = f"{v.median():.1f}" if len(v) else "–"
            r[f"{SHORT[d]} Ø"] = f"{v.mean():.2f}" if len(v) else "–"
            r[f"{SHORT[d]} n"] = len(v)
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))

    out.append("\nVerteilung der Score-Werte je Stufe und Dimension "
               "(Anzahl Dateien):\n")
    rows = []
    for s in STAGES:
        p2 = _p2(s)
        for d in DIMS:
            v = pd.to_numeric(p2[d], errors="coerce")
            rows.append({"Stufe": s, "Dimension": SHORT[d],
                         "1": int((v == 1).sum()), "2": int((v == 2).sum()),
                         "3": int((v == 3).sum()), "4": int((v == 4).sum()),
                         "n/a": int(v.isna().sum())})
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


def pass_matrix() -> pd.DataFrame:
    rows = []
    for uc in C.UCS:
        r = {"uc_id": uc}
        for s in STAGES:
            p1 = _p1(s)
            sub = p1[p1.uc_id == uc]
            r[f"Stufe {s}"] = 100.0 * (sub.exec_category == "PASS").sum() / len(sub)
        rows.append(r)
    df = pd.DataFrame(rows)
    tot = {"uc_id": "GESAMT"}
    for s in STAGES:
        p1 = _p1(s)
        tot[f"Stufe {s}"] = 100.0 * (p1.exec_category == "PASS").sum() / len(p1)
    return pd.concat([df, pd.DataFrame([tot])], ignore_index=True)


def pass_matrix_section() -> str:
    out = ["## 3 PASS-Raten-Matrix Use Case × Stufe\n"]
    out.append("Quelle: `_phase1_results.csv` je Stufe; je Zelle "
               "`sum(exec_category=='PASS') / 50` in Prozent.\n")
    df = pass_matrix()
    disp = df.copy()
    for s in STAGES:
        disp[f"Stufe {s}"] = disp[f"Stufe {s}"].map(lambda v: f"{v:.0f}%")
    out.append(C.md_table(disp))

    out.append("\nDifferenzen zwischen benachbarten Stufen "
               "(Prozentpunkte, positiv = Verbesserung):\n")
    rows = []
    for _, r in df.iterrows():
        d = {"uc_id": r["uc_id"]}
        for a, b in [(1, 2), (2, 3), (3, 4), (4, 5)]:
            d[f"{a}→{b}"] = f"{r[f'Stufe {b}'] - r[f'Stufe {a}']:+.0f}"
        d["1→5"] = f"{r['Stufe 5'] - r['Stufe 1']:+.0f}"
        rows.append(d)
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


def vacuous_section() -> str:
    out = ["## 4 `vacuous_pass` je Stufe\n"]
    out.append("Quelle: `_phase2_judge.csv` (Judge-Flag) und "
               "`_phase1_results.csv` ⋈ `_phase2_judge.csv` für die "
               "Nachrechnung (PASS und `assertion_score ≤ 2`).\n")
    rows = []
    for s in STAGES:
        p1, p2 = _p1(s), _p2(s)
        m = p1.merge(p2.drop(columns=[c for c in ["exec_category", "passed",
                                                  "iterations_used"]
                                      if c in p2.columns]),
                     on=["stage", "run", "uc_id", "file"], how="left")
        flag = m["vacuous_pass"].astype(str).str.lower() == "true"
        a = pd.to_numeric(m["assertion_score"], errors="coerce")
        defi = (m.exec_category == "PASS") & (a <= 2)
        npass = int((m.exec_category == "PASS").sum())
        rows.append({
            "Stufe": s,
            "PASS": npass,
            "vacuous_pass (Judge)": int(flag.sum()),
            "% der Stufe": C.pct(int(flag.sum()), len(m)),
            "% der PASS": C.pct(int(flag.sum()), npass),
            "Nachrechnung PASS ∧ assertion ≤ 2": int(defi.sum()),
            "Abweichung": int((flag != defi).sum()),
        })
    out.append(C.md_table(pd.DataFrame(rows)))

    out.append("\n`vacuous_pass` je Stufe und Use Case (absolut):\n")
    rows = []
    for uc in C.UCS:
        r = {"uc_id": uc}
        for s in STAGES:
            p2 = _p2(s)
            sub = p2[p2.uc_id == uc]
            r[f"Stufe {s}"] = int((sub["vacuous_pass"].astype(str).str.lower()
                                   == "true").sum())
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


def wanderung_section() -> str:
    out = ["## 5 Wanderung der Fehlerklassen zwischen den Stufen\n"]
    out.append("Quelle: `_phase1_results.csv` je Stufe. Absolute Zahlen und "
               "Veränderung gegenüber der Vorstufe.\n")
    cats = ["PASS", "ASSERTION_FAIL", "INFRA_FAIL", "COMPILE_ERROR",
            "GENERATION_ERROR", "TIMEOUT"]
    counts = {s: _p1(s)["exec_category"].value_counts() for s in STAGES}
    rows = []
    for c in cats:
        if not any(counts[s].get(c, 0) for s in STAGES):
            continue
        r = {"exec_category": c}
        prev = None
        for s in STAGES:
            v = int(counts[s].get(c, 0))
            r[f"Stufe {s}"] = v
            if prev is not None:
                r[f"Δ {s-1}→{s}"] = f"{v - prev:+d}"
            prev = v
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))

    out.append("\n**INFRA_FAIL → ASSERTION_FAIL?** – Anteil der Fehlschläge, "
               "die auf eine inhaltliche Assertion entfallen "
               "(`ASSERTION_FAIL / (ASSERTION_FAIL + INFRA_FAIL + "
               "COMPILE_ERROR + GENERATION_ERROR + TIMEOUT)`):\n")
    rows = []
    for s in STAGES:
        c = counts[s]
        nfail = int(sum(c.get(x, 0) for x in cats if x != "PASS"))
        rows.append({
            "Stufe": s, "Fehlschläge gesamt": nfail,
            "ASSERTION_FAIL": int(c.get("ASSERTION_FAIL", 0)),
            "INFRA_FAIL": int(c.get("INFRA_FAIL", 0)),
            "Anteil ASSERTION_FAIL an den Fehlschlägen":
                C.pct(int(c.get("ASSERTION_FAIL", 0)), nfail),
            "Verhältnis ASSERTION/INFRA":
                (f"{c.get('ASSERTION_FAIL', 0) / c.get('INFRA_FAIL', 0):.2f}"
                 if c.get("INFRA_FAIL", 0) else "–"),
        })
    out.append(C.md_table(pd.DataFrame(rows)))

    out.append("\n**COMPILE_ERROR und GENERATION_ERROR ab Stufe 3** "
               "(Einführung der Map-Model-Helfer):\n")
    rows = []
    for s in STAGES:
        c = counts[s]
        rows.append({"Stufe": s,
                     "COMPILE_ERROR": int(c.get("COMPILE_ERROR", 0)),
                     "GENERATION_ERROR": int(c.get("GENERATION_ERROR", 0)),
                     "Cannot-find-module-Meldungen in `error_summary`":
                         int(_p1(s)["error_summary"].str.contains(
                             "Cannot find module", na=False).sum()),
                     "Helferimport im Code (Dateien)":
                         int((C.code_frame(s)["helper_import"] > 0).sum())})
    out.append(C.md_table(pd.DataFrame(rows)))
    out.append("\n- `COMPILE_ERROR` kommt in **keiner** Stufe vor; die "
               "Einführung der Helferdatei ab Stufe 3 hat weder "
               "`Cannot find module`-Fehler noch `COMPILE_ERROR` erzeugt "
               "(siehe Spalte 4 und 5).")

    out.append("\n**Fehlergruppen je Stufe** (Anteil an den Fehlschlägen "
               "der Stufe; Regeltabelle `common.py:ERROR_GROUP_RULES`):\n")
    grp_all = {}
    for s in STAGES:
        p1 = _p1(s)
        f = p1[p1.exec_category != "PASS"]
        grp_all[s] = (Counter(f["error_summary"].map(C.error_group)), len(f))
    allg = sorted({g for s in STAGES for g in grp_all[s][0]})
    rows = []
    for g in allg:
        r = {"Gruppe": g}
        for s in STAGES:
            cnt, tot = grp_all[s]
            r[f"Stufe {s}"] = f"{cnt.get(g, 0)} ({C.pct(cnt.get(g, 0), tot)})"
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


def gegentrend_section() -> str:
    out = ["## 6 Use Cases gegen den Gesamttrend\n"]
    df = pass_matrix()
    ucs = df[df.uc_id != "GESAMT"]
    total = df[df.uc_id == "GESAMT"].iloc[0]
    out.append("Referenz ist die Zeile GESAMT der PASS-Raten-Matrix. "
               "„Gegentrend“ = das Vorzeichen der Änderung eines UC weicht "
               "vom Vorzeichen der Gesamtänderung derselben Stufengrenze ab. "
               "Quelle: `_phase1_results.csv` aller Stufen.\n")
    rows = []
    for a, b in [(1, 2), (2, 3), (3, 4), (4, 5)]:
        dtot = total[f"Stufe {b}"] - total[f"Stufe {a}"]
        for _, r in ucs.iterrows():
            duc = r[f"Stufe {b}"] - r[f"Stufe {a}"]
            if dtot == 0:
                continue
            if (duc > 0) != (dtot > 0) and duc != 0:
                rows.append({"Stufengrenze": f"{a}→{b}", "uc_id": r["uc_id"],
                             "PASS vorher": f"{r[f'Stufe {a}']:.0f}%",
                             "PASS nachher": f"{r[f'Stufe {b}']:.0f}%",
                             "Δ UC (pp)": f"{duc:+.0f}",
                             "Δ GESAMT (pp)": f"{dtot:+.0f}"})
    out.append(C.md_table(pd.DataFrame(rows)) if rows
               else "- keine Zelle mit gegenläufigem Vorzeichen.")

    out.append("\nUse Cases, die über die Stufen 1→4 **nicht** besser werden "
               "(Δ ≤ 0 pp) – trotz wachsendem Kontext:\n")
    rows = []
    for _, r in ucs.iterrows():
        d = r["Stufe 4"] - r["Stufe 1"]
        if d <= 0:
            rows.append({"uc_id": r["uc_id"],
                         "Stufe 1": f"{r['Stufe 1']:.0f}%",
                         "Stufe 2": f"{r['Stufe 2']:.0f}%",
                         "Stufe 3": f"{r['Stufe 3']:.0f}%",
                         "Stufe 4": f"{r['Stufe 4']:.0f}%",
                         "Δ 1→4 (pp)": f"{d:+.0f}"})
    out.append(C.md_table(pd.DataFrame(rows)) if rows
               else "- keiner.")

    out.append("\nUse Cases mit einem Rückgang zwischen zwei benachbarten "
               "Stufen von mindestens 10 pp:\n")
    rows = []
    for a, b in [(1, 2), (2, 3), (3, 4), (4, 5)]:
        for _, r in ucs.iterrows():
            d = r[f"Stufe {b}"] - r[f"Stufe {a}"]
            if d <= -10:
                rows.append({"Stufengrenze": f"{a}→{b}", "uc_id": r["uc_id"],
                             "von": f"{r[f'Stufe {a}']:.0f}%",
                             "nach": f"{r[f'Stufe {b}']:.0f}%",
                             "Δ (pp)": f"{d:+.0f}"})
    out.append(C.md_table(pd.DataFrame(rows)) if rows else "- keiner.")
    return "\n".join(out)


def _kontext_hinweis() -> str:
    """Prüft die Annahme „Stufe 5 startet mit dem Kontext von Stufe 2“
    gegen die abgelegten Kontextdateien."""
    import difflib
    ctx = {}
    for s, name in [(2, "_stage_2_context.txt"), (3, "_stage_3_context.txt"),
                    (4, "_stage_4_context.txt"),
                    (5, "_stage_5_initial_context.txt")]:
        p = C.stage_dir(s) / name
        ctx[s] = p.read_text(encoding="utf-8") if p.exists() else ""

    def heads(t):
        return [l for l in t.splitlines()
                if l.endswith(":") and not l.startswith((" ", "-", "|", "*", "/"))]

    rows = []
    for s in [2, 3, 4, 5]:
        rows.append({"Stufe": s, "Zeichen": len(ctx[s]),
                     "Zeilen": len(ctx[s].splitlines()),
                     "Abschnitte": ", ".join(f"`{h}`" for h in heads(ctx[s])),
                     "Ähnlichkeit zu Stufe 5":
                         f"{difflib.SequenceMatcher(None, ctx[5], ctx[s]).ratio():.3f}"})
    return ("> **Prüfung der Annahme.** Die Aufgabenstellung geht davon aus, "
            "dass Stufe 5 mit dem Kontext von Stufe 2 startet. Die abgelegten "
            "Kontextdateien belegen das **nicht**: der Startkontext von "
            "Stufe 5 enthält zusätzlich zum Stufe-2-Material (testid-Liste + "
            "Accessibility-Tree) den vollständigen Quelltext von "
            "`map-model-helpers.ts` — denselben Block, den Stufe 3 und 4 "
            "bekommen. `generate_tests_stage_5.py:build_ui_context()` fügt "
            "ihn explizit an (Kommentar dort: „identical role to stage 2, "
            "plus helpers“). Zusätzlich stammt der Scrape aus einem späteren "
            "Lauf und listet 24 statt 19 `data-testid`-Werte. Der Vergleich "
            "unten ist deshalb **kein** Vergleich bei gleichem Kontext.\n\n"
            + C.md_table(pd.DataFrame(rows)))


def stufe5_vs_2() -> str:
    out = ["## 7 Stufe 5 gegen Stufe 2\n"]
    out.append("Verglichen werden (a) das Ergebnis der **ersten** "
               "Loop-Iteration (`history[0]`, klassifiziert mit "
               "`classify_runtime_result`) gegen Stufe 2 und (b) das "
               "Endergebnis gegen die Stufen 2–4.\n")
    out.append(_kontext_hinweis())
    out.append("")

    recs = stage5_loop.iter_records()
    first = {}
    for r in recs:
        it = sorted(r["iters"], key=lambda x: x["iteration"])[0]
        first[(r["run"], r["uc_id"])] = it["cls"]
    fc = Counter(first.values())

    p1_2 = _p1(2)["exec_category"].value_counts()
    p1_5 = _p1(5)["exec_category"].value_counts()
    cats = ["PASS", "ASSERTION_FAIL", "INFRA_FAIL", "COMPILE_ERROR",
            "GENERATION_ERROR", "TIMEOUT"]
    rows = []
    for c in cats:
        v2, v5i, v5e = int(p1_2.get(c, 0)), int(fc.get(c, 0)), int(p1_5.get(c, 0))
        if not (v2 or v5i or v5e):
            continue
        rows.append({
            "exec_category": c,
            "Stufe 2": f"{v2} ({C.pct(v2, 500)})",
            "Stufe 5, Iteration 1": f"{v5i} ({C.pct(v5i, 500)})",
            "Δ Iter. 1 − Stufe 2 (pp)": f"{100*(v5i-v2)/500:+.1f}",
            "Stufe 5, Endergebnis": f"{v5e} ({C.pct(v5e, 500)})",
        })
    out.append("**(a) Phase-1-Kategorien**\n")
    out.append(C.md_table(pd.DataFrame(rows)))

    out.append("\nPASS-Rate je UC – Stufe 2 gegen Stufe 5 (Iteration 1) "
               "gegen Stufe 5 (Endergebnis):\n")
    rows = []
    p1_2df, p1_5df = _p1(2), _p1(5)
    for uc in C.UCS:
        n2 = int((p1_2df[p1_2df.uc_id == uc].exec_category == "PASS").sum())
        n5i = sum(1 for (rn, u), c in first.items() if u == uc and c == "PASS")
        n5e = int((p1_5df[p1_5df.uc_id == uc].exec_category == "PASS").sum())
        rows.append({"uc_id": uc, "Stufe 2": f"{2*n2:.0f}%",
                     "Stufe 5 Iter. 1": f"{2*n5i:.0f}%",
                     "Δ (pp)": f"{2*(n5i-n2):+.0f}",
                     "Stufe 5 Ende": f"{2*n5e:.0f}%"})
    out.append(C.md_table(pd.DataFrame(rows)))

    out.append("\n**(b) Judge-Dimensionen: Endergebnis Stufe 5 gegen "
               "Stufen 2–4**\n")
    out.append("Der Judge hat für Stufe 5 die *finale* Spec-Datei bewertet; "
               "für die erste Iteration liegen **keine** Judge-Scores vor "
               "(nur 299 der 500 bewerteten Dateien sind `iter-0`-Dateien; "
               "siehe `stufe_5.md`). Ein Vergleich der Judge-Dimensionen "
               "für die erste Iteration ist mit den vorliegenden Daten "
               "nicht möglich.\n")
    rows = []
    for s in [2, 3, 4, 5]:
        p2 = _p2(s)
        r = {"Stufe": s}
        for d in DIMS:
            v = pd.to_numeric(p2[d], errors="coerce").dropna()
            r[f"{SHORT[d]} Md"] = f"{v.median():.1f}" if len(v) else "–"
            r[f"{SHORT[d]} Ø"] = f"{v.mean():.2f}" if len(v) else "–"
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))

    # Wie viele der Stufe-5-Judge-Dateien sind iter-0?
    import re as _re
    pj = C.load_phase2_json(5)
    it_idx = Counter(int(m.group(1)) if (m := _re.search(r"-iter-(\d+)-", r["file"]))
                     else -1 for r in pj)
    out.append("\nIterationsindex der von Judge bewerteten Stufe-5-Dateien:\n")
    out.append(C.md_table(pd.DataFrame(
        [{"iter-Index": k, "n bewertete Dateien": v, "%": C.pct(v, len(pj))}
         for k, v in sorted(it_idx.items())])))
    return "\n".join(out)


def helper_section() -> str:
    out = ["## 8 Nutzung der Map-Model-Helfer\n"]
    out.append("Quelle: die generierten `*.spec.ts` je Stufe (Stufe 5: die "
               "`final_spec` je Lauf/UC). Gezählt wird das Vorkommen des "
               "jeweiligen Bezeichners im Quelltext (Regex, siehe "
               "`common.py:CODE_PATTERNS`). Prozent = Anteil der 500 Dateien "
               "der Stufe.\n")
    cols = ["__openPioneerMap", "helper_any", "helper_import"] + \
           [f"helper_{f}" for f in C.HELPER_FUNCS]
    rows = []
    for s in STAGES:
        cf = C.code_frame(s)
        r = {"Stufe": s, "Dateien": len(cf)}
        for c in cols:
            n = int((cf[c] > 0).sum())
            r[c] = f"{n} ({C.pct(n, len(cf))})"
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))

    out.append("\nImportpfade der Helferdatei (exakte Zeichenkette im "
               "`from '...'`):\n")
    rows = []
    for s in STAGES:
        cf = C.code_frame(s)
        c = Counter(p for lst in cf["_helper_import_paths"] for p in lst)
        for path, n in c.most_common():
            rows.append({"Stufe": s, "Importpfad": "`" + path + "`", "n Dateien": n})
    out.append(C.md_table(pd.DataFrame(rows)) if rows
               else "- in keiner Stufe wird `map-model-helpers` importiert.")

    out.append("\nHelfernutzung je Stufe und Use Case "
               "(Dateien mit mindestens einem Helferaufruf oder "
               "`__openPioneerMap`):\n")
    rows = []
    for uc in C.UCS:
        r = {"uc_id": uc}
        for s in STAGES:
            cf = C.code_frame(s)
            sub = cf[cf.uc_id == uc]
            n = int(((sub["helper_any"] > 0) | (sub["__openPioneerMap"] > 0)).sum())
            r[f"Stufe {s}"] = f"{n}/{len(sub)}"
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


def main():
    C.OUT_DIR.mkdir(parents=True, exist_ok=True)
    parts = [
        "# Stufenvergleich 1–5",
        "",
        "Alle Zahlen aus den Rohdaten berechnet mit "
        "`src/app/llm/eval_extract/compare.py`. "
        "Grundmenge je Stufe: 500 Dateien (50 Läufe × 10 Use Cases).",
        "",
        exec_matrix(), "",
        dim_matrix(), "",
        pass_matrix_section(), "",
        vacuous_section(), "",
        wanderung_section(), "",
        gegentrend_section(), "",
        stufe5_vs_2(), "",
        helper_section(), "",
    ]
    (C.OUT_DIR / "vergleich.md").write_text("\n".join(parts), encoding="utf-8")
    print(f"[OK] vergleich.md")


if __name__ == "__main__":
    main()
