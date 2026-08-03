// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    const printingPanel = page.getByTestId('printing-panel');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();
    await expect(printToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    if (!(await printDialog.isVisible().catch(() => false))) {
        await printToggle.click();
    }

    await expect(printDialog).toBeVisible();
    await expect(printingPanel).toBeVisible();
    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');

    const titleInput = printingPanel.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current Weather Map');
    await expect(titleInput).toHaveValue('Current Weather Map');

    const formatCombobox = printingPanel.getByRole('combobox', { name: 'File format', exact: true });
    await expect(formatCombobox).toBeVisible();
    await formatCombobox.selectOption({ label: 'PNG' });
    await expect.poll(() => formatCombobox.inputValue()).toMatch(/png/i);

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const exportButton = printingPanel.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (!downloadPath) {
        throw new Error('Expected a downloaded PNG file, but no download path was available.');
    }

    const fileContent = await readFile(downloadPath);
    expect(fileContent.byteLength).toBeGreaterThan(1000);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    const width = fileContent.readUInt32BE(16);
    const height = fileContent.readUInt32BE(20);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
});
