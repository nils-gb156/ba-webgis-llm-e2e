// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC-09 Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(printingPanel).toBeVisible();
    await expect(printDialog).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('E2E PNG Export');
    await expect(titleInput).toHaveValue('E2E PNG Export');

    const formatCombobox = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(formatCombobox).toBeVisible();
    await formatCombobox.selectOption({ label: 'PNG' });
    await expect.poll(async () => {
        return await formatCombobox.evaluate((element) => {
            if (!(element instanceof HTMLSelectElement)) {
                return '';
            }
            return element.selectedOptions[0]?.label ?? element.selectedOptions[0]?.text ?? '';
        });
    }).toMatch(/^PNG$/i);

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    if (!downloadPath) {
        throw new Error('Expected a local download path for the exported PNG file.');
    }

    const fileData = await readFile(downloadPath);
    expect(fileData.byteLength).toBeGreaterThan(1000);
    expect(fileData.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(fileData.toString('ascii', 12, 16)).toBe('IHDR');
    expect(fileData.readUInt32BE(16)).toBeGreaterThan(0);
    expect(fileData.readUInt32BE(20)).toBeGreaterThan(0);
});
