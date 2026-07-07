// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";

test("Use Case 5: Activate the Precipitation overlay and verify the legend updates", async ({
    page
}) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Wait for the application to load and the layer switcher/legend to be visible
    await expect(page.getByRole("tree")).toBeVisible();
    await expect(page.getByRole("region", { name: /legend/i })).toBeVisible();

    // Step 1: Click the visibility toggle of the Precipitation overlay layer
    // We look for the checkbox associated with the "Precipitation" label in the layer tree
    const precipitationToggle = page.getByRole("checkbox", { name: "Precipitation" });
    await expect(precipitationToggle).toBeVisible();

    // Click the toggle to enable the layer
    await precipitationToggle.click();

    // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
    await expect(precipitationToggle).toBeChecked();

    // Step 3: Verify the legend displays an entry corresponding to the Precipitation layer
    // The legend region should now contain text or an element related to "Precipitation"
    const legendRegion = page.getByRole("region", { name: /legend/i });
    await expect(legendRegion.getByText("Precipitation", { exact: false })).toBeVisible();
});
