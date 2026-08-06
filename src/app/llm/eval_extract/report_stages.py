"""Erzeugt docs/eval/stufe_1.md ... stufe_5.md (Grundmenge, Phase 1, Phase 2).

Die Stufe-5-spezifischen Loop-Abschnitte haengt report_stage5_loop.py an.

Aufruf:  python src/app/llm/eval_extract/report_stages.py [stufe ...]
"""

from __future__ import annotations

import sys
from collections import Counter

import numpy as np
import pandas as pd

import common as c
import notes


# --------------------------------------------------------------------------
# Bestandsaufnahme
# --------------------------------------------------------------------------

def inventory(stage: int) -> tuple[str, dict]:
    d = c.stage_dir(stage)
    rows = []
    digest = {}
    for f in sorted(d.iterdir()):
        if f.is_dir():
            continue
        size_kb = round(f.stat().st_size / 1024)
        if f.suffix == ".csv":
            df = pd.read_csv(f)
            rows.append([f.name, "CSV", size_kb, len(df),
                         ", ".join(f"`{x}`" for x in df.columns)])
            digest[f.name] = {"rows": len(df), "cols": list(df.columns)}
        elif f.name.endswith(".jsonl"):
            recs = [l for l in f.read_text(encoding="utf-8").splitlines() if l.strip()]
            import json as _j
            keys = sorted({k for r in recs for k in _j.loads(r).keys()})
            rows.append([f.name, "JSONL", size_kb, len(recs),
                         ", ".join(f"`{k}`" for k in keys)])
            digest[f.name] = {"rows": len(recs), "keys": keys}
        elif f.suffix == ".json":
            import json as _j
            obj = _j.loads(f.read_text(encoding="utf-8"))
            if isinstance(obj, list):
                keys = sorted({k for e in obj if isinstance(e, dict) for k in e})
                rows.append([f.name, "JSON (Liste)", size_kb, len(obj),
                             ", ".join(f"`{k}`" for k in keys)])
                digest[f.name] = {"rows": len(obj), "keys": keys}
            else:
                rows.append([f.name, "JSON (Objekt)", size_kb, "-",
                             ", ".join(f"`{k}`" for k in list(obj)[:12])])
        elif f.suffix == ".txt":
            n = len(f.read_text(encoding="utf-8", errors="replace").splitlines())
            rows.append([f.name, "Text", size_kb, n, "(Kontextdatei, kein Datensatz)"])
        elif f.suffix == ".png":
            rows.append([f.name, "PNG", size_kb, "-", "(Screenshot)"])
        else:
            rows.append([f.name, f.suffix or "?", size_kb, "-", ""])

    plots = c.stage_dir(stage) / "plots"
    for f in sorted(plots.iterdir()) if plots.exists() else []:
        size_kb = round(f.stat().st_size / 1024)
        if f.suffix == ".csv":
            df = pd.read_csv(f)
            rows.append([f"plots/{f.name}", "CSV", size_kb, len(df),
                         ", ".join(f"`{x}`" for x in df.columns)])
        else:
            rows.append([f"plots/{f.name}", "PNG", size_kb, "-", "(Diagramm)"])

    n_run_dirs = len([p for p in d.iterdir() if p.is_dir() and p.name.startswith("run_")])
    specs = c.spec_files(stage)
    txt = ["### Dateien im Stufenverzeichnis", "",
           c.md_table(["Datei", "Format", "kB", "Datensätze/Zeilen",
                       "Spalten bzw. Schlüssel"], rows), "",
           "### Verzeichnisse", "",
           c.md_table(["Größe", "Wert"], [
               ["`run_*`-Verzeichnisse", n_run_dirs],
               ["`*.spec.ts`-Dateien (ohne `.exec.spec.ts`)", len(specs)],
           ])]
    digest["n_run_dirs"] = n_run_dirs
    digest["n_spec_files"] = len(specs)
    return "\n".join(txt), digest


# --------------------------------------------------------------------------
# Grundmenge
# --------------------------------------------------------------------------

def grundmenge(stage: int, p1: pd.DataFrame, p2: pd.DataFrame) -> tuple[str, dict]:
    have = set(zip(p1.run, p1.uc_id))
    soll = {(r, u) for r in c.RUN_IDS for u in c.UC_IDS}
    missing = sorted(soll - have)
    extra = sorted(have - soll)

    p2_keys = set(zip(p2.run, p2.uc_id))
    p2_missing = sorted(have - p2_keys)
    p2_extra = sorted(p2_keys - have)

    n_specs = len(c.spec_files(stage))
    rows = [
        ["Testdateien im Verzeichnis (`*.spec.ts`)", n_specs,
         "`rglob('*.spec.ts')` im Stufenordner"],
        ["Zeilen in `_phase1_results.csv`", len(p1), "eine Zeile je Testdatei"],
        ["Läufe (`run`, distinct)", p1.run.nunique(), "`_phase1_results.csv`, Spalte `run`"],
        ["Use Cases (`uc_id`, distinct)", p1.uc_id.nunique(), "`_phase1_results.csv`, Spalte `uc_id`"],
        ["Soll (50 Läufe × 10 UC)", c.SOLL_FILES, "-"],
        ["fehlende Kombinationen Lauf/UC", len(missing), "Sollmenge minus vorhandene `(run, uc_id)`"],
        ["in Phase 2 bewertet (`_phase2_judge.json`)", len(p2), "Anzahl Einträge"],
        ["Phase-1-Zeilen ohne Phase-2-Bewertung", len(p2_missing), "Mengendifferenz `(run, uc_id)`"],
        ["Phase-2-Einträge ohne Phase-1-Zeile", len(p2_extra), "Mengendifferenz `(run, uc_id)`"],
    ]
    txt = [c.md_table(["Größe", "Wert", "Quelle / Berechnung"], rows), ""]
    if missing:
        txt.append("Fehlende Kombinationen namentlich: " +
                   ", ".join(f"`{r}/{u}`" for r, u in missing))
    else:
        txt.append("Fehlende Kombinationen: keine.")
    if p2_missing:
        txt.append("Nicht in Phase 2 bewertet: " +
                   ", ".join(f"`{r}/{u}`" for r, u in p2_missing))
    if extra:
        txt.append("Unerwartete Kombinationen: " +
                   ", ".join(f"`{r}/{u}`" for r, u in extra))

    # Dateien ohne Score-Werte (Phase-2-Eintrag vorhanden, Scores leer)
    no_scores = p2[(p2[["coverage_score_state", "selector_score_state",
                        "assertion_score_state"]] == "missing").all(axis=1)]
    txt.append("")
    txt.append(f"Phase-2-Einträge ohne numerische Scores in coverage/selector/assertion: "
               f"{len(no_scores)}"
               + (" (" + ", ".join(f"`{r.run}/{r.uc_id}` ({r.exec_category})"
                                   for r in no_scores.itertuples()) + ")"
                  if len(no_scores) else ""))
    digest = {"n_specs": n_specs, "n_p1": len(p1), "n_p2": len(p2),
              "missing": missing, "p2_missing": p2_missing,
              "no_scores": [[r.run, r.uc_id, r.exec_category] for r in no_scores.itertuples()]}
    return "\n".join(txt), digest


# --------------------------------------------------------------------------
# Phase 1
# --------------------------------------------------------------------------

def phase1_section(stage: int, p1: pd.DataFrame) -> tuple[str, dict]:
    n = len(p1)
    out = []
    digest = {}

    # 1) exec_category
    vc = p1.exec_category.value_counts()
    rows = [[cat, int(vc.get(cat, 0)), c.pct(int(vc.get(cat, 0)), n)]
            for cat in c.EXEC_ORDER]
    rows.append(["**Summe**", n, c.pct(n, n)])
    out += ["#### Verteilung `exec_category`", "",
            c.md_table(["Kategorie", "n", "% der Stufengrundmenge"], rows),
            "", f"Quelle: `_phase1_results.csv`, Spalte `exec_category`, "
                f"`value_counts()`; Prozent = n / {n}.", ""]
    digest["exec_category"] = {k: int(v) for k, v in vc.items()}

    # 2) PASS-Rate je UC
    rows = []
    for uc in c.UC_IDS:
        sub = p1[p1.uc_id == uc]
        n_uc = len(sub)
        n_pass = int((sub.exec_category == "PASS").sum())
        cats = sub.exec_category.value_counts()
        rows.append([uc, n_uc, n_pass, c.pct(n_pass, n_uc),
                     int(cats.get("ASSERTION_FAIL", 0)),
                     int(cats.get("INFRA_FAIL", 0)),
                     int(cats.get("COMPILE_ERROR", 0)),
                     int(cats.get("GENERATION_ERROR", 0))])
    tot_pass = int((p1.exec_category == "PASS").sum())
    rows.append(["**gesamt**", n, tot_pass, c.pct(tot_pass, n),
                 int((p1.exec_category == "ASSERTION_FAIL").sum()),
                 int((p1.exec_category == "INFRA_FAIL").sum()),
                 int((p1.exec_category == "COMPILE_ERROR").sum()),
                 int((p1.exec_category == "GENERATION_ERROR").sum())])
    out += ["#### PASS-Rate je Use Case", "",
            c.md_table(["uc_id", "n", "PASS", "PASS %", "ASSERTION_FAIL",
                        "INFRA_FAIL", "COMPILE_ERROR", "GENERATION_ERROR"], rows),
            "", "Quelle: `_phase1_results.csv`, Gruppierung nach `uc_id`, "
                "PASS % = PASS / n je UC.", ""]
    digest["pass_rate_uc"] = {uc: round(100.0 * (p1[p1.uc_id == uc].exec_category == "PASS").mean(), 1)
                              for uc in c.UC_IDS}

    # 3) Streuung über die Läufe
    per_run = p1.assign(is_pass=(p1.exec_category == "PASS")).groupby("run").agg(
        n=("is_pass", "size"), n_pass=("is_pass", "sum"))
    per_run["rate"] = 100.0 * per_run.n_pass / per_run.n
    rows = [
        ["Anzahl Läufe", len(per_run)],
        ["PASS-Rate je Lauf: Minimum", f"{per_run.rate.min():.1f} % "
         f"({', '.join(per_run.index[per_run.rate == per_run.rate.min()][:6])})"],
        ["PASS-Rate je Lauf: Maximum", f"{per_run.rate.max():.1f} % "
         f"({', '.join(per_run.index[per_run.rate == per_run.rate.max()][:6])})"],
        ["PASS-Rate je Lauf: Median", f"{per_run.rate.median():.1f} %"],
        ["PASS-Rate je Lauf: Mittelwert", f"{per_run.rate.mean():.1f} %"],
        ["PASS-Rate je Lauf: Standardabweichung (Stichprobe, ddof=1)",
         f"{per_run.rate.std(ddof=1):.2f} Prozentpunkte"],
    ]
    out += ["#### Streuung der PASS-Rate über die Läufe", "",
            c.md_table(["Größe", "Wert"], rows), "",
            "Quelle: `_phase1_results.csv`; je `run` Anteil der Zeilen mit "
            "`exec_category == PASS` (Nenner = Anzahl UC im Lauf), darüber "
            "Min/Max/Median/Mittelwert/Standardabweichung.", ""]
    digest["per_run_rate"] = {"min": per_run.rate.min(), "max": per_run.rate.max(),
                              "std": per_run.rate.std(ddof=1),
                              "median": per_run.rate.median()}

    # Springende UCs
    rows = []
    for uc in c.UC_IDS:
        sub = p1[p1.uc_id == uc]
        r = 100.0 * (sub.exec_category == "PASS").mean()
        if 0 < r < 100:
            fails = sub[sub.exec_category != "PASS"].exec_category.value_counts()
            rows.append([uc, f"{r:.1f}", int((sub.exec_category == "PASS").sum()),
                         len(sub) - int((sub.exec_category == "PASS").sum()),
                         ", ".join(f"{k}: {v}" for k, v in fails.items())])
    stable_pass = [uc for uc in c.UC_IDS
                   if (p1[p1.uc_id == uc].exec_category == "PASS").all()]
    stable_fail = [uc for uc in c.UC_IDS
                   if not (p1[p1.uc_id == uc].exec_category == "PASS").any()]
    out += ["#### Use Cases, die zwischen PASS und Fehlschlag springen", "",
            (c.md_table(["uc_id", "PASS %", "PASS", "Fehlschlag",
                         "Fehlerkategorien der Fehlschläge"], rows)
             if rows else "Keine (alle UC sind über die Läufe eindeutig)"),
            "",
            f"Immer PASS: {', '.join(stable_pass) if stable_pass else 'keine'}. "
            f"Nie PASS: {', '.join(stable_fail) if stable_fail else 'keine'}.",
            "", "Kriterium: 0 % < PASS-Rate < 100 % über die Läufe des UC.", ""]
    digest["springende_ucs"] = [r[0] for r in rows]
    digest["stable_pass"] = stable_pass
    digest["stable_fail"] = stable_fail

    # 4) duration_s
    dur = pd.to_numeric(p1.duration_s, errors="coerce")
    if dur.notna().sum() == 0:
        out += ["#### `duration_s`", "",
                "Spalte `duration_s` ist in dieser Stufe durchgehend leer "
                f"({int(dur.isna().sum())} von {n} Zeilen ohne Wert) - keine "
                "Laufzeitkennzahl berechenbar.", ""]
        digest["duration"] = None
    else:
        q = dur.quantile([0.25, 0.5, 0.75, 0.9, 0.95, 0.99])
        rows = [["n mit Wert", int(dur.notna().sum())],
                ["Minimum", f"{dur.min():.2f}"],
                ["25 %-Quantil", f"{q[0.25]:.2f}"],
                ["Median", f"{dur.median():.2f}"],
                ["Mittelwert", f"{dur.mean():.2f}"],
                ["75 %-Quantil", f"{q[0.75]:.2f}"],
                ["90 %-Quantil", f"{q[0.9]:.2f}"],
                ["95 %-Quantil", f"{q[0.95]:.2f}"],
                ["Maximum", f"{dur.max():.2f}"]]
        out += ["#### `duration_s` (Sekunden)", "",
                c.md_table(["Größe", "Wert"], rows), ""]
        # Median je Kategorie
        med_cat = p1.assign(d=dur).groupby("exec_category").d.agg(["size", "median", "max"])
        out += ["Median je `exec_category`:", "",
                c.md_table(["exec_category", "n", "Median", "Maximum"],
                           [[i, int(r["size"]), f"{r['median']:.2f}", f"{r['max']:.2f}"]
                            for i, r in med_cat.iterrows()]), ""]
        # Ausreißer: > Median + 3*IQR
        iqr = q[0.75] - q[0.25]
        thr = dur.median() + 3 * iqr
        out_rows = p1.assign(d=dur)[dur > thr].sort_values("d", ascending=False)
        n_at_timeout = int((dur >= 30.0).sum())
        n_zero = int((dur == 0.0).sum())
        out += [f"Ausreißer (`duration_s` > Median + 3 × IQR = {thr:.2f} s): "
                f"{len(out_rows)} Zeilen. "
                f"Am Playwright-Testtimeout (`duration_s` ≥ 30,00 s): "
                f"{n_at_timeout} Zeilen ({c.pct(n_at_timeout, n)} %). "
                f"`duration_s` = 0,00 s: {n_zero} Zeilen "
                f"(nicht ausgeführt, i. d. R. GENERATION_ERROR).", ""]
        if len(out_rows):
            out += [c.md_table(["run", "uc_id", "duration_s", "exec_category"],
                               [[r.run, r.uc_id, f"{r.d:.2f}", r.exec_category]
                                for r in out_rows.head(15).itertuples()]),
                    "", "(maximal 15 Zeilen gezeigt)" if len(out_rows) > 15 else "", ""]
        digest["duration"] = {"median": float(dur.median()), "max": float(dur.max()),
                              "n_outlier": int(len(out_rows)), "thr": float(thr)}

    # 5) error_summary Gruppen
    sig = c.group_errors(p1.error_summary)
    fails = p1.assign(sig=sig)[p1.exec_category != "PASS"]
    vc = fails.sig.value_counts()
    rows = []
    for s, cnt in vc.head(15).items():
        sub = fails[fails.sig == s]
        ucs = ", ".join(f"{u}({k})" for u, k in
                        sorted(Counter(sub.uc_id).items()))
        cats = ", ".join(sorted(set(sub.exec_category)))
        rows.append([cnt, c.pct(cnt, len(fails)), s[:150], cats, ucs])
    out += ["#### Gruppierte `error_summary` (nur Zeilen ohne PASS)", "",
            f"Nicht-PASS-Zeilen: {len(fails)}; daraus {len(vc)} Signaturgruppen. "
            "Die 15 häufigsten:", "",
            c.md_table(["n", "% der Fehlschläge", "Signatur", "exec_category",
                        "Use Cases (n)"], rows), "",
            "Gruppierungsregel (`common.error_signature`): ANSI entfernen; "
            "Call-Log-, Code-Frame- und Stacktrace-Zeilen verwerfen; erste "
            "Zeile plus bis zu drei ursachenkonkretisierende Zeilen "
            "(`Error:`, `Locator:`, `Matcher error`, `Received`, "
            "`Expected pattern/string/substring`, `Cannot find module`, "
            "`waiting for`) behalten; Duplikate entfernen; Pfade → `<PATH>`, "
            "gequotete Literale → `<Q>`, Zahlen → `<N>`; auf 200 Zeichen kürzen.",
            ""]
    digest["error_groups"] = [[int(cnt), s] for s, cnt in vc.head(25).items()]
    digest["n_error_groups"] = int(len(vc))

    # needs_review
    nr = p1[p1.needs_review == True]  # noqa: E712
    out += [f"`needs_review = true`: {len(nr)} Zeilen"
            + (" (" + ", ".join(f"`{r.run}/{r.uc_id}` → {r.exec_category}"
                                for r in nr.itertuples()) + ")" if len(nr) else ""),
            ""]
    digest["needs_review"] = [[r.run, r.uc_id, r.exec_category] for r in nr.itertuples()]
    return "\n".join(out), digest


# --------------------------------------------------------------------------
# Phase 2
# --------------------------------------------------------------------------

def phase2_section(stage: int, p1: pd.DataFrame, p2: pd.DataFrame) -> tuple[str, dict]:
    out = []
    digest = {}
    n = len(p2)

    # 1) je Dimension
    rows = []
    for dim in c.SCORE_DIMS:
        s = p2[dim]
        st = p2[dim + "_state"]
        n_na_literal = int((st == "n/a").sum())
        n_missing = int((st == "missing").sum())
        counts = s.value_counts()
        rows.append([
            c.DIM_SHORT[dim],
            *[int(counts.get(float(k), 0)) for k in (1, 2, 3, 4)],
            int(s.notna().sum()),
            f"{s.median():.1f}" if s.notna().any() else "-",
            f"{s.mean():.2f}" if s.notna().any() else "-",
            f"{s.std(ddof=1):.2f}" if s.notna().sum() > 1 else "-",
            n_na_literal, n_missing,
        ])
    out += ["#### Score-Verteilung je Dimension", "",
            c.md_table(["Dimension", "1", "2", "3", "4", "n numerisch",
                        "Median", "Mittelwert", "Std (ddof=1)", "`n/a`",
                        "Wert fehlt"], rows), "",
            f"Quelle: `_phase2_judge.json` ({n} Einträge). `n/a` = literaler "
            "Wert `\"n/a\"`; \"Wert fehlt\" = Schlüssel `null`/nicht gesetzt. "
            "Median/Mittelwert nur über numerische Werte.", ""]
    digest["dims"] = {c.DIM_SHORT[d]: {
        "median": None if p2[d].isna().all() else float(p2[d].median()),
        "mean": None if p2[d].isna().all() else float(p2[d].mean()),
        "counts": {int(k): int(v) for k, v in p2[d].value_counts().items()},
        "n_na": int((p2[d + "_state"] == "n/a").sum()),
        "n_missing": int((p2[d + "_state"] == "missing").sum()),
    } for d in c.SCORE_DIMS}

    # 2) map_interaction: auf welche UC angewandt
    rows = []
    for uc in c.UC_IDS:
        sub = p2[p2.uc_id == uc]
        st = sub["map_interaction_score_state"]
        n_num = int((st == "num").sum())
        n_na = int((st == "n/a").sum())
        n_miss = int((st == "missing").sum())
        rows.append([uc, "ja" if uc in c.MAP_UCS else "nein", len(sub), n_num,
                     n_na, n_miss,
                     f"{sub.map_interaction_score.median():.1f}" if n_num else "-",
                     f"{sub.map_interaction_score.mean():.2f}" if n_num else "-"])
    out += ["#### `map_interaction`: tatsächlicher Anwendungsbereich", "",
            c.md_table(["uc_id", "in MAP_UCS (Prompt)", "n", "numerisch bewertet",
                        "`n/a`", "Wert fehlt", "Median", "Mittelwert"], rows), "",
            "`MAP_UCS` laut `phase2_judge_prompt.md` Zeile 16: "
            + ", ".join(f"`{u}`" for u in c.MAP_UCS) + ".", ""]
    inconsistent = [r[0] for r in rows
                    if (r[1] == "ja" and r[3] == 0) or (r[1] == "nein" and r[3] > 0)]
    out += [("Abweichung Prompt ↔ Daten: " + ", ".join(inconsistent))
            if inconsistent else
            "Keine Abweichung: numerisch bewertet wurden genau die MAP_UCS.", ""]
    digest["map_interaction_inconsistent"] = inconsistent

    # 3) Scores je UC und Dimension
    rows = []
    for uc in c.UC_IDS:
        sub = p2[p2.uc_id == uc]
        r = [uc, len(sub)]
        for dim in c.SCORE_DIMS:
            s = sub[dim]
            if s.notna().any():
                r += [f"{s.median():.1f}", f"{s.mean():.2f}", f"{s.std(ddof=1):.2f}"
                      if s.notna().sum() > 1 else "-"]
            else:
                r += ["n/a", "n/a", "-"]
        rows.append(r)
    hdr = ["uc_id", "n"]
    for dim in c.SCORE_DIMS:
        short = c.DIM_SHORT[dim]
        hdr += [f"{short} Md", f"{short} Ø", f"{short} σ"]
    out += ["#### Scores je Use Case und Dimension", "",
            c.md_table(hdr, rows), "",
            "Md = Median, Ø = Mittelwert, σ = Standardabweichung (ddof=1), "
            "jeweils nur über numerische Werte.", ""]
    digest["scores_by_uc"] = {uc: {c.DIM_SHORT[d]: (
        None if p2[p2.uc_id == uc][d].isna().all() else float(p2[p2.uc_id == uc][d].mean()))
        for d in c.SCORE_DIMS} for uc in c.UC_IDS}

    # 4) vacuous_pass
    vp = p2.vacuous_pass.astype(bool)
    # Definition laut Prompt: exec_category == PASS UND assertion_score <= 2
    # Prüfung gegen exec_category aus Phase 1 (verbindliche Quelle) und aus Phase 2
    merged = p2.merge(p1[["run", "uc_id", "exec_category"]], on=["run", "uc_id"],
                      how="left", suffixes=("_p2", "_p1"))
    exp = ((merged.exec_category_p1 == "PASS") & (merged.assertion_score <= 2))
    mism = merged[vp.values != exp.values]
    raw_types = ", ".join(sorted({type(v).__name__ for v in p2.vacuous_pass_raw}))
    rows = [[f"`vacuous_pass = true` laut Datei (Rohtyp: {raw_types})",
             int(vp.sum()), c.pct(int(vp.sum()), n)],
            ["nach Definition erwartet (Phase-1-PASS und assertion ≤ 2)",
             int(exp.sum()), c.pct(int(exp.sum()), n)],
            ["Abweichungen", len(mism), c.pct(len(mism), n)]]
    out += ["#### `vacuous_pass`", "",
            c.md_table(["Größe", "n", "% der Stufengrundmenge"], rows), ""]
    if len(mism):
        out += [c.md_table(["run", "uc_id", "exec_category (Phase 1)",
                            "exec_category (Phase 2)", "assertion_score",
                            "vacuous_pass laut Datei", "erwartet"],
                           [[r.run, r.uc_id, r.exec_category_p1, r.exec_category_p2,
                             r.assertion_score, r.vacuous_pass, bool(e)]
                            for r, e in zip(mism.itertuples(), exp[vp.values != exp.values])]),
                ""]
    # vacuous_pass je UC
    vp_uc = p2.assign(vp=vp).groupby("uc_id").vp.agg(["size", "sum"])
    out += ["`vacuous_pass` je Use Case:", "",
            c.md_table(["uc_id", "n", "vacuous_pass", "%"],
                       [[i, int(r["size"]), int(r["sum"]),
                         c.pct(int(r["sum"]), int(r["size"]))]
                        for i, r in vp_uc.iterrows()]), ""]
    digest["vacuous_pass"] = {"n": int(vp.sum()), "expected": int(exp.sum()),
                              "mismatch": len(mism),
                              "by_uc": {i: int(r["sum"]) for i, r in vp_uc.iterrows()}}

    # 5) Reasoning-Muster
    pats = c.count_reasoning_patterns(p2)
    rows = []
    for name, v in sorted(pats.items(), key=lambda kv: -kv[1]["n_files"]):
        ex = v["example"]
        rows.append([name, v["n_files"], v["pct"],
                     ", ".join(f"{k}: {n2}" for k, n2 in v["per_dim"].items() if n2),
                     f"`{ex['file'].split('/tests/')[-1]}`" if ex else "-"])
    out += ["#### Wiederkehrende Muster in den Judge-Begründungen", "",
            c.md_table(["Muster", "Dateien", "% der Stufe", "Treffer je Dimension",
                        "Beispieldatei"], rows), "",
            "Zählweise: Regex-Suche (case-insensitive) über die vier "
            "`reasoning`-Texte je Eintrag in `_phase2_judge.json`; eine Datei "
            "zählt einmal, wenn mindestens eine Dimension trifft. Die "
            "Regex-Definitionen stehen in "
            "`src/app/llm/eval_extract/common.py` (`REASONING_PATTERNS`).", ""]
    digest["reasoning_patterns"] = {k: v["n_files"] for k, v in pats.items()}
    digest["reasoning_examples"] = {k: (v["example"]["file"] if v["example"] else None)
                                   for k, v in pats.items()}

    # 6) Auffälligkeiten in der Bewertung selbst
    out += ["#### Auffälligkeiten in der Bewertung selbst", ""]
    an_rows = []
    # identische Begründungen
    for dim in c.DIM_SHORT.values():
        col = p2["r_" + dim].fillna("")
        vc = col[col.str.len() > 0].value_counts()
        top = vc.head(1)
        n_dup = int((vc > 1).sum())
        n_files_dup = int(vc[vc > 1].sum())
        an_rows.append([f"identische `{dim}`-Begründung",
                        f"{n_dup} Textvarianten betreffen {n_files_dup} Dateien; "
                        f"häufigster Text {int(top.iloc[0])}×"])
    # unvollständige Datensätze
    inc = p2[p2["_reasoning_keys"] != "assertion,coverage,map_interaction,selector"]
    an_rows.append(["Einträge ohne alle vier `reasoning`-Schlüssel", str(len(inc))])
    miss_any = p2[(p2[["coverage_score_state", "selector_score_state",
                       "assertion_score_state"]] == "missing").any(axis=1)]
    an_rows.append(["Einträge mit fehlendem Score in coverage/selector/assertion",
                    f"{len(miss_any)}"
                    + (f" (exec_category: " + ", ".join(
                        f"{k}: {v}" for k, v in
                        miss_any.exec_category.value_counts().items()) + ")"
                       if len(miss_any) else "")])
    miss_mi = p2[p2["map_interaction_score_state"] == "missing"]
    an_rows.append(["Einträge mit fehlendem `map_interaction_score` "
                    "(weder Zahl noch `n/a`)",
                    f"{len(miss_mi)}"
                    + (" (" + ", ".join(f"`{r.run}/{r.uc_id}`"
                                        for r in miss_mi.itertuples()) + ")"
                       if len(miss_mi) else "")])
    # Widersprüche
    contra = {}
    sel_bad = p2["r_selector"].fillna("").map(c.strip_negations).str.contains(
        r"erfunden|existiert (?:in der App )?(?:jedoch )?nicht|halluziniert",
        case=False, regex=True)
    contra["selector_score ≥ 3 trotz Begründung „erfunden/existiert nicht“"] = \
        p2[(p2.selector_score >= 3) & sel_bad]
    ass_triv = p2["r_assertion"].fillna("").map(c.strip_negations).str.contains(
        r"trivial|beweist nichts|kann nicht fehlschlagen|(?:immer|stets) (?:wahr|erfuellt)",
        case=False, regex=True)
    contra["assertion_score ≥ 3 trotz Begründung „trivial/beweist nichts“"] = \
        p2[(p2.assertion_score >= 3) & ass_triv]
    cov_gap = p2["r_coverage"].fillna("").map(c.strip_negations).str.contains(
        r"fehlt|nicht abgedeckt|unvollstaendig", case=False, regex=True)
    contra["coverage_score = 4 trotz Begründung „fehlt/unvollständig“"] = \
        p2[(p2.coverage_score == 4) & cov_gap]
    mi_none = p2["r_map_interaction"].fillna("").map(c.strip_negations).str.contains(
        r"kein(?:e)? kartenspezifische|kein Zugriff|weder", case=False, regex=True)
    contra["map_interaction ≥ 3 trotz Begründung „keine kartenspezifische Prüfung“"] = \
        p2[(p2.map_interaction_score >= 3) & mi_none]
    for k, v in contra.items():
        ex = (f"`{v.iloc[0]['file'].split('/tests/')[-1]}`" if len(v) else "-")
        an_rows.append([k, f"{len(v)} Dateien; Beispiel: {ex}"])
    out += [c.md_table(["Prüfung", "Befund"], an_rows), ""]
    digest["bewertungs_auffaelligkeiten"] = {k: len(v) for k, v in contra.items()}
    digest["incomplete_reasoning"] = len(inc)

    # identische Begründungen: Top-Texte
    dup_rows = []
    for dim in c.DIM_SHORT.values():
        col = p2["r_" + dim].fillna("")
        vc = col[col.str.len() > 0].value_counts()
        for text, cnt in vc.head(2).items():
            if cnt > 1:
                ucs = sorted(set(p2[col == text].uc_id))
                dup_rows.append([dim, cnt, ", ".join(ucs), text[:170]])
    if dup_rows:
        out += ["Häufigste wörtlich identische Begründungstexte:", "",
                c.md_table(["Dimension", "n Dateien", "Use Cases", "Text (gekürzt)"],
                           dup_rows), ""]
    return "\n".join(out), digest


# --------------------------------------------------------------------------
def build(stage: int) -> dict:
    p1 = c.load_phase1(stage)
    p2 = c.load_phase2(stage)

    inv_txt, inv_d = inventory(stage)
    gm_txt, gm_d = grundmenge(stage, p1, p2)
    p1_txt, p1_d = phase1_section(stage, p1)
    p2_txt, p2_d = phase2_section(stage, p1, p2)

    doc = [
        f"# Stufe {stage} - Auswertung",
        "",
        f"Stufenverzeichnis: `src/app/llm/tests/{c.STAGE_DIRS[stage]}/`  ",
        f"Bezeichnung: {c.STAGE_LABELS[stage]}  ",
        "Erzeugt von: `src/app/llm/eval_extract/report_stages.py` "
        "(Rohdaten: `_phase1_results.csv`, `_phase2_judge.json`).",
        "",
        "## 1 Bestandsaufnahme", "", inv_txt, "",
        "## 2 Grundmenge", "", gm_txt, "",
        "## 3 Phase 1 (Ausführung)", "", p1_txt, "",
        "## 4 Phase 2 (Judge-Bewertung)", "", p2_txt, "",
    ]
    # Fuer Stufe 5 haengt report_stage5_loop.py die Abschnitte 5-10 an; die
    # Stichpunkte kommen dort ganz am Ende.
    if stage != 5:
        doc += [
            notes.md_bullets("5 Auffälligkeiten (Stichpunkte)",
                             notes.AUFFAELLIG.get(stage, [])),
            notes.md_bullets("6 Hypothesen (unbelegt)",
                             notes.HYPOTHESEN.get(stage, [])),
        ]
    c.write_doc(f"stufe_{stage}.md", "\n".join(doc))
    digest = {"inventory": inv_d, "grundmenge": gm_d, "phase1": p1_d, "phase2": p2_d}
    c.write_json(f"stage_{stage}_digest.json", digest)
    return digest


if __name__ == "__main__":
    stages = [int(a) for a in sys.argv[1:]] or [1, 2, 3, 4, 5]
    for s in stages:
        print(f"=== Stufe {s}")
        build(s)
