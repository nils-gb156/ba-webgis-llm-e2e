// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Verify map is loaded with base and operational layers
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: Open the printing panel by clicking the print toggle
    const printToggle = page.getByRole('button', { name: 'Print' });
    await printToggle.click();

    // Expected result: The printing panel is visible
    await expect(page.getByTestId('printing-panel')).toBeVisible();

    // Step 2: Enter a title for the printout
    const titleInput = page.getByLabel('Title');
    await titleInput.fill('Test Printout');

    // Step 3: Select the PNG file format
    const formatRadio = page.getByRole('radio', { name: 'PNG' });
    await formatRadio.click({ force: true });

    // Verify the radio button is checked
    await expect(formatRadio).toBeChecked();

    // Step 4: Trigger the export/print action
    // Wait for the download to start before clicking the export button
    const downloadPromise = page.waitForEvent('download');
    const exportButton = page.getByRole('button', { name: /Export|Print/ });
    await exportButton.click();

    // Expected result: A PNG file is downloaded
    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/);
});
