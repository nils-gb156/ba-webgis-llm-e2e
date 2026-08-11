"""Erzeugt docs/eval/pruefprotokoll.md.

Sammelt alle Abweichungen zwischen eigener Rechnung und der
Referenzaggregation, alle fehlenden/unerwarteten Daten und alle Stellen mit
Unsicherheit. Die numerischen Prüfungen laufen hier erneut, damit das
Protokoll aus derselben Ausführung stammt wie die Berichte.

Aufruf:  python -m eval_extract.pruefprotokoll      (aus src/app/llm/)
"""

from __future__ import annotations

import difflib
import json
import re
from collections import Counter

import pandas as pd

from . import common as C
from . import stage_reports as SR
from . import stage5_loop as S5

STAGES = [1, 2, 3, 4, 5]
MAP_UCS = {"uc-04", "uc-06", "uc-07", "uc-08", "uc-10"}


def sec_datenlage() -> str:
    out = ["## 1 Abweichungen zwischen Aufgabenstellung und Datenlage\n"]
    rows = []

    # a) Pfade / Dateinamen
    rows.append({
        "Punkt": "Verzeichnisnamen",
        "Erwartung laut Aufgabe": "`src/app/llm/tests/stage_<n>/`",
        "Befund": "Die Verzeichnisse heißen `stage_1_baseline`, "
                  "`stage_2_accessibility_snapshot`, "
                  "`stage_3_generated_ui_map`, `stage_4_manual_ui_map`, "
                  "`stage_5_self_improvement_loop`.",
        "Umgang": "Zuordnung über `common.py:STAGE_DIRS`.",
    })

    plots = [p for s in STAGES for p in C.stage_dir(s).glob("plots")]
    aggs = list((C.LLM_DIR).rglob("aggregates.csv"))
    rows.append({
        "Punkt": "`plots/` und `aggregates.csv`",
        "Erwartung laut Aufgabe": "`src/app/llm/tests/stage_<n>/plots/` mit "
                                  "Diagrammen und `aggregates.csv`",
        "Befund": f"Existiert nicht: {len(plots)} `plots/`-Verzeichnisse, "
                  f"{len(aggs)} Dateien `aggregates.csv` im gesamten "
                  f"Arbeitsbaum. `plot_stage.py` erzeugt beides, wurde aber "
                  f"nicht ausgeführt bzw. die Ausgabe ist nicht eingecheckt.",
        "Umgang": "Statt eines Vergleichs mit einer Datei wird die "
                  "Referenzfunktion `plot_stage.write_aggregates()` auf "
                  "denselben Rohdaten ausgeführt (in ein temporäres "
                  "Verzeichnis) und zellweise gegen die eigene Rechnung "
                  "gestellt. Kein Datenverzeichnis wurde beschrieben.",
    })

    rows.append({
        "Punkt": "`run_stage_eval.py`",
        "Erwartung laut Aufgabe": "Klassifikationsfunktionen aus "
                                  "`run_stage_eval.py` importieren",
        "Befund": "Diese Datei existiert nicht. Die Klassifikationslogik "
                  "liegt in `src/app/llm/run_phase1_eval.py` "
                  "(`classify_runtime_result`, `scan_for_truncation`, "
                  "`strip_ansi`).",
        "Umgang": "Diese Funktionen werden importiert und unverändert "
                  "verwendet (`common.py`, Zeile mit "
                  "`from run_phase1_eval import …`). Für Stufe 5 wird "
                  "`classify_runtime_result('failed', error_excerpt)` je "
                  "Iteration aufgerufen – genau wie in "
                  "`map_stage5_phase1.py`, das daraus die Phase-1-CSV "
                  "erzeugt hat.",
    })

    # b) fehlende Kombination Stufe 3
    p1_3 = C.load_phase1(3)
    have = set(zip(p1_3["run"], p1_3["uc_id"]))
    disk = C.spec_files(3)
    rows.append({
        "Punkt": "„In Stufe 3 fehlt run_20/uc-02\"",
        "Erwartung laut Aufgabe": "run_20/uc-02 fehlt in Stufe 3",
        "Befund": f"Trifft **nicht** zu. `_phase1_results.csv` der Stufe 3 "
                  f"enthält {len(p1_3)} Zeilen, darunter run_20/uc-02 "
                  f"(`{('run_20', 'uc-02') in have}`); die Spec-Datei liegt "
                  f"auf der Platte "
                  f"(`{('run_20', 'uc-02') in disk}`). In **keiner** Stufe "
                  f"fehlt eine Lauf/UC-Kombination; alle fünf Stufen haben "
                  f"500 Zeilen, 500 Spec-Dateien und 500 Judge-Zeilen.",
        "Umgang": "Als Befund dokumentiert; keine Sonderbehandlung.",
    })

    # c) Stufe-5-Kontext
    ctx2 = (C.stage_dir(2) / "_stage_2_context.txt").read_text(encoding="utf-8")
    ctx5 = (C.stage_dir(5) / "_stage_5_initial_context.txt").read_text(encoding="utf-8")
    rows.append({
        "Punkt": "„Stufe 5 startet mit dem Kontext von Stufe 2\"",
        "Erwartung laut Aufgabe": "identischer Startkontext wie Stufe 2",
        "Befund": f"Trifft **nicht** zu. `_stage_2_context.txt` hat "
                  f"{len(ctx2)} Zeichen und zwei Abschnitte (testid-Liste, "
                  f"Accessibility-Tree); `_stage_5_initial_context.txt` hat "
                  f"{len(ctx5)} Zeichen und drei Abschnitte – zusätzlich den "
                  f"vollständigen Quelltext von `map-model-helpers.ts`. "
                  f"`generate_tests_stage_5.py:build_ui_context()` hängt ihn "
                  f"explizit an ("
                  f"„identical role to stage 2, plus helpers\"). Die "
                  f"testid-Liste umfasst 24 statt 19 Werte, der Scrape "
                  f"stammt aus einem späteren Lauf. "
                  f"Ähnlichkeit (`difflib.SequenceMatcher.ratio`) "
                  f"Stufe 5 ↔ Stufe 2: "
                  f"{difflib.SequenceMatcher(None, ctx5, ctx2).ratio():.3f}.",
        "Umgang": "Der Vergleich Stufe 5 ↔ Stufe 2 in `vergleich.md` "
                  "Abschnitt 7 ist mit diesem Hinweis versehen. Die "
                  "Kennzahlen selbst sind davon unberührt.",
    })

    # d) Judge-Bezug Stufe 5
    pj5 = C.load_phase2_json(5)
    it = Counter(int(m.group(1)) if (m := re.search(r"-iter-(\d+)-", r["file"]))
                 else -1 for r in pj5)
    rows.append({
        "Punkt": "Judge-Bezug in Stufe 5",
        "Erwartung laut Aufgabe": "Judge-Scores je Datei",
        "Befund": f"Der Judge hat je Lauf/UC genau die **finale** Iteration "
                  f"bewertet, nicht die erste: "
                  f"{it.get(0, 0)} Dateien mit `iter-0`, der Rest verteilt "
                  f"auf `iter-1` … `iter-9`.",
        "Umgang": "Judge-Dimensionen der ersten Iteration sind nicht "
                  "berechenbar; das steht in `vergleich.md` Abschnitt 7 und "
                  "wird nicht ersatzweise geschätzt.",
    })

    # e) Aufwand
    rows.append({
        "Punkt": "Laufzeit und Token je Lauf (Stufe 5)",
        "Erwartung laut Aufgabe": "„soweit protokolliert\"",
        "Befund": "Nicht protokolliert. `duration_s` ist in "
                  "`_phase1_results.csv` der Stufe 5 für alle 500 Zeilen "
                  "leer; weder `_stage_5_all_runs.jsonl` noch "
                  "`_stage_5_run_summary.json`, die "
                  "`*-loop-summary.json` oder die `*.result.json` enthalten "
                  "ein Zeit- oder Tokenfeld. `generate_tests_stage_5.py` "
                  "setzt nur `max_tokens` und schreibt keine `usage`.",
        "Umgang": "Ersatzweise wird die Zahl der Iterationen als einzige "
                  "protokollierte Aufwandsgröße ausgewiesen "
                  "(`stufe_5.md`, Abschnitt „Aufwand\"). Es wird nichts "
                  "hochgerechnet.",
    })

    # f) testid-Liste
    src = C.real_testids_from_source()
    md, declared = C.real_testids()
    md_named = {x for x in md if x != "..."}
    rows.append({
        "Punkt": "„die Liste der 39 real existierenden testids\"",
        "Erwartung laut Aufgabe": "39 reale testids",
        "Befund": f"Die Zahl 39 stammt aus dem Kopf von "
                  f"`generated-ui-map.md` („{declared} unique data-testid "
                  f"values\"). Die Tabelle dort enthält {len(md_named)} "
                  f"benannte Einträge plus drei Zeilen `...` "
                  f"(nicht statisch auflösbare Werte). Der Anwendungs"
                  f"quelltext liefert {len(src)} Werte; gegenüber der "
                  f"Tabelle zusätzlich: "
                  f"{', '.join('`' + x + '`' for x in sorted(src - md_named) if '${' not in x)}.",
        "Umgang": "Als Grundwahrheit wird die aus dem Quelltext "
                  "abgeleitete Liste verwendet "
                  "(`common.py:real_testids_from_source()`); die Abweichung "
                  "ist in `auffaelligkeiten.md` Schritt D genannt. Ein "
                  "dynamischer Eintrag "
                  "(`geocoder-result-item-${…}`) gilt über sein Präfix als "
                  "getroffen – mit der Quelltextliste als Referenz fällt "
                  "die Zahl der halluzinierten testids *kleiner* aus als "
                  "mit der 39er-Liste.",
    })
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


def sec_aggregates() -> str:
    out = ["## 2 Abweichungen zur Referenzaggregation\n"]
    out.append("Verglichen wurden je Stufe und je Use Case (plus GESAMT): "
               "`n`, `PASS`, die vier `*_score_mean` und `vacuous_pass` – "
               "eigene Rechnung gegen `plot_stage.write_aggregates()` auf "
               "denselben Rohdaten.\n")
    rows = []
    total = 0
    for s in STAGES:
        _tbl, diffs = SR.aggregates_check(s)
        total += len(diffs)
        rows.append({"Stufe": s, "verglichene Zellen": 11 * 7,
                     "Abweichungen": len(diffs),
                     "Details": "; ".join(diffs) if diffs else "keine"})
    out.append(C.md_table(pd.DataFrame(rows)))
    out.append(f"\n- **{total} Abweichungen insgesamt.**"
               + ("" if total else " Die eigene Rechnung stimmt in allen "
                                   "geprüften Zellen mit der "
                                   "Referenzimplementierung überein."))
    out.append("\n- Nicht abgedeckt vom Vergleich: alle Kennzahlen, die "
               "`write_aggregates()` gar nicht bildet (Streuung über die "
               "Läufe, `duration_s`, Fehlergruppen, Textmuster, "
               "Loop-Auswertung, Codemuster). Diese Zahlen sind nur gegen "
               "die Rohdaten geprüft.")
    return "\n".join(out)


def sec_fehlende_daten() -> str:
    out = ["## 3 Fehlende, leere und unerwartete Daten\n"]
    rows = []
    for s in STAGES:
        p1, p2 = C.load_phase1(s), C.load_phase2_csv(s)
        m = p1.merge(p2.drop(columns=[c for c in ["exec_category", "passed",
                                                  "iterations_used"]
                                      if c in p2.columns]),
                     on=["stage", "run", "uc_id", "file"], how="left")
        no_scores = m[m[C.SCORE_DIMS].isna().all(axis=1)]
        empty = {d: int(p2[d].isna().sum()) for d in C.SCORE_DIMS}
        dur = pd.to_numeric(p1["duration_s"], errors="coerce")
        rows.append({
            "Stufe": s,
            "Zeilen Phase 1": len(p1),
            "Zeilen Phase 2": len(p2),
            "fehlende Lauf/UC": 500 - len(set(zip(p1["run"], p1["uc_id"]))),
            "Zeilen ohne jeden Judge-Score": len(no_scores),
            "davon betroffen": ", ".join(f"{r.run}/{r.uc_id}"
                                         for r in no_scores.itertuples()) or "–",
            "leere Score-Zellen": ", ".join(f"{k.replace('_score','')}={v}"
                                            for k, v in empty.items()),
            "`duration_s` leer": int(dur.isna().sum()),
        })
    out.append(C.md_table(pd.DataFrame(rows)))
    out.append("\n- Stufe 1, `run_44/uc-03`: einzige Zeile mit "
               "`exec_category = GENERATION_ERROR` (abgeschnittene "
               "Generierung). Der Judge hat für diese Datei eine Zeile "
               "angelegt, aber alle vier Scores leer gelassen. Sie geht "
               "damit in keinen Score-Mittelwert ein – die "
               "Score-Grundmenge der Stufe 1 ist 499, nicht 500.")
    out.append("- Stufe 5, `duration_s`: für alle 500 Zeilen leer, siehe "
               "Abschnitt 1.")
    out.append("- `map_interaction_score` ist in jeder Stufe für exakt 250 "
               "Zeilen `n/a`. Das entspricht genau den fünf Nicht-Karten-UCs "
               "(uc-01, uc-02, uc-03, uc-05, uc-09) × 50 Läufe. Die "
               "MAP_UCS-Liste im Judge-Prompt "
               "(`phase2_judge_prompt.md`, Zeile 16: uc-04, uc-06, uc-07, "
               "uc-08, uc-10) wird also ausnahmslos eingehalten; es gibt "
               "keinen UC mit teils Score, teils `n/a`.")

    # exec_category-Werte, die nie vorkommen
    seen = set()
    for s in STAGES:
        seen |= set(C.load_phase1(s)["exec_category"].unique())
    never = [c for c in C.EXEC_ORDER if c not in seen]
    out.append(f"- Nie belegte `exec_category`-Werte über alle Stufen: "
               f"{', '.join('`' + c + '`' for c in never) or 'keine'}. "
               f"`COMPILE_ERROR` und `TIMEOUT` sind in "
               f"`run_phase1_eval.py` definiert, treten in den Daten aber "
               f"nirgends auf.")

    # Stufe 5 Loop
    recs = S5.iter_records()
    fails = [i for r in recs for i in r["iters"] if not i["passed"]]
    nosnap = [(r, i) for r in recs for i in r["iters"]
              if not i["passed"] and i["snapshot"] is not True]
    trunc = sum(1 for i in fails if len(i["error_excerpt"]) == 500)
    nosnap_txt = ", ".join(
        "{}/{} Iter. {}".format(r["run"], r["uc_id"], i["iteration"])
        for r, i in nosnap) or "–"
    out.append(f"- Stufe 5, Loop-Protokoll: {len(fails)} fehlgeschlagene "
               f"Iterationen. Davon ohne `failure_snapshot_captured = true`: "
               f"{len(nosnap)} – {nosnap_txt}. "
               f"Alle übrigen haben Snapshot **und** Screenshot.")
    out.append(f"- Stufe 5: `error_excerpt` ist auf 500 Zeichen gekappt; "
               f"{trunc} von {len(fails)} fehlgeschlagenen Iterationen "
               f"erreichen dieses Limit. Substring-Zählungen über "
               f"`error_excerpt` (u. a. Karten-Canvas, Pointer-Events) "
               f"sind damit nach unten verzerrt: Muster, die erst im "
               f"hinteren Teil des Call-Logs stehen, fehlen im Protokoll. "
               f"Die entsprechende Tabelle in `stufe_5.md` ist mit diesem "
               f"Hinweis versehen.")
    return "\n".join(out)


def sec_eigene_logik() -> str:
    out = ["## 4 Eigene Logik (nicht aus dem Bestand übernommen)\n"]
    out.append("Diese Auswertungen haben in `run_phase1_eval.py` oder "
               "`plot_stage.py` keine Entsprechung und wurden neu "
               "geschrieben. Sie sind als eigene Logik gekennzeichnet.\n")
    rows = [
        {"Auswertung": "Gruppierung der `error_summary`",
         "Ort": "`common.py:ERROR_GROUP_RULES`, `error_group()`",
         "Art": "geordnete Regeltabelle, erste passende Regel gewinnt; "
                "Reihenfolge folgt der Prüfreihenfolge in "
                "`classify_runtime_result()`"},
        {"Auswertung": "normalisierter Fehlerkopf",
         "Ort": "`common.py:error_headline()`",
         "Art": "erste Fehlerzeile, Zeichenketten → `<s>`, Zahlen → `<n>`"},
        {"Auswertung": "Muster in den Judge-Begründungen",
         "Ort": "`stage_reports.py:REASON_PATTERNS`, `match_reason()`",
         "Art": "Regex je Muster, satzweise ausgewertet; Negationswörter "
                "im selben Satz markieren den Treffer als negiert"},
        {"Auswertung": "Widersprüche Score ↔ Begründung",
         "Ort": "`stage_reports.py:bewertungs_auffaelligkeiten()`",
         "Art": "drei feste Prüfregeln, im Bericht ausgeschrieben"},
        {"Auswertung": "Rangordnung für „Rückschritt\" (Stufe 5)",
         "Ort": "`stage5_loop.py:SEVERITY`",
         "Art": "GENERATION_ERROR < COMPILE_ERROR < TIMEOUT < INFRA_FAIL "
                "< ASSERTION_FAIL < PASS"},
        {"Auswertung": "Codeähnlichkeit zwischen Iterationen",
         "Ort": "`stage5_loop.py:code_entwicklung()`",
         "Art": "`difflib.SequenceMatcher.ratio()` auf dem Quelltext mit "
                "normalisiertem Whitespace; „nahezu identisch\" = ≥ 0.95"},
        {"Auswertung": "Auswahl der auffälligen Zellen",
         "Ort": "`anomalies.py:SELECT_RULES`, `schritt_a()`",
         "Art": "vier numerische Regeln (0 %, ≥ 30 pp gegen Stufenmittel, "
                "≥ 25 pp Sprung, Δ 1→4 ≤ 0)"},
        {"Auswertung": "Codemuster (Schritt D)",
         "Ort": "`anomalies.py:BASE_PATTERNS`, `EXTRA_PATTERNS`, "
                "`count_map_container_assertions()`",
         "Art": "Regex je Muster über den Quelltext; für "
                "`map-container`-Assertions zusätzlich Auflösung der "
                "Locator-Variablen"},
        {"Auswertung": "reale testid-Liste",
         "Ort": "`common.py:real_testids_from_source()`",
         "Art": "`data-testid=\"…\"`, `data-testid={`…`}` und das "
                "`testId`-Prop aus `src/app/**/*.tsx|ts` ohne `llm/`"},
    ]
    out.append(C.md_table(pd.DataFrame(rows)))

    # Kontrollrechnung Gruppierung vs. Klassifikation
    out.append("\n**Kontrolle der eigenen Gruppierung gegen die "
               "übernommene Klassifikation.** Erwartete Zuordnung "
               "Gruppe → `exec_category`; gezählt werden Zeilen, die davon "
               "abweichen:\n")
    exp = {"A_generierung_abgeschnitten": "GENERATION_ERROR",
           "B_cannot_find_module": "COMPILE_ERROR",
           "C_strict_mode_violation": "INFRA_FAIL",
           "D_element_not_found": "INFRA_FAIL",
           "E_js_laufzeitfehler": "INFRA_FAIL",
           "F_test_ended_offener_call": "INFRA_FAIL",
           "G_target_closed": "INFRA_FAIL",
           "H_pointer_events_abgefangen": "INFRA_FAIL",
           "I_element_nicht_stabil_sichtbar": "INFRA_FAIL",
           "J_konkreter_received_wert": "ASSERTION_FAIL",
           "K_locator_aufgeloest_aktion_scheitert": "ASSERTION_FAIL",
           "L_predicate_timeout": "ASSERTION_FAIL",
           "M_timeout_beim_warten_auf_locator": "INFRA_FAIL",
           "N_generischer_test_timeout": "INFRA_FAIL"}
    rows = []
    for s in STAGES:
        p1 = C.load_phase1(s)
        f = p1[p1.exec_category != "PASS"].copy()
        f["grp"] = f["error_summary"].map(C.error_group)
        bad = f[f.apply(lambda r: r["grp"] in exp
                        and exp[r["grp"]] != r["exec_category"], axis=1)]
        detail = ", ".join(f"{a}→{b}: {n}" for (a, b), n in
                           bad.groupby(["grp", "exec_category"]).size().items())
        rows.append({"Stufe": s, "Fehlschläge": len(f),
                     "Abweichungen": len(bad),
                     "Anteil": C.pct(len(bad), len(f)),
                     "Details": detail or "–"})
    out.append(C.md_table(pd.DataFrame(rows)))
    out.append("\n- Die Abweichungen entstehen dort, wo eine Meldung "
               "mehrere Muster gleichzeitig trägt und die Regeltabelle "
               "früher zuschlägt als `classify_runtime_result()`. Sie "
               "betreffen nur die Gruppenzuordnung im Bericht, nicht die "
               "`exec_category` – diese stammt unverändert aus "
               "`_phase1_results.csv`. Die Gruppentabellen in den "
               "Stufenberichten enthalten deshalb zusätzlich die Kreuztabelle "
               "Gruppe × `exec_category`.")
    return "\n".join(out)


def sec_unsicher() -> str:
    out = ["## 5 Stellen mit Unsicherheit\n"]
    rows = [
        {"Stelle": "Negationserkennung in den Judge-Begründungen",
         "Unsicherheit": "Die satzweise Negationsprüfung "
                         "(`kein`, `nicht`, `ohne`, `statt`, `weder`) trennt "
                         "„erfundener Selektor\" nicht zuverlässig von "
                         "„keine Erfindung\", wenn beides in einem Satz "
                         "steht oder die Verneinung über die Satzgrenze "
                         "reicht.",
         "Auswirkung": "Die Spalten „nicht negiert\"/„negiert\" in den "
                       "Mustertabellen sind Näherungen. Die Spalte "
                       "„Dateien gesamt\" (Treffer unabhängig von der "
                       "Verneinung) ist exakt."},
        {"Stelle": "Regeltabelle der Fehlergruppen",
         "Unsicherheit": "Die Reihenfolge der Regeln entscheidet bei "
                         "Meldungen mit mehreren Mustern. `H` (Pointer-"
                         "Events) steht bewusst vor `J`/`K`, damit das "
                         "Canvas-Symptom sichtbar bleibt – das weicht von "
                         "der Reihenfolge in `classify_runtime_result()` ab.",
         "Auswirkung": "Siehe Abschnitt 4, Kontrolltabelle: 0–13 Zeilen je "
                       "Stufe (max. 5,3 % der Fehlschläge)."},
        {"Stelle": "Schwelle „nahezu identischer Code\" (Stufe 5)",
         "Unsicherheit": "Der Wert 0.95 für "
                         "`SequenceMatcher.ratio()` ist gesetzt, nicht "
                         "hergeleitet.",
         "Auswirkung": "Der Bericht nennt zusätzlich die Schwellen 0.99 "
                       "und 1.0 sowie Median und Mittelwert, damit die "
                       "Aussage nicht an einer Schwelle hängt."},
        {"Stelle": "„Assertion prüft das falsche Element\"",
         "Unsicherheit": "Ob eine Assertion inhaltlich das falsche Element "
                         "prüft, lässt sich nicht regelbasiert entscheiden. "
                         "Gezählt wird nur, ob der Judge das in seiner "
                         "Begründung so formuliert, und getrennt davon, ob "
                         "die Assertion syntaktisch auf `map-container` "
                         "zielt.",
         "Auswirkung": "Beide Zahlen sind als das ausgewiesen, was sie "
                       "messen; sie werden nicht zu einer Aussage über "
                       "Korrektheit zusammengefasst."},
        {"Stelle": "Auswahl der Stichprobendateien (Schritt C)",
         "Unsicherheit": "Je Zelle wurden die ersten fünf Läufe der "
                         "größten Fehlergruppe gelesen, nicht zufällig "
                         "gezogen.",
         "Auswirkung": "Die Beschreibungen aus Schritt C sind nicht "
                       "repräsentativ gemeint; jedes daraus abgeleitete "
                       "Muster wird in Schritt D über alle 500 Dateien der "
                       "Stufe ausgezählt."},
        {"Stelle": "Halluzinierte testids",
         "Unsicherheit": "Referenz ist der aktuelle Anwendungsquelltext. "
                         "Ob die Anwendung zum Zeitpunkt der "
                         "Testgenerierung dieselben testids hatte, ist aus "
                         "den Daten nicht belegbar. Die Kontextdatei der "
                         "Stufe 2 listet 19, die der Stufe 5 24 testids – "
                         "die Anwendung hat 40.",
         "Auswirkung": "Die Zahlen für Stufe 1 (30 Dateien mit "
                       "halluzinierten testids) stehen unter diesem "
                       "Vorbehalt; ab Stufe 2 ist der Befund 0, dort "
                       "spielt er keine Rolle."},
        {"Stelle": "Zuordnung Spec-Datei ↔ CSV-Zeile in Stufe 5",
         "Unsicherheit": "Die Spalte `file` in `_phase1_results.csv` der "
                         "Stufe 5 ist relativ zu `src/app/llm/`, in den "
                         "Stufen 1–4 absolut. Für die Codeauswertung wird "
                         "die Datei über `final_spec` aus dem "
                         "Loop-Protokoll aufgelöst.",
         "Auswirkung": "Alle 500 Dateien ließen sich auflösen; keine "
                       "Auswirkung auf die Zahlen."},
        {"Stelle": "`vacuous_pass`",
         "Unsicherheit": "keine – die Definition im Judge-Prompt "
                         "(`phase2_judge_prompt.md`: „true genau dann, wenn "
                         "exec_category=PASS UND assertion_score <= 2\") "
                         "ist identisch mit der Definition in der "
                         "Aufgabenstellung.",
         "Auswirkung": "Die Nachrechnung stimmt in allen fünf Stufen "
                       "exakt mit dem Judge-Flag überein (0 Abweichungen)."},
    ]
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


def sec_judge() -> str:
    out = ["## 6 Auffälligkeiten in den Judge-Daten selbst\n"]
    out.append("Nicht als Fehler gemeldet, aber für die Einordnung der "
               "Phase-2-Zahlen wichtig.\n")
    rows = []
    for s in STAGES:
        pj = C.load_phase2_json(s)
        r = {"Stufe": s}
        for dim in ["coverage", "selector", "map_interaction", "assertion"]:
            texts = [x.get("reasoning", {}).get(dim, "") for x in pj]
            cnt = Counter(texts)
            r[dim] = f"{len(cnt)} versch. / max {max(cnt.values())}"
        rows.append(r)
    out.append("Verschiedene Begründungstexte je Teiltext und Stufe "
               "(Format: *Anzahl verschiedener Texte* / *häufigster Text "
               "kommt so oft vor*; Grundmenge je Zelle 500 Dateien):\n")
    out.append(C.md_table(pd.DataFrame(rows)))
    out.append("\n- In allen Stufen und allen vier Teiltexten liegt die "
               "Zahl verschiedener Begründungstexte weit unter 500; der "
               "häufigste Text steht in bis zu 50 Dateien, also in allen "
               "50 Läufen eines Use Case. Die Begründungen sind damit "
               "überwiegend **pro Use Case** formuliert, nicht pro Datei. "
               "Die Mustertabellen in den Stufenberichten zählen Dateien; "
               "eine Häufigkeit von z. B. 50 entspricht typischerweise "
               "einem einzigen Urteil über einen ganzen Use Case.")
    out.append("- Mehrere Begründungstexte verweisen auf eine eigene "
               "`grep`-Verifikation des Judge (Formulierung "
               "„grep-verifiziert\"), also auf eine laufübergreifende "
               "Betrachtung. Das stützt denselben Befund.")
    return "\n".join(out)


def main():
    C.OUT_DIR.mkdir(parents=True, exist_ok=True)
    parts = [
        "# Prüfprotokoll",
        "",
        "Erzeugt mit `src/app/llm/eval_extract/pruefprotokoll.py`. "
        "Enthält alle Abweichungen zwischen eigener Rechnung und der "
        "Referenzaggregation, alle fehlenden oder unerwarteten Daten und "
        "alle Stellen, an denen eine Entscheidung getroffen werden musste.",
        "",
        sec_datenlage(), "",
        sec_aggregates(), "",
        sec_fehlende_daten(), "",
        sec_eigene_logik(), "",
        sec_unsicher(), "",
        sec_judge(), "",
    ]
    (C.OUT_DIR / "pruefprotokoll.md").write_text("\n".join(parts),
                                                 encoding="utf-8")
    print("[OK] pruefprotokoll.md")


if __name__ == "__main__":
    main()
