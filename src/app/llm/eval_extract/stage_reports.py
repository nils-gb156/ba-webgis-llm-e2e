"""Erzeugt docs/eval/stufe_1.md ... stufe_5.md.

Alle Zahlen werden aus den Rohdaten berechnet. Quelle und Filterbedingung
stehen jeweils in der Überschrift bzw. unter der Tabelle.

Aufruf:  python -m eval_extract.stage_reports      (aus src/app/llm/)
"""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict

import numpy as np
import pandas as pd

from . import common as C

DIMS = C.SCORE_DIMS
DIM_SHORT = {d: d.replace("_score", "") for d in DIMS}

# ---------------------------------------------------------------------------
# Textmuster in den Judge-Begründungen (eigene Logik dieses Skripts)
# ---------------------------------------------------------------------------
# Satzweise Auswertung: ein Treffer wird als "negiert" gewertet, wenn im
# selben Satz eines der Negationswörter steht.
NEGATIONS = re.compile(
    r"\b(kein|keine|keinen|keiner|keines|nicht|ohne|statt|weder)\b", re.IGNORECASE)

REASON_PATTERNS: list[tuple[str, str, str]] = [
    ("selektor_erfunden", r"erfund|Erfindung|erfindet",
     "Selektor erfunden / nicht real"),
    ("selektor_existiert_nicht", r"existiert nicht|nicht existent|gibt es nicht",
     "Element existiert nicht"),
    ("importpfad", r"Importpfad|map-model-helpers|Cannot find module|import\w*\s+aus",
     "Importpfad der Helferdatei"),
    ("map_model_zugriff", r"__openPioneerMap|Kartenmodell",
     "Zugriff auf das Kartenmodell"),
    ("helper_erwaehnt", r"\bHelper\b|Helferfunktion|getActiveBaseLayerTitle|"
                        r"isLayerRendered|getMapZoomLevel|getMapCenter|"
                        r"getHighlightedCoordinate",
     "Map-Model-Helfer erwähnt"),
    ("wartebedingung", r"Wartebedingung|waitForTimeout|feste Wartezeit|"
                       r"Wartestrategie|ohne Warten",
     "Wartebedingung"),
    ("assertion_falsches_element", r"falsche[nsr]? Element|falschen Container|"
                                   r"prueft nicht|prüft nicht|falsche[nsr]? Ziel",
     "Assertion prüft falsches Element"),
    ("canvas_statt_modell", r"\bcanvas\b|ol-viewport|map-container",
     "Canvas/map-container statt Kartenmodell"),
    ("nicht_zustandstragend", r"zustandstragend",
     "Zustandstragendes Element (Regel 13)"),
    ("vacuous_tautologisch", r"vacuous|tautolog|trivial|immer erfuellt|"
                             r"immer erfüllt|nicht falsifizierbar",
     "vacuous / tautologische Assertion"),
    ("force_klick", r"force\s*:\s*true|force-Klick|\bforce\b",
     "force:true beim Klick"),
    ("verdeckt_ueberdeckt", r"verdeck|ueberdeck|überdeck|intercept",
     "Element verdeckt / Pointer-Events abgefangen"),
    ("strict_mode", r"strict mode|mehrdeutig|nicht eindeutig",
     "mehrdeutiger Selektor"),
]
_REASON_C = [(k, re.compile(rx, re.IGNORECASE), lbl)
             for k, rx, lbl in REASON_PATTERNS]
_REASON_RX = {k: rx for k, rx, _l in _REASON_C}

_SENT_SPLIT = re.compile(r"(?<=[.;!?])\s+")


def match_reason(text: str) -> dict[str, str]:
    """-> {muster: 'pos'|'neg'} für jedes Muster mit Treffer."""
    out = {}
    sents = _SENT_SPLIT.split(text or "")
    for key, rx, _lbl in _REASON_C:
        hit_pos = hit_neg = False
        for s in sents:
            if rx.search(s):
                if NEGATIONS.search(s):
                    hit_neg = True
                else:
                    hit_pos = True
        if hit_pos:
            out[key] = "pos"
        elif hit_neg:
            out[key] = "neg"
    return out


# ---------------------------------------------------------------------------
# Bestandsaufnahme
# ---------------------------------------------------------------------------

def inventory(stage: int) -> str:
    sd = C.stage_dir(stage)
    rows = []
    for p in sorted(sd.iterdir()):
        if p.is_dir():
            continue
        size_kb = round(p.stat().st_size / 1024, 1)
        kind, shape = "", ""
        if p.suffix == ".csv":
            df = pd.read_csv(p)
            kind = "CSV"
            shape = f"{len(df)} Datenzeilen; Spalten: {', '.join(df.columns)}"
        elif p.name.endswith(".jsonl"):
            n = sum(1 for line in p.open(encoding="utf-8") if line.strip())
            first = json.loads(next(l for l in p.open(encoding="utf-8") if l.strip()))
            kind = "JSONL"
            shape = f"{n} Objekte; Top-Level-Schlüssel: {', '.join(first.keys())}"
        elif p.suffix == ".json":
            try:
                d = json.load(p.open(encoding="utf-8"))
            except Exception as exc:  # pragma: no cover
                kind, shape = "JSON", f"nicht lesbar: {exc}"
            else:
                kind = "JSON"
                if isinstance(d, list):
                    shape = (f"Liste, {len(d)} Objekte; Schlüssel: "
                             f"{', '.join(d[0].keys())}" if d else "leere Liste")
                else:
                    shape = f"Objekt; Schlüssel: {', '.join(list(d.keys())[:12])}"
        elif p.suffix == ".txt":
            kind = "TXT"
            shape = f"{len(p.read_text(encoding='utf-8', errors='replace').splitlines())} Zeilen"
        elif p.suffix == ".png":
            kind = "PNG"
            shape = "Bilddatei"
        rows.append({"Datei": p.name, "Format": kind, "kB": size_kb, "Inhalt": shape})

    run_dirs = sorted(d for d in sd.iterdir() if d.is_dir())
    specs = list(sd.rglob("*.spec.ts"))
    extra = [
        {"Datei": f"run_01 … run_{len(run_dirs):02d}/", "Format": "Verzeichnis",
         "kB": "–",
         "Inhalt": f"{len(run_dirs)} Lauf-Verzeichnisse, insgesamt "
                   f"{len(specs)} *.spec.ts-Dateien"},
    ]
    return C.md_table(pd.DataFrame(rows + extra))


# ---------------------------------------------------------------------------
# Grundmenge
# ---------------------------------------------------------------------------

def grundmenge(stage: int, p1: pd.DataFrame, p2: pd.DataFrame) -> str:
    sd = C.stage_dir(stage)
    lines = []
    have = set(zip(p1["run"], p1["uc_id"]))
    expected = {(r, u) for r in C.RUNS for u in C.UCS}
    missing = sorted(expected - have)
    extra = sorted(have - expected)

    if stage == 5:
        n_specs_disk = len(C.spec_files(5))
        disk_note = (f"{n_specs_disk} final_spec-Dateien auf der Platte auflösbar "
                     f"(alle Iterationsdateien zusammen: "
                     f"{len(list(sd.rglob('*.spec.ts')))})")
    else:
        n_specs_disk = len(C.spec_files(stage))
        disk_note = f"{n_specs_disk} *.spec.ts-Dateien in run_*/"

    p2_have = set(zip(p2["run"], p2["uc_id"]))
    rows = [
        {"Kennzahl": "Läufe (run-Verzeichnisse)", "Wert": len([d for d in sd.iterdir() if d.is_dir()])},
        {"Kennzahl": "Läufe in _phase1_results.csv", "Wert": p1["run"].nunique()},
        {"Kennzahl": "Use Cases in _phase1_results.csv", "Wert": p1["uc_id"].nunique()},
        {"Kennzahl": "Zeilen _phase1_results.csv", "Wert": len(p1)},
        {"Kennzahl": "Soll (50 Läufe × 10 UC)", "Wert": 500},
        {"Kennzahl": "fehlende Lauf/UC-Kombinationen", "Wert": len(missing)},
        {"Kennzahl": "unerwartete Kombinationen", "Wert": len(extra)},
        {"Kennzahl": "Spec-Dateien auf der Platte", "Wert": disk_note},
        {"Kennzahl": "Zeilen _phase2_judge.csv", "Wert": len(p2)},
        {"Kennzahl": "in Phase 2 bewertet (Lauf/UC)", "Wert": len(p2_have)},
        {"Kennzahl": "in Phase 2 ausgelassen", "Wert": len(have - p2_have)},
        {"Kennzahl": "in Phase 2, aber nicht in Phase 1", "Wert": len(p2_have - have)},
    ]
    lines.append(C.md_table(pd.DataFrame(rows)))
    lines.append("")
    if missing:
        lines.append("- fehlende Kombinationen: " +
                     ", ".join(f"{r}/{u}" for r, u in missing))
    else:
        lines.append("- fehlende Kombinationen: keine")
    if have - p2_have:
        lines.append("- in Phase 2 ausgelassen: " +
                     ", ".join(f"{r}/{u}" for r, u in sorted(have - p2_have)))
    else:
        lines.append("- in Phase 2 ausgelassen: keine")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Phase 1
# ---------------------------------------------------------------------------

def phase1_section(stage: int, p1: pd.DataFrame) -> str:
    n = len(p1)
    out = []

    # 1) exec_category
    vc = p1["exec_category"].value_counts()
    order = [c for c in C.EXEC_ORDER if c in vc.index] + \
            [c for c in vc.index if c not in C.EXEC_ORDER]
    rows = [{"exec_category": c, "n": int(vc[c]), "% der Stufengrundmenge": C.pct(int(vc[c]), n)}
            for c in order]
    rows.append({"exec_category": "GESAMT", "n": n, "% der Stufengrundmenge": "100.0%"})
    out.append("### Verteilung `exec_category`\n")
    out.append("Quelle: `_phase1_results.csv`, Spalte `exec_category`, alle Zeilen.\n")
    out.append(C.md_table(pd.DataFrame(rows)))

    # 2) PASS-Rate je UC
    out.append("\n### PASS-Rate je Use Case\n")
    out.append("Quelle: `_phase1_results.csv`; je UC "
               "`sum(exec_category=='PASS') / count()`, n = 50 Läufe.\n")
    rows = []
    for uc in sorted(p1["uc_id"].unique()):
        sub = p1[p1.uc_id == uc]
        npass = int((sub.exec_category == "PASS").sum())
        r = {"uc_id": uc, "n": len(sub), "PASS": npass,
             "PASS-Rate": C.pct(npass, len(sub))}
        for c in C.EXEC_ORDER:
            if (p1.exec_category == c).any():
                r[c] = int((sub.exec_category == c).sum())
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))

    # 3) Streuung über die Läufe
    per_run = p1.groupby("run")["exec_category"].apply(
        lambda s: (s == "PASS").sum() / len(s))
    out.append("\n### Streuung der PASS-Rate über die 50 Läufe\n")
    out.append("Quelle: `_phase1_results.csv`; je Lauf PASS-Anteil über die 10 UC, "
               "dann Kennzahlen über die 50 Läufe. Standardabweichung: "
               "Populations-SD (`ddof=0`).\n")
    rows = [{"Kennzahl": k, "Wert": v} for k, v in [
        ("Min PASS-Rate (Lauf)", f"{per_run.min():.1%} ({', '.join(sorted(per_run[per_run == per_run.min()].index))})"),
        ("Max PASS-Rate (Lauf)", f"{per_run.max():.1%} ({', '.join(sorted(per_run[per_run == per_run.max()].index))})"),
        ("Mittelwert", f"{per_run.mean():.1%}"),
        ("Median", f"{per_run.median():.1%}"),
        ("Standardabweichung (ddof=0)", f"{per_run.std(ddof=0):.4f}"),
    ]]
    out.append(C.md_table(pd.DataFrame(rows)))

    uc_pass = p1.groupby("uc_id")["exec_category"].apply(lambda s: (s == "PASS").sum())
    flip = [uc for uc in uc_pass.index if 0 < uc_pass[uc] < 50]
    always = [uc for uc in uc_pass.index if uc_pass[uc] == 50]
    never = [uc for uc in uc_pass.index if uc_pass[uc] == 0]
    out.append("")
    out.append(f"- Use Cases, die zwischen PASS und Fehlschlag springen "
               f"(0 < PASS < 50): **{len(flip)}** – {', '.join(flip) or '–'}")
    out.append(f"- immer PASS (50/50): {', '.join(always) or '–'}")
    out.append(f"- nie PASS (0/50): {', '.join(never) or '–'}")

    # 4) duration_s
    out.append("\n### `duration_s`\n")
    dur = pd.to_numeric(p1["duration_s"], errors="coerce")
    if dur.notna().sum() == 0:
        out.append("- `duration_s` ist in dieser Stufe für alle Zeilen leer "
                   "(im Loop-Protokoll wird keine Einzelmessung geführt; "
                   "siehe `map_stage5_phase1.py`, Kommentar zu `duration_s`). "
                   "Keine Laufzeitkennzahl berechenbar.")
    else:
        q1, q3 = dur.quantile(0.25), dur.quantile(0.75)
        iqr = q3 - q1
        hi = q3 + 1.5 * iqr
        out.append("Quelle: `_phase1_results.csv`, Spalte `duration_s` "
                   "(Sekunden, Playwright-Ergebnis). Ausreißer: Tukey-Zaun "
                   "`> Q3 + 1.5·IQR`.\n")
        rows = [{"Kennzahl": k, "Wert": v} for k, v in [
            ("n (nicht leer)", int(dur.notna().sum())),
            ("Median", f"{dur.median():.2f} s"),
            ("Mittelwert", f"{dur.mean():.2f} s"),
            ("Min", f"{dur.min():.2f} s"),
            ("Q1", f"{q1:.2f} s"), ("Q3", f"{q3:.2f} s"),
            ("Max", f"{dur.max():.2f} s"),
            ("Ausreißerzaun Q3+1.5·IQR", f"{hi:.2f} s"),
            ("Anzahl über dem Zaun", int((dur > hi).sum())),
        ]]
        out.append(C.md_table(pd.DataFrame(rows)))
        out.append("\nMedian je `exec_category`:\n")
        med = p1.assign(d=dur).groupby("exec_category")["d"].agg(
            ["count", "median", "mean", "max"]).round(2).reset_index()
        med.columns = ["exec_category", "n", "Median s", "Mittelwert s", "Max s"]
        out.append(C.md_table(med))
        top = p1.assign(d=dur).nlargest(10, "d")[
            ["run", "uc_id", "exec_category", "d"]]
        top.columns = ["run", "uc_id", "exec_category", "duration_s"]
        out.append("\n10 längste Läufe:\n")
        out.append(C.md_table(top))

    # 5) error_summary-Gruppen
    out.append("\n### Gruppierte `error_summary`\n")
    fails = p1[p1.exec_category != "PASS"].copy()
    fails["grp"] = fails["error_summary"].map(C.error_group)
    fails["head"] = fails["error_summary"].map(C.error_headline)
    out.append(f"Quelle: `_phase1_results.csv`, Zeilen mit "
               f"`exec_category != 'PASS'` (n = {len(fails)}). Gruppierung "
               f"regelbasiert nach `eval_extract/common.py:ERROR_GROUP_RULES` "
               f"(erste passende Regel gewinnt).\n")
    rows = []
    for g, sub in sorted(fails.groupby("grp"), key=lambda kv: -len(kv[1])):
        ucs = sorted(sub["uc_id"].unique())
        rows.append({"Gruppe": g, "n": len(sub),
                     "% der Fehlschläge": C.pct(len(sub), len(fails)),
                     "% der Stufe": C.pct(len(sub), n),
                     "betroffene UC": ", ".join(ucs)})
    out.append(C.md_table(pd.DataFrame(rows)))

    ct = pd.crosstab(fails["grp"], fails["exec_category"]).reset_index()
    out.append("\nGruppe × `exec_category` (Kontrolle, ob die Gruppierung zur "
               "Klassifikation aus `run_phase1_eval.py` passt):\n")
    out.append(C.md_table(ct))

    out.append("\nHäufigste normalisierte Fehlerköpfe "
               "(erste Fehlerzeile; Zeichenketten → `<s>`, Zahlen → `<n>`):\n")
    rows = []
    for h, cnt in Counter(fails["head"]).most_common(12):
        sub = fails[fails["head"] == h]
        rows.append({"normalisierter Fehlerkopf": "`" + h.replace("|", "\\|") + "`",
                     "n": cnt, "% der Fehlschläge": C.pct(cnt, len(fails)),
                     "UC": ", ".join(sorted(sub["uc_id"].unique()))})
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Phase 2
# ---------------------------------------------------------------------------

def phase2_section(stage: int, p1: pd.DataFrame, p2: pd.DataFrame,
                   pj: list[dict]) -> str:
    out = []
    n = len(p2)

    # 1) Verteilung je Dimension
    out.append("### Verteilung je Bewertungsdimension\n")
    out.append("Quelle: `_phase2_judge.csv`, Spalten `*_score`. `n/a` = "
               "nicht-numerischer Zellwert. Median/Mittelwert nur über die "
               "numerischen Werte.\n")
    rows = []
    for d in DIMS:
        s = p2[d]
        num = pd.to_numeric(s, errors="coerce")
        na = int(num.isna().sum())
        r = {"Dimension": DIM_SHORT[d]}
        for lvl in [1, 2, 3, 4]:
            r[f"{lvl}"] = int((num == lvl).sum())
        r["n/a"] = na
        r["n numerisch"] = int(num.notna().sum())
        r["Median"] = f"{num.median():.1f}" if num.notna().any() else "–"
        r["Mittelwert"] = f"{num.mean():.2f}" if num.notna().any() else "–"
        r["SD (ddof=0)"] = f"{num.std(ddof=0):.2f}" if num.notna().any() else "–"
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))

    # 2) map_interaction: auf welche UC angewandt
    out.append("\n### `map_interaction`: tatsächliche Anwendung\n")
    mi = pd.to_numeric(p2["map_interaction_score"], errors="coerce")
    rows = []
    for uc in sorted(p2["uc_id"].unique()):
        m = p2["uc_id"] == uc
        rows.append({"uc_id": uc, "n": int(m.sum()),
                     "numerisch bewertet": int(mi[m].notna().sum()),
                     "n/a": int(mi[m].isna().sum()),
                     "Mittelwert": f"{mi[m].mean():.2f}" if mi[m].notna().any() else "–"})
    out.append(C.md_table(pd.DataFrame(rows)))
    applied = [r["uc_id"] for r in rows if r["numerisch bewertet"] > 0]
    mixed = [r["uc_id"] for r in rows
             if 0 < r["numerisch bewertet"] < r["n"]]
    out.append("")
    out.append(f"- numerisch bewertet in: {', '.join(applied) or '–'}")
    out.append(f"- durchgehend `n/a` in: "
               f"{', '.join(r['uc_id'] for r in rows if r['numerisch bewertet'] == 0) or '–'}")
    out.append(f"- uneinheitlich (teils Score, teils `n/a`): {', '.join(mixed) or '–'}")

    # 3) Scores je UC × Dimension
    out.append("\n### Scores je Use Case und Dimension\n")
    out.append("Quelle: `_phase2_judge.csv`; je UC Mittelwert und Median über "
               "die 50 Läufe, nur numerische Werte.\n")
    rows = []
    for uc in sorted(p2["uc_id"].unique()):
        sub = p2[p2.uc_id == uc]
        r = {"uc_id": uc, "n": len(sub)}
        for d in DIMS:
            v = pd.to_numeric(sub[d], errors="coerce").dropna()
            r[f"{DIM_SHORT[d]} Ø"] = f"{v.mean():.2f}" if len(v) else "n/a"
            r[f"{DIM_SHORT[d]} Md"] = f"{v.median():.1f}" if len(v) else "n/a"
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))

    # 4) vacuous_pass
    out.append("\n### `vacuous_pass`\n")
    vp = p2["vacuous_pass"].astype(str).str.lower() == "true"
    merged = p1.merge(p2.drop(columns=[c for c in ["exec_category", "passed",
                                                   "iterations_used"]
                                       if c in p2.columns]),
                      on=["stage", "run", "uc_id", "file"], how="left")
    a = pd.to_numeric(merged["assertion_score"], errors="coerce")
    definition = (merged["exec_category"] == "PASS") & (a <= 2)
    flag = merged["vacuous_pass"].astype(str).str.lower() == "true"
    fp = merged[flag & ~definition]      # markiert, erfüllt Definition nicht
    fn = merged[~flag & definition]      # Definition erfüllt, nicht markiert
    rows = [{"Kennzahl": k, "Wert": v} for k, v in [
        ("`vacuous_pass == true` (Judge)", int(vp.sum())),
        ("Anteil an der Stufe", C.pct(int(vp.sum()), n)),
        ("Anteil an den PASS-Fällen",
         C.pct(int((merged[flag].exec_category == "PASS").sum()),
               int((merged.exec_category == "PASS").sum()))),
        ("eigene Nachrechnung: PASS und assertion_score ≤ 2", int(definition.sum())),
        ("markiert, aber Definition nicht erfüllt", len(fp)),
        ("Definition erfüllt, aber nicht markiert", len(fn)),
    ]]
    out.append("Definition laut Aufgabenstellung: Phase 1 = `PASS` **und** "
               "`assertion_score ≤ 2`. Quelle: `_phase1_results.csv` "
               "(`exec_category`) ⋈ `_phase2_judge.csv` "
               "(`assertion_score`, `vacuous_pass`) über "
               "`stage, run, uc_id, file`.\n")
    out.append(C.md_table(pd.DataFrame(rows)))
    if len(fp):
        out.append("\nAbweichung – markiert, Definition nicht erfüllt:\n")
        t = fp[["run", "uc_id", "exec_category", "assertion_score"]].head(30)
        out.append(C.md_table(t))
    if len(fn):
        out.append("\nAbweichung – Definition erfüllt, nicht markiert:\n")
        t = fn[["run", "uc_id", "exec_category", "assertion_score"]].head(30)
        out.append(C.md_table(t))
    if not len(fp) and not len(fn):
        out.append("\n- keine Abweichung zwischen Judge-Flag und Definition.")

    # 5) Begründungsmuster
    out.append("\n### Muster in den Begründungstexten\n")
    out.append("Quelle: `_phase2_judge.json`, Feld `reasoning` (alle vier "
               "Teiltexte zusammengefasst). Regeltabelle: "
               "`eval_extract/stage_reports.py:REASON_PATTERNS`. Ein Treffer "
               "gilt als *negiert*, wenn im selben Satz ein Negationswort "
               "steht (`kein`, `nicht`, `ohne`, `statt`, `weder`).\n")
    hits = defaultdict(lambda: {"pos": 0, "neg": 0})
    examples: dict[str, tuple[str, str]] = {}
    for r in pj:
        txt = " ".join(r.get("reasoning", {}).values())
        m = match_reason(txt)
        for k, v in m.items():
            hits[k][v] += 1
            if v == "pos" and k not in examples:
                sent = next((s for s in _SENT_SPLIT.split(txt)
                             if _REASON_RX[k].search(s)
                             and not NEGATIONS.search(s)), "")
                examples[k] = (r["file"], sent.strip())
    rows = []
    lbl = {k: l for k, _rx, l in REASON_PATTERNS}
    for k, _rx, _l in REASON_PATTERNS:
        h = hits.get(k, {"pos": 0, "neg": 0})
        tot = h["pos"] + h["neg"]
        rows.append({"Muster": k, "Bedeutung": lbl[k],
                     "Dateien gesamt": tot, "davon nicht negiert": h["pos"],
                     "davon negiert": h["neg"],
                     "% der Stufe (nicht negiert)": C.pct(h["pos"], len(pj))})
    out.append(C.md_table(pd.DataFrame(rows).sort_values(
        "davon nicht negiert", ascending=False)))
    out.append("\nJe ein Beispielsatz (nicht negierter Treffer):\n")
    rows = []
    for k, _rx, _l in REASON_PATTERNS:
        if k in examples:
            f, s = examples[k]
            rows.append({"Muster": k, "Datei": "`" + short_path(f) + "`",
                         "Beispielsatz": C.esc(s, 200)})
    out.append(C.md_table(pd.DataFrame(rows)))

    # 6) Auffälligkeiten in der Bewertung
    out.append("\n### Auffälligkeiten in der Bewertung selbst\n")
    out.append(bewertungs_auffaelligkeiten(stage, p2, pj, merged))
    return "\n".join(out)


def short_path(f: str) -> str:
    f = f.replace("\\", "/")
    i = f.find("/tests/")
    return f[i + 1:] if i >= 0 else f


def bewertungs_auffaelligkeiten(stage: int, p2: pd.DataFrame, pj: list[dict],
                                merged: pd.DataFrame) -> str:
    out = []

    # a) identische Begründungen
    rows = []
    for dim in ["coverage", "selector", "map_interaction", "assertion"]:
        texts = [r.get("reasoning", {}).get(dim, "") for r in pj]
        cnt = Counter(texts)
        dupes = {t: c for t, c in cnt.items() if c > 1}
        rows.append({
            "Teiltext": dim,
            "Dateien": len(texts),
            "verschiedene Texte": len(cnt),
            "Texte, die mehrfach vorkommen": len(dupes),
            "Dateien mit einem mehrfach vorkommenden Text": sum(dupes.values()),
            "häufigster Text – Anzahl": max(cnt.values()) if cnt else 0,
        })
    out.append("**Identische Begründungen** (exakter Textvergleich je Teiltext, "
               "Quelle `_phase2_judge.json` → `reasoning.<dim>`):\n")
    out.append(C.md_table(pd.DataFrame(rows)))

    rows = []
    for dim in ["coverage", "selector", "map_interaction", "assertion"]:
        cnt = Counter((r.get("reasoning", {}).get(dim, ""), r["uc_id"]) for r in pj)
        for (t, uc), c in cnt.most_common(3):
            rows.append({"Teiltext": dim, "uc_id": uc, "n Dateien": c,
                         "Text": C.esc(t, 130)})
    out.append("\nDie je Teiltext häufigsten identischen Texte (mit UC):\n")
    out.append(C.md_table(pd.DataFrame(rows)))

    # b) unvollständige Datensätze
    rows = []
    miss_reason = [r for r in pj if not r.get("reasoning")]
    miss_dim = Counter()
    for r in pj:
        for dim in ["coverage", "selector", "map_interaction", "assertion"]:
            if not (r.get("reasoning", {}) or {}).get(dim):
                miss_dim[dim] += 1
    empty_scores = {}
    for d in DIMS:
        empty_scores[d] = int(p2[d].isna().sum())
    rows = [{"Prüfung": k, "Wert": v} for k, v in [
        ("Datensätze in `_phase2_judge.json`", len(pj)),
        ("Datensätze ohne `reasoning`-Objekt", len(miss_reason)),
        ("fehlende Teiltexte (coverage/selector/map_interaction/assertion)",
         ", ".join(f"{k}={v}" for k, v in miss_dim.items()) or "keine"),
        ("leere Score-Zellen in der CSV",
         ", ".join(f"{k}={v}" for k, v in empty_scores.items())),
        ("Score-Werte außerhalb 1–4 oder 'n/a'", anomale_scores(p2)),
        ("CSV/JSON identisch besetzt (gleiche Anzahl Zeilen)",
         "ja" if len(pj) == len(p2) else f"nein ({len(pj)} vs. {len(p2)})"),
    ]]
    out.append("\n**Vollständigkeit:**\n")
    out.append(C.md_table(pd.DataFrame(rows)))

    # c) Widersprüche Score vs. Begründung (regelbasiert)
    out.append("\n**Widersprüche zwischen Score und Begründung** "
               "(regelbasiert, eigene Prüfregeln):\n")
    checks = [
        ("selector ≥ 3, aber Begründung nennt einen erfundenen Selektor "
         "(nicht negiert)", "selector", "selector_score",
         lambda sc: sc >= 3, "selektor_erfunden"),
        ("assertion ≥ 3, aber Begründung nennt eine vacuous/tautologische "
         "Assertion (nicht negiert)", "assertion", "assertion_score",
         lambda sc: sc >= 3, "vacuous_tautologisch"),
        ("coverage = 4, aber Begründung nennt eine Lücke", "coverage",
         "coverage_score", lambda sc: sc == 4, "_luecke"),
    ]
    luecke = re.compile(r"fehlt|nicht abgedeckt|nicht geprueft|nicht geprüft|"
                        r"unvollstaendig|unvollständig|Luecke|Lücke", re.IGNORECASE)
    rows = []
    ex_map: dict[str, str] = {}
    for label, dim, scol, cond, pat in checks:
        cnt = 0
        for r in pj:
            sc = pd.to_numeric(pd.Series([r.get(scol)]), errors="coerce").iloc[0]
            if pd.isna(sc) or not cond(sc):
                continue
            txt = (r.get("reasoning", {}) or {}).get(dim, "")
            if pat == "_luecke":
                hit = any(luecke.search(s) and not NEGATIONS.search(s)
                          for s in _SENT_SPLIT.split(txt))
            else:
                hit = match_reason(txt).get(pat) == "pos"
            if hit:
                cnt += 1
                ex_map.setdefault(label, short_path(r["file"]))
        rows.append({"Prüfregel": label, "n": cnt,
                     "% der Stufe": C.pct(cnt, len(pj)),
                     "Beispiel": "`" + ex_map.get(label, "–") + "`"})
    out.append(C.md_table(pd.DataFrame(rows)))

    # d) Dateien ohne Bewertung
    nosc = merged[merged[DIMS].isna().all(axis=1)] if all(
        d in merged.columns for d in DIMS) else merged.iloc[0:0]
    out.append(f"\n- Zeilen aus Phase 1 ohne jeden Judge-Score nach dem Join: "
               f"**{len(nosc)}**"
               + ("" if not len(nosc) else " – " +
                  ", ".join(f"{r.run}/{r.uc_id}" for r in nosc.itertuples())))
    return "\n".join(out)


def anomale_scores(p2: pd.DataFrame) -> str:
    bad = []
    for d in DIMS:
        for v in p2[d].astype(str).unique():
            v = str(v)
            if v.strip().lower() in {"n/a", "na", "nan"}:
                continue
            try:
                iv = float(v)
            except ValueError:
                bad.append(f"{d}={v!r}")
                continue
            if iv not in (1, 2, 3, 4):
                bad.append(f"{d}={v!r}")
    return ", ".join(sorted(set(bad))) or "keine"


# ---------------------------------------------------------------------------
# Vergleich mit der Referenzimplementierung (write_aggregates aus plot_stage)
# ---------------------------------------------------------------------------

def aggregates_check(stage: int) -> tuple[str, list[str]]:
    """`aggregates.csv` existiert im Repository nicht. Ersatzweise wird die
    Referenzfunktion plot_stage.write_aggregates auf denselben Rohdaten
    ausgeführt und mit der eigenen Rechnung verglichen."""
    import tempfile
    from pathlib import Path as _P
    df = C.load_merged(stage)
    with tempfile.TemporaryDirectory() as td:
        ref_path = _P(td) / "aggregates_ref.csv"
        C.plot_stage.write_aggregates(df, ref_path)
        ref = pd.read_csv(ref_path)
    p1 = C.load_phase1(stage)
    p2 = C.load_phase2_csv(stage)

    diffs: list[str] = []
    rows = []
    for uc in sorted(p1["uc_id"].unique()) + ["GESAMT"]:
        sub1 = p1 if uc == "GESAMT" else p1[p1.uc_id == uc]
        sub2 = p2 if uc == "GESAMT" else p2[p2.uc_id == uc]
        refrow = ref[ref.uc_id == uc]
        if refrow.empty:
            diffs.append(f"Stufe {stage}: `{uc}` fehlt in der Referenzaggregation")
            continue
        refrow = refrow.iloc[0]
        r = {"uc_id": uc}
        # n
        r["n eigen"] = len(sub1)
        r["n Referenz"] = int(refrow["n"])
        if len(sub1) != int(refrow["n"]):
            diffs.append(f"Stufe {stage}/{uc}: n eigen={len(sub1)} vs. Referenz={refrow['n']}")
        # PASS
        own_pass = int((sub1.exec_category == "PASS").sum())
        r["PASS eigen"] = own_pass
        r["PASS Referenz"] = int(refrow["PASS"])
        if own_pass != int(refrow["PASS"]):
            diffs.append(f"Stufe {stage}/{uc}: PASS eigen={own_pass} vs. Referenz={refrow['PASS']}")
        # Mittelwerte je Dimension
        for d in DIMS:
            col = f"{d}_mean"
            if col not in ref.columns:
                continue
            own = pd.to_numeric(sub2[d], errors="coerce").dropna()
            own_m = round(own.mean(), 2) if len(own) else None
            ref_m = refrow[col]
            ref_m = None if (pd.isna(ref_m) or ref_m == "") else round(float(ref_m), 2)
            r[f"{DIM_SHORT[d]} Ø eigen"] = own_m if own_m is not None else "–"
            r[f"{DIM_SHORT[d]} Ø Ref"] = ref_m if ref_m is not None else "–"
            if own_m != ref_m:
                diffs.append(f"Stufe {stage}/{uc}: {col} eigen={own_m} vs. "
                             f"Referenz={ref_m}")
        # vacuous
        own_v = int((sub2["vacuous_pass"].astype(str).str.lower() == "true").sum())
        r["vacuous eigen"] = own_v
        r["vacuous Ref"] = int(refrow["vacuous_pass"])
        if own_v != int(refrow["vacuous_pass"]):
            diffs.append(f"Stufe {stage}/{uc}: vacuous_pass eigen={own_v} vs. "
                         f"Referenz={refrow['vacuous_pass']}")
        rows.append(r)
    return C.md_table(pd.DataFrame(rows)), diffs


# ---------------------------------------------------------------------------
# Bericht je Stufe
# ---------------------------------------------------------------------------

def build_stage_report(stage: int) -> tuple[str, list[str]]:
    p1 = C.load_phase1(stage)
    p2 = C.load_phase2_csv(stage)
    pj = C.load_phase2_json(stage)

    agg_tbl, diffs = aggregates_check(stage)

    parts = [
        f"# {C.STAGE_LABELS[stage]}",
        "",
        f"Datenverzeichnis: `src/app/llm/tests/{C.STAGE_DIRS[stage]}/`  ",
        "Alle Zahlen aus den Rohdaten berechnet mit "
        "`src/app/llm/eval_extract/stage_reports.py`.",
        "",
        "## 1 Bestandsaufnahme",
        "",
        inventory(stage),
        "",
        "## 2 Grundmenge",
        "",
        grundmenge(stage, p1, p2),
        "",
        "## 3 Phase 1",
        "",
        phase1_section(stage, p1),
        "",
        "## 4 Phase 2",
        "",
        phase2_section(stage, p1, p2, pj),
        "",
        "## 5 Abgleich mit der Referenzaggregation",
        "",
        "`plots/aggregates.csv` existiert im Repository nicht (kein "
        "`plots/`-Verzeichnis in keiner Stufe, keine Datei `aggregates.csv` "
        "im Arbeitsbaum). Als Ersatz wird die Referenzfunktion "
        "`plot_stage.write_aggregates()` auf denselben Rohdaten ausgeführt "
        "und Zelle für Zelle mit der eigenen Rechnung verglichen.",
        "",
        agg_tbl,
        "",
        ("- **keine Abweichung** zwischen eigener Rechnung und "
         "`plot_stage.write_aggregates()`." if not diffs else
         "- Abweichungen:\n" + "\n".join(f"  - {d}" for d in diffs)),
        "",
    ]
    if stage == 5:
        from . import stage5_loop
        parts += [stage5_loop.section(), ""]
    return "\n".join(parts), diffs


def main():
    C.OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_diffs = {}
    for stage in [1, 2, 3, 4, 5]:
        txt, diffs = build_stage_report(stage)
        (C.OUT_DIR / f"stufe_{stage}.md").write_text(txt, encoding="utf-8")
        all_diffs[stage] = diffs
        print(f"[OK] stufe_{stage}.md ({len(txt)} Zeichen, "
              f"{len(diffs)} Abweichungen zur Referenzaggregation)")


if __name__ == "__main__":
    main()
