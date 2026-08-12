#!/usr/bin/env python3
"""
plot_all.py — Kombinierte Übersichtsdiagramme über alle vier Kontextstufen.

Ergänzt plot_stage.py um Abbildungen, die die Stufen 1-4 gemeinsam in
einem Bild darstellen (statt vier separater PNGs). Verwendet dieselben
Datenquellen, Farben und Kategorien wie plot_stage.py, um Konsistenz zu
allen bereits erzeugten Einzelplots sicherzustellen.

Nutzung (aus src/app/llm/ heraus):
    python plot_all.py

Erzeugt in tests/plots_combined/:
    exec_category_by_uc_grid.png   2x2-Raster: Ausführungskategorien pro
                                    UC, Stufen 1-4, gemeinsame Legende
    score_heatmap_grid.png         2x2-Raster: mittlerer Judge-Score je
                                    UC × Dimension, Stufen 1-4, gemeinsame
                                    Farbskala
    stage5_score_heatmap.png       Einzel-Heatmap (nur Stufe 5): mittlerer
                                    Judge-Score je UC × Dimension, gleiches
                                    Format wie ein Panel des 1-4-Rasters
    stage5_loop_grid.png           1x2-Raster (nur Stufe 5): Loop-Konvergenz
                                    und PASS-Iteration pro UC nebeneinander,
                                    gemeinsame Legende

Stufe 5 hat ein eigenes Ausführungsmodell (Self-Improvement-Loop, siehe
Kapitel 6.4 der Arbeit) und wird daher in einem separaten kombinierten
Bild dargestellt.
"""

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
}

STAGE_LABELS = {
    "stage1": "Stufe 1: Baseline",
    "stage2": "Stufe 2: Accessibility-Snapshot",
    "stage3": "Stufe 3: Automatisch generierte UI-Map",
    "stage4": "Stufe 4: Manuell erstellte UI-Map",
}

# Stufe 5 wird getrennt behandelt (eigenes Ausführungsmodell, Loop-Plots aus
# _stage_5_all_runs.jsonl statt der Standard-CSV).
STAGE5_DIR = "stage_5_self_improvement_loop"
STAGE5_LABEL = "Bonus-Stufe 5: Self-Improvement-Loop"

# Farbverlauf für die PASS-Iteration in Stage-5-Plots identisch zu
# plot_stage.py (früh = dunkelblau, spät = hell), FAIL = vermilion.
# Bei Änderung dort MUSS hier synchron angepasst werden.
ITER_COLORS = {0: "#0072B2", 1: "#56B4E9", 2: "#88CCEE", 3: "#B8E0F5", 4: "#DDEEF9"}
FAIL_COLOR = "#D55E00"

# Identisch zu plot_stage.py -- bewusst dupliziert statt importiert, damit
# dieses Skript unabhängig von der internen Struktur von plot_stage.py
# bleibt. Bei Änderung der Palette dort MUSS hier synchron angepasst werden.
EXEC_ORDER = ["PASS", "ASSERTION_FAIL", "INFRA_FAIL", "COMPILE_ERROR",
              "GENERATION_ERROR", "TIMEOUT"]
EXEC_COLORS = {
    "PASS": "#0072B2",
    "ASSERTION_FAIL": "#E69F00",
    "INFRA_FAIL": "#D55E00",
    "COMPILE_ERROR": "#CC79A7",
    "GENERATION_ERROR": "#000000",
    "TIMEOUT": "#999999",
}

# Score-Dimensionen und Farbskala identisch zu plot_stage.py (Okabe-Ito):
# Score 1 = dunkelorange ... 4 = dunkelblau. map_interaction_score ist für
# Nicht-Karten-UCs "n/a" -> NaN und wird in der Heatmap als neutrale Zelle
# dargestellt. Bei Änderung dort MUSS hier synchron angepasst werden.
SCORE_DIMS = ["coverage_score", "selector_score", "map_interaction_score",
              "assertion_score"]
SCORE_GRADIENT = ["#D55E00", "#E69F00", "#56B4E9", "#0072B2"]
SCORE_CMAP = LinearSegmentedColormap.from_list("score_orange_blue", SCORE_GRADIENT)


def load_phase1(stage_dir: Path) -> pd.DataFrame:
    p1 = stage_dir / "_phase1_results.csv"
    if not p1.exists():
        sys.exit(f"[FEHLER] {p1} fehlt")
    return pd.read_csv(p1)


def load_phase2_uc_dimension_means(stage_dir: Path) -> pd.DataFrame:
    """Liefert eine UC × Dimension-Matrix mittlerer Judge-Scores.

    Quelle ist _phase2_judge.csv (eine Zeile je Testdatei, gleiche Datei wie
    in plot_stage.py). Die ordinalen Score-Spalten werden numerisch geparst
    ("n/a" -> NaN, z. B. map_interaction_score für Nicht-Karten-UCs) und je
    Use Case gemittelt. Index = uc_id, Spalten = SCORE_DIMS.
    """
    p2 = stage_dir / "_phase2_judge.csv"
    if not p2.exists():
        sys.exit(f"[FEHLER] {p2} fehlt")
    df = pd.read_csv(p2)
    for dim in SCORE_DIMS:
        if dim in df.columns:
            df[dim] = pd.to_numeric(df[dim], errors="coerce")
    dims = [d for d in SCORE_DIMS if d in df.columns]
    ucs = sorted(df["uc_id"].unique())
    means = df.groupby("uc_id")[dims].mean().reindex(ucs)
    return means


def plot_exec_by_uc_panel(ax, df: pd.DataFrame, stage_label: str):
    """Zeichnet einen einzelnen Panel-Plot (ohne eigene Legende/Titel-Duplikat)."""
    ucs = sorted(df["uc_id"].unique())
    present = [c for c in EXEC_ORDER if c in df["exec_category"].unique()]
    counts = {c: [len(df[(df.uc_id == uc) & (df.exec_category == c)]) for uc in ucs]
              for c in present}

    bottom = [0] * len(ucs)
    bars_by_cat = {}
    for c in present:
        bars = ax.bar(ucs, counts[c], bottom=bottom, color=EXEC_COLORS.get(c))
        bars_by_cat[c] = bars
        bottom = [b + v for b, v in zip(bottom, counts[c])]

    ax.set_title(stage_label, fontsize=14)
    ax.set_ylabel("Anzahl Testdateien", fontsize=12)
    ax.set_ylim(0, 50)
    ax.tick_params(axis="x", rotation=45, labelsize=11)
    ax.tick_params(axis="y", labelsize=11)
    for label in ax.get_xticklabels():
        label.set_ha("right")
    return bars_by_cat, present


def plot_grid(dfs: dict[str, pd.DataFrame], out: Path):
    fig, axes = plt.subplots(2, 2, figsize=(13, 7.5))
    order = ["stage1", "stage2", "stage3", "stage4"]

    all_bars = {}
    all_present = []
    for key, ax in zip(order, axes.flat):
        bars_by_cat, present = plot_exec_by_uc_panel(ax, dfs[key], STAGE_LABELS[key])
        all_bars.update(bars_by_cat)
        for c in present:
            if c not in all_present:
                all_present.append(c)

    # Gemeinsame Legende unter dem gesamten Raster, in Stapelreihenfolge
    # (oben im Balken zuerst), wie in plot_stage.py.
    legend_order = [c for c in reversed(EXEC_ORDER) if c in all_present]
    handles = [all_bars[c] for c in legend_order]
    fig.legend(handles, legend_order, loc="lower center",
               bbox_to_anchor=(0.5, 0.0), ncol=len(legend_order), fontsize=12)

    fig.suptitle("Ausführungskategorien pro Use Case, Stufen 1-4", fontsize=16)
    fig.tight_layout(rect=[0, 0.06, 1, 0.96])
    fig.savefig(out, dpi=150)
    plt.close(fig)


def plot_heatmap_panel(ax, means: pd.DataFrame, stage_label: str):
    """Zeichnet einen einzelnen Heatmap-Panel (UC × Dimension) ohne eigene
    Colorbar. NaN-Zellen (z. B. map_interaction für Nicht-Karten-UCs) werden
    neutral grau dargestellt und mit "n/a" beschriftet."""
    dims = [d for d in SCORE_DIMS if d in means.columns]
    data = means[dims].to_numpy(dtype=float)

    cmap = SCORE_CMAP.copy()
    cmap.set_bad(color="#E5E5E5")
    data_ma = np.ma.masked_invalid(data)
    # "auto": Zellen füllen die volle Achsenbreite (breite Kacheln), damit der
    # verfügbare Platz je Panel voll genutzt wird.
    im = ax.imshow(data_ma, cmap=cmap, vmin=1, vmax=4, aspect="auto")

    for i in range(data.shape[0]):
        for j in range(data.shape[1]):
            val = data[i, j]
            if np.isnan(val):
                ax.text(j, i, "n/a", ha="center", va="center", fontsize=10,
                        color="#888888")
            else:
                ax.text(j, i, f"{val:.1f}", ha="center", va="center",
                        fontsize=11, color="black")

    ax.set_xticks(range(len(dims)))
    ax.set_xticklabels([d.replace("_score", "") for d in dims], fontsize=11,
                       rotation=20, ha="right")
    ax.set_yticks(range(len(means)))
    ax.set_yticklabels(means.index, fontsize=11)
    ax.set_title(stage_label, fontsize=14)
    return im


def plot_heatmap_grid(means_by_stage: dict[str, pd.DataFrame], out: Path):
    fig, axes = plt.subplots(2, 2, figsize=(11, 11), constrained_layout=True)
    order = ["stage1", "stage2", "stage3", "stage4"]

    im = None
    for key, ax in zip(order, axes.flat):
        im = plot_heatmap_panel(ax, means_by_stage[key], STAGE_LABELS[key])

    fig.colorbar(im, ax=axes, orientation="horizontal", location="bottom",
                 shrink=0.5, pad=0.03, fraction=0.05, label="Ø Score (1–4)")
    fig.suptitle("Mittlerer Judge-Score je UC × Dimension, Stufen 1-4",
                 fontsize=16)
    fig.savefig(out, dpi=150)
    plt.close(fig)


def plot_heatmap_single(means: pd.DataFrame, out: Path, stage_label: str):
    """Einzelne Score-Heatmap (UC × Dimension) im selben Format wie ein Panel
    des Stufen-1-4-Rasters: identische Farbskala, Zellbeschriftung und
    horizontale Colorbar unten. Für Stufe 5, die getrennt dargestellt wird."""
    fig, ax = plt.subplots(figsize=(5.5, 5.5), constrained_layout=True)
    im = plot_heatmap_panel(ax, means, stage_label)
    fig.colorbar(im, ax=ax, orientation="horizontal", location="bottom",
                 shrink=0.5, pad=0.03, fraction=0.05, label="Ø Score (1–4)")
    fig.savefig(out, dpi=150)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Stufe 5: kombinierte Loop-Plots (Datenquelle: _stage_5_all_runs.jsonl).
# Logik identisch zu plot_stage.py, hier nur so umgebaut, dass beide
# Diagramme in einem Bild nebeneinander liegen.
# ---------------------------------------------------------------------------

def load_loop_jsonl(stage_dir: Path) -> list[dict]:
    jsonl = stage_dir / "_stage_5_all_runs.jsonl"
    if not jsonl.exists():
        print(f"[WARNUNG] {jsonl} fehlt -- Stufe-5-Plot wird übersprungen")
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


def plot_loop_convergence_panel(ax, entries: list[dict], max_iters: int):
    """Kumulierte PASS-Rate nach Iteration k über alle UC×Run-Einträge."""
    n = len(entries)
    pass_iters = [pass_iteration(e) for e in entries]
    cumulative = []
    for k in range(max_iters):
        passed_by_k = sum(1 for p in pass_iters if p is not None and p <= k)
        cumulative.append(100.0 * passed_by_k / n if n else 0.0)

    xs = list(range(max_iters))
    ax.plot(xs, cumulative, marker="o", color="#0072B2")
    for x, y in zip(xs, cumulative):
        ax.annotate(f"{y:.0f}%", (x, y), textcoords="offset points",
                    xytext=(0, 8), ha="center", fontsize=11)
    ax.set_xticks(xs)
    ax.set_xlabel("Iteration", fontsize=12)
    ax.set_ylabel("Kumulierte PASS-Rate (%)", fontsize=12)
    ax.set_ylim(0, 105)
    ax.tick_params(axis="both", labelsize=11)
    ax.set_title(f"Loop-Konvergenz: kumulierte PASS-Rate (n={n})", fontsize=14)
    ax.grid(axis="y", alpha=0.3)


def plot_loop_iterations_by_uc_panel(ax, entries: list[dict], max_iters: int):
    """Pro UC gestapelte Balken: in welcher Iteration wurde bestanden
    (Farbverlauf früh -> spät), plus finale FAILs (vermilion)."""
    ucs = sorted({f"uc-{int(e['uc_id']):02d}" for e in entries})
    by_uc: dict[str, list] = {uc: [] for uc in ucs}
    for e in entries:
        by_uc[f"uc-{int(e['uc_id']):02d}"].append(pass_iteration(e))

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

    ax.set_ylabel("Anzahl Läufe", fontsize=12)
    ax.set_xlabel("Use Case", fontsize=12)
    ax.set_title("PASS-Iteration pro Use Case", fontsize=14)
    ax.tick_params(axis="y", labelsize=11)
    ax.tick_params(axis="x", rotation=45, labelsize=11)
    for label in ax.get_xticklabels():
        label.set_ha("right")
    return handles


def plot_loop_grid(entries: list[dict], max_iters: int, out: Path,
                   stage_label: str):
    """1x2-Raster: Loop-Konvergenz (links) und PASS-Iteration pro UC
    (rechts) nebeneinander, mit gemeinsamer Legende unter dem Raster."""
    fig, axes = plt.subplots(1, 2, figsize=(15, 6),
                             gridspec_kw={"width_ratios": [1, 1.6]})
    plot_loop_convergence_panel(axes[0], entries, max_iters)
    handles = plot_loop_iterations_by_uc_panel(axes[1], entries, max_iters)

    legend_labels = list(handles.keys())
    fig.legend([handles[l] for l in legend_labels], legend_labels,
               loc="lower center", bbox_to_anchor=(0.5, 0.0),
               ncol=min(len(legend_labels), 7), fontsize=12)

    fig.suptitle(stage_label, fontsize=16)
    fig.tight_layout(rect=[0, 0.08, 1, 0.95])
    fig.savefig(out, dpi=150)
    plt.close(fig)


def main():
    dfs = {}
    for key, dirname in STAGE_DIRS.items():
        stage_dir = SCRIPT_DIR / "tests" / dirname
        dfs[key] = load_phase1(stage_dir)

    means_by_stage = {}
    for key, dirname in STAGE_DIRS.items():
        stage_dir = SCRIPT_DIR / "tests" / dirname
        means_by_stage[key] = load_phase2_uc_dimension_means(stage_dir)

    out_dir = SCRIPT_DIR / "tests" / "plots_combined"
    out_dir.mkdir(parents=True, exist_ok=True)

    plot_grid(dfs, out_dir / "exec_category_by_uc_grid.png")
    print(f"[OK] geschrieben: {out_dir / 'exec_category_by_uc_grid.png'}")

    plot_heatmap_grid(means_by_stage, out_dir / "score_heatmap_grid.png")
    print(f"[OK] geschrieben: {out_dir / 'score_heatmap_grid.png'}")

    stage5_dir = SCRIPT_DIR / "tests" / STAGE5_DIR
    stage5_means = load_phase2_uc_dimension_means(stage5_dir)
    plot_heatmap_single(stage5_means, out_dir / "stage5_score_heatmap.png",
                        STAGE5_LABEL)
    print(f"[OK] geschrieben: {out_dir / 'stage5_score_heatmap.png'}")

    entries = load_loop_jsonl(stage5_dir)
    if entries:
        max_iters = max(
            (len(e.get("iterations", [])) for e in entries), default=5)
        max_iters = max(max_iters,
                        max((int(e.get("max_iterations", 5)) for e in entries),
                            default=5))
        plot_loop_grid(entries, max_iters, out_dir / "stage5_loop_grid.png",
                       STAGE5_LABEL)
        print(f"[OK] geschrieben: {out_dir / 'stage5_loop_grid.png'}")


if __name__ == "__main__":
    main()