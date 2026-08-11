# eval_extract

Aggregationsskripte für die Auswertung der Evaluationsdaten der Stufen 1–5.
Erzeugt die Berichte unter `docs/eval/`.

## Ausführen

```bash
cd src/app/llm
python -m eval_extract.run_all
```

Benötigt `pandas` und `matplotlib` (letzteres nur, weil `plot_stage.py`
importiert wird). Die Skripte lesen ausschließlich; keine Datei unter
`tests/` wird verändert.

Einzeln:

```bash
python -m eval_extract.stage_reports   # docs/eval/stufe_1.md … stufe_5.md
python -m eval_extract.compare         # docs/eval/vergleich.md
python -m eval_extract.anomalies       # docs/eval/auffaelligkeiten.md
python -m eval_extract.pruefprotokoll  # docs/eval/pruefprotokoll.md
```

## Dateien

| Datei               | Inhalt                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `common.py`         | Laden der Rohdaten, Stufenzuordnung, Regeltabelle für die Fehlergruppen, Codemuster-Scan, reale testid-Liste, Markdown-Tabellen |
| `stage_reports.py`  | Bestandsaufnahme, Grundmenge, Phase 1, Phase 2 je Stufe; Abgleich mit `plot_stage.write_aggregates()`                           |
| `stage5_loop.py`    | Loop-Auswertung der Stufe 5 (Iterationen, Sequenzen, Übergangsmatrix, Codeentwicklung, Aufwand)                                 |
| `compare.py`        | Stufenvergleich                                                                                                                 |
| `anomalies.py`      | Schritte A–E der Auffälligkeitsanalyse plus Hypothesen-Abschnitt                                                                |
| `stichprobe.py`     | Reine Datendatei: Beschreibung der in Schritt C gelesenen Dateien                                                               |
| `pruefprotokoll.py` | Abweichungen, fehlende Daten, Unsicherheiten                                                                                    |
| `run_all.py`        | erzeugt alles neu                                                                                                               |

## Übernommene Logik

Die Klassifikation wird **nicht** nachgebaut, sondern importiert:

- `run_phase1_eval.classify_runtime_result()` – Fehlerklasse aus Status und
  Meldung; in `stage5_loop.py` je Iteration angewandt, wie es
  `map_stage5_phase1.py` für die Phase-1-CSV tut
- `run_phase1_eval.scan_for_truncation()`, `run_phase1_eval.strip_ansi()`
- `plot_stage.load_and_merge()` – Join Phase 1 ⋈ Phase 2
- `plot_stage.write_aggregates()` – Referenzaggregation für den Abgleich

Eigene Logik (Fehlergruppierung, Textmuster, Codemuster, Zellauswahl,
Ähnlichkeitsmaß) ist in `docs/eval/pruefprotokoll.md`, Abschnitt 4,
vollständig aufgeführt.
