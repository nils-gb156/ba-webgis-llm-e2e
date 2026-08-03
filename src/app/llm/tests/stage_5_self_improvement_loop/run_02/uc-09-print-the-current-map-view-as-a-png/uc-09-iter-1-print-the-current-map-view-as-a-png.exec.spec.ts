// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    const printingPanel = page.getByTestId('printing-panel');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();
    await expect(printToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const panelVisible = await printingPanel.isVisible().catch(() => false);
    if (!panelVisible) {
        const pressed = await printToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printDialog).toBeVisible();
    await expect(printingPanel).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    const formatCombobox = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });

    await expect(titleInput).toBeVisible();
    await expect(formatCombobox).toBeVisible();
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const printTitle = `Map export ${Date.now()}`;
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    await formatCombobox.selectOption({ label: 'PNG' });
    await expect
        .poll(async () => {
            return await formatCombobox.evaluate((element) => {
                if (element instanceof HTMLSelectElement) {
                    return element.selectedOptions[0]?.textContent?.trim() ?? '';
                }
                return '';
            });
        })
        .toBe('PNG');

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.failure()).toBeNull();

    const savedFile = test.info().outputPath('printed-map-view.png');
    await download.saveAs(savedFile);

    const fileBuffer = await readFile(savedFile);
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);
    expect(fileBuffer.toString('ascii', 12, 16)).toBe('IHDR');
    expect(fileBuffer.readUInt32BE(16)).toBeGreaterThan(200);
    expect(fileBuffer.readUInt32BE(20)).toBeGreaterThan(200);
    expect(fileBuffer.includes(Buffer.from('IDAT'))).toBe(true);
    expect(fileBuffer.includes(Buffer.from('IEND'))).toBe(true);
    expect(fileBuffer.byteLength).toBeGreaterThan(1000);

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
