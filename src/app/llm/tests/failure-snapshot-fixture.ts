// SPDX-FileCopyrightText: Harness instrumentation for Stage 5 (self-improvement loop)
// SPDX-License-Identifier: Apache-2.0
//
// Auto-fixture that captures the application state at the point of failure:
//   1. failure-snapshot.txt   — data-testids + aria tree (text)
//   2. failure-screenshot.png — full-page screenshot (visual map state)
// This file is injected by the Stage 5 harness via an execution copy of the
// generated spec (import rewritten from '@playwright/test' to this file).
// The generated test code itself remains untouched — this is harness
// instrumentation, not model output.
//
// Location: src/app/llm/tests/failure-snapshot-fixture.ts
// Exec specs live in tests/stage_5_self_improvement_loop/<uc-dir>/ and import
// this file as '../../failure-snapshot-fixture'.

/// <reference types="node" />
// ^ This folder is excluded from tsconfig.browser.json, so the editor would
//   otherwise place this file in an inferred project without @types/node,
//   causing spurious "Cannot find name 'fs'/'path'" errors. Playwright
//   transpiles via esbuild at runtime, so this only affects editor tooling.

import { test as base, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export const test = base.extend<{ failureSnapshot: void }>({
    failureSnapshot: [
        async ({ page }, use, testInfo) => {
            await use();
            if (testInfo.status !== testInfo.expectedStatus) {
                try {
                    const snapshot = await page.locator("body").ariaSnapshot();
                    const testIds: string[] = await page.evaluate(() => {
                        function collect(root: Node, ids: Set<string>) {
                            const walker = document.createTreeWalker(
                                root,
                                NodeFilter.SHOW_ELEMENT
                            );
                            let node = walker.nextNode();
                            while (node) {
                                const el = node as Element & { shadowRoot?: ShadowRoot };
                                if (el.shadowRoot) collect(el.shadowRoot, ids);
                                const tid = el.getAttribute?.("data-testid");
                                if (tid) ids.add(tid);
                                node = walker.nextNode();
                            }
                        }
                        const ids = new Set<string>();
                        collect(document.body, ids);
                        return [...ids].sort();
                    });

                    const out =
                        "data-testid attributes at failure:\n" +
                        testIds.map((t) => "  - " + t).join("\n") +
                        "\n\nAccessibility tree at failure:\n" +
                        snapshot;

                    fs.mkdirSync(testInfo.outputDir, { recursive: true });
                    fs.writeFileSync(
                        path.join(testInfo.outputDir, "failure-snapshot.txt"),
                        out,
                        "utf-8"
                    );

                    // Visual state at the point of failure — the only channel
                    // through which the canvas-rendered map state can reach
                    // the (multimodal) model. Give the basemap tiles a brief
                    // chance to finish painting so the map is visible rather
                    // than an empty white canvas.
                    try {
                        await page.waitForLoadState("networkidle", { timeout: 3000 });
                    } catch {
                        // Ignore — capture whatever has rendered so far.
                    }
                    await page.screenshot({
                        path: path.join(testInfo.outputDir, "failure-screenshot.png"),
                    });
                } catch {
                    // Page may already be closed (e.g. timeout during goto) —
                    // in that case only the Playwright error message is fed back.
                }
            } else {
                // Test passed: capture an end screenshot so the final visual
                // state (incl. the canvas-rendered map) can be reviewed by a
                // human. Not fed back to the model — purely for verification.
                try {
                    try {
                        await page.waitForLoadState("networkidle", { timeout: 3000 });
                    } catch {
                        // Ignore — capture whatever has rendered so far.
                    }
                    fs.mkdirSync(testInfo.outputDir, { recursive: true });
                    await page.screenshot({
                        path: path.join(testInfo.outputDir, "end-screenshot.png"),
                    });
                } catch {
                    // Page may already be closed — no end screenshot in that case.
                }
            }
        },
        { auto: true },
    ],
});

export { expect };