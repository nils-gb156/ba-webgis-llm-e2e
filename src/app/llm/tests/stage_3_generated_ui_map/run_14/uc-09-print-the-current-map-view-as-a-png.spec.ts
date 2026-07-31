// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial layers to be rendered
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    // Step 1: Open the printing panel
    const printToggle = page.getByTestId('print-toggle');
    // The toggle might already be in the correct state or not, we ensure it's open.
    // Since the panel starts hidden, we click the toggle.
    await printToggle.click();

    // Verify the printing panel is visible
    await expect(page.getByTestId('printing-panel')).toBeVisible();

    // Step 2: Enter a title for the printout
    // Assuming there is an input field for the title inside the printing panel.
    // Based on typical UI patterns, we look for a label or input.
    // If no specific test id is provided for the title input, we use getByLabel or getByRole.
    // Let's assume a label "Title" or similar.
    const titleInput = page.getByTestId('printing-panel').getByLabel(/title/i);
    await titleInput.fill('My Map Printout');

    // Step 3: Select the PNG file format
    // Assuming there are radio buttons or a select for format.
    // Let's look for a radio button or option with text "PNG".
    const pngFormatOption = page.getByTestId('printing-panel').getByRole('radio', { name: 'PNG' });
    // If it's a checkbox or button, we adjust. Given "selects", radio is likely.
    // If the radio is already checked, clicking it might do nothing or deselect.
    // We assert the state after interaction or before if already correct.
    // Let's assume it needs to be clicked to ensure selection.
    if (!(await pngFormatOption.isChecked())) {
        await pngFormatOption.click({ force: true });
    }
    await expect(pngFormatOption).toBeChecked();

    // Step 4: Trigger the export/print
    const exportButton = page.getByTestId('printing-panel').getByRole('button', { name: /export|print|download/i });
    
    // Wait for the download to start before clicking
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    // Verify the download
    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);
});
