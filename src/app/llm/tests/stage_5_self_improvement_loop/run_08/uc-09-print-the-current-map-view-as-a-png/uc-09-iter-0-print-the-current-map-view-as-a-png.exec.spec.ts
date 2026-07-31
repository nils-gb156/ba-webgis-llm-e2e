// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Verify at least one base map and one overlay layer are visible.
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
    const printButton = page.getByRole('button', { name: 'Print Map' });
    await printButton.click();

    // Expected: The printing panel is visible.
    await expect(page.getByRole('dialog', { name: /Print Map/i })).toBeVisible();

    // Step 2: The user enters a title for the printout.
    const dialog = page.getByRole('dialog', { name: /Print Map/i });
    const titleInput = dialog.getByLabel('Title');
    await titleInput.fill('Map Printout');

    // Step 3: The user selects the PNG file format.
    const formatSelect = dialog.getByRole('combobox', { name: /Format/i });
    await formatSelect.selectOption('png');

    // Step 4: The user clicks the export/print button.
    const downloadPromise = page.waitForEvent('download');
    const exportButton = dialog.getByRole('button', { name: /Print|Export/i });
    await exportButton.click();

    const download = await downloadPromise;
    // Expected: A PNG file containing the current map view is generated and downloaded.
    expect(download.suggestedFilename()).toMatch(/\.png$/);
});
