"""Stufe-5-Loop-Analyse; haengt die Abschnitte 5-10 an docs/eval/stufe_5.md an.

Datenquellen:
  * _stage_5_run_summary.json  (Loop-Protokoll, 500 Laeufe, Feld `history`)
  * _stage_5_all_runs.jsonl    (dasselbe in kompakter Form)
  * run_NN/uc-XX-*/uc-XX-iter-K-*.result.json  (vollstaendiger
    Playwright-JSON-Report je Iteration -> vollstaendige Fehlermeldung)
  * run_NN/uc-XX-*/uc-XX-iter-K-*.spec.ts      (generierter Code je Iteration)

Die Fehlerklassifikation je Iteration verwendet exakt dieselbe Logik wie
Phase 1: scan_for_truncation -> collect_test_results/collect_load_errors ->
classify_runtime_result (importiert aus run_phase1_eval.py, siehe common.py).

Aufruf:  python src/app/llm/eval_extract/report_stage5_loop.py
"""

from __future__ import annotations

import difflib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd

import common as c
import notes

MAX_ITER_SOLL = 10

# Rangfolge fuer die Rueckschritt-Erkennung (hoeher = weiter fortgeschritten).
# Begruendung: GENERATION_ERROR/COMPILE_ERROR = Code laeuft gar nicht,
# INFRA_FAIL = Code laeuft, loest aber keinen Wert auf, ASSERTION_FAIL = Wert
# aufgeloest, Erwartung verfehlt, PASS = erfuellt.
CLASS_RANK = {"GENERATION_ERROR": 0, "COMPILE_ERROR": 1, "TIMEOUT": 1,
              "INFRA_FAIL": 2, "ASSERTION_FAIL": 3, "PASS": 4}

CLASS_ORDER = ["PASS", "ASSERTION_FAIL", "INFRA_FAIL", "COMPILE_ERROR",
               "GENERATION_ERROR", "TIMEOUT"]

CACHE = c.OUT_DIR / "stage5_iterations.csv"


# --------------------------------------------------------------------------
# Iterationen einsammeln und klassifizieren
# --------------------------------------------------------------------------

def collect_iterations(force: bool = False) -> pd.DataFrame:
    if CACHE.exists() and not force:
        return pd.read_csv(CACHE)

    summ = c.load_stage5_summary()
    rows = []
    for rec in summ:
        run = rec["run"]
        uc = f"uc-{int(rec['use_case_id']):02d}"
        uc_dir = None
        for h in rec["history"]:
            spec_name = h["spec"]
            if uc_dir is None:
                cands = list((c.stage_dir(5) / run).glob(f"{uc}-*"))
                uc_dir = cands[0] if cands else None
            spec_path = (uc_dir / spec_name) if uc_dir else None
            result_path = (spec_path.with_name(
                spec_name.replace(".spec.ts", ".result.json"))
                if spec_path else None)

            category = None
            needs_review = False
            message = ""
            duration_s = None

            trunc = False
            trunc_reason = ""
            if spec_path and spec_path.exists():
                trunc, trunc_reason, _hard = c.scan_for_truncation(spec_path)

            if result_path and result_path.exists():
                report = json.loads(result_path.read_text(encoding="utf-8"))
                rbf = c.collect_test_results(report)
                lerr = c.collect_load_errors(report)
                if rbf:
                    res = list(rbf.values())[0][-1]
                    category, needs_review = c.classify_runtime_result(
                        res["status"], res["message"])
                    message = res["message"]
                    duration_s = res["duration_s"]
                elif trunc:
                    category, message = "GENERATION_ERROR", trunc_reason
                elif lerr:
                    category, message = "COMPILE_ERROR", list(lerr.values())[0]
                else:
                    category = "TIMEOUT"
                    message = "Kein Testergebnis im Report der Iteration"
                    needs_review = True
                duration_s = duration_s if duration_s is not None else \
                    round(report.get("stats", {}).get("duration", 0) / 1000, 2)
            elif trunc:
                category, message = "GENERATION_ERROR", trunc_reason
            else:
                category = "TIMEOUT"
                message = "Keine result.json zur Iteration gefunden"
                needs_review = True

            spec_text = (spec_path.read_text(encoding="utf-8", errors="replace")
                         if spec_path and spec_path.exists() else "")
            rows.append({
                "run": run, "uc_id": uc, "iteration": h["iteration"],
                "iterations_used": rec["iterations_used"],
                "run_passed": rec["passed"],
                "max_iterations": rec["max_iterations"],
                "loop_passed": h["passed"],
                "loop_error_type": h["error_type"],
                "loop_error_excerpt": h["error_excerpt"],
                "snapshot": h["failure_snapshot_captured"],
                "screenshot": h["failure_screenshot_captured"],
                "spec": h["spec"],
                "spec_exists": bool(spec_path and spec_path.exists()),
                "result_exists": bool(result_path and result_path.exists()),
                "exec_category": category,
                "needs_review": needs_review,
                "message": message[:4000],
                "duration_s": duration_s,
                "n_lines": len(spec_text.splitlines()),
                "n_expect": len(re.findall(r"\bexpect\s*\(|\bexpect\.poll\(", spec_text)),
                "n_chars": len(spec_text),
                "spec_text": spec_text,
            })
    df = pd.DataFrame(rows)
    c.ensure_dirs()
    df.drop(columns=["spec_text"]).to_csv(CACHE, index=False)
    # spec_text separat halten (nur im Speicher / Codeanalyse)
    df.to_pickle(c.OUT_DIR / "stage5_iterations.pkl")
    return df


def load_iterations() -> pd.DataFrame:
    pkl = c.OUT_DIR / "stage5_iterations.pkl"
    if pkl.exists():
        return pd.read_pickle(pkl)
    return collect_iterations(force=True)


# --------------------------------------------------------------------------
# Abschnitt 5: Struktur des Loop-Protokolls
# --------------------------------------------------------------------------

def sec_struktur(it: pd.DataFrame) -> str:
    summ = c.load_stage5_summary()
    jl = c.load_stage5_jsonl()
    top_keys = sorted({k for r in summ for k in r})
    hist_keys = sorted({k for r in summ for h in r["history"] for k in h})
    jl_keys = sorted({k for r in jl for k in r})
    jl_it_keys = sorted({k for r in jl for h in r["iterations"] for k in h})

    out = ["### 5.1 Aufbau der beiden Protokolldateien", "",
           c.md_table(["Datei", "Datensätze", "Felder je Datensatz",
                       "Felder je Iteration"],
                      [["`_stage_5_run_summary.json`", len(summ),
                        ", ".join(f"`{k}`" for k in top_keys),
                        ", ".join(f"`{k}`" for k in hist_keys) + " (in `history`)"],
                       ["`_stage_5_all_runs.jsonl`", len(jl),
                        ", ".join(f"`{k}`" for k in jl_keys),
                        ", ".join(f"`{k}`" for k in jl_it_keys) + " (in `iterations`)"]]),
           "",
           "Die JSONL-Datei enthält je Iteration eine Teilmenge der Felder von "
           "`history` (kein `spec`, kein `failure_snapshot_captured`, kein "
           "`failure_screenshot_captured`). Beide Dateien decken dieselben "
           f"{len(summ)} Läufe und dieselbe Zahl an Iterationen ab "
           f"({sum(len(r['history']) for r in summ)} bzw. "
           f"{sum(len(r['iterations']) for r in jl)}).", ""]

    # Vollständigkeit der Iterationsfelder
    n_it = len(it)
    fails = it[~it.loop_passed.astype(bool)]
    rows = [
        ["Iterationen insgesamt", n_it, "Summe über `history`"],
        ["davon `passed = true`", int(it.loop_passed.astype(bool).sum()),
         "Feld `passed` je Iteration"],
        ["davon `passed = false`", len(fails), "Feld `passed` je Iteration"],
        ["Fehlermeldung vorhanden (`error_excerpt` nicht leer)",
         int((it.loop_error_excerpt.fillna("").str.len() > 0).sum()),
         "Feld `error_excerpt`"],
        ["`error_excerpt` genau 500 Zeichen lang",
         int((it.loop_error_excerpt.fillna("").str.len() == 500).sum()),
         "Feld `error_excerpt` - das Protokoll kürzt auf 500 Zeichen"],
        ["`failure_snapshot_captured = true`", int(it.snapshot.astype(bool).sum()),
         "Feld `failure_snapshot_captured`"],
        ["`failure_screenshot_captured = true`", int(it.screenshot.astype(bool).sum()),
         "Feld `failure_screenshot_captured`"],
        ["Fehlgeschlagene Iterationen OHNE Snapshot",
         int((~fails.snapshot.astype(bool)).sum()),
         "`passed = false` und `failure_snapshot_captured = false`"],
        ["Fehlgeschlagene Iterationen OHNE Screenshot",
         int((~fails.screenshot.astype(bool)).sum()),
         "`passed = false` und `failure_screenshot_captured = false`"],
        ["`*.spec.ts` je Iteration auf der Platte", int(it.spec_exists.sum()),
         "Existenzprüfung des Pfads aus `history[].spec`"],
        ["`*.result.json` je Iteration auf der Platte", int(it.result_exists.sum()),
         "Existenzprüfung des zugehörigen Playwright-Reports"],
        ["`iterations_used` ≠ Länge von `history`",
         int((it.groupby(["run", "uc_id"]).iteration.count()
              != it.groupby(["run", "uc_id"]).iterations_used.first()).sum()),
         "Konsistenzprüfung je Lauf"],
    ]
    out += ["### 5.2 Vollständigkeit der Iterationsdatensätze", "",
            c.md_table(["Prüfung", "Wert", "Quelle / Berechnung"], rows), ""]

    no_snap = fails[~fails.snapshot.astype(bool)]
    if len(no_snap):
        out += ["Fehlgeschlagene Iterationen ohne Snapshot/Screenshot:", "",
                c.md_table(["run", "uc_id", "iteration", "error_type",
                            "eigene Klassifikation"],
                           [[r.run, r.uc_id, r.iteration, r.loop_error_type,
                             r.exec_category] for r in no_snap.itertuples()]), ""]

    # error_type des Protokolls vs. eigene Klassifikation
    ct = pd.crosstab(it.loop_error_type, it.exec_category)
    hdr = ["`error_type` (Protokoll)"] + list(ct.columns) + ["Summe"]
    rows = [[i] + [int(v) for v in r] + [int(r.sum())] for i, r in ct.iterrows()]
    rows.append(["**Summe**"] + [int(ct[col].sum()) for col in ct.columns]
                + [int(ct.values.sum())])
    out += ["### 5.3 `error_type` des Loop-Protokolls gegen die "
            "Phase-1-Klassifikation", "",
            c.md_table(hdr, rows), "",
            "Zeilen: Feld `error_type` aus dem Loop-Protokoll. Spalten: "
            "eigene Klassifikation der Iteration mit "
            "`classify_runtime_result()` aus `run_phase1_eval.py`, angewandt "
            "auf den vollständigen Playwright-Report der Iteration "
            "(`*.result.json`). Das Protokollfeld ist eine eigene, gröbere "
            "Taxonomie und nicht mit den Phase-1-Kategorien identisch.", ""]
    return "\n".join(out)


# --------------------------------------------------------------------------
# Abschnitt 6: Ergebnis
# --------------------------------------------------------------------------

def sec_ergebnis(it: pd.DataFrame, p1: pd.DataFrame) -> str:
    out = []
    n = len(p1)

    vc = p1.exec_category.value_counts()
    rows = [[cat, int(vc.get(cat, 0)), c.pct(int(vc.get(cat, 0)), n)]
            for cat in c.EXEC_ORDER]
    out += ["### 6.1 Endergebnis in den Phase-1-Kategorien", "",
            c.md_table(["Kategorie", "n", "%"], rows), "",
            "Quelle: `_phase1_results.csv` (Endzustand je Lauf/UC).", ""]

    runs = it.groupby(["run", "uc_id"]).agg(
        iterations_used=("iterations_used", "first"),
        passed=("run_passed", "first")).reset_index()
    vc = runs.iterations_used.value_counts().sort_index()
    rows = []
    cum = 0
    for k in range(1, MAX_ITER_SOLL + 1):
        v = int(vc.get(k, 0))
        cum += v
        n_pass = int(((runs.iterations_used == k) & runs.passed.astype(bool)).sum())
        rows.append([k, v, c.pct(v, len(runs)), n_pass, v - n_pass,
                     cum, c.pct(cum, len(runs))])
    out += ["### 6.2 Verteilung `iterations_used`", "",
            c.md_table(["iterations_used", "Läufe", "%", "davon PASS",
                        "davon ohne PASS", "kumuliert", "kumuliert %"], rows),
            "",
            f"`max_iterations` in den Daten: "
            f"{sorted(set(int(x) for x in it.max_iterations.unique()))} "
            f"(Soll 10). Höchster beobachteter Wert von `iterations_used`: "
            f"{int(runs.iterations_used.max())}.", "",
            f"In Iteration 1 bestanden: "
            f"{int(((runs.iterations_used == 1) & runs.passed.astype(bool)).sum())} "
            f"von {len(runs)} Läufen "
            f"({c.pct(int(((runs.iterations_used == 1) & runs.passed.astype(bool)).sum()), len(runs))} %).",
            f"Nach 10 Iterationen ohne PASS abgebrochen: "
            f"{int(((runs.iterations_used == 10) & ~runs.passed.astype(bool)).sum())} "
            f"({c.pct(int(((runs.iterations_used == 10) & ~runs.passed.astype(bool)).sum()), len(runs))} %).",
            f"Insgesamt PASS: {int(runs.passed.astype(bool).sum())} "
            f"({c.pct(int(runs.passed.astype(bool).sum()), len(runs))} %); "
            f"ohne PASS: {int((~runs.passed.astype(bool)).sum())}.", ""]

    # Grenznutzen
    rows = []
    cum_pass = 0
    for k in range(1, MAX_ITER_SOLL + 1):
        new = int(((runs.iterations_used == k) & runs.passed.astype(bool)).sum())
        cum_pass += new
        rows.append([k, new, c.pct(new, len(runs)), cum_pass,
                     c.pct(cum_pass, len(runs))])
    last_gain = max([r[0] for r in rows if r[1] > 0], default=None)
    out += ["### 6.3 Grenznutzen je zusätzlicher Iteration", "",
            c.md_table(["Iteration", "neu bestandene Läufe", "% der 500 Läufe",
                        "kumuliert PASS", "kumulierte PASS-Rate %"], rows), "",
            f"Ein Lauf zählt in der Iteration, in der er bestanden hat "
            f"(`iterations_used` bei `passed = true`). Letzte Iteration mit "
            f"Zugewinn: {last_gain}. "
            + (f"Ab Iteration {last_gain + 1} kommt kein Lauf mehr hinzu."
               if last_gain and last_gain < MAX_ITER_SOLL
               else "Zugewinne treten bis zur letzten Iteration auf."), ""]
    return "\n".join(out)


# --------------------------------------------------------------------------
# Abschnitt 7: Fehlerklassen im Verlauf
# --------------------------------------------------------------------------

def sec_verlauf(it: pd.DataFrame) -> tuple[str, dict]:
    out = []
    digest = {}
    it = it.sort_values(["run", "uc_id", "iteration"])

    # Klasse je Iterationsindex
    ct = pd.crosstab(it.iteration, it.exec_category)
    cols = [x for x in CLASS_ORDER if x in ct.columns]
    rows = [[int(i)] + [int(r.get(x, 0)) for x in cols] + [int(r.sum())]
            for i, r in ct.iterrows()]
    out += ["### 7.1 Fehlerklasse je Iteration", "",
            c.md_table(["Iteration (0-basiert)"] + cols + ["Summe"], rows), "",
            "Klassifikation je Iteration mit `classify_runtime_result()` aus "
            "`run_phase1_eval.py` auf dem vollständigen Playwright-Report der "
            "Iteration (`*.result.json`); Vorschaltung von "
            "`scan_for_truncation()` und `collect_load_errors()` wie in "
            "`run_phase1_eval.main()`.", ""]

    # Sequenzen
    seqs = it.groupby(["run", "uc_id"]).exec_category.apply(list)
    seq_str = seqs.map(lambda s: " → ".join(s))
    vc = seq_str.value_counts()
    rows = [[i + 1, cnt, c.pct(cnt, len(seq_str)), s[:170]]
            for i, (s, cnt) in enumerate(vc.head(20).items())]
    out += ["### 7.2 Häufigste Sequenzmuster der Fehlerklassen", "",
            f"{len(seq_str)} Läufe, {len(vc)} verschiedene Sequenzen. "
            "Die 20 häufigsten:", "",
            c.md_table(["#", "n Läufe", "%", "Sequenz"], rows), ""]
    digest["n_sequences"] = int(len(vc))
    digest["top_sequences"] = [[int(cnt), s] for s, cnt in vc.head(20).items()]

    # komprimierte Sequenzen (Wiederholungen zusammengefasst)
    def compress(s):
        out_ = []
        for x in s:
            if not out_ or out_[-1][0] != x:
                out_.append([x, 1])
            else:
                out_[-1][1] += 1
        return " → ".join(f"{x}×{k}" if k > 1 else x for x, k in out_)
    cvc = seqs.map(compress).value_counts()
    out += ["Komprimierte Sequenzen (unmittelbare Wiederholungen als `×k`), "
            "die 15 häufigsten:", "",
            c.md_table(["n Läufe", "%", "Sequenz"],
                       [[cnt, c.pct(cnt, len(seqs)), s[:170]]
                        for s, cnt in cvc.head(15).items()]), ""]

    # Anteil identischer Folge-Klassen
    pairs = []
    for (run, uc), s in seqs.items():
        for a, b in zip(s, s[1:]):
            pairs.append((run, uc, a, b))
    pdf = pd.DataFrame(pairs, columns=["run", "uc_id", "von", "nach"])
    same = int((pdf.von == pdf.nach).sum())
    out += ["### 7.3 Aufeinanderfolgende Iterationen mit identischer "
            "Fehlerklasse", "",
            c.md_table(["Größe", "Wert"], [
                ["Iterationsübergänge insgesamt", len(pdf)],
                ["davon gleiche Klasse wie zuvor", same],
                ["Anteil", f"{c.pct(same, len(pdf))} %"],
            ]), "",
            "Ein Übergang ist ein Paar (Iteration k → k+1) innerhalb eines "
            "Laufs; PASS-Übergänge sind eingeschlossen.", ""]
    digest["transitions_total"] = len(pdf)
    digest["transitions_same"] = same

    # Übergangsmatrix
    m = pd.crosstab(pdf.von, pdf.nach)
    cols = [x for x in CLASS_ORDER if x in m.columns]
    rows = []
    for i in [x for x in CLASS_ORDER if x in m.index]:
        r = m.loc[i]
        rows.append([i] + [int(r.get(x, 0)) for x in cols] + [int(r.sum())])
    out += ["### 7.4 Übergangsmatrix der Fehlerklassen", "",
            c.md_table(["von \\ nach"] + cols + ["Summe"], rows), "",
            "Zeile = Klasse in Iteration k, Spalte = Klasse in Iteration k+1. "
            "Nur Läufe mit mindestens zwei Iterationen tragen bei.", ""]

    # Behebungsquote
    rows = []
    for i in [x for x in CLASS_ORDER if x in m.index and x != "PASS"]:
        r = m.loc[i]
        tot = int(r.sum())
        to_pass = int(r.get("PASS", 0))
        stay = int(r.get(i, 0))
        other = tot - to_pass - stay
        rows.append([i, tot, to_pass, c.pct(to_pass, tot), stay,
                     c.pct(stay, tot), other, c.pct(other, tot)])
    out += ["### 7.5 Behebungsquote je Fehlerklasse", "",
            c.md_table(["Klasse in Iteration k", "Übergänge", "→ PASS",
                        "→ PASS %", "→ gleiche Klasse", "gleich %",
                        "→ andere Fehlerklasse", "andere %"], rows), "",
            "Behebungsquote = Anteil der Übergänge aus dieser Klasse, die in "
            "der Folgeiteration PASS ergeben. Nenner ist die Zahl der "
            "Übergänge, nicht die Zahl der Läufe: eine Klasse, die in einem "
            "Lauf mehrfach auftritt, wird mehrfach gezählt.", ""]
    digest["repair_rates"] = {r[0]: r[3] for r in rows}

    # Rückschritte
    pdf["rank_von"] = pdf.von.map(CLASS_RANK)
    pdf["rank_nach"] = pdf.nach.map(CLASS_RANK)
    back = pdf[pdf.rank_nach < pdf.rank_von]
    out += ["### 7.6 Rückschritte", "",
            "Rangfolge (höher = weiter fortgeschritten): "
            + ", ".join(f"`{k}` = {v}" for k, v in
                        sorted(CLASS_RANK.items(), key=lambda kv: kv[1]))
            + ". Ein Rückschritt ist ein Übergang mit sinkendem Rang.", "",
            c.md_table(["Größe", "Wert"], [
                ["Rückschritt-Übergänge", len(back)],
                ["Anteil aller Übergänge", f"{c.pct(len(back), len(pdf))} %"],
                ["betroffene Läufe", back.groupby(['run', 'uc_id']).ngroups],
            ]), ""]
    bvc = back.groupby(["von", "nach"]).size().sort_values(ascending=False)
    out += ["Rückschritte nach Art:", "",
            c.md_table(["von", "nach", "n", "betroffene Use Cases (n)"],
                       [[v, na, int(cnt),
                         ", ".join(f"{u}({k})" for u, k in sorted(Counter(
                             back[(back.von == v) & (back.nach == na)].uc_id).items()))]
                        for (v, na), cnt in bvc.items()]), ""]
    ex = back.head(5)
    if len(ex):
        out += ["Beispiele (erste fünf):", "",
                c.md_table(["run", "uc_id", "von", "nach"],
                           [[r.run, r.uc_id, r.von, r.nach] for r in ex.itertuples()]), ""]
    digest["rueckschritte"] = len(back)

    # Terminale Fehlerklasse der abgebrochenen Läufe
    aborted = it[(~it.run_passed.astype(bool))]
    last = aborted.sort_values("iteration").groupby(["run", "uc_id"]).tail(1)
    ct = pd.crosstab(last.uc_id, last.exec_category)
    cols = [x for x in CLASS_ORDER if x in ct.columns]
    rows = []
    for uc in c.UC_IDS:
        if uc in ct.index:
            r = ct.loc[uc]
            rows.append([uc] + [int(r.get(x, 0)) for x in cols] + [int(r.sum())])
        else:
            rows.append([uc] + [0] * len(cols) + [0])
    rows.append(["**Summe**"] + [int(ct[x].sum()) for x in cols]
                + [int(ct.values.sum())])
    out += ["### 7.7 Terminale Fehlerklasse der abgebrochenen Läufe "
            "(zentrale Tabelle)", "",
            c.md_table(["uc_id"] + cols + ["abgebrochene Läufe"], rows), "",
            f"Abgebrochen = `passed = false` im Loop-Protokoll "
            f"({last.groupby(['run', 'uc_id']).ngroups} Läufe). Terminale "
            "Klasse = eigene Klassifikation der letzten Iteration des Laufs.",
            ""]
    # zusätzlich: iterations_used der abgebrochenen Läufe
    au = last.iterations_used.value_counts().sort_index()
    out += ["`iterations_used` der abgebrochenen Läufe: "
            + ", ".join(f"{int(k)} → {int(v)} Läufe" for k, v in au.items()) + ".",
            ""]
    digest["terminal_by_uc"] = {uc: {x: int(ct.loc[uc].get(x, 0)) for x in cols}
                               for uc in ct.index}
    return "\n".join(out), digest


# --------------------------------------------------------------------------
# Abschnitt 8: Was nicht behoben wird
# --------------------------------------------------------------------------

def sec_nicht_behoben(it: pd.DataFrame) -> tuple[str, dict]:
    out = []
    digest = {}
    it = it.sort_values(["run", "uc_id", "iteration"]).copy()
    it["sig"] = it.message.fillna("").map(c.error_signature)

    # Läufe mit über alle 10 Iterationen identischer Fehlermeldung
    full = it[it.iterations_used == 10]
    rows = []
    for (run, uc), g in full.groupby(["run", "uc_id"]):
        if g.sig.nunique() == 1 and len(g) == 10 and not bool(g.run_passed.iloc[0]):
            rows.append([run, uc, g.exec_category.iloc[0], g.sig.iloc[0][:120]])
    out += ["### 8.1 Läufe mit über alle 10 Iterationen identischer "
            "Fehlersignatur", "",
            f"Geprüft wurden die {full.groupby(['run', 'uc_id']).ngroups} Läufe "
            f"mit `iterations_used = 10`. Kriterium: alle 10 Iterationen haben "
            f"dieselbe Fehlersignatur (`common.error_signature`, siehe "
            f"Stufenbericht Abschnitt 3) und der Lauf endet ohne PASS. "
            f"Treffer: {len(rows)} Läufe.", ""]
    if rows:
        out += [c.md_table(["run", "uc_id", "Fehlerklasse",
                            "Fehlersignatur (gekürzt)"], rows), ""]
        ucs = Counter(r[1] for r in rows)
        out += ["Betroffene Use Cases: "
                + ", ".join(f"`{u}` ({k})" for u, k in sorted(ucs.items())), ""]
        out += ["Wörtliche Meldung eines Beispiels (auf 400 Zeichen gekürzt):",
                ""]
        ex_run, ex_uc = rows[0][0], rows[0][1]
        ex_msg = it[(it.run == ex_run) & (it.uc_id == ex_uc)].message.iloc[0]
        out += ["```", f"{ex_run}/{ex_uc}, Iteration 0",
                ex_msg[:400].strip(), "```", ""]
    digest["identisch_10x"] = rows

    # etwas weichere Variante: identische Klasse über alle 10
    same_class = 0
    for (run, uc), g in full.groupby(["run", "uc_id"]):
        if g.exec_category.nunique() == 1 and len(g) == 10:
            same_class += 1
    out += [f"Zum Vergleich: {same_class} der Läufe mit 10 Iterationen tragen "
            f"über alle Iterationen dieselbe *Fehlerklasse* (nicht "
            f"notwendigerweise dieselbe Meldung).", ""]

    # Gruppierung aller Fehlermeldungen; nur in abgebrochenen Läufen
    fails = it[it.exec_category != "PASS"].copy()
    fails["aborted"] = ~fails.run_passed.astype(bool)
    g = fails.groupby("sig").agg(n=("sig", "size"),
                                 n_aborted=("aborted", "sum"),
                                 ucs=("uc_id", lambda s: ", ".join(
                                     f"{u}({k})" for u, k in sorted(Counter(s).items()))))
    g["nur_abgebrochen"] = g.n == g.n_aborted
    g = g.sort_values("n", ascending=False)
    rows = [[int(r.n), int(r.n_aborted), "ja" if r.nur_abgebrochen else "nein",
             i[:130], r.ucs] for i, r in g.head(20).iterrows()]
    out += ["### 8.2 Fehlermeldungsgruppen über alle Iterationen", "",
            f"{len(fails)} fehlgeschlagene Iterationen, {len(g)} Signaturgruppen. "
            f"Davon treten {int(g.nur_abgebrochen.sum())} Gruppen "
            f"ausschließlich in abgebrochenen Läufen auf "
            f"({int(g[g.nur_abgebrochen].n.sum())} Iterationen). "
            "Die 20 häufigsten Gruppen:", "",
            c.md_table(["Iterationen", "davon in abgebrochenen Läufen",
                        "nur in abgebrochenen Läufen", "Signatur",
                        "Use Cases (n)"], rows), ""]
    only = g[g.nur_abgebrochen].sort_values("n", ascending=False)
    if len(only):
        out += ["Gruppen, die ausschließlich in abgebrochenen Läufen auftreten "
                "(die 12 häufigsten):", "",
                c.md_table(["Iterationen", "Signatur", "Use Cases (n)"],
                           [[int(r.n), i[:140], r.ucs]
                            for i, r in only.head(12).iterrows()]), ""]
    digest["n_sig_groups"] = int(len(g))
    digest["n_only_aborted_groups"] = int(g.nur_abgebrochen.sum())

    # Karten-Canvas- und Chakra-Muster
    pats = {
        "Pointer-Events abgefangen (`intercepts pointer events`)":
            r"intercepts pointer events",
        "Element nicht stabil (`element is not stable`)":
            r"element is not stable",
        "Meldung nennt `map-container`": r"map-container",
        "Meldung nennt `canvas` / `.ol-viewport`": r"canvas|ol-viewport",
        "Meldung nennt eine Chakra-Klasse (`chakra-`)": r"chakra-?",
        "Meldung nennt `accessible name`": r"accessible name",
        "`getByRole(...)` nicht gefunden / mehrdeutig":
            r"getByRole\([^\n]*\)[\s\S]{0,400}?(?:element\(s\) not found|strict mode violation)",
    }
    rows = []
    for name, pat in pats.items():
        rx = re.compile(pat, re.IGNORECASE)
        m = fails.message.fillna("").str.contains(rx)
        sub = fails[m]
        n_ab = int(sub.aborted.sum())
        rows.append([name, int(m.sum()), c.pct(int(m.sum()), len(fails)),
                     n_ab, sub.groupby(["run", "uc_id"]).ngroups,
                     ", ".join(f"{u}({k})" for u, k in
                               sorted(Counter(sub.uc_id).items()))])
    out += ["### 8.3 Karten-Canvas- und Chakra-spezifische Fehlerbilder", "",
            c.md_table(["Muster", "Iterationen", "% der Fehl-Iterationen",
                        "davon in abgebrochenen Läufen", "betroffene Läufe",
                        "Use Cases (n)"], rows), "",
            f"Nenner: {len(fails)} fehlgeschlagene Iterationen. Gesucht wird "
            "in der vollständigen Fehlermeldung aus `*.result.json` "
            "(case-insensitive Regex). Die Muster überlappen sich.", ""]
    digest["canvas_chakra"] = {r[0]: r[1] for r in rows}
    return "\n".join(out), digest


# --------------------------------------------------------------------------
# Abschnitt 9: Entwicklung des Codes
# --------------------------------------------------------------------------

def norm_code(t: str) -> str:
    """Normalisiert Code fuer den Aehnlichkeitsvergleich: Kommentare und
    Leerraum entfernen."""
    t = re.sub(r"/\*[\s\S]*?\*/", "", t)
    t = re.sub(r"//[^\n]*", "", t)
    lines = [re.sub(r"\s+", " ", l).strip() for l in t.splitlines()]
    return "\n".join(l for l in lines if l)


def sec_code(it: pd.DataFrame) -> tuple[str, dict]:
    out = []
    digest = {}
    it = it.sort_values(["run", "uc_id", "iteration"])

    recs = []
    for (run, uc), g in it.groupby(["run", "uc_id"]):
        g = g.sort_values("iteration")
        texts = [norm_code(t or "") for t in g.spec_text]
        lines = list(g.n_lines)
        exps = list(g.n_expect)
        for k in range(len(texts) - 1):
            a, b = texts[k], texts[k + 1]
            ratio = difflib.SequenceMatcher(None, a, b).ratio()
            la = a.splitlines()
            lb = b.splitlines()
            sm = difflib.SequenceMatcher(None, la, lb)
            changed = sum(max(i2 - i1, j2 - j1)
                          for tag, i1, i2, j1, j2 in sm.get_opcodes()
                          if tag != "equal")
            recs.append({
                "run": run, "uc_id": uc, "iteration": int(g.iteration.iloc[k]),
                "ratio": ratio, "changed_lines": changed,
                "lines_a": lines[k], "lines_b": lines[k + 1],
                "d_lines": lines[k + 1] - lines[k],
                "exp_a": exps[k], "exp_b": exps[k + 1],
                "d_expect": exps[k + 1] - exps[k],
                "run_passed": bool(g.run_passed.iloc[0]),
            })
    d = pd.DataFrame(recs)
    digest["n_pairs"] = len(d)

    rows = [
        ["Iterationspaare (k → k+1)", len(d)],
        ["Ähnlichkeit (SequenceMatcher) Median", f"{d.ratio.median():.3f}"],
        ["Ähnlichkeit Mittelwert", f"{d.ratio.mean():.3f}"],
        ["Paare mit Ähnlichkeit ≥ 0,95", f"{int((d.ratio >= 0.95).sum())} "
                                         f"({c.pct(int((d.ratio >= 0.95).sum()), len(d))} %)"],
        ["Paare mit Ähnlichkeit ≥ 0,99", f"{int((d.ratio >= 0.99).sum())} "
                                         f"({c.pct(int((d.ratio >= 0.99).sum()), len(d))} %)"],
        ["Paare mit Ähnlichkeit = 1,0 (identischer Code)",
         f"{int((d.ratio >= 0.9999).sum())} "
         f"({c.pct(int((d.ratio >= 0.9999).sum()), len(d))} %)"],
        ["Paare mit Ähnlichkeit < 0,50", f"{int((d.ratio < 0.5).sum())} "
                                         f"({c.pct(int((d.ratio < 0.5).sum()), len(d))} %)"],
        ["geänderte Codezeilen je Paar: Median", f"{d.changed_lines.median():.1f}"],
        ["geänderte Codezeilen je Paar: Mittelwert", f"{d.changed_lines.mean():.1f}"],
        ["Paare mit 0 geänderten Zeilen", int((d.changed_lines == 0).sum())],
    ]
    out += ["### 9.1 Ähnlichkeit aufeinanderfolgender Iterationen", "",
            c.md_table(["Größe", "Wert"], rows), "",
            "Vor dem Vergleich werden Kommentare und Leerraum entfernt "
            "(`norm_code`). Ähnlichkeit = "
            "`difflib.SequenceMatcher(None, a, b).ratio()` auf dem "
            "normalisierten Text; geänderte Zeilen = Summe der nicht-`equal` "
            "Blöcke aus dem zeilenweisen Diff.", ""]

    # nach Ausgang
    grp = d.groupby("run_passed").ratio.agg(["size", "median", "mean"])
    out += ["Aufgeschlüsselt nach Ausgang des Laufs:", "",
            c.md_table(["Lauf endet mit PASS", "Paare", "Median Ähnlichkeit",
                        "Mittelwert"],
                       [["ja" if i else "nein", int(r["size"]),
                         f"{r['median']:.3f}", f"{r['mean']:.3f}"]
                        for i, r in grp.iterrows()]), ""]

    # je Übergangsindex
    grp = d.groupby("iteration").agg(n=("ratio", "size"),
                                     med=("ratio", "median"),
                                     n_high=("ratio", lambda s: int((s >= 0.95).sum())))
    out += ["Je Übergang k → k+1:", "",
            c.md_table(["k", "Paare", "Median Ähnlichkeit", "≥ 0,95", "≥ 0,95 %"],
                       [[int(i), int(r.n), f"{r.med:.3f}", int(r.n_high),
                         c.pct(int(r.n_high), int(r.n))] for i, r in grp.iterrows()]),
            ""]
    digest["ratio_median"] = float(d.ratio.median())
    digest["pct_ge_095"] = float(100.0 * (d.ratio >= 0.95).mean())

    # Länge und Assertions
    first_last = []
    for (run, uc), g in it.groupby(["run", "uc_id"]):
        g = g.sort_values("iteration")
        if len(g) < 2:
            continue
        first_last.append({
            "run": run, "uc_id": uc, "n_iter": len(g),
            "lines_first": int(g.n_lines.iloc[0]), "lines_last": int(g.n_lines.iloc[-1]),
            "exp_first": int(g.n_expect.iloc[0]), "exp_last": int(g.n_expect.iloc[-1]),
            "run_passed": bool(g.run_passed.iloc[0]),
        })
    fl = pd.DataFrame(first_last)
    rows = [
        ["Läufe mit ≥ 2 Iterationen", len(fl)],
        ["Zeilen erste Iteration: Median", f"{fl.lines_first.median():.1f}"],
        ["Zeilen letzte Iteration: Median", f"{fl.lines_last.median():.1f}"],
        ["Läufe mit mehr Zeilen am Ende",
         f"{int((fl.lines_last > fl.lines_first).sum())} "
         f"({c.pct(int((fl.lines_last > fl.lines_first).sum()), len(fl))} %)"],
        ["Läufe mit weniger Zeilen am Ende",
         f"{int((fl.lines_last < fl.lines_first).sum())} "
         f"({c.pct(int((fl.lines_last < fl.lines_first).sum()), len(fl))} %)"],
        ["`expect(`-Aufrufe erste Iteration: Median", f"{fl.exp_first.median():.1f}"],
        ["`expect(`-Aufrufe letzte Iteration: Median", f"{fl.exp_last.median():.1f}"],
        ["Läufe mit mehr Assertions am Ende",
         f"{int((fl.exp_last > fl.exp_first).sum())} "
         f"({c.pct(int((fl.exp_last > fl.exp_first).sum()), len(fl))} %)"],
        ["Läufe mit weniger Assertions am Ende",
         f"{int((fl.exp_last < fl.exp_first).sum())} "
         f"({c.pct(int((fl.exp_last < fl.exp_first).sum()), len(fl))} %)"],
        ["Läufe mit unveränderter Assertionszahl",
         f"{int((fl.exp_last == fl.exp_first).sum())} "
         f"({c.pct(int((fl.exp_last == fl.exp_first).sum()), len(fl))} %)"],
    ]
    out += ["### 9.2 Länge und Assertionszahl über die Iterationen", "",
            c.md_table(["Größe", "Wert"], rows), "",
            "`expect(`-Aufrufe = Treffer der Regex `\\bexpect\\s*\\(|"
            "\\bexpect\\.poll\\(` in der Datei (zählt auch `expect` innerhalb "
            "von Hilfsfunktionen).", ""]

    # nach Ausgang
    sub = fl.groupby("run_passed").agg(
        n=("run", "size"), lf=("lines_first", "median"), ll=("lines_last", "median"),
        ef=("exp_first", "median"), el=("exp_last", "median"),
        weniger=("exp_last", lambda s: 0))
    rows = []
    for flag, g in fl.groupby("run_passed"):
        rows.append(["ja" if flag else "nein", len(g),
                     f"{g.lines_first.median():.1f}", f"{g.lines_last.median():.1f}",
                     f"{g.exp_first.median():.1f}", f"{g.exp_last.median():.1f}",
                     f"{int((g.exp_last < g.exp_first).sum())} "
                     f"({c.pct(int((g.exp_last < g.exp_first).sum()), len(g))} %)"])
    out += ["Aufgeschlüsselt nach Ausgang:", "",
            c.md_table(["PASS", "Läufe", "Zeilen erste (Md)", "Zeilen letzte (Md)",
                        "expect erste (Md)", "expect letzte (Md)",
                        "Läufe mit Assertion-Abbau"], rows), ""]

    # Mittelwerte je Iterationsindex
    grp = it.groupby("iteration").agg(n=("n_lines", "size"),
                                      lines=("n_lines", "median"),
                                      exps=("n_expect", "median"))
    out += ["Median je Iterationsindex (nur die Läufe, die diese Iteration "
            "erreicht haben):", "",
            c.md_table(["Iteration", "n Dateien", "Zeilen (Md)", "`expect(` (Md)"],
                       [[int(i), int(r.n), f"{r.lines:.1f}", f"{r.exps:.1f}"]
                        for i, r in grp.iterrows()]), ""]
    digest["assertion_abbau"] = int((fl.exp_last < fl.exp_first).sum())
    return "\n".join(out), digest


# --------------------------------------------------------------------------
# Abschnitt 10: Aufwand
# --------------------------------------------------------------------------

def sec_aufwand(it: pd.DataFrame) -> str:
    out = []
    # Tokens
    out += ["### 10.1 Protokollierte Größen", "",
            c.md_table(["Größe", "Verfügbarkeit"], [
                ["Token je Generierungsaufruf",
                 "**nicht protokolliert** - weder `_stage_5_run_summary.json`, "
                 "`_stage_5_all_runs.jsonl`, die `*.result.json` noch die "
                 "`*.raw.txt` enthalten ein Feld zu Token-/Usage-Werten; "
                 "`generate_tests_stage_1..5.py` setzen nur `max_tokens` und "
                 "schreiben keine Usage-Daten"],
                ["Wanduhrzeit je Generierungsaufruf",
                 "**nicht protokolliert** - kein Zeitstempel je Iteration in "
                 "den Protokolldateien"],
                ["Ausführungszeit je Iteration (Playwright)",
                 "vorhanden: `*.result.json`, Feld `stats.duration` (ms) bzw. "
                 "`suites[].specs[].tests[].results[].duration`"],
                ["Ausführungszeit je Testdatei Stufen 1-4",
                 "vorhanden: `_phase1_results.csv`, Spalte `duration_s`"],
                ["Ausführungszeit Endergebnis Stufe 5",
                 "**nicht vorhanden** - `duration_s` ist in "
                 "`_phase1_results.csv` der Stufe 5 in allen 500 Zeilen leer"],
            ]), "",
            "Ein Vergleich der *Generierungs*kosten zwischen Stufe 5 und den "
            "Stufen 1-4 ist mit den vorliegenden Daten nicht möglich. "
            "Vergleichbar ist nur die Zahl der Generierungsaufrufe und die "
            "Playwright-Ausführungszeit.", ""]

    # Generierungsaufrufe
    runs = it.groupby(["run", "uc_id"]).agg(
        n_iter=("iteration", "count"), passed=("run_passed", "first"))
    rows = [
        ["Generierungsaufrufe Stufen 1-4 (je Stufe)", "500",
         "eine Generierung je Lauf/UC"],
        ["Generierungsaufrufe Stufe 5", int(runs.n_iter.sum()),
         "Summe der Iterationen über alle 500 Läufe"],
        ["Faktor gegenüber einer Stufe 1-4",
         f"{runs.n_iter.sum() / 500:.2f}", "= Iterationen / 500"],
        ["Iterationen je Lauf: Median", f"{runs.n_iter.median():.1f}", "-"],
        ["Iterationen je Lauf: Mittelwert", f"{runs.n_iter.mean():.2f}", "-"],
        ["Iterationen je Lauf: Mittelwert bei PASS",
         f"{runs[runs.passed.astype(bool)].n_iter.mean():.2f}", "-"],
        ["Iterationen je Lauf: Mittelwert ohne PASS",
         f"{runs[~runs.passed.astype(bool)].n_iter.mean():.2f}", "-"],
    ]
    out += ["### 10.2 Zahl der Generierungsaufrufe", "",
            c.md_table(["Größe", "Wert", "Berechnung"], rows), ""]

    # Playwright-Ausführungszeit
    dur = pd.to_numeric(it.duration_s, errors="coerce")
    if dur.notna().any():
        per_run = it.assign(d=dur).groupby(["run", "uc_id"]).d.sum()
        rows = [
            ["Iterationen mit Zeitwert", int(dur.notna().sum())],
            ["Ausführungszeit je Iteration: Median", f"{dur.median():.2f} s"],
            ["Ausführungszeit je Iteration: Mittelwert", f"{dur.mean():.2f} s"],
            ["Ausführungszeit je Iteration: Maximum", f"{dur.max():.2f} s"],
            ["Ausführungszeit je Lauf (Summe): Median", f"{per_run.median():.2f} s"],
            ["Ausführungszeit je Lauf (Summe): Mittelwert", f"{per_run.mean():.2f} s"],
            ["Ausführungszeit je Lauf (Summe): Maximum", f"{per_run.max():.2f} s"],
            ["Ausführungszeit gesamt (alle Iterationen)",
             f"{dur.sum():.0f} s = {dur.sum() / 3600:.2f} h"],
        ]
        out += ["### 10.3 Playwright-Ausführungszeit der Iterationen", "",
                c.md_table(["Größe", "Wert"], rows), "",
                "Quelle: je Iteration `*.result.json`, "
                "`results[].duration` (ms → s), ersatzweise `stats.duration`.",
                ""]
        # Vergleich mit Stufen 1-4
        rows = []
        for st in [1, 2, 3, 4]:
            p1 = c.load_phase1(st)
            d = pd.to_numeric(p1.duration_s, errors="coerce")
            rows.append([f"Stufe {st}", int(d.notna().sum()), f"{d.median():.2f}",
                         f"{d.mean():.2f}", f"{d.sum():.0f}"])
        rows.append(["Stufe 5 (alle Iterationen)", int(dur.notna().sum()),
                     f"{dur.median():.2f}", f"{dur.mean():.2f}", f"{dur.sum():.0f}"])
        out += ["Vergleich der Ausführungszeiten:", "",
                c.md_table(["Stufe", "n Ausführungen", "Median s", "Mittelwert s",
                            "Summe s"], rows), ""]
    return "\n".join(out)


# --------------------------------------------------------------------------
def main():
    it = load_iterations()
    p1 = c.load_phase1(5)

    parts = [
        "\n## 5 Loop-Protokoll: Struktur\n", sec_struktur(it),
        "\n## 6 Ergebnis des Loops\n", sec_ergebnis(it, p1),
    ]
    t7, d7 = sec_verlauf(it)
    parts += ["\n## 7 Fehlerklassen im Verlauf\n", t7]
    t8, d8 = sec_nicht_behoben(it)
    parts += ["\n## 8 Was nicht behoben wird\n", t8]
    t9, d9 = sec_code(it)
    parts += ["\n## 9 Entwicklung des Codes\n", t9]
    parts += ["\n## 10 Aufwand\n", sec_aufwand(it)]
    parts += ["\n" + notes.md_bullets("11 Auffälligkeiten (Stichpunkte)",
                                      notes.AUFFAELLIG.get(5, [])),
              notes.md_bullets("12 Hypothesen (unbelegt)",
                               notes.HYPOTHESEN.get(5, []))]

    path = c.DOCS_DIR / "stufe_5.md"
    base = path.read_text(encoding="utf-8")
    marker = "\n## 5 Loop-Protokoll: Struktur\n"
    if marker in base:
        base = base.split(marker)[0].rstrip() + "\n"
    path.write_text(base + "\n" + "\n".join(parts).rstrip() + "\n",
                    encoding="utf-8")
    print(f"[erweitert] {path}")
    c.write_json("stage5_loop_digest.json", {"verlauf": d7, "nicht_behoben": d8,
                                             "code": d9})


if __name__ == "__main__":
    main()
