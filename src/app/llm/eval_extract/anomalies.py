"""Erzeugt docs/eval/auffaelligkeiten.md (Schritt A bis E).

A  auffällige Zellen der PASS-Raten-Matrix UC × Stufe (regelbasiert)
B  Gruppierung der `error_summary` dieser Zellen
C  Beschreibung der gelesenen Stichprobendateien (Daten: stichprobe.py)
D  Auszählung der abgeleiteten Muster über ALLE Dateien der Stufen
E  Steckbrief je Zelle

Aufruf:  python -m eval_extract.anomalies      (aus src/app/llm/)
"""

from __future__ import annotations

import re
from collections import Counter

import pandas as pd

from . import common as C
from . import compare as CMP
from .stichprobe import STICHPROBE

STAGES = [1, 2, 3, 4, 5]

# ---------------------------------------------------------------------------
# Schritt A: Auswahlregeln
# ---------------------------------------------------------------------------

SELECT_RULES = [
    ("R1", "PASS-Rate = 0 % obwohl UI-Kontext vorhanden (Stufe ≥ 2)"),
    ("R2", "Abweichung vom Stufenmittel ≥ 30 pp"),
    ("R3", "Sprung zur Nachbarstufe ≥ 25 pp (Betrag)"),
    ("R4", "keine Verbesserung über die Stufen 1 → 4 (Δ ≤ 0 pp)"),
]

# Die im Bericht ausgewerteten Zellen. Auswahl: alle Zellen, die mindestens
# eine der Regeln R1/R4 erfüllen, plus die Zellen mit dem größten Rückgang
# nach R3. Zellen mit auffällig gutem Wert sind in der A-Tabelle mit
# aufgeführt, aber nicht Teil der Stichprobe (Schritt C zielt auf
# Fehlerbilder).
CELLS = [("uc-08", 3), ("uc-08", 4), ("uc-02", 3), ("uc-02", 2),
         ("uc-05", 4), ("uc-06", 4), ("uc-10", 4), ("uc-07", 2),
         ("uc-10", 2)]


def schritt_a() -> tuple[str, pd.DataFrame]:
    df = CMP.pass_matrix().set_index("uc_id")
    tot = df.loc["GESAMT"]
    ucs = df.drop(index="GESAMT")

    rows = []
    for uc in ucs.index:
        for s in STAGES:
            v = ucs.loc[uc, f"Stufe {s}"]
            dev = v - tot[f"Stufe {s}"]
            reasons, mag = [], 0.0
            if v == 0 and s >= 2:
                reasons.append("R1: 0 % PASS")
                mag = max(mag, 100.0)
            if abs(dev) >= 30:
                reasons.append(f"R2: {dev:+.0f} pp gegen Stufenmittel "
                               f"({tot[f'Stufe {s}']:.0f} %)")
                mag = max(mag, abs(dev))
            for a, b in [(1, 2), (2, 3), (3, 4), (4, 5)]:
                if b == s:
                    d = v - ucs.loc[uc, f"Stufe {a}"]
                    if abs(d) >= 25:
                        reasons.append(f"R3: Sprung {a}→{b} {d:+.0f} pp")
                        mag = max(mag, abs(d))
            if s == 4 and (ucs.loc[uc, "Stufe 4"] - ucs.loc[uc, "Stufe 1"]) <= 0:
                reasons.append(
                    f"R4: Δ 1→4 = "
                    f"{ucs.loc[uc, 'Stufe 4'] - ucs.loc[uc, 'Stufe 1']:+.0f} pp")
                mag = max(mag, 100.0)
            if reasons:
                rows.append({"uc_id": uc, "Stufe": s,
                             "PASS-Rate": f"{v:.0f}%",
                             "Stufenmittel": f"{tot[f'Stufe {s}']:.0f}%",
                             "Richtung": "schlecht" if dev < 0 or v == 0 else "gut",
                             "_mag": mag,
                             "Begründung": "; ".join(reasons)})
    out = pd.DataFrame(rows).sort_values("_mag", ascending=False)
    sel = out[out.apply(lambda r: (r["uc_id"], r["Stufe"]) in CELLS, axis=1)]

    txt = ["## Schritt A – auffällige Zellen der PASS-Raten-Matrix\n"]
    txt.append("Quelle: `_phase1_results.csv` aller Stufen; Zelle = "
               "`sum(exec_category=='PASS') / 50` je (uc_id, Stufe). "
               "Auswahlregeln (rein numerisch, im Skript "
               "`anomalies.py:schritt_a()`):\n")
    txt.append(C.md_table(pd.DataFrame(
        [{"Regel": k, "Bedingung": v} for k, v in SELECT_RULES])))
    txt.append("\nAlle Zellen, die mindestens eine Regel erfüllen "
               f"(n = {len(out)}), absteigend nach der größten "
               "auslösenden Abweichung:\n")
    txt.append(C.md_table(out.drop(columns=["_mag"])))
    txt.append(f"\nFür die Schritte B bis E ausgewählt sind die "
               f"{len(CELLS)} Zellen der Fehlerseite (Richtung "
               f"„schlecht\" bzw. R1/R4). Zellen mit auffällig **gutem** "
               f"Wert stehen in der Tabelle oben, werden aber nicht "
               f"weiter untersucht:\n")
    txt.append(C.md_table(sel.drop(columns=["_mag"])))
    return "\n".join(txt), out


# ---------------------------------------------------------------------------
# Schritt B
# ---------------------------------------------------------------------------

def schritt_b() -> str:
    txt = ["## Schritt B – Fehlermeldungen der ausgewählten Zellen\n"]
    txt.append("Quelle: `_phase1_results.csv` der jeweiligen Stufe, Zeilen "
               "mit `uc_id == <UC>` und `exec_category != 'PASS'`. "
               "Gruppierung nach `common.py:ERROR_GROUP_RULES`.\n")
    rows = []
    for uc, s in CELLS:
        p1 = C.load_phase1(s)
        sub = p1[(p1.uc_id == uc) & (p1.exec_category != "PASS")].copy()
        if sub.empty:
            continue
        grp = Counter(sub["error_summary"].map(C.error_group))
        head = Counter(sub["error_summary"].map(C.error_headline))
        g, gn = grp.most_common(1)[0]
        h, hn = head.most_common(1)[0]
        rows.append({
            "Zelle": f"{uc} / Stufe {s}",
            "Fehlschläge": len(sub),
            "größte Gruppe": g,
            "n": gn, "Anteil an der Zelle": C.pct(gn, len(sub)),
            "häufigster Fehlerkopf": "`" + h.replace("|", "\\|") + "`",
            "n (Kopf)": hn, "Anteil (Kopf)": C.pct(hn, len(sub)),
        })
    txt.append(C.md_table(pd.DataFrame(rows)))

    txt.append("\nVollständige Gruppenverteilung je Zelle:\n")
    rows = []
    for uc, s in CELLS:
        p1 = C.load_phase1(s)
        sub = p1[(p1.uc_id == uc) & (p1.exec_category != "PASS")]
        grp = Counter(sub["error_summary"].map(C.error_group))
        for g, n in grp.most_common():
            rows.append({"Zelle": f"{uc} / Stufe {s}", "Gruppe": g, "n": n,
                         "Anteil": C.pct(n, len(sub))})
    txt.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(txt)


# ---------------------------------------------------------------------------
# Schritt C
# ---------------------------------------------------------------------------

def schritt_c() -> str:
    txt = ["## Schritt C – Stichprobe (je Zelle 5 Dateien gelesen)\n"]
    txt.append("Ausgewählt wurden je Zelle die ersten fünf Läufe aus der "
               "größten Fehlergruppe nach Schritt B. Die Beschreibung ist "
               "deskriptiv; Daten in "
               "`eval_extract/stichprobe.py:STICHPROBE`.\n")
    for uc, s in CELLS:
        key = f"{uc}_S{s}"
        if key not in STICHPROBE:
            txt.append(f"\n### {uc} / Stufe {s}\n\n- keine Stichprobe erfasst.")
            continue
        files, points = STICHPROBE[key]
        txt.append(f"\n### {uc} / Stufe {s}\n")
        txt.append("Gelesene Dateien (unter `src/app/llm/tests/`):\n")
        for f in files:
            txt.append(f"- `{f}`")
        txt.append("")
        for p in points:
            txt.append(f"- {p}")
    return "\n".join(txt)


# ---------------------------------------------------------------------------
# Schritt D
# ---------------------------------------------------------------------------

# Pflichtmuster laut Aufgabenstellung
BASE_PATTERNS: list[tuple[str, str, str]] = [
    ("getByTestId", r"getByTestId\s*\(", "Selektorart"),
    ("getByRole", r"getByRole\s*\(", "Selektorart"),
    ("getByText", r"getByText\s*\(", "Selektorart"),
    ("getByLabel(Text)", r"getByLabel(?:Text)?\s*\(", "Selektorart"),
    ("page.locator(CSS)", r"page\.locator\s*\(", "Selektorart"),
    ("__openPioneerMap", r"__openPioneerMap", "Kartenmodell"),
    ("Helferfunktion (eine der fünf)",
     r"\b(?:getActiveBaseLayerTitle|isLayerRendered|getMapZoomLevel|"
     r"getMapCenter|getHighlightedCoordinate)\s*\(", "Kartenmodell"),
    ("Import `map-model-helpers`",
     r"from\s+['\"][^'\"]*map-model-helpers[^'\"]*['\"]", "Kartenmodell"),
    ("waitForTimeout", r"waitForTimeout\s*\(", "Wartestrategie"),
    ("expect.poll", r"expect\.poll\s*\(", "Wartestrategie"),
    ("waitFor/waitForSelector/waitForFunction",
     r"\.waitFor\s*\(|waitForSelector\s*\(|waitForFunction\s*\(",
     "Wartestrategie"),
    ("waitForLoadState", r"waitForLoadState\s*\(", "Wartestrategie"),
    ("force: true", r"force\s*:\s*true", "Interaktion"),
    ("page.mouse.*", r"page\.mouse\.", "Interaktion"),
    ("dblclick", r"\.dblclick\s*\(", "Interaktion"),
]

# Aus Schritt C abgeleitete Muster
EXTRA_PATTERNS: list[tuple[str, str, str]] = [
    ("Regex-Textprüfung auf Zahl + m/km",
     r"\(m\|km\)|\(\?:m\|km\)|\(\?:mm\|cm\|m\|km\)", "aus uc-08"),
    ("erweiterte Einheiten mm|cm", r"mm\|cm", "aus uc-08"),
    ("selectOption(...)", r"\.selectOption\s*\(", "aus uc-02"),
    ("Cast auf HTMLSelectElement", r"HTMLSelectElement", "aus uc-02"),
    ("getByRole('combobox'…)", r"getByRole\s*\(\s*['\"]combobox['\"]",
     "aus uc-02"),
    ("getByRole('radio'…)", r"getByRole\s*\(\s*['\"]radio['\"]", "aus uc-02"),
    ("Kandidatenliste 'Base maps'/'Basemaps'",
     r"['\"]Base ?maps?['\"]|['\"]Basiskarten['\"]|['\"]Background maps?['\"]",
     "aus uc-02"),
    ("Legende über exakten Text 'Precipitation'",
     r"getByText\s*\(\s*['\"]Precipitation['\"]", "aus uc-05"),
    ("legendenspezifisches testid (`*-legend`)",
     r"getByTestId\s*\(\s*['\"][a-z-]*-legend['\"]", "aus uc-05"),
    ("Literal 24 in Assertion",
     r"toHaveCount\s*\(\s*24\s*\)|\.toBe\s*\(\s*24\s*\)", "aus uc-06/uc-10"),
    ("feste Zielkoordinate 1188692.84", r"1188692\.84", "aus uc-07"),
    ("Kalibrierung über coordinate-viewer",
     r"getByTestId\s*\(\s*['\"]coordinate-viewer['\"]", "aus uc-07"),
    ("hover({ position …", r"\.hover\s*\(\s*\{", "aus uc-07"),
    ("Suchbegriff 'Münster'", r"M(?:ü|ue|u)nster", "aus uc-10"),
    ("Platzhaltertext 'Click on the map…'",
     r"Click on the map to load a forecast", "aus uc-10"),
]

MAPC_VAR = re.compile(
    r"""(?:const|let|var)\s+(\w+)\s*=\s*[^;\n]*getByTestId\s*\(\s*['"`]map-container['"`]""")


def count_map_container_assertions(text: str) -> int:
    """Assertions, deren Subjekt der map-container ist.

    Erfasst `expect(page.getByTestId('map-container'))…` sowie
    `expect(<var>)…`, wenn `<var>` per getByTestId('map-container')
    deklariert wurde. Verschachtelte Locator (`mapContainer.getByText(...)`)
    zählen NICHT, weil dort ein anderes Element geprüft wird.
    """
    n = len(re.findall(
        r"""expect\s*\(\s*(?:await\s+)?page\.getByTestId\s*\(\s*['"`]map-container['"`]\s*\)\s*\)""",
        text))
    for var in set(MAPC_VAR.findall(text)):
        n += len(re.findall(rf"expect\s*\(\s*(?:await\s+)?{re.escape(var)}\s*\)", text))
    return n


def schritt_d() -> str:
    txt = ["## Schritt D – Zählmuster über ALLE Dateien der Stufe\n"]
    txt.append("Grundmenge je Stufe: 500 generierte `*.spec.ts` "
               "(Stufe 5: die `final_spec` je Lauf/UC). Angegeben sind "
               "Dateien mit mindestens einem Treffer (absolut und in Prozent "
               "der 500 Dateien). Alle Regexe stehen in "
               "`anomalies.py:BASE_PATTERNS` / `EXTRA_PATTERNS`.\n")

    texts = {}
    for s in STAGES:
        texts[s] = {k: p.read_text(encoding="utf-8", errors="replace")
                    for k, p in C.spec_files(s).items()}

    def table(pats, title):
        rows = []
        for name, rx, grp in pats:
            c = re.compile(rx)
            r = {"Gruppe": grp, "Muster": name,
                 "Regex": "`" + rx.replace("|", "\\|").replace("`", "\\`") + "`"}
            for s in STAGES:
                n = sum(1 for t in texts[s].values() if c.search(t))
                r[f"Stufe {s}"] = f"{n} ({C.pct(n, len(texts[s]))})"
            rows.append(r)
        return f"\n### {title}\n\n" + C.md_table(pd.DataFrame(rows))

    txt.append(table(BASE_PATTERNS, "Pflichtmuster"))
    txt.append(table(EXTRA_PATTERNS, "Aus Schritt C abgeleitete Muster"))

    # Assertions auf map-container
    txt.append("\n### Assertions direkt auf `map-container`\n")
    txt.append("Gezählt werden Assertions, deren Subjekt der "
               "`map-container` selbst ist – also "
               "`expect(page.getByTestId('map-container'))…` bzw. "
               "`expect(<var>)…` für eine so deklarierte Variable. "
               "Verschachtelte Locator wie "
               "`mapContainer.getByText(...)` zählen **nicht**, weil dort "
               "ein anderes Element geprüft wird "
               "(`anomalies.py:count_map_container_assertions`).\n")
    rows = []
    for s in STAGES:
        cnts = {k: count_map_container_assertions(t) for k, t in texts[s].items()}
        files = sum(1 for v in cnts.values() if v)
        helper = sum(1 for k, t in texts[s].items()
                     if re.search(r"\b(?:getActiveBaseLayerTitle|isLayerRendered|"
                                  r"getMapZoomLevel|getMapCenter|"
                                  r"getHighlightedCoordinate)\s*\(", t))
        both = sum(1 for k, t in texts[s].items()
                   if cnts[k] and re.search(
                       r"\b(?:getActiveBaseLayerTitle|isLayerRendered|"
                       r"getMapZoomLevel|getMapCenter|"
                       r"getHighlightedCoordinate)\s*\(", t))
        rows.append({"Stufe": s,
                     "Dateien mit Assertion auf map-container":
                         f"{files} ({C.pct(files, len(texts[s]))})",
                     "Assertions gesamt": sum(cnts.values()),
                     "Dateien mit Helferaufruf":
                         f"{helper} ({C.pct(helper, len(texts[s]))})",
                     "Dateien mit beidem": both,
                     "Dateien mit map-container-Assertion, aber ohne Helfer":
                         files - both})
    txt.append(C.md_table(pd.DataFrame(rows)))

    # Importpfade
    txt.append("\n### Importpfad der Helferdatei und seine Varianten\n")
    txt.append("Quelle: Regex "
               "`from\\s+['\\\"]([^'\\\"]*map-model-helpers[^'\\\"]*)['\\\"]` "
               "über alle Dateien der Stufe.\n")
    rows = []
    for s in STAGES:
        c = Counter()
        for t in texts[s].values():
            for m in C.HELPER_IMPORT_PATH_RE.findall(t):
                c[m] += 1
        if not c:
            rows.append({"Stufe": s, "Importpfad": "– (kein Import)",
                         "n Dateien": 0, "% der Stufe": "0.0%"})
        for path, n in c.most_common():
            rows.append({"Stufe": s, "Importpfad": "`" + path + "`",
                         "n Dateien": n, "% der Stufe": C.pct(n, len(texts[s]))})
    txt.append(C.md_table(pd.DataFrame(rows)))
    txt.append("\n- Die Verzeichnistiefe unterscheidet sich bauartbedingt: "
               "Stufen 1–4 legen die Spec unter `run_NN/` ab (drei Ebenen "
               "bis `src/app/llm/`), Stufe 5 unter `run_NN/<uc-dir>/` "
               "(vier Ebenen). Andere Varianten kommen in den Daten nicht "
               "vor.")

    # testids
    txt.append("\n### Verwendete `getByTestId`-Werte gegen die reale Liste\n")
    real_src = C.real_testids_from_source()
    real_md, declared = C.real_testids()
    txt.append(
        f"Referenzliste (Grundwahrheit): alle `data-testid`-Werte im "
        f"Anwendungsquelltext `src/app/**/*.tsx|ts` ohne `llm/` – "
        f"**{len(real_src)}** Werte "
        f"(`common.py:real_testids_from_source()`). Die Datei "
        f"`generated-ui-map.md` nennt im Kopf „{declared} unique "
        f"data-testid values\"; ihre Tabelle enthält "
        f"{len([x for x in real_md if x != '...'])} benannte Einträge plus "
        f"drei Zeilen `...`. Gegenüber dem Quelltext fehlen ihr "
        f"{', '.join('`' + x + '`' for x in sorted(real_src - {y for y in real_md if y != '...'}) if '${' not in x)}. "
        f"Ausgezählt wird gegen die Quelltextliste; ein dynamischer "
        f"Eintrag (`geocoder-result-item-${{…}}`) gilt über sein Präfix "
        f"als getroffen.\n")
    rows = []
    halluz_detail = {}
    for s in STAGES:
        used = Counter()
        files_with_halluz = 0
        halluz = Counter()
        for k, t in texts[s].items():
            ids = set(C.TESTID_RE.findall(t))
            used.update(ids)
            bad = {i for i in ids if not C.testid_matches_real(i, real_src)}
            if bad:
                files_with_halluz += 1
                halluz.update(bad)
        halluz_detail[s] = halluz
        rows.append({
            "Stufe": s,
            "verschiedene verwendete testids": len(used),
            "davon real": len([i for i in used if C.testid_matches_real(i, real_src)]),
            "davon halluziniert": len(halluz),
            "Dateien mit ≥ 1 halluziniertem testid":
                f"{files_with_halluz} ({C.pct(files_with_halluz, len(texts[s]))})",
            "Vorkommen halluzinierter testids (Dateien summiert)":
                sum(halluz.values()),
        })
    txt.append(C.md_table(pd.DataFrame(rows)))
    txt.append("\nListe der halluzinierten testids je Stufe "
               "(Wert – Anzahl Dateien):\n")
    rows = []
    for s in STAGES:
        h = halluz_detail[s]
        rows.append({"Stufe": s,
                     "n": len(h),
                     "halluzinierte testids":
                         ", ".join(f"`{k}` ({v})" for k, v in h.most_common())
                         or "– keine"})
    txt.append(C.md_table(pd.DataFrame(rows)))

    # Selektorart je Stufe, Anteil ausschließlich testid
    txt.append("\n### Selektorstrategie je Stufe\n")
    rows = []
    for s in STAGES:
        n = len(texts[s])
        tid = re.compile(r"getByTestId\s*\(")
        other = re.compile(r"getByRole\s*\(|getByText\s*\(|getByLabel(?:Text)?\s*\(|"
                           r"getByPlaceholder\s*\(|page\.locator\s*\(")
        only_tid = sum(1 for t in texts[s].values()
                       if tid.search(t) and not other.search(t))
        only_other = sum(1 for t in texts[s].values()
                         if not tid.search(t) and other.search(t))
        both = sum(1 for t in texts[s].values()
                   if tid.search(t) and other.search(t))
        rows.append({"Stufe": s,
                     "nur getByTestId": f"{only_tid} ({C.pct(only_tid, n)})",
                     "nur Rolle/Text/Label/CSS":
                         f"{only_other} ({C.pct(only_other, n)})",
                     "gemischt": f"{both} ({C.pct(both, n)})"})
    txt.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(txt)


# ---------------------------------------------------------------------------
# Schritt E
# ---------------------------------------------------------------------------

# je Zelle: (Muster-Anzeigename, Regex, auf welche UC-Teilmenge beziehen)
CELL_PATTERN = {
    ("uc-08", 3): ("Regex-Textprüfung auf Zahl + m/km",
                   r"\(m\|km\)|\(\?:m\|km\)|\(\?:mm\|cm\|m\|km\)"),
    ("uc-08", 4): ("Regex-Textprüfung auf Zahl + m/km",
                   r"\(m\|km\)|\(\?:m\|km\)|\(\?:mm\|cm\|m\|km\)"),
    ("uc-02", 3): ("getByRole('radio'…) + click({force:true})",
                   r"getByRole\s*\(\s*['\"]radio['\"]"),
    ("uc-02", 2): ("selectOption(...) auf einer Combobox",
                   r"\.selectOption\s*\("),
    ("uc-05", 4): ("Legende über exakten Text 'Precipitation'",
                   r"getByText\s*\(\s*['\"]Precipitation['\"]"),
    ("uc-06", 4): ("Literal 24 in der Abschluss-Assertion",
                   r"toHaveCount\s*\(\s*24\s*\)|\.toBe\s*\(\s*24\s*\)"),
    ("uc-10", 4): ("Literal 24 in der Abschluss-Assertion",
                   r"toHaveCount\s*\(\s*24\s*\)|\.toBe\s*\(\s*24\s*\)"),
    ("uc-07", 2): ("feste Zielkoordinate 1188692.84", r"1188692\.84"),
    ("uc-10", 2): ("Suchbegriff 'Münster'", r"M(?:ü|ue|u)nster"),
}


def schritt_e() -> str:
    txt = ["## Schritt E – Steckbrief je auffälliger Zelle\n"]
    txt.append("„Häufigkeit des Problems\" = Anteil der Fehlschläge der "
               "Zelle in der größten Fehlergruppe aus Schritt B. "
               "„Zählmuster\" ist das aus Schritt C abgeleitete Muster, "
               "ausgezählt über alle 50 Dateien der Zelle **und** über alle "
               "500 Dateien der Stufe.\n")
    df = CMP.pass_matrix().set_index("uc_id")
    rows = []
    for uc, s in CELLS:
        p1 = C.load_phase1(s)
        cell = p1[p1.uc_id == uc]
        fails = cell[cell.exec_category != "PASS"]
        grp = Counter(fails["error_summary"].map(C.error_group))
        g, gn = grp.most_common(1)[0] if grp else ("–", 0)
        name, rx = CELL_PATTERN[(uc, s)]
        c = re.compile(rx)
        specs = C.spec_files(s)
        cell_files = {k: v for k, v in specs.items() if k[1] == uc}
        n_cell = sum(1 for p in cell_files.values()
                     if c.search(p.read_text(encoding="utf-8", errors="replace")))
        n_stage = sum(1 for p in specs.values()
                      if c.search(p.read_text(encoding="utf-8", errors="replace")))
        # Beispiel: erste fehlgeschlagene Datei der Zelle, die das
        # Zählmuster auch tatsächlich enthält (sonst die erste überhaupt)
        fail_keys = [(r.run, r.uc_id) for r in fails.itertuples()]
        example = ""
        for k in fail_keys:
            p = cell_files.get(k)
            if p and c.search(p.read_text(encoding="utf-8", errors="replace")):
                example = p.as_posix()
                break
        if not example and fail_keys:
            p = cell_files.get(fail_keys[0])
            example = p.as_posix() if p else str(fails.iloc[0]["file"])
        example = example.replace("\\", "/")
        i = example.find("/tests/")
        example = example[i + 1:] if i >= 0 else example
        # Muster-Treffer unter den Fehlschlägen der Zelle
        n_fail_hit = sum(
            1 for k in fail_keys
            if (p := cell_files.get(k)) is not None
            and c.search(p.read_text(encoding="utf-8", errors="replace")))
        rows.append({
            "Zelle": f"**{uc} / Stufe {s}**",
            "PASS-Rate": f"{df.loc[uc, f'Stufe {s}']:.0f}%",
            "Fehlschläge": len(fails),
            "größte Fehlergruppe": f"{g} – {gn} ({C.pct(gn, len(fails))})",
            "Zählmuster (Schritt D)": name,
            "Treffer in der Zelle": f"{n_cell}/{len(cell_files)} "
                                    f"({C.pct(n_cell, len(cell_files))})",
            "davon unter den Fehlschlägen": f"{n_fail_hit}/{len(fails)} "
                                            f"({C.pct(n_fail_hit, len(fails))})",
            "Treffer in der Stufe": f"{n_stage}/500 ({C.pct(n_stage, 500)})",
            "Beispieldatei": "`" + example + "`",
        })
    txt.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(txt)


HYPOTHESEN = """## Hypothesen (unbelegt)

> Dieser Abschnitt ist **nicht** aus den Daten belegt. Er listet mögliche
> Erklärungen für die oben gezählten Muster, die sich jeweils mit einem
> konkreten nächsten Schritt am Code prüfen ließen. Nichts davon wurde
> geprüft.

| Beobachtung (belegt) | Hypothese (unbelegt) | prüfbar durch |
| --- | --- | --- |
| uc-08: 0 % PASS in Stufe 3 und 4; 96 % bzw. 94 % der Fehlschläge in `J_konkreter_received_wert`, Fehlerkopf `toContainText(expected) failed`; 74 % bzw. 66 % der Dateien prüfen mit einer Regex auf Zahl + `m`/`km` | Der reale Text im `measurement`-Element trägt eine andere Einheit oder ein anderes Format, als die Regex erwartet | einmal manuell messen und den tatsächlichen `textContent` von `getByTestId('measurement')` protokollieren; gegen die acht in Schritt C notierten Regexe halten |
| uc-02: Stufe 2 adressiert den Basemap-Umschalter in 100 % als `getByRole('combobox')` + `selectOption`, Stufe 3 in 100 % als `getByRole('radio')` + `click({force:true})`; Stufe 2 scheitert zu 71 % an `Cannot read properties of undefined`, Stufe 3 zu 82 % an `element(s) not found`; Stufe 4 erreicht 38 % | Das reale Bedienelement ist weder ein `<select>` noch eine Radiogruppe; beide Kontextstufen legen eine falsche Widget-Art nahe | die tatsächliche Rolle des Elements im Accessibility-Tree ablesen und mit den drei Kontextdateien (Stufe 2, 3, 4) vergleichen |
| uc-05: Stufe 3 100 % PASS, Stufe 4 24 %; 97 % der Fehlschläge `element(s) not found`; 76 % der Stufe-4-Dateien schließen mit `legend.getByText('Precipitation', {exact:true})`, in Stufe 3 tut das keine Datei | Die manuelle UI-Map (Stufe 4) legt den exakten Legendentext `Precipitation` nahe, während die Legende anders beschriftet ist oder das legendenspezifische testid (`precipitation-legend`) tragen würde | den gerenderten Inhalt von `getByTestId('legend')` nach Aktivierung protokollieren; `manual-ui-map.json` gegen `generated-ui-map.md` an dieser Stelle vergleichen |
| uc-06 und uc-10: 100 % der Dateien enthalten das Literal `24` in der Abschluss-Assertion; in Stufe 4 sind alle Fehlschläge dieser beiden Zellen `element(s) not found` | Die Zahl 24 stammt aus dem Referenztest bzw. dem Use-Case-Text und ist datenabhängig (Stundenwerte der Vorhersage) | `use_cases.md` und den Referenztest auf die Herkunft der 24 prüfen; die tatsächliche Zahl der `weather-forecast-entry`-Elemente in mehreren Läufen zählen |
| uc-07: 94 % der Stufe-2-Dateien enthalten dieselbe feste Zielkoordinate `1188692.84 / 6767643.28`, jede Datei baut eine eigene Pixel-Kalibrierung über `coordinate-viewer` | Die Koordinate stammt aus dem Use-Case-Text; ohne Map-Model-Helfer bleibt nur die Kalibrierung über den Koordinatenanzeiger. Stufe 3 (56 %) und 4 (78 %) verbessern sich, sobald `getHighlightedCoordinate` verfügbar ist | die Kalibrierungsgenauigkeit einmal messen: Zielkoordinate gegen tatsächlich geklickte Koordinate |
| Stufe 1: 28 verschiedene halluzinierte testids in 30 Dateien (u. a. `map`, `forecast-entry`, `ol-map`); ab Stufe 2 null | Ohne testid-Liste im Kontext erfindet das Modell plausible Namen | keine weitere Prüfung nötig – der Befund ist bereits gezählt |
| `waitForTimeout` kommt in **keiner** der 2500 Dateien vor; `expect.poll` in 47,8 % (Stufe 1) bis 90,8 % (Stufe 5) | Die Wartestrategie wird durch den Generierungs-Prompt bzw. das Skill-Dokument vorgegeben, nicht durch den UI-Kontext | `generate_tests_stage_*.py` und `SKILL.md` auf eine entsprechende Anweisung durchsuchen |
| Stufe 4 setzt in 78,6 % der Dateien mindestens eine Assertion direkt auf `map-container`, Stufe 3 in 49,2 % – bei gleichzeitig 90 % Helfernutzung in beiden | Die zusätzliche `ui-map`-Sektion der Stufe 4 nennt `map-container` als Element und lädt zu einer Sichtbarkeitsprüfung darauf ein, die zum Testziel nichts beiträgt | `_stage_4_context.txt` an der `map-container`-Zeile mit `_stage_3_context.txt` vergleichen |
"""


def main():
    C.OUT_DIR.mkdir(parents=True, exist_ok=True)
    a, _ = schritt_a()
    parts = [
        "# Auffälligkeiten mit Beleg",
        "",
        "Erzeugt mit `src/app/llm/eval_extract/anomalies.py`. "
        "Die Schritte A, B, D und E sind vollständig aus den Rohdaten "
        "berechnet; Schritt C beruht auf dem vollständigen Lesen der dort "
        "genannten Dateien (Daten in `eval_extract/stichprobe.py`).",
        "",
        a, "", schritt_b(), "", schritt_c(), "", schritt_d(), "", schritt_e(),
        "", HYPOTHESEN, "",
    ]
    (C.OUT_DIR / "auffaelligkeiten.md").write_text("\n".join(parts),
                                                   encoding="utf-8")
    print("[OK] auffaelligkeiten.md")


if __name__ == "__main__":
    main()
