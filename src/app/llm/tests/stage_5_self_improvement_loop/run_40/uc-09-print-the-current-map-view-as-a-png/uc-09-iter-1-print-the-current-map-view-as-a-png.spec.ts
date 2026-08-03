// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printDialog.isVisible().catch(() => false))) {
        await expect(printToggle).toBeVisible();
        await expect(printToggle).toBeEnabled();
        await printToggle.click();
    }

    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(printDialog).toBeVisible();
    await expect(printingPanel).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();

    const printTitle = 'Current Weather Map PNG Export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const formatCombobox = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(formatCombobox).toBeVisible();
    await formatCombobox.selectOption({ label: 'PNG' });
    await expect(formatCombobox).toHaveValue(/png/i);

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadedFilePath = test.info().outputPath(download.suggestedFilename());
    await download.saveAs(downloadedFilePath);

    const fileBuffer = await readFile(downloadedFilePath);
    expect(fileBuffer.length).toBeGreaterThan(1024);
    expect(fileBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);

    const width = fileBuffer.readUInt32BE(16);
    const height = fileBuffer.readUInt32BE(20);
    expect(width).toBeGreaterThan(100);
    expect(height).toBeGreaterThan(100);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
