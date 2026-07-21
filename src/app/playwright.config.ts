// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for LLM-generated end-to-end tests.
 * Tests live under llm/tests/<stage>/ and are run via run_stage_eval.py.
 */

// run_stage_eval.py passes a JSON array of absolute file paths (posix) that
// failed to parse in a previous attempt. They are ignored so a single broken
// file does not abort collection for all remaining tests.
const ignoreRaw = process.env.PW_TEST_IGNORE;
const testIgnore: string[] | undefined = ignoreRaw ? JSON.parse(ignoreRaw) : undefined;

export default defineConfig({
    testDir: ".",
    testMatch: "**/*.spec.ts",
    testIgnore,

    // Each test gets its own timeout (passed via CLI --timeout flag).
    // No global timeout set here so the CLI value takes precedence.
    timeout: 30_000,

    use: {
        baseURL: "http://localhost:5173/ba-webgis-llm-e2e/",
        headless: true
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] }
        }
    ]
});
