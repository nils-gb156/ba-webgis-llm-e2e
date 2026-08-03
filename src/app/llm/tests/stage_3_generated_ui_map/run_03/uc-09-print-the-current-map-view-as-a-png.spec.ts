// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }
    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const printTitle = 'Current Map View PNG';

    let titleInput = printingPanel.getByRole('textbox', { name: 'Title', exact: true });
    if (await titleInput.count() === 0) {
        titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    }
    if (await titleInput.count() === 0) {
        titleInput = printingPanel.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: 'PNG', exact: true });
    if (await pngRadio.count() > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatSelect = printingPanel.getByRole('combobox', { name: 'Format', exact: true });
        if (await formatSelect.count() === 0) {
            formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
        }
        await expect(formatSelect).toBeVisible();
        await formatSelect.selectOption({ label: 'PNG' });
        await expect(formatSelect).toHaveValue(/png/i);
    }

    let exportButton = printingPanel.getByRole('button', { name: 'Export', exact: true });
    if (await exportButton.count() === 0) {
        exportButton = printingPanel.getByRole('button', { name: 'Print', exact: true });
    }
    if (await exportButton.count() === 0) {
        exportButton = printingPanel.getByRole('button', { name: 'Print Map', exact: true });
    }
    if (await exportButton.count() === 0) {
        exportButton = printingPanel.getByRole('button', { name: 'Download', exact: true });
    }
    if (await exportButton.count() === 0) {
        exportButton = printingPanel.getByRole('button', { name: /export|print|download/i }).last();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect(printingPanel).toBeVisible();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
