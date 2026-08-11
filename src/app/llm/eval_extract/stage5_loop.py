"""Zusatzauswertung für Stufe 5 (Self-Improvement-Loop).

Datenquellen
  tests/stage_5_self_improvement_loop/_stage_5_all_runs.jsonl     (Loop-Protokoll)
  tests/stage_5_self_improvement_loop/_stage_5_run_summary.json   (dasselbe + spec/Flags)
  tests/stage_5_self_improvement_loop/run_XX/<uc-dir>/*.spec.ts   (Code je Iteration)

Die Fehlerklassifikation je Iteration verwendet
run_phase1_eval.classify_runtime_result(status="failed", message=error_excerpt)
-- identisch zu map_stage5_phase1.py, das damit die Phase-1-CSV erzeugt hat.
"""

from __future__ import annotations

import difflib
import re
from collections import Counter, defaultdict

import pandas as pd

from . import common as C

PASS = "PASS"
# Rangordnung für "Rückschritt": kleinerer Rang = schlechter
SEVERITY = {"GENERATION_ERROR": 0, "COMPILE_ERROR": 1, "TIMEOUT": 2,
            "INFRA_FAIL": 3, "ASSERTION_FAIL": 4, "PASS": 5}


def iter_records() -> list[dict]:
    """Vereinigt Loop-Protokoll (JSONL) und run_summary.json zu einem Datensatz
    je (run, uc). Die Iterationsklasse wird mit classify_runtime_result
    bestimmt."""
    jl = {(e["run"], f"uc-{int(e['uc_id']):02d}"): e for e in C.load_loop_jsonl()}
    rs = {(e["run"], f"uc-{int(e['use_case_id']):02d}"): e
          for e in C.load_loop_summary()}
    specs = C.stage5_iteration_specs()

    out = []
    for key in sorted(set(jl) | set(rs)):
        run, uc = key
        a, b = jl.get(key), rs.get(key)
        src = b or a
        iters = []
        hist = (b or {}).get("history") or (a or {}).get("iterations") or []
        for h in hist:
            i = int(h["iteration"])
            msg = h.get("error_excerpt", "") or ""
            passed = bool(h.get("passed"))
            cls = PASS if passed else C.classify_runtime_result("failed", msg)[0]
            p = specs.get((run, uc, i))
            iters.append({
                "iteration": i, "passed": passed, "cls": cls,
                "error_type": h.get("error_type"),
                "error_excerpt": msg,
                "spec": h.get("spec"),
                "snapshot": h.get("failure_snapshot_captured"),
                "screenshot": h.get("failure_screenshot_captured"),
                "path": p,
                "code": p.read_text(encoding="utf-8", errors="replace") if p else None,
            })
        out.append({
            "run": run, "uc_id": uc,
            "complexity": src.get("complexity"),
            "passed": bool(src.get("passed")),
            "iterations_used": int(src.get("iterations_used", len(iters))),
            "max_iterations": (b or {}).get("max_iterations"),
            "screenshots_enabled": (b or {}).get("screenshots_enabled"),
            "final_spec": src.get("final_spec"),
            "in_jsonl": a is not None, "in_summary": b is not None,
            "iters": iters,
        })
    return out


# ---------------------------------------------------------------------------

def struktur(recs: list[dict]) -> str:
    out = ["### Struktur des Loop-Protokolls\n"]
    out.append("Zwei Dateien beschreiben denselben Lauf. Das JSONL ist die "
               "schmalere Fassung; `_stage_5_run_summary.json` enthält "
               "zusätzlich `spec`, `failure_snapshot_captured`, "
               "`failure_screenshot_captured`, `max_iterations` und "
               "`screenshots_enabled`.\n")
    rows = [
        {"Datei": "`_stage_5_all_runs.jsonl`", "Ebene": "Lauf",
         "Felder": "run, uc_id, complexity, passed, iterations_used, final_spec, iterations[]"},
        {"Datei": "`_stage_5_all_runs.jsonl`", "Ebene": "Iteration",
         "Felder": "iteration, passed, error_type, error_excerpt"},
        {"Datei": "`_stage_5_run_summary.json`", "Ebene": "Lauf",
         "Felder": "run, use_case_id, title, complexity, passed, iterations_used, "
                   "max_iterations, screenshots_enabled, final_spec, history[]"},
        {"Datei": "`_stage_5_run_summary.json`", "Ebene": "Iteration",
         "Felder": "iteration, spec, passed, failure_snapshot_captured, "
                   "failure_screenshot_captured, error_type, error_excerpt"},
    ]
    out.append(C.md_table(pd.DataFrame(rows)))

    all_it = [i for r in recs for i in r["iters"]]
    fails = [i for i in all_it if not i["passed"]]
    passes = [i for i in all_it if i["passed"]]
    rows = [{"Prüfung": k, "Wert": v} for k, v in [
        ("Läufe im JSONL", sum(1 for r in recs if r["in_jsonl"])),
        ("Läufe in run_summary.json", sum(1 for r in recs if r["in_summary"])),
        ("Läufe nur in einer der beiden Dateien",
         sum(1 for r in recs if not (r["in_jsonl"] and r["in_summary"]))),
        ("Iterationen insgesamt", len(all_it)),
        ("davon `passed = true`", len(passes)),
        ("davon `passed = false`", len(fails)),
        ("fehlgeschlagene Iterationen mit leerem `error_excerpt`",
         sum(1 for i in fails if not i["error_excerpt"].strip())),
        ("bestandene Iterationen mit nicht-leerem `error_excerpt`",
         sum(1 for i in passes if i["error_excerpt"].strip())),
        ("`error_type` fehlt", sum(1 for i in all_it if i["error_type"] is None)),
        ("fehlgeschl. Iterationen mit `failure_snapshot_captured = true`",
         sum(1 for i in fails if i["snapshot"] is True)),
        ("fehlgeschl. Iterationen mit `failure_screenshot_captured = true`",
         sum(1 for i in fails if i["screenshot"] is True)),
        ("fehlgeschl. Iterationen **ohne** Snapshot **und** ohne Screenshot",
         ", ".join(f"{r['run']}/{r['uc_id']} Iter. {i['iteration']}"
                   for r in recs for i in r["iters"]
                   if not i["passed"] and i["snapshot"] is not True
                   and i["screenshot"] is not True) or "keine"),
        ("`error_excerpt` auf 500 Zeichen gekappt (Länge = 500)",
         f"{sum(1 for i in fails if len(i['error_excerpt']) == 500)} von "
         f"{len(fails)} fehlgeschlagenen Iterationen"),
        ("bestandene Iterationen mit Snapshot-Flag `true`",
         sum(1 for i in passes if i["snapshot"] is True)),
        ("Iterationen ohne auflösbare Spec-Datei auf der Platte",
         sum(1 for i in all_it if i["path"] is None)),
        ("`iterations_used` ≠ Anzahl Einträge in `history`",
         sum(1 for r in recs if r["iterations_used"] != len(r["iters"]))),
        ("Laufzeit je Iteration protokolliert", "nein – kein Feld vorhanden"),
        ("Token-/Kostenangaben protokolliert", "nein – kein Feld vorhanden"),
    ]]
    out.append("\n**Vollständigkeit der Iterationsdatensätze:**\n")
    out.append(C.md_table(pd.DataFrame(rows)))

    et = Counter(i["error_type"] for i in all_it)
    out.append("\n`error_type` (Feld des Loop-Harness, nicht die "
               "Phase-1-Klassifikation):\n")
    out.append(C.md_table(pd.DataFrame(
        [{"error_type": k, "n Iterationen": v,
          "% aller Iterationen": C.pct(v, len(all_it))}
         for k, v in et.most_common()])))
    return "\n".join(out)


def ergebnis(recs: list[dict], p1: pd.DataFrame) -> str:
    out = ["### Ergebnis\n"]
    n = len(recs)
    out.append("Quelle Endergebnis: `_phase1_results.csv` (aus dem Loop-"
               "Protokoll erzeugt von `map_stage5_phase1.py`). "
               "Quelle `iterations_used`: Loop-Protokoll.\n")
    vc = p1["exec_category"].value_counts()
    out.append(C.md_table(pd.DataFrame(
        [{"exec_category": c, "n": int(vc[c]), "%": C.pct(int(vc[c]), len(p1))}
         for c in [c for c in C.EXEC_ORDER if c in vc.index]])))

    iu = Counter(r["iterations_used"] for r in recs)
    rows = []
    cum = 0
    for k in sorted(iu):
        cum += iu[k]
        rows.append({"iterations_used": k, "n Läufe": iu[k],
                     "%": C.pct(iu[k], n), "kumuliert": cum,
                     "kumuliert %": C.pct(cum, n)})
    out.append("\nVerteilung `iterations_used`:\n")
    out.append(C.md_table(pd.DataFrame(rows)))

    pass1 = sum(1 for r in recs if r["passed"] and r["iterations_used"] == 1)
    abort = [r for r in recs if not r["passed"]]
    maxit = Counter(r["max_iterations"] for r in recs)
    out.append("")
    out.append(f"- besteht in Iteration 1 (`passed = true`, `iterations_used = 1`): "
               f"**{pass1} / {n}** = {C.pct(pass1, n)}")
    out.append(f"- bricht ohne PASS ab: **{len(abort)} / {n}** = "
               f"{C.pct(len(abort), n)}"
               + (" – " + ", ".join(f"{r['run']}/{r['uc_id']}" for r in abort)
                  if abort else ""))
    out.append(f"- `max_iterations` in den Daten: "
               f"{', '.join(f'{k} ({v} Läufe)' for k, v in maxit.items())}")
    out.append(f"- Läufe mit `iterations_used > max_iterations`: "
               f"{sum(1 for r in recs if r['max_iterations'] and r['iterations_used'] > r['max_iterations'])}")

    # Grenznutzen
    out.append("\n**Grenznutzen je zusätzlicher Iteration** "
               "(Läufe, die genau in dieser Iteration erstmals bestehen; "
               "Quelle: `history[].passed`):\n")
    firstpass = Counter()
    for r in recs:
        fp = next((i["iteration"] for i in r["iters"] if i["passed"]), None)
        if fp is not None:
            firstpass[fp] += 1
    rows = []
    cum = 0
    for i in range(0, 10):
        cum += firstpass.get(i, 0)
        rows.append({"Iteration (0-basiert)": i, "Iteration (1-basiert)": i + 1,
                     "neu bestanden": firstpass.get(i, 0),
                     "Zuwachs in % der 500": C.pct(firstpass.get(i, 0), n),
                     "kumuliert bestanden": cum,
                     "kumulierte PASS-Rate": C.pct(cum, n)})
    out.append(C.md_table(pd.DataFrame(rows)))
    last_gain = max((i for i in range(10) if firstpass.get(i, 0) > 0), default=None)
    zero_from = next((i for i in range(10)
                      if all(firstpass.get(j, 0) == 0 for j in range(i, 10))), None)
    out.append("")
    out.append(f"- letzte Iteration mit Zuwachs: **{last_gain}** (0-basiert) "
               f"= Iteration {last_gain + 1 if last_gain is not None else '–'}")
    out.append(f"- ab Iteration **{zero_from}** (0-basiert) kommt kein Lauf mehr hinzu")
    return "\n".join(out)


def fehlerklassen(recs: list[dict]) -> str:
    out = ["### Fehlerklassen im Verlauf\n"]
    out.append("Klassifikation je Iteration mit "
               "`run_phase1_eval.classify_runtime_result(\"failed\", "
               "error_excerpt)`; bestandene Iterationen = `PASS`. "
               "Identische Logik wie in Phase 1 bzw. `map_stage5_phase1.py`.\n")

    all_it = [i for r in recs for i in r["iters"]]
    vc = Counter(i["cls"] for i in all_it)
    out.append(C.md_table(pd.DataFrame(
        [{"Fehlerklasse": k, "n Iterationen": v, "%": C.pct(v, len(all_it))}
         for k, v in sorted(vc.items(), key=lambda kv: -kv[1])])))

    # Klasse je Iterationsindex
    out.append("\nFehlerklasse je Iterationsindex:\n")
    idx = defaultdict(Counter)
    for i in all_it:
        idx[i["iteration"]][i["cls"]] += 1
    classes = [c for c in C.EXEC_ORDER if any(c in v for v in idx.values())]
    rows = []
    for k in sorted(idx):
        r = {"Iteration": k, "n": sum(idx[k].values())}
        for c in classes:
            r[c] = idx[k].get(c, 0)
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))

    # Sequenzen
    SHORT = {"PASS": "P", "ASSERTION_FAIL": "A", "INFRA_FAIL": "I",
             "COMPILE_ERROR": "C", "GENERATION_ERROR": "G", "TIMEOUT": "T"}
    seqs = {}
    for r in recs:
        seqs[(r["run"], r["uc_id"])] = "".join(
            SHORT.get(i["cls"], "?") for i in sorted(r["iters"],
                                                     key=lambda x: x["iteration"]))
    out.append("\n**Sequenzmuster** (ein Zeichen je Iteration; "
               "P = PASS, A = ASSERTION_FAIL, I = INFRA_FAIL, "
               "C = COMPILE_ERROR, T = TIMEOUT, G = GENERATION_ERROR):\n")
    cnt = Counter(seqs.values())
    rows = []
    for s, c in cnt.most_common(20):
        ucs = sorted({uc for (rn, uc), v in seqs.items() if v == s})
        rows.append({"Sequenz": "`" + s + "`", "Länge": len(s), "n Läufe": c,
                     "% der 500": C.pct(c, len(seqs)),
                     "UC": ", ".join(ucs)})
    out.append(C.md_table(pd.DataFrame(rows)))
    out.append(f"\n- verschiedene Sequenzen insgesamt: **{len(cnt)}**")

    # Anteil identischer Folgeklassen
    same = tot = 0
    for r in recs:
        it = sorted(r["iters"], key=lambda x: x["iteration"])
        for a, b in zip(it, it[1:]):
            tot += 1
            if a["cls"] == b["cls"]:
                same += 1
    out.append(f"- aufeinanderfolgende Iterationspaare insgesamt: **{tot}**")
    out.append(f"- davon mit **identischer** Fehlerklasse: **{same}** = "
               f"{C.pct(same, tot)}")

    # Übergangsmatrix
    trans = defaultdict(Counter)
    for r in recs:
        it = sorted(r["iters"], key=lambda x: x["iteration"])
        for a, b in zip(it, it[1:]):
            trans[a["cls"]][b["cls"]] += 1
    froms = [c for c in C.EXEC_ORDER if c in trans]
    tos = sorted({t for v in trans.values() for t in v},
                 key=lambda c: C.EXEC_ORDER.index(c) if c in C.EXEC_ORDER else 99)
    out.append("\n**Übergangsmatrix** (Zeile = Klasse in Iteration *i*, "
               "Spalte = Klasse in Iteration *i+1*; nur Läufe, die eine "
               "Folgeiteration hatten):\n")
    rows = []
    for f in froms:
        tot_f = sum(trans[f].values())
        r = {"von \\ nach": f, "n": tot_f}
        for t in tos:
            r[t] = trans[f].get(t, 0)
        r["→ PASS"] = trans[f].get("PASS", 0)
        r["Behebungsquote"] = C.pct(trans[f].get("PASS", 0), tot_f)
        r["bleibt gleich"] = C.pct(trans[f].get(f, 0), tot_f)
        rows.append(r)
    out.append(C.md_table(pd.DataFrame(rows)))
    out.append("\n- *Behebungsquote* = Anteil der Übergänge aus dieser Klasse, "
               "die direkt in `PASS` führen "
               "(`trans[Klasse][PASS] / sum(trans[Klasse])`).")

    # Rückschritte
    back = []
    for r in recs:
        it = sorted(r["iters"], key=lambda x: x["iteration"])
        for a, b in zip(it, it[1:]):
            if SEVERITY.get(b["cls"], 9) < SEVERITY.get(a["cls"], 9):
                back.append({"run": r["run"], "uc_id": r["uc_id"],
                             "Iteration": f"{a['iteration']} → {b['iteration']}",
                             "von": a["cls"], "nach": b["cls"]})
    out.append(f"\n**Rückschritte** (Klasse verschlechtert sich nach der "
               f"Ordnung GENERATION_ERROR < COMPILE_ERROR < TIMEOUT < "
               f"INFRA_FAIL < ASSERTION_FAIL < PASS): **{len(back)}** "
               f"von {tot} Übergängen = {C.pct(len(back), tot)}\n")
    if back:
        bd = pd.DataFrame(back)
        out.append(C.md_table(bd.groupby(["von", "nach"]).size()
                              .reset_index(name="n")
                              .sort_values("n", ascending=False)))
        out.append("\nEinzelne Rückschritte (max. 40):\n")
        out.append(C.md_table(bd.head(40)))

    # Terminale Fehlerklasse der abgebrochenen Läufe -- zentrale Tabelle
    out.append("\n### Terminale Fehlerklasse der abgebrochenen Läufe\n")
    abort = [r for r in recs if not r["passed"]]
    out.append(f"Quelle: letzte Iteration (`history[-1]`) der {len(abort)} "
               f"Läufe mit `passed = false`.\n")
    rows = []
    for r in abort:
        last = sorted(r["iters"], key=lambda x: x["iteration"])[-1]
        rows.append({"run": r["run"], "uc_id": r["uc_id"],
                     "iterations_used": r["iterations_used"],
                     "terminale Klasse": last["cls"],
                     "error_type": last["error_type"],
                     "Fehlermeldung (gekürzt)": C.esc(last["error_excerpt"], 150)})
    if rows:
        df = pd.DataFrame(rows).sort_values(["uc_id", "run"])
        out.append(C.md_table(df))
        out.append("\nAggregiert – UC × terminale Klasse:\n")
        ct = pd.crosstab(df["uc_id"], df["terminale Klasse"]).reset_index()
        ct["gesamt"] = ct.drop(columns=["uc_id"]).sum(axis=1)
        out.append(C.md_table(ct))
    else:
        out.append("- keine abgebrochenen Läufe.")
    return "\n".join(out)


def nicht_behoben(recs: list[dict]) -> str:
    out = ["### Was nicht behoben wird\n"]

    # a) identische Fehlermeldung über alle Iterationen
    def norm(m):
        return re.sub(r"\s+", " ", C.strip_ansi(m or "")).strip()[:400]

    full = [r for r in recs if len(r["iters"]) >= 10]
    same_msg = []
    same_grp = []
    for r in recs:
        it = sorted(r["iters"], key=lambda x: x["iteration"])
        msgs = [norm(i["error_excerpt"]) for i in it if not i["passed"]]
        if len(msgs) >= 10 and len(set(msgs)) == 1:
            same_msg.append((r, msgs[0]))
        grps = [C.error_group(i["error_excerpt"]) for i in it if not i["passed"]]
        if len(grps) >= 10 and len(set(grps)) == 1:
            same_grp.append((r, grps[0]))
    out.append(f"Quelle: alle Iterationen eines Laufs, Feld `error_excerpt` "
               f"(Whitespace normalisiert, auf 400 Zeichen gekürzt).\n")
    out.append(f"- Läufe mit 10 Iterationen: **{len(full)}**")
    out.append(f"- davon mit **wörtlich identischer** Meldung in allen 10 "
               f"Iterationen: **{len(same_msg)}**")
    out.append(f"- davon mit derselben **Fehlergruppe** in allen 10 "
               f"Iterationen: **{len(same_grp)}**")
    if same_msg:
        out.append("\n")
        out.append(C.md_table(pd.DataFrame(
            [{"run": r["run"], "uc_id": r["uc_id"],
              "Meldung (gekürzt)": C.esc(m, 200)} for r, m in same_msg])))
    if same_grp:
        out.append("\nLäufe mit durchgehend derselben Fehlergruppe:\n")
        out.append(C.md_table(pd.DataFrame(
            [{"run": r["run"], "uc_id": r["uc_id"], "Gruppe": g,
              "verschiedene Meldungstexte":
                  len({norm(i['error_excerpt']) for i in r['iters']
                       if not i['passed']})}
             for r, g in same_grp]).sort_values(["uc_id", "run"])))

    # b) Fehlermeldungsgruppen; welche nur in abgebrochenen Läufen
    out.append("\n**Fehlergruppen über alle Iterationen** "
               "(Regeltabelle `common.py:ERROR_GROUP_RULES`):\n")
    aborted_keys = {(r["run"], r["uc_id"]) for r in recs if not r["passed"]}
    per_grp = defaultdict(lambda: {"n": 0, "runs": set(), "ab": 0, "ucs": set()})
    for r in recs:
        for i in r["iters"]:
            if i["passed"]:
                continue
            g = C.error_group(i["error_excerpt"])
            d = per_grp[g]
            d["n"] += 1
            d["runs"].add((r["run"], r["uc_id"]))
            d["ucs"].add(r["uc_id"])
            if (r["run"], r["uc_id"]) in aborted_keys:
                d["ab"] += 1
    rows = []
    for g, d in sorted(per_grp.items(), key=lambda kv: -kv[1]["n"]):
        only_ab = d["runs"] <= aborted_keys
        rows.append({"Gruppe": g, "n Iterationen": d["n"],
                     "n Läufe": len(d["runs"]),
                     "davon abgebrochene Läufe":
                         len(d["runs"] & aborted_keys),
                     "nur in abgebrochenen Läufen": "ja" if only_ab else "nein",
                     "UC": ", ".join(sorted(d["ucs"]))})
    out.append(C.md_table(pd.DataFrame(rows)))

    # c) Canvas / Pointer-Events und Chakra-Accessible-Names
    out.append("\n**Gesondert gezählt** (Substring-Suche über "
               "`error_excerpt` aller fehlgeschlagenen Iterationen).\n\n"
               "> Einschränkung: `error_excerpt` ist im Loop-Protokoll auf "
               "500 Zeichen gekappt; bei den meisten Einträgen ist das "
               "Zeichenlimit erreicht. Muster, die erst im hinteren Teil des "
               "Playwright-Call-Logs stehen (u. a. `intercepts pointer "
               "events`, der `<canvas>`-Auszug), können deshalb im Protokoll "
               "fehlen, obwohl sie im vollständigen Fehlertext stünden. Die "
               "Nullwerte in dieser Tabelle sind Befunde über das Protokoll, "
               "nicht über die Testläufe.\n")
    SPECIAL = [
        ("Pointer-Events abgefangen", r"intercepts pointer events"),
        ("Element überdeckt / verdeckt (subtree)", r"subtree intercepts|is not visible"),
        ("Bezug auf `map-container`", r"map-container"),
        ("Bezug auf `<canvas>` / ol-viewport", r"canvas|ol-viewport"),
        ("Karten-Canvas gesamt (eine der drei vorigen Zeilen)",
         r"intercepts pointer events|map-container|canvas|ol-viewport"),
        ("Accessible Name in `getByRole(...{name:...})` nicht gefunden",
         r"getByRole\([^)]*name:"),
        ("`getByLabel` nicht gefunden", r"getByLabel"),
        ("Chakra-typisch: `<select>`/`<input>`-Erwartung verfehlt",
         r"Element is not a <select> element|Element is not an <input>"),
        ("`aria-` erwähnt", r"aria-"),
    ]
    fails = [(r, i) for r in recs for i in r["iters"] if not i["passed"]]
    rows = []
    for label, rx in SPECIAL:
        c = re.compile(rx, re.IGNORECASE)
        hit = [(r, i) for r, i in fails if c.search(i["error_excerpt"] or "")]
        runs = {(r["run"], r["uc_id"]) for r, _ in hit}
        rows.append({"Muster": label, "Regex": "`" + rx.replace("|", "\\|") + "`",
                     "n Iterationen": len(hit),
                     "% der fehlgeschl. Iterationen": C.pct(len(hit), len(fails)),
                     "n Läufe": len(runs),
                     "davon abgebrochen": len(runs & aborted_keys)})
    out.append(C.md_table(pd.DataFrame(rows)))
    return "\n".join(out)


def code_entwicklung(recs: list[dict]) -> str:
    out = ["### Entwicklung des Codes\n"]
    out.append("Quelle: die je Iteration erzeugte `*.spec.ts` "
               "(Pfad aus `history[].spec`). Ähnlichkeit: "
               "`difflib.SequenceMatcher.ratio()` über den Quelltext mit "
               "normalisiertem Whitespace. *nahezu identisch* = Ratio ≥ 0.95. "
               "Zeilendifferenz: `difflib.unified_diff`, gezählt werden "
               "geänderte/hinzugefügte/entfernte Zeilen.\n")

    def normcode(s):
        return "\n".join(l.strip() for l in (s or "").splitlines() if l.strip())

    pairs = []
    for r in recs:
        it = sorted(r["iters"], key=lambda x: x["iteration"])
        for a, b in zip(it, it[1:]):
            if a["code"] is None or b["code"] is None:
                continue
            ca, cb = normcode(a["code"]), normcode(b["code"])
            ratio = difflib.SequenceMatcher(None, ca, cb).ratio()
            la, lb = ca.splitlines(), cb.splitlines()
            diff = [l for l in difflib.unified_diff(la, lb, n=0)
                    if l[:1] in "+-" and not l.startswith(("+++", "---"))]
            pairs.append({
                "run": r["run"], "uc_id": r["uc_id"],
                "von": a["iteration"], "nach": b["iteration"],
                "ratio": ratio, "diff_lines": len(diff),
                "lines_a": len(la), "lines_b": len(lb),
                "exp_a": a["code"].count("expect("),
                "exp_b": b["code"].count("expect("),
                "cls_a": a["cls"], "cls_b": b["cls"],
            })
    df = pd.DataFrame(pairs)
    if df.empty:
        return "\n".join(out + ["- keine Iterationspaare mit Quelltext gefunden."])

    n = len(df)
    rows = [{"Kennzahl": k, "Wert": v} for k, v in [
        ("Iterationspaare mit Quelltext auf beiden Seiten", n),
        ("Ähnlichkeit – Median", f"{df.ratio.median():.3f}"),
        ("Ähnlichkeit – Mittelwert", f"{df.ratio.mean():.3f}"),
        ("nahezu identisch (Ratio ≥ 0.95)",
         f"{int((df.ratio >= 0.95).sum())} = {C.pct(int((df.ratio >= 0.95).sum()), n)}"),
        ("Ratio ≥ 0.99",
         f"{int((df.ratio >= 0.99).sum())} = {C.pct(int((df.ratio >= 0.99).sum()), n)}"),
        ("wörtlich identisch (Ratio = 1.0)",
         f"{int((df.ratio == 1.0).sum())} = {C.pct(int((df.ratio == 1.0).sum()), n)}"),
        ("Ratio < 0.5 (praktisch neu geschrieben)",
         f"{int((df.ratio < 0.5).sum())} = {C.pct(int((df.ratio < 0.5).sum()), n)}"),
        ("geänderte Zeilen – Median", f"{df.diff_lines.median():.0f}"),
        ("geänderte Zeilen – Mittelwert", f"{df.diff_lines.mean():.1f}"),
    ]]
    out.append(C.md_table(pd.DataFrame(rows)))

    out.append("\nÄhnlichkeit je Iterationsübergang:\n")
    g = df.groupby(["von", "nach"]).agg(
        n=("ratio", "size"), ratio_median=("ratio", "median"),
        ratio_mean=("ratio", "mean"),
        nahezu_identisch=("ratio", lambda s: int((s >= 0.95).sum())),
        diff_median=("diff_lines", "median")).round(3).reset_index()
    g["nahezu identisch %"] = [C.pct(int(a), int(b))
                               for a, b in zip(g["nahezu_identisch"], g["n"])]
    for c in ["von", "nach", "n", "nahezu_identisch"]:
        g[c] = g[c].astype(int).astype(str)
    g["diff_median"] = g["diff_median"].astype(int).astype(str)
    g["ratio_median"] = g["ratio_median"].map("{:.3f}".format)
    g["ratio_mean"] = g["ratio_mean"].map("{:.3f}".format)
    out.append(C.md_table(g))

    out.append("\n**Länge des Tests und Anzahl `expect(`-Aufrufe je Iteration** "
               "(nur Läufe, die diese Iteration erreicht haben):\n")
    rows = []
    per_iter = defaultdict(list)
    for r in recs:
        for i in r["iters"]:
            if i["code"] is not None:
                per_iter[i["iteration"]].append(
                    (len(normcode(i["code"]).splitlines()),
                     i["code"].count("expect(")))
    for k in sorted(per_iter):
        v = per_iter[k]
        ln = [x[0] for x in v]
        ex = [x[1] for x in v]
        rows.append({"Iteration": str(k), "n Dateien": str(len(v)),
                     "Zeilen Median": str(int(pd.Series(ln).median())),
                     "Zeilen Ø": f"{sum(ln) / len(ln):.1f}",
                     "expect( Median": str(int(pd.Series(ex).median())),
                     "expect( Ø": f"{sum(ex) / len(ex):.2f}"})
    out.append(C.md_table(pd.DataFrame(rows)))

    grew = int((df.lines_b > df.lines_a).sum())
    shrank = int((df.lines_b < df.lines_a).sum())
    same = int((df.lines_b == df.lines_a).sum())
    e_more = int((df.exp_b > df.exp_a).sum())
    e_less = int((df.exp_b < df.exp_a).sum())
    e_same = int((df.exp_b == df.exp_a).sum())
    out.append("\nRichtung der Änderung über alle Iterationspaare:\n")
    out.append(C.md_table(pd.DataFrame([
        {"Größe": "Zeilenzahl", "nimmt zu": grew, "bleibt gleich": same,
         "nimmt ab": shrank, "zu %": C.pct(grew, n), "ab %": C.pct(shrank, n)},
        {"Größe": "Anzahl `expect(`", "nimmt zu": e_more, "bleibt gleich": e_same,
         "nimmt ab": e_less, "zu %": C.pct(e_more, n), "ab %": C.pct(e_less, n)},
    ])))

    # Assertions entfernt statt korrigiert: expect( sinkt und danach PASS
    removed_then_pass = df[(df.exp_b < df.exp_a) & (df.cls_b == "PASS")]
    out.append(f"\n- Iterationspaare, in denen die Zahl der `expect(`-Aufrufe "
               f"sinkt **und** die Folgeiteration besteht: "
               f"**{len(removed_then_pass)}** = {C.pct(len(removed_then_pass), n)} "
               f"aller Paare")
    if len(removed_then_pass):
        t = removed_then_pass[["run", "uc_id", "von", "nach", "exp_a", "exp_b",
                               "lines_a", "lines_b", "ratio"]].copy()
        t.columns = ["run", "uc_id", "von", "nach", "expect vorher",
                     "expect nachher", "Zeilen vorher", "Zeilen nachher", "ratio"]
        out.append("\n" + C.md_table(t.head(40).round({"ratio": 3})))

    # letzte gegen erste Iteration je Lauf
    rows = []
    for r in recs:
        it = [i for i in sorted(r["iters"], key=lambda x: x["iteration"])
              if i["code"] is not None]
        if len(it) < 2:
            continue
        a, b = it[0], it[-1]
        rows.append({"passed": r["passed"],
                     "d_lines": len(normcode(b["code"]).splitlines())
                                - len(normcode(a["code"]).splitlines()),
                     "d_expect": b["code"].count("expect(") - a["code"].count("expect(")})
    if rows:
        d = pd.DataFrame(rows)
        out.append("\nErste gegen letzte Iteration je Lauf (nur Läufe mit ≥ 2 "
                   "Iterationen):\n")
        agg = d.groupby("passed").agg(
            n=("d_lines", "size"),
            zeilen_delta_median=("d_lines", "median"),
            zeilen_delta_mean=("d_lines", "mean"),
            expect_delta_median=("d_expect", "median"),
            expect_delta_mean=("d_expect", "mean"),
            expect_gesunken=("d_expect", lambda s: int((s < 0).sum()))
        ).round(2).reset_index()
        agg["passed"] = agg["passed"].map({True: "ja (PASS)", False: "nein (Abbruch)"})
        for c in ["n", "expect_gesunken"]:
            agg[c] = agg[c].astype(int).astype(str)
        out.append(C.md_table(agg))
    return "\n".join(out)


def aufwand(recs: list[dict]) -> str:
    out = ["### Aufwand\n"]
    all_it = [i for r in recs for i in r["iters"]]
    n_gen = len(all_it)
    rows = [{"Kennzahl": k, "Wert": v} for k, v in [
        ("Laufzeit je Lauf protokolliert",
         "nein – `_phase1_results.csv` führt `duration_s` für Stufe 5 leer "
         "(`map_stage5_phase1.py`: „keine Einzelmessung im Loop-Protokoll“); "
         "weder JSONL noch run_summary.json enthalten ein Zeitfeld"),
        ("Token-/Kostenangaben protokolliert",
         "nein – kein Feld in JSONL, run_summary.json, loop-summary.json oder "
         "result.json; `generate_tests_stage_5.py` setzt nur `max_tokens` und "
         "schreibt keine `usage`"),
        ("ersatzweise zählbar: LLM-Generierungen gesamt", n_gen),
        ("Generierungen je Lauf – Mittelwert",
         f"{n_gen / len(recs):.2f}"),
        ("Generierungen je Lauf – Median",
         f"{pd.Series([len(r['iters']) for r in recs]).median():.0f}"),
        ("Vergleich Stufen 1–4: Generierungen je Lauf", 1),
        ("Faktor Stufe 5 / Stufen 1–4 (Generierungen)",
         f"{n_gen / len(recs):.2f}×"),
        ("Playwright-Ausführungen gesamt (eine je Iteration)", n_gen),
        ("Vergleich Stufen 1–4: Playwright-Ausführungen", 500),
        ("Faktor (Ausführungen)", f"{n_gen / 500:.2f}×"),
    ]]
    out.append(C.md_table(pd.DataFrame(rows)))
    out.append("\n- Ein direkter Laufzeit- oder Tokenvergleich zu den Stufen 1–4 "
               "ist aus den vorliegenden Dateien **nicht** möglich. "
               "Die einzige protokollierte Aufwandsgröße ist die Zahl der "
               "Iterationen (= LLM-Generierungen + Testausführungen).")
    out.append("- Die Stufen 1–4 protokollieren `duration_s` je Test, das ist "
               "die *Ausführungszeit* des generierten Tests, nicht die "
               "Generierungszeit; für Stufe 5 fehlt auch diese Größe.")
    return "\n".join(out)


def section() -> str:
    recs = iter_records()
    p1 = C.load_phase1(5)
    return "\n\n".join([
        "## 6 Stufe 5: Loop-Protokoll",
        struktur(recs),
        ergebnis(recs, p1),
        fehlerklassen(recs),
        nicht_behoben(recs),
        code_entwicklung(recs),
        aufwand(recs),
    ])


if __name__ == "__main__":
    print(section()[:4000])
