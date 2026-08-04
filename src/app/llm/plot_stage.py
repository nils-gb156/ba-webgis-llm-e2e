#!/usr/bin/env python3
"""
plot_stage.py — Diagramme aus den Evaluationsergebnissen einer Stage.

Joint _phase1_results.csv (deterministische Ausführung) und
_phase2_judge.csv (LLM-Judge-Scores) über stage,run,uc_id,file und
erzeugt die zentralen Diagramme + eine Aggregations-CSV.

Für alle 5 Stages identisch verwendbar. Bei Stage 5 stammt die
_phase1_results.csv aus map_stage5_phase1.py (Loop-Protokoll statt
separatem Eval-Lauf); zusätzlich werden zwei loop-spezifische
Diagramme aus _stage_5_all_runs.jsonl erzeugt.

Nutzung (aus src/app/llm/ heraus):
    python plot_stage.py --stage1
    python plot_stage.py --stage2
    python plot_stage.py --stage3
    python plot_stage.py --stage4
    python plot_stage.py --stage5

Erzeugt in tests/<stage>/plots/:
    exec_category_by_uc.png     gestapelte Ausführungskategorien pro UC
    score_distribution.png      Verteilung der Score-Stufen je Dimension
    score_heatmap.png           mittlerer Score je UC x Dimension
    aggregates.csv              Aggregierte Kennzahlen (für eigene Plots/Tabellen)

Zusätzlich nur bei --stage5:
    loop_convergence.png        kumulierte PASS-Rate nach Iteration
    loop_iterations_by_uc.png   PASS-Iteration pro UC (gestapelt) + FAIL

Hinweis: Bei einem Proberun mit wenigen Runs sind die Diagramme zur
Diagnose gedacht, nicht als finale Ergebnisse für die Arbeit.
"""

import argparse
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import numpy as np
import pandas as pd

SCRIPT_DIR = Path(__file__).resolve().parent

STAGE_DIRS = {
    "stage1": "stage_1_baseline",
    "stage2": "stage_2_accessibility_snapshot",
    "stage3": "stage_3_generated_ui_map",
    "stage4": "stage_4_manual_ui_map",
    "stage5": "stage_5_self_improvement_loop",
}

# Anzeigenamen für Plot-Titel (konsistent mit der Benennung in der Arbeit)
STAGE_LABELS = {
    "stage1": "Stufe 1: Baseline (kein UI-Kontext)",
    "stage2": "Stufe 2: Automatischer Accessibility-Snapshot",
    "stage3": "Stufe 3: Automatisch generierte UI-Map",
    "stage4": "Stufe 4: Manuell erstellte UI-Map",
    "stage5": "Bonus-Stufe 5: Self-Improvement-Loop",
}

# feste Reihenfolge/Farben, damit alle Stages vergleichbar aussehen.
# Palette: Okabe-Ito (colorblind-sicher, auch in Graustufen unterscheidbar).
# Semantik: PASS = blau (Erfolg), Fehlerstufen in Orange/Vermilion nach
# Schweregrad, Pipeline-/Compile-Befunde in klar abgesetzten Tönen.
EXEC_ORDER = ["PASS", "ASSERTION_FAIL", "INFRA_FAIL", "COMPILE_ERROR",
              "GENERATION_ERROR", "TIMEOUT"]
EXEC_COLORS = {
    "PASS": "#0072B2",             # blau
    "ASSERTION_FAIL": "#E69F00",   # orange
    "INFRA_FAIL": "#D55E00",       # vermilion (rot-orange)
    "COMPILE_ERROR": "#CC79A7",    # rosa/magenta
    "GENERATION_ERROR": "#000000", # schwarz -- hebt sich klar ab
    "TIMEOUT": "#999999",          # grau
}
# Reihenfolge in allen Plots: coverage -> selector -> map_interaction ->
# assertion. map_interaction_score ist für Nicht-Karten-UCs "n/a" (siehe
# MAP_UCS im Judge-Prompt) und wird beim Einlesen zu NaN -> in Mittelwerten/
# Verteilungen ausgeklammert, in der Heatmap als neutrale n/a-Zelle.
SCORE_DIMS = ["coverage_score", "selector_score", "map_interaction_score",
              "assertion_score"]

# Einheitliches Farbschema für die ordinalen Judge-Scores (1-4) in
# score_distribution UND score_heatmap: Farbverlauf aus der Okabe-Ito-Palette
# der anderen Grafiken -- Score 1 = dunkelorange, 2 = hellorange, 3 = hellblau,
# 4 = dunkelblau. Die Orangetöne sind identisch mit exec_category_by_uc
# (#D55E00 = INFRA_FAIL, #E69F00 = ASSERTION_FAIL). Colorblind-sicher; die
# vier diskreten Stufen sind exakt die Stützstellen des kontinuierlichen
# Verlaufs, damit score_distribution und score_heatmap dieselbe Farblogik nutzen.
SCORE_GRADIENT = ["#D55E00", "#E69F00", "#56B4E9", "#0072B2"]
SCORE_CMAP = LinearSegmentedColormap.from_list("score_orange_blue", SCORE_GRADIENT)
SCORE_LEVEL_COLORS = {1: "#D55E00", 2: "#E69F00", 3: "#56B4E9", 4: "#0072B2"}

# Farbverlauf für die PASS-Iteration in Stage-5-Plots (früh = dunkelblau,
# spät = hell), FAIL = vermilion. Colorblind-sicher gewählt.
ITER_COLORS = {0: "#0072B2", 1: "#56B4E9", 2: "#88CCEE", 3: "#B8E0F5", 4: "#DDEEF9"}
FAIL_COLOR = "#D55E00"


def load_and_merge(stage_dir: Path) -> pd.DataFrame:
    p1 = stage_dir / "_phase1_results.csv"
    p2 = stage_dir / "_phase2_judge.csv"
    if not p1.exists():
        sys.exit(f"[FEHLER] {p1} fehlt")
    if not p2.exists():
        sys.exit(f"[FEHLER] {p2} fehlt")

    df1 = pd.read_csv(p1)
    df2 = pd.read_csv(p2)

    # Join über die identifizierenden Spalten. exec_category kommt aus Phase 1
    # (deterministisch) -- aus df2 entfernen, um Dubletten zu vermeiden.
    # Gleiches gilt für die Stage-5-Metadatenspalten, falls der Judge sie
    # in seine CSV übernommen hat.
    key = ["stage", "run", "uc_id", "file"]
    drop_cols = [c for c in ["exec_category", "passed", "iterations_used"]
                 if c in df2.columns]
    df2_scores = df2.drop(columns=drop_cols)
    df = df1.merge(df2_scores, on=key, how="left")

    missing = [d for d in SCORE_DIMS if d not in df.columns]
    if missing:
        print(f"[WARNUNG] Score-Spalte(n) fehlen in _phase2_judge.csv: "
              f"{', '.join(missing)} -- Judge-Lauf mit altem Prompt? "
              f"Plots werden ohne diese Dimension(en) erzeugt.")
    for dim in SCORE_DIMS:
        if dim in df.columns:
            df[dim] = pd.to_numeric(df[dim], errors="coerce")
    return df


def plot_exec_by_uc(df: pd.DataFrame, out: Path, stage_label: str):
    ucs = sorted(df["uc_id"].unique())
    present = [c for c in EXEC_ORDER if c in df["exec_category"].unique()]
    counts = {c: [len(df[(df.uc_id == uc) & (df.exec_category == c)]) for uc in ucs]
              for c in present}

    fig, ax = plt.subplots(figsize=(10, 5.5))
    bottom = [0] * len(ucs)
    handles = {}
    for c in present:
        bars = ax.bar(ucs, counts[c], bottom=bottom, label=c, color=EXEC_COLORS.get(c))
        handles[c] = bars
        bottom = [b + v for b, v in zip(bottom, counts[c])]
    ax.set_ylabel("Anzahl Testdateien")
    ax.set_xlabel("Use Case")
    ax.set_title(f"Ausführungskategorien pro Use Case\n{stage_label}")
    # Legende in visueller Stapelreihenfolge (oben im Balken zuerst)
    legend_order = list(reversed(present))
    ax.legend([handles[c] for c in legend_order], legend_order,
              loc="upper center", bbox_to_anchor=(0.5, -0.22),
              ncol=len(present), fontsize=8)
    plt.xticks(rotation=45, ha="right")
    fig.subplots_adjust(bottom=0.32)
    fig.savefig(out, dpi=150)
    plt.close(fig)


def plot_score_distribution(df: pd.DataFrame, out: Path, stage_label: str):
    """Verteilung der ordinalen Judge-Scores (1-4) je Dimension als
    gestapelte Balken. Passt zur 4-stufigen Rubrik besser als ein Boxplot,
    weil er zeigt, wie viele Tests auf welchem Score-Wert liegen.
    Legende sagt bewusst "Score", nicht "Stufe" -- "Stufe" ist in der
    Arbeit für die Kontextstufen (UV) reserviert."""
    dims = [d for d in SCORE_DIMS if d in df.columns]
    labels = [d.replace("_score", "") for d in dims]

    fig, ax = plt.subplots(figsize=(8, 5))
    bottom = [0] * len(dims)
    for level in [1, 2, 3, 4]:
        heights = [int((df[d] == level).sum()) for d in dims]
        bars = ax.bar(labels, heights, bottom=bottom,
                      label=f"Score {level}",
                      color=SCORE_LEVEL_COLORS[level],
                      edgecolor="white", linewidth=0.4)
        # Zahl in jedes Segment schreiben, wenn groß genug; Schriftfarbe
        # an Segmenthelligkeit anpassen (helle Segmente -> schwarze Schrift)
        for bar, h, b in zip(bars, heights, bottom):
            if h >= 3:
                ax.text(bar.get_x() + bar.get_width() / 2, b + h / 2,
                        str(h), ha="center", va="center",
                        color="black", fontsize=9, fontweight="bold")
        bottom = [b + h for b, h in zip(bottom, heights)]

    ax.set_ylabel("Anzahl Testdateien")
    ax.set_title(f"Verteilung der Judge-Scores je Dimension\n{stage_label}")
    handles, lbls = ax.get_legend_handles_labels()
    ax.legend(reversed(handles), reversed(lbls),
              title="Judge-Score",
              loc="center left", bbox_to_anchor=(1.02, 0.5), fontsize=9)
    fig.tight_layout()
    fig.savefig(out, dpi=150)
    plt.close(fig)


def plot_score_heatmap(df: pd.DataFrame, out: Path, stage_label: str):
    ucs = sorted(df["uc_id"].unique())
    dims = [d for d in SCORE_DIMS if d in df.columns]
    matrix = [[df[df.uc_id == uc][dim].mean() for dim in dims] for uc in ucs]

    fig, ax = plt.subplots(figsize=(6.5, 7))
    # Farbverlauf orange/gelb -> hellblau -> dunkelblau (Okabe-Ito):
    # niedriger Score = orange, hoher Score = dunkelblau. Gleiche Farblogik wie
    # in score_distribution, dadurch sind beide Grafiken gemeinsam lesbar.
    # map_interaction_score ist für Nicht-Karten-UCs "n/a" -> NaN im Mittel.
    # Solche Zellen neutral grau (set_bad) statt als Score einfärben.
    cmap = SCORE_CMAP.copy()
    cmap.set_bad(color="#E5E5E5")
    matrix_ma = np.ma.masked_invalid(matrix)
    im = ax.imshow(matrix_ma, cmap=cmap, vmin=1, vmax=4, aspect="auto")
    ax.set_xticks(range(len(dims)))
    ax.set_xticklabels([d.replace("_score", "") for d in dims])
    ax.set_yticks(range(len(ucs)))
    ax.set_yticklabels(ucs)
    for i in range(len(ucs)):
        for j in range(len(dims)):
            v = matrix[i][j]
            if pd.notna(v):
                # einheitliche Schriftfarbe (schwarz) für alle Zellen
                ax.text(j, i, f"{v:.1f}", ha="center", va="center",
                        fontsize=8, color="black")
            else:
                # n/a (map_interaction für Nicht-Karten-UCs)
                ax.text(j, i, "n/a", ha="center", va="center",
                        fontsize=7, color="#888888")
    ax.set_title(f"Mittlerer Score je UC × Dimension\n{stage_label}")
    fig.colorbar(im, ax=ax, label="Ø Score (1–4)")
    fig.tight_layout()
    fig.savefig(out, dpi=150)
    plt.close(fig)


def write_aggregates(df: pd.DataFrame, out: Path):
    rows = []
    ucs = sorted(df["uc_id"].unique())
    for uc in ucs + ["GESAMT"]:
        sub = df if uc == "GESAMT" else df[df.uc_id == uc]
        row = {"uc_id": uc, "n": len(sub)}
        for c in EXEC_ORDER:
            row[c] = int((sub.exec_category == c).sum())
        for dim in SCORE_DIMS:
            if dim not in sub.columns:
                continue
            vals = sub[dim].dropna()
            row[f"{dim}_mean"] = round(vals.mean(), 2) if len(vals) else ""
            row[f"{dim}_median"] = vals.median() if len(vals) else ""
            row[f"{dim}_std"] = round(vals.std(ddof=0), 2) if len(vals) else ""
        row["vacuous_pass"] = int((sub.get("vacuous_pass", pd.Series(dtype=str))
                                   .astype(str).str.lower() == "true").sum())
        # Stage-5-Metadaten, falls vorhanden
        if "iterations_used" in sub.columns:
            iters = pd.to_numeric(sub["iterations_used"], errors="coerce").dropna()
            row["iterations_mean"] = round(iters.mean(), 2) if len(iters) else ""
        rows.append(row)
    pd.DataFrame(rows).to_csv(out, index=False)


# ---------------------------------------------------------------------------
# Loop-spezifische Plots (nur Stage 5, Datenquelle: _stage_5_all_runs.jsonl)
# ---------------------------------------------------------------------------

def load_loop_jsonl(stage_dir: Path) -> list[dict]:
    jsonl = stage_dir / "_stage_5_all_runs.jsonl"
    if not jsonl.exists():
        print(f"[WARNUNG] {jsonl} fehlt -- Loop-Plots werden übersprungen")
        return []
    entries = []
    with jsonl.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                entries.append(json.loads(line))
    return entries


def pass_iteration(entry: dict) -> int | None:
    """Iteration (0-basiert), in der der Loop bestanden hat, oder None."""
    for it in entry.get("iterations", []):
        if it.get("passed"):
            return int(it.get("iteration", 0))
    return None


def plot_loop_convergence(entries: list[dict], max_iters: int, out: Path,
                          stage_label: str):
    """Kumulierte PASS-Rate nach Iteration k über alle UC×Run-Einträge.
    Zeigt den Grenznutzen jeder weiteren Loop-Iteration."""
    n = len(entries)
    pass_iters = [pass_iteration(e) for e in entries]
    cumulative = []
    for k in range(max_iters):
        passed_by_k = sum(1 for p in pass_iters if p is not None and p <= k)
        cumulative.append(100.0 * passed_by_k / n if n else 0.0)

    fig, ax = plt.subplots(figsize=(7, 4.5))
    xs = list(range(max_iters))
    ax.plot(xs, cumulative, marker="o", color="#0072B2")
    for x, y in zip(xs, cumulative):
        ax.annotate(f"{y:.0f}%", (x, y), textcoords="offset points",
                    xytext=(0, 8), ha="center", fontsize=9)
    ax.set_xticks(xs)
    ax.set_xlabel("Iteration")
    ax.set_ylabel("Kumulierte PASS-Rate (%)")
    ax.set_ylim(0, 105)
    ax.set_title(f"Loop-Konvergenz: kumulierte PASS-Rate nach Iteration (n={n})"
                 f"\n{stage_label}")
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(out, dpi=150)
    plt.close(fig)


def plot_loop_iterations_by_uc(entries: list[dict], max_iters: int, out: Path,
                               stage_label: str):
    """Pro UC gestapelte Balken: in welcher Iteration wurde bestanden
    (Farbverlauf frueh -> spaet), plus finale FAILs (vermilion)."""
    ucs = sorted({f"uc-{int(e['uc_id']):02d}" for e in entries})
    by_uc: dict[str, list] = {uc: [] for uc in ucs}
    for e in entries:
        by_uc[f"uc-{int(e['uc_id']):02d}"].append(pass_iteration(e))

    fig, ax = plt.subplots(figsize=(10, 5.5))
    bottom = [0] * len(ucs)
    handles = {}
    for k in range(max_iters):
        heights = [sum(1 for p in by_uc[uc] if p == k) for uc in ucs]
        bars = ax.bar(ucs, heights, bottom=bottom, label=f"PASS in Iter. {k}",
                      color=ITER_COLORS.get(k, "#DDEEF9"), edgecolor="white",
                      linewidth=0.4)
        handles[f"PASS in Iter. {k}"] = bars
        bottom = [b + h for b, h in zip(bottom, heights)]
    fail_heights = [sum(1 for p in by_uc[uc] if p is None) for uc in ucs]
    bars = ax.bar(ucs, fail_heights, bottom=bottom, label="FAIL (alle Iter.)",
                  color=FAIL_COLOR, edgecolor="white", linewidth=0.4)
    handles["FAIL (alle Iter.)"] = bars

    ax.set_ylabel("Anzahl Läufe")
    ax.set_xlabel("Use Case")
    ax.set_title(f"PASS-Iteration pro Use Case\n{stage_label}")
    legend_labels = list(handles.keys())
    ax.legend([handles[l] for l in legend_labels], legend_labels,
              loc="upper center", bbox_to_anchor=(0.5, -0.22),
              ncol=min(len(legend_labels), 6), fontsize=8)
    plt.xticks(rotation=45, ha="right")
    fig.subplots_adjust(bottom=0.32)
    fig.savefig(out, dpi=150)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    g = ap.add_mutually_exclusive_group(required=True)
    for k in STAGE_DIRS:
        g.add_argument(f"--{k}", action="store_true", help=STAGE_DIRS[k])
    args = ap.parse_args()

    stage_key = next(k for k in STAGE_DIRS if getattr(args, k))
    stage_name = STAGE_DIRS[stage_key]
    stage_dir = SCRIPT_DIR / "tests" / stage_name
    plots_dir = stage_dir / "plots"
    plots_dir.mkdir(parents=True, exist_ok=True)

    stage_label = STAGE_LABELS[stage_key]

    df = load_and_merge(stage_dir)
    print(f"[INFO] {len(df)} Dateien geladen für {stage_name}")

    plot_exec_by_uc(df, plots_dir / "exec_category_by_uc.png", stage_label)
    plot_score_distribution(df, plots_dir / "score_distribution.png", stage_label)
    plot_score_heatmap(df, plots_dir / "score_heatmap.png", stage_label)
    write_aggregates(df, plots_dir / "aggregates.csv")

    if stage_key == "stage5":
        entries = load_loop_jsonl(stage_dir)
        if entries:
            max_iters = max(
                (len(e.get("iterations", [])) for e in entries), default=5)
            max_iters = max(max_iters,
                            max((int(e.get("max_iterations", 5)) for e in entries),
                                default=5))
            plot_loop_convergence(entries, max_iters,
                                  plots_dir / "loop_convergence.png",
                                  stage_label)
            plot_loop_iterations_by_uc(entries, max_iters,
                                       plots_dir / "loop_iterations_by_uc.png",
                                       stage_label)
            print("[INFO] Loop-Plots erzeugt (convergence, iterations_by_uc)")

    print(f"[FERTIG] Diagramme + aggregates.csv in {plots_dir}")


if __name__ == "__main__":
    main()