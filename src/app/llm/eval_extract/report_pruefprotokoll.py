"""Erzeugt docs/eval/pruefprotokoll.md.

Enthaelt: Abweichungen eigene Rechnung <-> plots/aggregates.csv,
Datenformat-Inkonsistenzen, fehlende/unerwartete Daten, offene Punkte.

Aufruf:  python src/app/llm/eval_extract/report_pruefprotokoll.py
(setzt voraus, dass check_aggregates.py und report_patterns.py gelaufen sind)
"""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

import pandas as pd

import common as c
import check_aggregates
import report_stage5_loop as loop

STAGES = [1, 2, 3, 4, 5]


def main():
    p1 = {s: c.load_phase1(s) for s in STAGES}
    p2 = {s: c.load_phase2(s) for s in STAGES}

    out = ["# Prüfprotokoll", "",
           "Erzeugt von `src/app/llm/eval_extract/report_pruefprotokoll.py` "
           "(Abschnitt 1 von `check_aggregates.py`). Enthält jede Abweichung "
           "zwischen eigener Rechnung und `plots/aggregates.csv`, jede "
           "Format-Inkonsistenz in den Rohdaten, alle fehlenden oder "
           "unerwarteten Datensätze und die Punkte, an denen eine Festlegung "
           "getroffen werden musste.", ""]

    # ---------------------------------------------------------------- 1
    out += ["## 1 Abweichungen gegenüber `plots/aggregates.csv`", ""]
    rows = []
    total = 0
    for s in STAGES:
        r = check_aggregates.check_stage(s)
        total += r["n_diffs"]
        rows.append([f"Stufe {s}", r["agg_rows"], r["n_diffs"],
                     f"{r['n_std_ddof_gap']} von {r['n_std_compared']}"])
    out += [c.md_table(["Stufe", "Zeilen in aggregates.csv",
                        "Abweichungen (n, PASS/Fehlerklassen, Mittelwert, "
                        "Median, std mit ddof=0, vacuous_pass)",
                        "std-Werte, die bei ddof=1 abweichen würden"], rows), "",
            f"**Ergebnis: {total} inhaltliche Abweichungen.** Verglichen wurden "
            "je Stufe und je `uc_id` (plus Zeile `GESAMT`): `n`, alle sechs "
            "Fehlerklassen, sowie Mittelwert, Median und Standardabweichung "
            "der vier Score-Dimensionen und `vacuous_pass`. Toleranz 0,005 "
            "(aggregates.csv ist auf zwei Dezimalstellen gerundet).", "",
            "### Konventionsunterschied bei der Standardabweichung", "",
            "`plot_stage.py:251` berechnet `vals.std(ddof=0)` "
            "(Grundgesamtheit). In den Stufenberichten steht dagegen "
            "`std(ddof=1)` (Stichprobe), weil die 50 Läufe eine Stichprobe "
            "sind. Beide Werte sind korrekt, unterscheiden sich aber um den "
            "Faktor `sqrt(n/(n-1))`. Bei den in der Tabelle genannten Zellen "
            "liegt der Unterschied über der Rundungstoleranz von 0,005. "
            "Beispiel Stufe 1, `uc-01`, `selector_score`: eigener Wert "
            "(ddof=1) 1,0069; `aggregates.csv` 1,00.", "",
            "### `vacuous_pass` in `aggregates.csv`", "",
            "`plot_stage.py:252` zählt `astype(str).str.lower() == \"true\"` "
            "und erfasst damit beide in den Rohdaten vorkommenden "
            "Typisierungen (Boolean und String). Die Werte stimmen mit der "
            "eigenen Rechnung überein.", ""]

    # ---------------------------------------------------------------- 2
    out += ["## 2 Format-Inkonsistenzen in den Rohdaten", ""]
    rows = []
    # vacuous_pass Typ
    typ = {}
    for s in STAGES:
        typ[s] = sorted({type(v).__name__ for v in p2[s].vacuous_pass_raw})
    rows.append(["`vacuous_pass` in `_phase2_judge.json`",
                 "; ".join(f"Stufe {s}: {', '.join(typ[s])}" for s in STAGES),
                 "Stufen 1/2/5 liefern JSON-Booleans, Stufen 3/4 die Strings "
                 "`\"true\"`/`\"false\"`. Wer die Datei ohne Normalisierung "
                 "einliest, erhält für die Stufen 3/4 in Python `bool(\"false\") "
                 "== True` und damit 499 bzw. 500 statt 10 bzw. 15 "
                 "vacuous_pass. Behandlung hier: `common._as_bool()`."])
    # leerer Score
    miss = {}
    for s in STAGES:
        kinds = set()
        n_files = 0
        for dim in c.SCORE_DIMS:
            for v in p2[s][dim + "_raw"]:
                if v is None:
                    kinds.add("null")
                elif isinstance(v, str) and not v.strip():
                    kinds.add('leerer String ""')
        n_files = int((p2[s][["coverage_score_state", "selector_score_state",
                              "assertion_score_state"]] == "missing")
                      .all(axis=1).sum())
        miss[s] = f"{n_files} Dateien, Kodierung: {', '.join(sorted(kinds)) or '-'}"
    rows.append(["fehlende Scores in `_phase2_judge.json`",
                 "; ".join(f"Stufe {s}: {miss[s]}" for s in STAGES),
                 "Nicht bewertete Dateien werden in den Stufen 1/4/5 als "
                 "`null` und in den Stufen 2/3 als leerer String geführt. "
                 "Behandlung hier: beides gilt als `missing`, getrennt von "
                 "`\"n/a\"`."])
    # file-Spalte
    rows.append(["Spalte `file` in `_phase1_results.csv`",
                 "Stufen 1-4: absoluter Windows-Pfad mit Laufwerksbuchstaben; "
                 "Stufe 5: relativer Pfad ab `tests/`",
                 "Beispiel Stufe 4: "
                 "`C:/Users/.../tests/stage_4_manual_ui_map/run_01/uc-01-...spec.ts`; "
                 "Stufe 5: `tests/stage_5_self_improvement_loop/run_01/uc-01-.../"
                 "uc-01-iter-0-...spec.ts`. Für Stufe 5 zeigt der Pfad auf die "
                 "FINALE Iteration, nicht auf eine Datei direkt im run-Ordner."])
    # duration_s Stufe 5
    rows.append(["Spalte `duration_s` in `_phase1_results.csv` der Stufe 5",
                 f"in allen {len(p1[5])} Zeilen leer",
                 "Für Stufe 5 ist aus dieser Datei keine Laufzeit ableitbar. "
                 "Ersatzquelle: `stats.duration` bzw. `results[].duration` in "
                 "den `*.result.json` der Iterationen (siehe stufe_5.md, "
                 "Abschnitt 10.3)."])
    # error_summary manuell
    man = {}
    for s in STAGES:
        ce = p1[s][p1[s].exec_category.isin(["COMPILE_ERROR"])]
        man[s] = [str(x)[:80] for x in ce.error_summary.dropna()]
    rows.append(["`error_summary` bei `COMPILE_ERROR`",
                 "Stufen 3/4: deutschsprachige Kurznotizen statt "
                 "Playwright-Ausgabe",
                 "Beispiele: "
                 + "; ".join(f"`{t}`" for t in (man[3][:2] + man[4][:1]))
                 + ". Diese Texte stammen nicht aus dem Playwright-Report; die "
                 "Zeilen wurden nach dem Lauf von Hand annotiert. Sie sind für "
                 "die regelbasierte Gruppierung eigene Signaturgruppen."])
    # error_summary Kuerzung
    lens = {s: int((p1[s].error_summary.fillna("").str.len() == 500).sum())
            for s in STAGES}
    rows.append(["`error_summary` Länge",
                 "; ".join(f"Stufe {s}: {lens[s]} Zeilen mit genau 500 Zeichen"
                           for s in STAGES),
                 "`run_phase1_eval.py:604` schneidet die Meldung auf 500 "
                 "Zeichen ab. Fehlerdetails jenseits von 500 Zeichen fehlen in "
                 "der CSV. Für Stufe 5 wurden deshalb die vollständigen "
                 "Meldungen aus den `*.result.json` verwendet."])
    out += [c.md_table(["Feld", "Befund", "Auswirkung / Behandlung"], rows), ""]

    # ---------------------------------------------------------------- 3
    out += ["## 3 Fehlende und unerwartete Datensätze", ""]
    rows = []
    for s in STAGES:
        have = set(zip(p1[s].run, p1[s].uc_id))
        soll = {(r, u) for r in c.RUN_IDS for u in c.UC_IDS}
        missing = sorted(soll - have)
        extra = sorted(have - soll)
        p2k = set(zip(p2[s].run, p2[s].uc_id))
        rows.append([f"Stufe {s}", len(p1[s]), c.SOLL_FILES,
                     ", ".join(f"`{r}/{u}`" for r, u in missing) or "-",
                     ", ".join(f"`{r}/{u}`" for r, u in extra) or "-",
                     len(p2[s]),
                     ", ".join(f"`{r}/{u}`" for r, u in sorted(have - p2k)) or "-"])
    out += [c.md_table(["Stufe", "Zeilen Phase 1", "Soll", "fehlende Lauf/UC",
                        "unerwartete Lauf/UC", "Einträge Phase 2",
                        "ohne Phase-2-Bewertung"], rows), "",
            "Die in der Aufgabenstellung genannte fehlende Kombination "
            "`run_20/uc-02` in Stufe 3 ist bestätigt: es existiert weder eine "
            "`*.spec.ts`-Datei noch eine CSV-Zeile noch ein "
            "Phase-2-Eintrag. Alle anderen Stufen sind vollständig (500 "
            "Zeilen). Es gibt in keiner Stufe eine Datei, die in Phase 1 "
            "vorkommt und in Phase 2 fehlt.", ""]

    # nicht bewertete Dateien (Score leer)
    rows = []
    for s in STAGES:
        sub = p2[s][(p2[s][["coverage_score_state", "selector_score_state",
                            "assertion_score_state"]] == "missing").all(axis=1)]
        rows.append([f"Stufe {s}", len(sub),
                     ", ".join(sorted(set(sub.exec_category))) or "-",
                     ", ".join(f"`{r.run}/{r.uc_id}`" for r in sub.itertuples())
                     or "-"])
    out += ["Phase-2-Einträge ohne numerische Scores (Eintrag vorhanden, "
            "Bewertung leer):", "",
            c.md_table(["Stufe", "n", "exec_category", "betroffene Läufe/UC"],
                       rows), "",
            "Diese Dateien sind laut `phase2_judge_prompt.md` (Zeile 112) "
            "bewusst nicht bewertet: bei `GENERATION_ERROR` bleiben die "
            "Score-Spalten leer. Sie sind in allen Mittelwerten und Medianen "
            "ausgeschlossen; der Nenner steht in jeder Tabelle "
            "(`n numerisch`).", ""]

    # map_interaction ohne Wert
    rows = []
    for s in STAGES:
        sub = p2[s][p2[s].map_interaction_score_state == "missing"]
        n_na = int((p2[s].map_interaction_score_state == "n/a").sum())
        rows.append([f"Stufe {s}", n_na, len(sub),
                     ", ".join(f"`{r.run}/{r.uc_id}` ({r.uc_id in c.MAP_UCS and 'MAP_UC' or 'kein MAP_UC'})"
                               for r in sub.itertuples()) or "-"])
    out += ["`map_interaction_score`: `n/a` gegen fehlenden Wert:", "",
            c.md_table(["Stufe", "`n/a`", "Wert fehlt", "betroffene Läufe/UC"],
                       rows), "",
            "`n/a` ist laut Prompt für alle UC ausserhalb von MAP_UCS "
            "(uc-04, uc-06, uc-07, uc-08, uc-10) vorgesehen; 250 `n/a`-Werte "
            "entsprechen genau 5 Nicht-Karten-UC × 50 Läufe. Die zusätzlich "
            "fehlenden Werte liegen in MAP_UCS und gehören zu den "
            "GENERATION_ERROR-Dateien.", ""]

    # ---------------------------------------------------------------- 4
    out += ["## 4 Widersprüche und Auffälligkeiten in der Bewertung", ""]
    rows = []
    for s in STAGES:
        vp = p2[s].vacuous_pass.astype(bool)
        merged = p2[s].merge(p1[s][["run", "uc_id", "exec_category"]],
                             on=["run", "uc_id"], how="left",
                             suffixes=("_p2", "_p1"))
        exp = (merged.exec_category_p1 == "PASS") & (merged.assertion_score <= 2)
        mism_def = int((vp.values != exp.values).sum())
        mism_cat = int((merged.exec_category_p2 != merged.exec_category_p1).sum())
        sel_bad = p2[s]["r_selector"].fillna("").map(c.strip_negations).str.contains(
            r"erfunden|existiert (?:in der App )?(?:jedoch )?nicht|halluziniert",
            case=False, regex=True)
        rows.append([f"Stufe {s}", mism_def, mism_cat,
                     int(((p2[s].selector_score >= 3) & sel_bad).sum()),
                     int((p2[s]["_reasoning_keys"]
                          != "assertion,coverage,map_interaction,selector").sum())])
    out += [c.md_table(["Stufe",
                        "`vacuous_pass` weicht von der Definition ab",
                        "`exec_category` in Phase 2 ≠ Phase 1",
                        "`selector_score` ≥ 3 trotz Begründung "
                        "„erfunden/existiert nicht“",
                        "Einträge ohne alle vier `reasoning`-Texte"], rows), "",
            "Zur Spalte „selector_score ≥ 3 trotz Begründung“: Die "
            "Begründungstexte enthalten häufig **verneinte** Aussagen "
            "(„Keine erfundenen Selektoren“, „erfundene Selektoren kommen "
            "nicht vor“). Ein einfacher Substring-Treffer auf `erfunden` "
            "zählt diese fälschlich mit - ohne Verneinungsbehandlung lägen "
            "die Werte bei 12 / 13 / 72 / 102 / 34 statt bei den oben "
            "gezeigten. `common.strip_negations()` entfernt die "
            "Verneinungsphrasen vor der Suche; dieselbe Behandlung gilt für "
            "alle Musterzählungen in `REASONING_PATTERNS`. Die verbleibenden "
            "Treffer sind bei Score 3 laut Prompt vorgesehen (Mischung aus "
            "korrektem DOM-Locator und erfundenem Zugriffspfad auf das "
            "Kartenmodell, z. B. `window.map` statt "
            "`globalThis.__openPioneerMap`); bei Score 4 verbleiben "
            "Restfälle mit anderen Verneinungsformulierungen. Die Zahl ist "
            "ein Prüfhinweis, kein Fehlerbefund.", ""]

    # identische Begruendungen
    rows = []
    for s in STAGES:
        for dim in c.DIM_SHORT.values():
            col = p2[s]["r_" + dim].fillna("")
            vc = col[col.str.len() > 0].value_counts()
            rows.append([f"Stufe {s}", dim, len(vc),
                         int((vc > 1).sum()), int(vc[vc > 1].sum()),
                         int(vc.iloc[0]) if len(vc) else 0])
    out += ["Wörtlich identische Begründungstexte (der Judge hat pro UC "
            "weitgehend denselben Text vergeben):", "",
            c.md_table(["Stufe", "Dimension", "verschiedene Texte",
                        "Texte, die mehrfach vorkommen",
                        "Dateien mit einem mehrfach vergebenen Text",
                        "häufigster Text (Dateien)"], rows), "",
            "Bei 500 Dateien und 10 Use Cases pro Stufe sind das je Dimension "
            "16 bis 30 verschiedene Texte. Die Begründungen sind damit "
            "weitgehend Vorlagen je (UC, Fehlermuster) und keine "
            "Einzelfallbeschreibungen. Für Aussagen über einzelne Dateien "
            "sind sie deshalb nur eingeschränkt belastbar.", ""]

    # ---------------------------------------------------------------- 5
    it = loop.load_iterations()
    fails = it[~it.loop_passed.astype(bool)]
    rows = [
        ["Iterationen laut `history`/`iterations`", len(it),
         "500 Läufe, Summe der Iterationen; beide Protokolldateien stimmen überein"],
        ["`*.spec.ts` je Iteration vorhanden", int(it.spec_exists.sum()), "-"],
        ["`*.result.json` je Iteration vorhanden", int(it.result_exists.sum()), "-"],
        ["fehlgeschlagene Iterationen ohne Snapshot",
         int((~fails.snapshot.astype(bool)).sum()),
         ", ".join(f"`{r.run}/{r.uc_id}` Iter. {r.iteration}"
                   for r in fails[~fails.snapshot.astype(bool)].itertuples())
         or "-"],
        ["fehlgeschlagene Iterationen ohne Screenshot",
         int((~fails.screenshot.astype(bool)).sum()),
         ", ".join(f"`{r.run}/{r.uc_id}` Iter. {r.iteration}"
                   for r in fails[~fails.screenshot.astype(bool)].itertuples())
         or "-"],
        ["`error_excerpt` auf 500 Zeichen abgeschnitten",
         int((it.loop_error_excerpt.fillna("").str.len() == 500).sum()),
         "Deshalb erfolgt die Klassifikation der Iterationen nicht über "
         "`error_excerpt`, sondern über die vollständige Meldung aus "
         "`*.result.json`"],
        ["Iterationen mit `needs_review` aus der eigenen Klassifikation",
         int(it.needs_review.astype(bool).sum()),
         "`classify_runtime_result()` konnte kein Muster zuordnen"],
        ["`max_iterations` in den Daten",
         ", ".join(str(int(x)) for x in sorted(set(it.max_iterations))),
         "Soll 10"],
        ["`screenshots_enabled`",
         ", ".join(str(x) for x in sorted({r["screenshots_enabled"]
                                           for r in c.load_stage5_summary()})),
         "-"],
    ]
    out += ["## 5 Stufe 5: Vollständigkeit des Loop-Protokolls", "",
            c.md_table(["Prüfung", "Wert", "Anmerkung"], rows), ""]

    # Vergleich error_type <-> eigene Klassifikation
    ct = pd.crosstab(it.loop_error_type, it.exec_category)
    out += ["Das Protokollfeld `error_type` ist eine eigene, gröbere Taxonomie "
            "(`assertion_fail`, `matcher_type_error`, `element_not_found`, "
            "`pointer_interception`, `timeout`, `api_misuse`, "
            "`selector_ambiguity`, `other`, `generation_error`, `none`) und "
            "nicht deckungsgleich mit den Phase-1-Kategorien. Die Kreuztabelle "
            "steht in stufe_5.md, Abschnitt 5.3. Für alle Auswertungen in "
            "diesem Bericht wird ausschließlich die Phase-1-Logik "
            "(`classify_runtime_result`) verwendet, damit Stufe 5 mit den "
            "Stufen 1-4 vergleichbar bleibt.", ""]

    # ---------------------------------------------------------------- 6
    out += ["## 6 Festlegungen und offene Punkte", "",
            "Punkte, an denen eine Entscheidung nötig war. Sie sind hier "
            "dokumentiert, damit die Zahlen nachvollziehbar bleiben.", ""]
    rows = [
        ["`run_stage_eval.py` existiert nicht",
         "Die Aufgabenstellung nennt `run_stage_eval.py` als Quelle der "
         "Klassifikationslogik. Im Repository heißt die Datei "
         "`src/app/llm/run_phase1_eval.py`. Aus ihr werden "
         "`classify_runtime_result`, `collect_test_results`, "
         "`collect_load_errors`, `scan_for_truncation` und `strip_ansi` "
         "importiert (`common.load_phase1_module()`), nicht nachgebaut."],
        ["Gruppierung von `error_summary` selbst definiert",
         "Für die Gruppierung gleicher oder nahezu gleicher Meldungen gibt es "
         "keine vorhandene Funktion. `common.error_signature()` ist eigene "
         "Logik und im Stufenbericht (Abschnitt 3) sowie im Docstring "
         "vollständig beschrieben. Sie ist deterministisch und ohne "
         "Modellbeteiligung."],
        ["Textmuster in den Judge-Begründungen selbst definiert",
         "`common.REASONING_PATTERNS` ist eigene Logik (Regex-Suche über die "
         "vier `reasoning`-Texte). Die Muster sind bewusst breit; drei von "
         "ihnen (`map-container / Canvas in der Begründung erwähnt`, "
         "`Netzwerk-/Request-Nachweis erwähnt`, "
         "`Assertion entfernt / abgeschwächt`) zählen nur die Erwähnung eines "
         "Begriffs, nicht eine bestätigte Aussage."],
        ["Referenzmenge der testids",
         "Ermittelt aus dem Anwendungsquellcode: 37 literale "
         "`data-testid`-Werte plus `eucos-station-info` und "
         "`uvi-station-info` (über die `testId`-Prop von `StationInfo.tsx`) = "
         "39, dazu die indizierte Familie `geocoder-result-item-<N>`. Die "
         "generierte UI-Map (`_stage_3_context.txt`) nennt in ihrer Kopfzeile "
         "ebenfalls „39 unique data-testid values“, listet aber nur 38 "
         "konkrete Werte plus drei unaufgelöste `...`-Zeilen; die beiden "
         "Station-Info-testids fehlen dort, weil sie über eine Prop gesetzt "
         "werden. Die Zählung „halluzinierte testids“ in diesem Bericht "
         "verwendet die Quellcode-Menge."],
        ["Rangfolge für Rückschritte in Stufe 5",
         "`GENERATION_ERROR` 0 < `COMPILE_ERROR`/`TIMEOUT` 1 < `INFRA_FAIL` 2 "
         "< `ASSERTION_FAIL` 3 < `PASS` 4. Eigene Festlegung "
         "(`report_stage5_loop.CLASS_RANK`), begründet mit dem Fortschritt der "
         "Ausführung: kein Start < kein aufgelöster Wert < aufgelöster, aber "
         "falscher Wert < erfüllt."],
        ["Ähnlichkeitsmaß für den Code",
         "`difflib.SequenceMatcher.ratio()` auf dem um Kommentare und Leerraum "
         "bereinigten Text; „nahezu identisch“ = Verhältnis ≥ 0,95. "
         "Schwellenwert selbst gesetzt; die Tabelle in stufe_5.md 9.1 nennt "
         "zusätzlich ≥ 0,99 und = 1,0."],
        ["Standardabweichung",
         "In den Stufenberichten `ddof=1` (Stichprobe), im Vergleich mit "
         "`aggregates.csv` `ddof=0` (wie `plot_stage.py`). Siehe Abschnitt 1."],
        ["Kontext der Stufe 5",
         "Die Aufgabenstellung sagt, Stufe 5 starte mit dem Kontext von "
         "Stufe 2. `_stage_5_initial_context.txt` enthält den "
         "Accessibility-Snapshot und die 24 testids aus "
         "`_stage_2_context.txt`, **zusätzlich** aber den vollständigen "
         "Quelltext von `map-model-helpers.ts` mit der Importanweisung "
         "`\"../../../../map-model-helpers\"` (Zeilen 100-234 der Datei). "
         "Stufe 5 hat damit mehr Kontext als Stufe 2. Der Vergleich in "
         "vergleich.md Abschnitt 7 ist entsprechend zu lesen."],
        ["testid-Liste im Kontext der Stufen 2 und 5",
         "Beide Kontextdateien listen nur 24 der 39 real existierenden "
         "testids (identische Liste). Nicht enthalten sind: "
         "clouds-legend, eucos-station-info, eucos-station-section, "
         "geocoder-clear-button, geocoder-results, measurement, "
         "measurement-panel, precipitation-legend, printing, printing-panel, "
         "uv-index-legend, uvi-station-info, uvi-station-section, "
         "weather-forecast, weather-forecast-entry."],
        ["Widersprüchlicher Importpfad im Kontext",
         "Die Anweisung im Kontext der Stufe 5 lautet "
         "`\"../../../../map-model-helpers\"`; der mitgelieferte Docstring der "
         "Helferdatei zeigt im Verwendungsbeispiel dagegen "
         "`\"../../llm/map-model-helpers\"`. In den Stufen 3/4 lautet die "
         "Anweisung `\"../../../map-model-helpers\"`. Tatsächlich verwendete "
         "Pfade siehe codemuster.md Abschnitt 3."],
        ["Token- und Zeitaufwand",
         "Nicht protokolliert. Es gibt in keiner Datei ein Feld zu "
         "Token-/Usage-Werten oder einen Zeitstempel je Generierung; die "
         "Dateizeitstempel im Repository sind durch das Kopieren der Ordner "
         "überschrieben. Ein Aufwandsvergleich Stufe 5 gegen Stufen 1-4 ist "
         "nur über die Zahl der Generierungsaufrufe (2154 gegen 500) und die "
         "Playwright-Ausführungszeit möglich (stufe_5.md, Abschnitt 10)."],
        ["Keine Judge-Bewertung der Zwischeniterationen in Stufe 5",
         "`_phase2_judge.json` der Stufe 5 enthält 500 Einträge, je einen für "
         "den Endstand eines Laufs. Die Judge-Dimensionen der ersten Iteration "
         "sind nicht erhoben; der in der Aufgabe geforderte Vergleich "
         "„erste Iteration gegen Stufe 2 in den Judge-Dimensionen“ ist daher "
         "nicht möglich und in vergleich.md 7.1 nur in den "
         "Phase-1-Kategorien ausgeführt."],
    ]
    out += [c.md_table(["Punkt", "Festlegung / Befund"], rows), ""]

    c.write_doc("pruefprotokoll.md", "\n".join(out))


if __name__ == "__main__":
    main()
