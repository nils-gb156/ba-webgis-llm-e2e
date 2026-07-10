// SPDX-FileCopyrightText: Harness instrumentation for Stage 5 (self-improvement loop)
// SPDX-License-Identifier: Apache-2.0
//
// Auto-fixture that captures the application state (aria snapshot + data-testids)
// at the point of failure. This file is injected by the Stage 5 harness via an
// execution copy of the generated spec (import rewritten from '@playwright/test'
// to this file). The generated test code itself remains untouched — this is
// harness instrumentation, not model output.
//
// Location: src/app/llm/tests/failure-snapshot-fixture.ts
// Exec specs live in tests/stage_5_self_improvement_loop/<uc-dir>/ and import
// this file as '../../failure-snapshot-fixture'.

/// <reference types="node" />
import { test as base, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

                    mkdirSync(testInfo.outputDir, { recursive: true });
                    writeFileSync(
                        join(testInfo.outputDir, "failure-snapshot.txt"),
                        out,
                        "utf-8"
                    );
                } catch {
                    // Page may already be closed (e.g. timeout during goto) —
                    // in that case only the Playwright error message is fed back.
                }
            }
        },
        { auto: true },
    ],
});

export { expect };