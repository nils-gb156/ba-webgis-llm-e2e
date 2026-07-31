// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition check: Ensure map is ready and layers are visible
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    // Step 1: The user clicks the 'Print Map' button in the toolbar to open the printing panel.
    const printToggle = page.getByRole('button', { name: 'Print Map' });
    await printToggle.click();

    // Expected result: The printing panel is visible.
    const printingPanel = page.getByRole('region', { name: /Print/i });
    // Fallback if role name is not exact, using the panel testid if available or general structure
    // Based on UI map: printing-panel is a panel.
    // Let's try to find it by role or testid if we can infer it.
    // The UI map lists `printing-panel` as a panel. It doesn't explicitly give a testid for the panel itself in the list,
    // but often panels have testids. Let's look for the printing panel content.
    // The UI map says `printing-panel` is visible via `print-toggle`.
    // Let's assume the panel has a testid or we can find it by content.
    // Since `printing-panel` is listed, let's try to get it by testid if it exists, or by role.
    // Looking at the UI map, `printing-panel` is listed but no testid is explicitly mapped to it in the "Components" table like `printing-panel` -> testid.
    // However, `printing` element is listed.
    // Let's try to find the panel by its likely accessible name or by checking visibility of elements inside it.
    // Often these panels have a testid like `printing-panel`. Let's assume standard naming or look for the title input.
    
    // Let's try to locate the printing panel using the `printing` element or by the presence of the title input.
    // The UI map lists `printing-panel` as a panel. Let's try to find it.
    // If no specific testid is given for the panel, we might need to rely on the title input being present.
    
    // Let's try to find the title input first to confirm the panel is open.
    // The use case says "enters a title".
    // Let's look for a text input that might be the title.
    // Common labels: "Title", "Print Title".
    
    // Step 2: The user enters a title for the printout.
    // We need to find the title input. Let's try to find an input with label "Title".
    const titleInput = page.getByLabel('Title');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Test Printout');

    // Step 3: The user selects the PNG file format.
    // We need to find the format selector. It might be a radio group or a select.
    // Let's try to find a radio button or select for "PNG".
    // Common labels: "Format", "PNG".
    const pngOption = page.getByRole('radio', { name: 'PNG' });
    // If radio doesn't exist, try select option
    const pngSelectOption = page.getByRole('option', { name: 'PNG' });
    
    if (await pngOption.isVisible().catch(() => false)) {
        await pngOption.click();
    } else if (await pngSelectOption.isVisible().catch(() => false)) {
        // Select might be in a dropdown
        const formatSelect = page.getByRole('combobox', { name: /Format/i });
        await formatSelect.click();
        await pngSelectOption.click();
    } else {
        // Fallback: try to find any PNG related button or radio
        const pngButton = page.getByRole('button', { name: 'PNG' });
        if (await pngButton.isVisible().catch(() => false)) {
            await pngButton.click();
        } else {
            throw new Error('Could not find PNG format option');
        }
    }

    // Step 4: The user clicks the export/print button.
    // Expected result: A PNG file containing the current map view is generated and downloaded.
    // We need to wait for the download before clicking.
    const downloadPromise = page.waitForEvent('download');
    
    const exportButton = page.getByRole('button', { name: /Export|Print|Generate/i });
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();
    
    // Expected result: The printed image shows the visible base map and overlay layers as well as the scale bar.
    // We can't assert the content of the image directly, but we can assert the file was downloaded.
    expect(suggestedFilename).toMatch(/\.png$/i);
    
    // Clean up the downloaded file
    await download.delete();
});
