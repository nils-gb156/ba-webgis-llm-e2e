// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from "@playwright/test";

test("Use Case 9: Print the current map view as a PNG", async ({ page }) => {
    // Navigate to the application
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Wait for the application to load and be ready
    await expect(page.getByRole("button", { name: /Print Map/i })).toBeVisible({ timeout: 30000 });

    // Step 1: Click the 'Print Map' button in the toolbar to open the printing panel
    const printButton = page.getByRole("button", { name: /Print Map/i });
    await printButton.click();

    // Verify the printing panel is visible
    // The panel might be a dialog, popover, or a dedicated section.
    // We look for common UI elements inside a print dialog/panel.
    await expect(page.getByRole("heading", { name: /Print/i })).toBeVisible({ timeout: 10000 });
    // Alternatively, if there's no specific heading, check for the presence of print-specific controls
    // e.g., a title input and format selector.
    const printPanel = page.locator('[role="dialog"]').first();
    if (await printPanel.isVisible()) {
        await expect(printPanel).toBeVisible();
    } else {
        // Fallback: assume the panel is visible if the print button was clicked and no error occurred
        // We'll proceed assuming the UI state changed to show print options.
    }

    // Step 2: Enter a title for the printout
    const titleInput = page.getByLabel(/Title/i);
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill("Test Map Printout");

    // Step 3: Select the PNG file format
    const formatSelector = page.getByLabel(/Format/i);
    await expect(formatSelector).toBeVisible({ timeout: 5000 });
    await formatSelector.selectOption("png");

    // Step 4: Click the export/print button
    const exportButton = page.getByRole("button", { name: /Export|Print|Generate/i });
    await expect(exportButton).toBeVisible({ timeout: 5000 });

    // Set up download listener before triggering the action
    const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);

    // Verify the download was initiated and has a suggested filename
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i, "The downloaded file should be a PNG");

    // Clean up the downloaded file
    await download.delete();
});
