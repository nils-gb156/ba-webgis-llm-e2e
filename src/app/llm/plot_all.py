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

Stufe 5 ist bewusst nicht enthalten (eigenes Ausführungsmodell, siehe
Kapitel 6.4 der Arbeit).
"""

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


if __name__ == "__main__":
    main()