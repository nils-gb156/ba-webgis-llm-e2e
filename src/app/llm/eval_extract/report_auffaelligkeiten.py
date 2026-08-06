"""Erzeugt docs/eval/auffaelligkeiten.md (Schritte A bis E).

Schritt A  auffaellige Zellen der PASS-Raten-Matrix UC x Stufe
Schritt B  Fehlermeldungsgruppen dieser Zellen
Schritt C  Stichprobe von 5 Testdateien je Zelle, Codeskelett
Schritt D  Verweis auf die stufenweite Auszaehlung (report_patterns.py)
Schritt E  Steckbrief je Zelle

Aufruf:  python src/app/llm/eval_extract/report_auffaelligkeiten.py
"""

from __future__ import annotations

import json
import re
from collections import Counter

import pandas as pd

import common as c
import notes

STAGES = [1, 2, 3, 4, 5]
N_SAMPLE = 5


# --------------------------------------------------------------------------
# Schritt A
# --------------------------------------------------------------------------

def pass_matrix(p1: dict) -> pd.DataFrame:
    rows = {}
    for uc in c.UC_IDS:
        rows[uc] = {s: 100.0 * (p1[s][p1[s].uc_id == uc].exec_category == "PASS").mean()
                    for s in STAGES}
    return pd.DataFrame(rows).T[STAGES]


def find_cells(m: pd.DataFrame, trend: dict) -> list[dict]:
    """Bestimmt auffaellige Zellen nach drei expliziten Regeln."""
    cands = {}

    def add(uc, stage, kind, reason, score):
        key = (uc, stage)
        if key not in cands or cands[key]["score"] < score:
            cands[key] = {"uc": uc, "stage": stage, "kind": kind,
                          "reason": reason, "score": score}
        else:
            cands[key]["reason"] += "; " + reason

    # Regel 1: Sprung gegen den Stufentrend (Abweichung der Zelldifferenz von
    # der Differenz der Gesamt-PASS-Rate)
    for uc in m.index:
        for i in range(len(STAGES) - 1):
            a, b = STAGES[i], STAGES[i + 1]
            d_uc = m.loc[uc, b] - m.loc[uc, a]
            d_all = trend[b] - trend[a]
            dev = d_uc - d_all
            if abs(dev) >= 25:
                add(uc, b, "Sprung",
                    f"PASS-Rate {m.loc[uc, a]:.0f} % → {m.loc[uc, b]:.0f} % "
                    f"({d_uc:+.0f} pp) gegenüber Stufentrend {d_all:+.1f} pp, "
                    f"Abweichung {dev:+.0f} pp",
                    abs(dev))

    # Regel 2: mehr Kontext ohne Verbesserung (Stufe 4 nicht besser als Stufe 1)
    for uc in m.index:
        d = m.loc[uc, 4] - m.loc[uc, 1]
        if d <= 0:
            add(uc, 4, "kein Kontextnutzen",
                f"Stufe 1 = {m.loc[uc, 1]:.0f} %, Stufe 4 = {m.loc[uc, 4]:.0f} % "
                f"({d:+.0f} pp), obwohl der Stufentrend "
                f"{trend[4] - trend[1]:+.1f} pp beträgt",
                abs(d) + 20)

    # Regel 3: Extremwerte je Stufe (0 % bzw. 100 %)
    for uc in m.index:
        for s in STAGES:
            v = m.loc[uc, s]
            if v == 0.0:
                add(uc, s, "Null-Zelle",
                    f"0 % PASS in Stufe {s} bei Stufen-PASS-Rate {trend[s]:.1f} %",
                    trend[s])
            elif v == 100.0 and s <= 4:
                add(uc, s, "Voll-Zelle",
                    f"100 % PASS in Stufe {s} bei Stufen-PASS-Rate {trend[s]:.1f} %",
                    100 - trend[s])

    out = sorted(cands.values(), key=lambda d: -d["score"])
    return out


# --------------------------------------------------------------------------
# Schritt C: Codeskelett
# --------------------------------------------------------------------------

LOCATOR_CALL = re.compile(
    r"(getByTestId|getByRole|getByText|getByLabel(?:Text)?|getByPlaceholder|"
    r"locator|getByTitle|getByAltText)\(([^\n]{0,120})")
ACTION = re.compile(
    r"\.(click|dblclick|fill|check|uncheck|hover|press|selectOption|type|"
    r"setInputFiles|dragTo|tap)\(")
MOUSE = re.compile(r"page\.mouse\.(move|down|up|click|wheel)\(")
EXPECT_LINE = re.compile(r"(expect(?:\.poll)?\s*\([^\n]{0,110})")
HELPER = re.compile(r"(" + "|".join(c.HELPER_FUNCS) + r")\(")


def skeleton(text: str, max_items: int = 14) -> list[str]:
    """Deterministische Kurzform: geordnete Liste der Locator-Definitionen,
    Interaktionen und Assertions einer Testdatei."""
    items = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("//") or line.startswith("*"):
            continue
        tags = []
        for m in LOCATOR_CALL.finditer(line):
            tags.append(f"{m.group(1)}({m.group(2).split(')')[0]})")
        if ACTION.search(line):
            act = "ACTION:" + ACTION.search(line).group(1)
            if re.search(r"force:\s*true", line):
                act += "{force:true}"
            tags.append(act)
        if MOUSE.search(line):
            tags.append("MOUSE:" + MOUSE.search(line).group(1))
        for m in HELPER.finditer(line):
            tags.append("HELPER:" + m.group(1))
        em = EXPECT_LINE.search(line)
        if em:
            tags.append("ASSERT:" + re.sub(r"\s+", " ", em.group(1))[:90])
        if "page.goto" in line:
            tags.append("goto")
        if "waitForTimeout" in line:
            tags.append("waitForTimeout")
        if "page.evaluate" in line:
            tags.append("page.evaluate")
        if tags:
            items.append(" | ".join(tags))
        if len(items) >= max_items:
            items.append("… (gekürzt)")
            break
    return items


# --------------------------------------------------------------------------
def main():
    p1 = {s: c.load_phase1(s) for s in STAGES}
    p2 = {s: c.load_phase2(s) for s in STAGES}
    code = {s: c.scan_code(s) for s in [1, 2, 3, 4]}
    # Fuer Stufe 5 ist in _phase1_results.csv die FINALE Iteration je Lauf
    # eingetragen (Spalte `file`). Die Stichprobe muss denselben Stand zeigen,
    # daher wird der Code ueber den Dateinamen aufgeloest.
    code5 = c.scan_code(5).sort_values(["run", "uc_id", "iteration"])
    code5["basename"] = code5.file.map(lambda f: f.rsplit("/", 1)[-1])
    code[5] = code5

    m = pass_matrix(p1)
    trend = {s: 100.0 * (p1[s].exec_category == "PASS").mean() for s in STAGES}
    cells = find_cells(m, trend)[:10]

    out = ["# Auffälligkeiten mit Beleg (Schritte A bis E)", "",
           "Erzeugt von `src/app/llm/eval_extract/report_auffaelligkeiten.py`. "
           "Grundlage: PASS-Raten-Matrix aus `_phase1_results.csv` aller "
           "Stufen, Fehlermeldungsgruppen aus der Spalte `error_summary`, "
           "Codestichproben aus den generierten `*.spec.ts`-Dateien.", ""]

    # ---- Schritt A
    rows = []
    for uc in m.index:
        rows.append([uc] + [f"{m.loc[uc, s]:.0f}" for s in STAGES])
    rows.append(["**gesamt**"] + [f"{trend[s]:.1f}" for s in STAGES])
    out += ["## Schritt A - auffällige Zellen", "",
            "Ausgangstabelle (PASS-Rate in Prozent):", "",
            c.md_table(["uc_id"] + [f"Stufe {s}" for s in STAGES], rows), "",
            "Auswahlregeln (in `find_cells`):", "",
            "1. **Sprung**: Änderung der Zelle von Stufe k zu k+1 weicht um "
            "mindestens 25 Prozentpunkte von der Änderung der Gesamt-PASS-Rate "
            "ab.",
            "2. **kein Kontextnutzen**: PASS-Rate in Stufe 4 ist nicht höher "
            "als in Stufe 1, obwohl die Gesamt-PASS-Rate um "
            f"{trend[4] - trend[1]:+.1f} Prozentpunkte steigt.",
            "3. **Extremwert**: Zelle ist 0 % (bei positiver Stufenrate) oder "
            "100 % (Stufen 1-4).",
            "",
            "Sortiert nach Auffälligkeitsmaß (Regel 1: Betrag der Abweichung; "
            "Regel 2: Betrag der Differenz + 20; Regel 3: Abstand zur "
            "Stufenrate). Die zehn auffälligsten Zellen:", ""]
    rows = []
    for i, cell in enumerate(cells, 1):
        rows.append([i, f"{cell['uc']} / Stufe {cell['stage']}", cell["kind"],
                     f"{m.loc[cell['uc'], cell['stage']]:.0f} %",
                     cell["reason"], f"{cell['score']:.0f}"])
    out += [c.md_table(["#", "Zelle", "Regel", "PASS-Rate", "Begründung",
                        "Maß"], rows), ""]

    # ---- Schritt B + C + E je Zelle
    out += ["## Schritt B und C - Fehlermeldungsgruppen und Codestichprobe je "
            "Zelle", ""]
    steckbriefe = []
    for i, cell in enumerate(cells, 1):
        uc, st = cell["uc"], cell["stage"]
        sub = p1[st][p1[st].uc_id == uc]
        fails = sub[sub.exec_category != "PASS"].copy()
        fails["sig"] = c.group_errors(fails.error_summary)
        vc = fails.sig.value_counts()

        out += [f"### {i}. `{uc}` / Stufe {st} "
                f"(PASS {m.loc[uc, st]:.0f} %, {len(sub)} Läufe, "
                f"{len(fails)} Fehlschläge)", "",
                "Kategorien: "
                + ", ".join(f"{k}: {v}" for k, v in
                            sub.exec_category.value_counts().items()) + ".", ""]
        if len(vc):
            rows = [[int(n), c.pct(int(n), len(fails)), s[:150]]
                    for s, n in vc.head(5).items()]
            out += ["**Schritt B - Fehlermeldungsgruppen** "
                    f"({len(vc)} Gruppen, die 5 häufigsten):", "",
                    c.md_table(["n", "% der Fehlschläge dieser Zelle",
                                "Signatur"], rows), ""]
            top_sig = vc.index[0]
            top_n = int(vc.iloc[0])
        else:
            out += ["**Schritt B**: keine Fehlschläge in dieser Zelle.", ""]
            top_sig, top_n = None, 0

        # Schritt C: Stichprobe
        if top_sig is not None:
            sample = fails[fails.sig == top_sig].head(N_SAMPLE)
        else:
            sample = sub.head(N_SAMPLE)
        out += [f"**Schritt C - Stichprobe** ({len(sample)} Dateien"
                + (" aus der größten Fehlermeldungsgruppe" if top_sig else "")
                + "):", ""]
        for r in sample.itertuples():
            cd = code[st]
            if st == 5:
                base = str(r.file).rsplit("/", 1)[-1]
                crow = cd[cd.basename == base]
            else:
                crow = cd[(cd.run == r.run) & (cd.uc_id == r.uc_id)]
            text = crow.iloc[0].text if len(crow) else ""
            rel = str(r.file).split("/tests/")[-1] if isinstance(r.file, str) else ""
            j = p2[st][(p2[st].run == r.run) & (p2[st].uc_id == r.uc_id)]
            out += [f"- `{rel}`  "]
            def _s(v):
                if v is None or (isinstance(v, str) and not v.strip()):
                    return "(leer)"
                try:
                    return str(int(v))
                except (TypeError, ValueError):
                    return str(v)
            out += [f"  Phase 1: {r.exec_category}; Judge: "
                    f"coverage {_s(j.iloc[0].coverage_score_raw)}, selector "
                    f"{_s(j.iloc[0].selector_score_raw)}, map_interaction "
                    f"{_s(j.iloc[0].map_interaction_score_raw)}, assertion "
                    f"{_s(j.iloc[0].assertion_score_raw)}" if len(j) else ""]
            out += ["  ```"]
            for line in skeleton(text):
                out += ["  " + line]
            out += ["  ```"]
        out += [""]

        # Steckbrief-Daten sammeln
        cd = code[st]
        if st == 5:
            finals = set(str(f).rsplit("/", 1)[-1] for f in p1[5].file)
            cd = cd[cd.basename.isin(finals)]
        sub_code = cd[cd.uc_id == uc]
        pat_hits = {}
        for pat in ["getByTestId", "getByRole", "__openPioneerMap",
                    "Helferfunktion (irgendeine)", "waitForTimeout",
                    "expect.poll", "force: true",
                    "Assertion auf map-container/Canvas"]:
            pat_hits[pat] = (int(sub_code[pat].sum()), len(sub_code))
        steckbriefe.append({
            "cell": cell, "top_sig": top_sig, "top_n": top_n,
            "n_fails": len(fails), "n": len(sub),
            "example": (str(sample.iloc[0].file).split("/tests/")[-1]
                        if len(sample) else "-"),
            "pat_hits": pat_hits,
            "halluc": int((sub_code.n_halluc_testids > 0).sum()),
        })

    # ---- Schritt D
    pats = json.loads((c.OUT_DIR / "patterns.json").read_text(encoding="utf-8"))
    out += ["## Schritt D - Muster über alle Dateien der Stufen", "",
            "Die vollständige Auszählung aller geforderten Muster über ALLE "
            "Dateien jeder Stufe steht in [codemuster.md](codemuster.md) "
            "(erzeugt von `report_patterns.py`). Zusammenfassung der "
            "Pflichtmuster:", ""]
    keys = ["Stufe 1", "Stufe 2", "Stufe 3", "Stufe 4", "Stufe 5 (Iter. 0)",
            "Stufe 5 (Endstand)"]
    must = ["getByTestId", "getByRole", "getByText", "getByLabel",
            "__openPioneerMap", "Helferfunktion (irgendeine)",
            "getActiveBaseLayerTitle", "isLayerRendered", "getMapZoomLevel",
            "getMapCenter", "getHighlightedCoordinate",
            "Import map-model-helpers", "waitForTimeout", "expect.poll",
            "waitFor (Locator/Page)", "Wartestrategie: nur waitForTimeout",
            "force: true", "Assertion auf map-container/Canvas",
            "getByTestId('map-container')"]
    rows = []
    for pat in must:
        rows.append([pat] + [f"{pats[k][pat]} ({c.pct(pats[k][pat], pats[k]['n'])} %)"
                             for k in keys])
    out += [c.md_table(["Muster"] + [f"{k} (n={pats[k]['n']})" for k in keys],
                       rows), ""]
    rows = []
    for k in keys:
        rows.append([k, pats[k]["n"], pats[k]["halluc_files"],
                     c.pct(pats[k]["halluc_files"], pats[k]["n"]),
                     pats[k]["halluc_distinct"],
                     ", ".join(f"`{t}` ({n})" for t, n in pats[k]["halluc_top"][:10])
                     or "-"])
    out += ["Halluzinierte testids (nicht in der Menge der 39 real "
            "existierenden `data-testid`-Werte):", "",
            c.md_table(["Grundmenge", "Dateien", "Dateien mit halluzinierter "
                        "testid", "%", "verschiedene halluzinierte testids",
                        "häufigste (Dateien)"], rows), ""]

    # ---- Schritt E
    out += ["## Schritt E - Steckbriefe", ""]
    for i, sb in enumerate(steckbriefe, 1):
        cell = sb["cell"]
        uc, st = cell["uc"], cell["stage"]
        rows = [["Stufe / Use Case", f"Stufe {st} / {uc}"],
                ["PASS-Rate der Zelle", f"{m.loc[uc, st]:.0f} % "
                                        f"({sb['n'] - sb['n_fails']} von {sb['n']})"],
                ["Auffälligkeitsregel", f"{cell['kind']} - {cell['reason']}"],
                ["häufigste Fehlermeldungsgruppe",
                 f"{sb['top_n']} von {sb['n_fails']} Fehlschlägen "
                 f"({c.pct(sb['top_n'], sb['n_fails'])} %): "
                 f"{(sb['top_sig'] or '-')[:140]}"],
                ["Beispieldatei", f"`{sb['example']}`"],
                ["Dateien der Zelle mit halluzinierter testid",
                 f"{sb['halluc']} von {sb['n']}"]]
        for pat, (k, n) in sb["pat_hits"].items():
            rows.append([f"Zählmuster `{pat}` in dieser Zelle",
                         f"{k} von {n} ({c.pct(k, n)} %)"])
        out += [f"### Steckbrief {i}: {uc} / Stufe {st}", "",
                c.md_table(["Feld", "Wert"], rows), ""]

    out += ["",
            notes.md_bullets("Auffälligkeiten (Stichpunkte)", notes.AUFF_NOTES),
            notes.md_bullets("Hypothesen (unbelegt)", notes.AUFF_HYPOTHESEN)]
    c.write_doc("auffaelligkeiten.md", "\n".join(out))
    c.write_json("auffaelligkeiten.json",
                 {"cells": cells, "matrix": m.to_dict(), "trend": trend})


if __name__ == "__main__":
    main()
