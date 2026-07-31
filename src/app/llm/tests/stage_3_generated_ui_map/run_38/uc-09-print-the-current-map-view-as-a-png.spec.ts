// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for map to be ready and layers to be rendered
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    // Verify preconditions: base map and overlay layers are visible
    await expect.poll(() => isLayerRendered(page, 'Carto Light')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: Open the printing panel
    const printToggle = page.getByTestId('print-toggle');
    const printPanel = page.getByTestId('printing-panel');

    // Ensure the panel is closed before clicking (source of truth: desired end state is visible)
    const isPanelVisible = await printPanel.isVisible();
    if (isPanelVisible) {
        await printToggle.click({ force: true });
    }
    await printToggle.click({ force: true });
    await expect(printPanel).toBeVisible();

    // Step 2: Enter a title for the printout
    const printingElement = page.getByTestId('printing');
    const titleInput = printingElement.locator('input[type="text"]').first();
    await titleInput.fill('Test Printout');

    // Step 3: Select the PNG file format
    // Assuming the format selector is a radio group or select within the printing panel
    const pngOption = printingElement.getByRole('radio', { name: 'PNG' }).or(printingElement.getByRole('option', { name: 'PNG' }));
    if (await pngOption.count() > 0) {
        await pngOption.click();
    } else {
        // Fallback: try to find a select or other control for format
        const formatSelect = printingElement.locator('select');
        if (await formatSelect.count() > 0) {
            await formatSelect.selectOption('png');
        }
    }

    // Step 4: Trigger the export
    const exportButton = printingElement.getByRole('button', { name: /export|print/i });
    await expect(exportButton).toBeEnabled();

    // Wait for the download to start
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click()
    ]);

    // Assert that a file was downloaded
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toBeTruthy();
    expect(suggestedFilename.toLowerCase().endsWith('.png')).toBe(true);

    // Clean up the downloaded file
    await download.delete();
});
