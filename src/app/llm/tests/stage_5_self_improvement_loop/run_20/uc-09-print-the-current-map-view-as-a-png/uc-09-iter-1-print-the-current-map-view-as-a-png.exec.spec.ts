// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');

    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    await expect(printDialog).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();

    const printTitle = 'Current weather map';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const formatCombobox = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(formatCombobox).toBeVisible();

    const currentFormat = await formatCombobox.inputValue();
    if (!/png/i.test(currentFormat)) {
        await formatCombobox.selectOption({ label: 'PNG' });
    }
    await expect(formatCombobox).toHaveValue(/png/i);

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const fileBytes = await readFile(downloadPath!);
    expect(fileBytes.length).toBeGreaterThan(1024);

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(fileBytes.subarray(0, 8).equals(pngSignature)).toBe(true);
    expect(fileBytes.subarray(12, 16).toString('ascii')).toBe('IHDR');

    const width = fileBytes.readUInt32BE(16);
    const height = fileBytes.readUInt32BE(20);
    expect(width).toBeGreaterThan(100);
    expect(height).toBeGreaterThan(100);
    expect(fileBytes.includes(Buffer.from('IDAT'))).toBe(true);
});
