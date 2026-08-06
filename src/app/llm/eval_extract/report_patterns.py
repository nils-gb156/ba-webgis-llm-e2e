"""Codemuster-Auszaehlung ueber ALLE Testdateien aller Stufen (Schritt D).

Ergebnis:
  * _out/code_scan_stage_<n>.csv   (eine Zeile je Datei, ohne Quelltext)
  * _out/patterns.json             (Auszaehlung je Muster und Stufe)

Fuer Stufe 5 werden zwei Grundmengen ausgewertet:
  * "Stufe 5 (Iteration 0)"   - die erste Generierung je Lauf/UC (500 Dateien),
                                direkt vergleichbar mit den Stufen 1-4
  * "Stufe 5 (Endstand)"      - die letzte Iteration je Lauf/UC (500 Dateien)
  * "Stufe 5 (alle Iter.)"    - alle 2154 Iterationsdateien

Aufruf:  python src/app/llm/eval_extract/report_patterns.py
"""

from __future__ import annotations

from collections import Counter

import pandas as pd

import common as c

PATTERN_COLS = list(c.CODE_PATTERNS.keys()) + [
    "Assertion auf map-container/Canvas",
    "nur getByTestId (kein Role/Text/Label)",
    "nur Role/Text/Label (kein getByTestId)",
    "Wartestrategie: nur waitForTimeout",
]


def scan_all() -> dict[str, pd.DataFrame]:
    frames = {}
    for st in [1, 2, 3, 4]:
        d = c.scan_code(st)
        frames[f"Stufe {st}"] = d
        d.drop(columns=["text"]).to_csv(
            c.OUT_DIR / f"code_scan_stage_{st}.csv", index=False)
    d5 = c.scan_code(5)
    d5.drop(columns=["text"]).to_csv(c.OUT_DIR / "code_scan_stage_5.csv",
                                     index=False)
    d5 = d5.sort_values(["run", "uc_id", "iteration"])
    frames["Stufe 5 (Iter. 0)"] = d5.groupby(["run", "uc_id"], as_index=False).head(0) \
        if False else d5[d5.iteration == 0]
    frames["Stufe 5 (Endstand)"] = d5.groupby(["run", "uc_id"]).tail(1)
    frames["Stufe 5 (alle Iter.)"] = d5
    return frames


def main():
    c.ensure_dirs()
    frames = scan_all()
    order = ["Stufe 1", "Stufe 2", "Stufe 3", "Stufe 4",
             "Stufe 5 (Iter. 0)", "Stufe 5 (Endstand)", "Stufe 5 (alle Iter.)"]

    # 1) Mustertabelle
    rows = []
    for pat in PATTERN_COLS:
        r = [pat]
        for key in order:
            d = frames[key]
            n = len(d)
            k = int(d[pat].sum())
            r.append(f"{k} ({c.pct(k, n)} %)")
        rows.append(r)
    tab_patterns = c.md_table(["Muster"] + [f"{k} (n={len(frames[k])})" for k in order],
                              rows)

    # 2) testids
    testid_rows = []
    halluc_lists = {}
    for key in order:
        d = frames[key]
        n = len(d)
        used = Counter(t for l in d.testids for t in l)
        halluc = Counter(t for l in d.halluc_testids for t in l)
        n_files_h = int((d.n_halluc_testids > 0).sum())
        halluc_lists[key] = halluc
        testid_rows.append([
            key, n, int((d.n_testids > 0).sum()),
            len(used), len(halluc), n_files_h, c.pct(n_files_h, n),
            int(d.n_halluc_testids.sum()),
        ])
    tab_testids = c.md_table(
        ["Grundmenge", "Dateien", "Dateien mit ≥ 1 `getByTestId`",
         "verschiedene testids im Code", "davon halluziniert",
         "Dateien mit ≥ 1 halluzinierter testid", "%",
         "Summe halluzinierter testid-Vorkommen (distinct je Datei)"],
        testid_rows)

    halluc_detail = []
    for key in order:
        h = halluc_lists[key]
        if not h:
            halluc_detail.append([key, 0, "-"])
            continue
        halluc_detail.append([
            key, len(h),
            ", ".join(f"`{t}` ({k})" for t, k in h.most_common(40))
            + (" …" if len(h) > 40 else "")])
    tab_halluc = c.md_table(
        ["Grundmenge", "verschiedene halluzinierte testids",
         "Liste (Dateien je testid), höchstens 40 gezeigt"], halluc_detail)

    # 3) Importpfade der Helferdatei
    imp_rows = []
    for key in order:
        d = frames[key]
        imps = Counter(i for l in d.helper_imports for i in l)
        imp_rows.append([key, len(d), int((d.helper_imports.map(len) > 0).sum()),
                         ", ".join(f"`{p}` ({k})" for p, k in imps.most_common())
                         or "-"])
    tab_imports = c.md_table(
        ["Grundmenge", "Dateien", "Dateien mit Helfer-Import",
         "Importpfade (Häufigkeit)"], imp_rows)

    # 4) Muster je Use Case (nur die wichtigsten Muster)
    key_pats = ["getByTestId", "getByRole", "__openPioneerMap",
                "Helferfunktion (irgendeine)", "waitForTimeout", "expect.poll",
                "force: true", "Assertion auf map-container/Canvas"]
    uc_tables = []
    for pat in key_pats:
        rows = []
        for uc in c.UC_IDS:
            r = [uc]
            for key in order:
                d = frames[key]
                sub = d[d.uc_id == uc]
                r.append(f"{int(sub[pat].sum())} ({c.pct(int(sub[pat].sum()), len(sub))} %)")
            rows.append(r)
        uc_tables.append((pat, c.md_table(["uc_id"] + order, rows)))

    # 5) Codeumfang
    size_rows = []
    for key in order:
        d = frames[key]
        size_rows.append([key, len(d), f"{d.n_lines.median():.1f}",
                          f"{d.n_lines.mean():.1f}", f"{d.n_expect.median():.1f}",
                          f"{d.n_expect.mean():.2f}",
                          f"{d.n_testids.mean():.2f}"])
    tab_size = c.md_table(["Grundmenge", "Dateien", "Zeilen Md", "Zeilen Ø",
                           "`expect(` Md", "`expect(` Ø",
                           "verschiedene testids je Datei Ø"], size_rows)

    doc = [
        "# Codemuster über alle Stufen (Schritt D)",
        "",
        "Erzeugt von `src/app/llm/eval_extract/report_patterns.py`. "
        "Grundlage sind ALLE generierten `*.spec.ts`-Dateien der jeweiligen "
        "Stufe (nicht nur Stichproben). Die Regex-Definitionen stehen in "
        "`common.py` (`CODE_PATTERNS`, `asserts_on_map_container`).",
        "",
        "Grundmengen: Stufen 1-4 je 500 Dateien (Stufe 3: 499, da "
        "`run_20/uc-02` fehlt). Stufe 5 wird dreifach ausgewertet: erste "
        "Iteration je Lauf (vergleichbar mit einem einzelnen "
        "Generierungsdurchlauf), letzte Iteration je Lauf (Endstand) und alle "
        "Iterationsdateien.",
        "",
        "## 1 Muster je Stufe", "",
        tab_patterns, "",
        "Lesart: Anzahl der Dateien, in denen das Muster mindestens einmal "
        "vorkommt, und Anteil an der Grundmenge der Spalte.", "",
        "## 2 Verwendete testids gegen die real existierenden", "",
        "Referenzmenge: 39 real im Anwendungsquellcode vergebene "
        "`data-testid`-Werte (37 literale Werte plus `eucos-station-info` und "
        "`uvi-station-info`, die über die `testId`-Prop von `StationInfo.tsx` "
        "gesetzt werden). Zusätzlich gilt die indizierte Familie "
        "`geocoder-result-item-<N>` als real (Template-Literal in "
        "`GeocoderSearch.tsx`). Die Liste steht in `common.py` "
        "(`REAL_TESTIDS`). Halluziniert = im Testcode über `getByTestId(...)` "
        "verwendeter Wert, der nicht in dieser Referenzmenge liegt.",
        "", tab_testids, "", tab_halluc, "",
        "## 3 Importpfad der Helferdatei", "", tab_imports, "",
        "Gesucht werden Import-/Require-Pfade, die `map-model-helpers` bzw. "
        "`map-model` enthalten. Die Datei liegt real unter "
        "`src/app/llm/map-model-helpers.ts`; aus "
        "`src/app/llm/tests/stage_<n>/run_<NN>/` ist das "
        "`../../../map-model-helpers`.",
        "",
        "## 4 Codeumfang", "", tab_size, "",
        "## 5 Ausgewählte Muster je Use Case", "",
    ]
    for pat, tab in uc_tables:
        doc += [f"### `{pat}`", "", tab, ""]

    c.write_doc("codemuster.md", "\n".join(doc))

    # JSON-Digest fuer auffaelligkeiten.md
    digest = {}
    for key in order:
        d = frames[key]
        digest[key] = {"n": len(d)}
        for pat in PATTERN_COLS:
            digest[key][pat] = int(d[pat].sum())
        digest[key]["halluc_files"] = int((d.n_halluc_testids > 0).sum())
        digest[key]["halluc_distinct"] = len(
            set(t for l in d.halluc_testids for t in l))
        digest[key]["halluc_top"] = Counter(
            t for l in d.halluc_testids for t in l).most_common(15)
        digest[key]["by_uc"] = {
            uc: {pat: int(d[d.uc_id == uc][pat].sum()) for pat in key_pats}
            for uc in c.UC_IDS}
    c.write_json("patterns.json", digest)
    print("[fertig] codemuster.md + _out/patterns.json")


if __name__ == "__main__":
    main()
