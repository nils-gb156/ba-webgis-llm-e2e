// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify preconditions: map is loaded with base and overlay layers
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect(page.getByTestId('map-container')).toBeVisible();

    // Step 1: Click the 'Print Map' button to open the printing panel
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    // Ensure the panel is not already open before clicking
    const panelState = await printingPanel.isVisible();
    if (!panelState) {
        await printToggle.click();
    }

    // Verify the printing panel is visible
    await expect(printingPanel).toBeVisible();

    // Step 2: Enter a title for the printout
    const titleInput = page.getByLabel('Title').or(page.getByTestId('printing-title-input'));
    if (titleInput.count() === 0) {
        // Fallback: try to find an input inside the printing panel
        const input = printingPanel.locator('input[type="text"]');
        if (input.count() > 0) {
            await input.fill('Test Map Print');
        } else {
            // If no specific input found, try getting by placeholder or just assume standard label
            await page.getByPlaceholder('Title').fill('Test Map Print');
        }
    } else {
        await titleInput.fill('Test Map Print');
    }

    // Step 3: Select the PNG file format
    const formatSelector = page.getByLabel('Format').or(page.getByTestId('printing-format-select'));
    if (formatSelector.count() === 0) {
        // Fallback: try radio buttons or select inside the panel
        const radio = printingPanel.getByRole('radio', { name: 'PNG' });
        if (radio.count() > 0 && !(await radio.isChecked())) {
            await radio.click();
        } else {
            const select = printingPanel.locator('select');
            if (select.count() > 0) {
                await select.selectOption('png');
            }
        }
    } else {
        await formatSelector.selectOption('png');
    }

    // Step 4: Click the export/print button
    const exportButton = page.getByRole('button', { name: /Export|Print|Generate/i }).first();
    if (exportButton.count() === 0) {
        const panelExportButton = printingPanel.getByRole('button', { name: /Export|Print|Generate/i });
        if (panelExportButton.count() > 0) {
            await panelExportButton.click();
        } else {
            // Last resort: click any button in the printing panel that looks like an action
            await printingPanel.getByRole('button').first().click();
        }
    } else {
        await exportButton.click();
    }

    // Wait for the download to start
    const downloadEvent = page.waitForEvent('download');
    
    // Re-trigger the click if the previous click didn't initiate a download event properly
    // Sometimes the button click happens before the listener is attached if not careful, 
    // but we attached it after the click in the flow above? No, we should attach before.
    // Let's restart the click logic with the listener attached first.
    
    // Re-approach for Step 4 to ensure download listener is ready
    const downloadPromise = page.waitForEvent('download');
    const triggerButton = printingPanel.getByRole('button', { name: /Export|Print|Generate/i });
    if (triggerButton.count() > 0) {
        await triggerButton.click();
    } else {
        // Fallback if specific button not found
        await page.getByRole('button', { name: /Export|Print|Generate/i }).first().click();
    }

    const download = await downloadPromise;
    
    // Verify the file was downloaded
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    
    // Clean up the download file
    await download.delete();
});
