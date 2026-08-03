// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printDialog.isVisible())) {
        await printToggle.click();
    }

    await expect(printDialog).toBeVisible();
    await expect(printingPanel).toBeVisible();
    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');

    const printForm = printDialog.getByRole('form', { name: 'Configure map printing', exact: true });
    await expect(printForm).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Playwright PNG export');
    await expect(titleInput).toHaveValue('Playwright PNG export');

    const fileFormat = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(fileFormat).toBeVisible();
    await fileFormat.selectOption({ label: 'PNG' });
    await expect(fileFormat).toHaveValue(/png/i);

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    await expect.poll(() => download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileBuffer = await readFile(downloadPath!);
    expect(fileBuffer.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    expect(fileBuffer.subarray(12, 16).toString('ascii')).toBe('IHDR');

    const width = fileBuffer.readUInt32BE(16);
    const height = fileBuffer.readUInt32BE(20);

    expect(width).toBeGreaterThan(100);
    expect(height).toBeGreaterThan(100);
    expect(fileBuffer.byteLength).toBeGreaterThan(1000);
});
