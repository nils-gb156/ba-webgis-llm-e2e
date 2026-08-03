// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });

    await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    if (!(await printDialog.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printDialog).toBeVisible();
    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current weather map');
    await expect(titleInput).toHaveValue('Current weather map');

    const fileFormat = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(fileFormat).toBeVisible();
    await fileFormat.selectOption({ label: 'PNG' });
    await expect.poll(() => fileFormat.inputValue()).toMatch(/png/i);

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const outputPath = test.info().outputPath(suggestedFilename);
    await download.saveAs(outputPath);

    const fileBytes = await readFile(outputPath);
    expect(fileBytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(fileBytes.toString('ascii', 12, 16)).toBe('IHDR');

    const width = fileBytes.readUInt32BE(16);
    const height = fileBytes.readUInt32BE(20);

    expect(width).toBeGreaterThan(200);
    expect(height).toBeGreaterThan(200);
    expect(fileBytes.includes(Buffer.from('IDAT'))).toBe(true);
    expect(fileBytes.includes(Buffer.from('IEND'))).toBe(true);
    expect(fileBytes.length).toBeGreaterThan(5000);
});
