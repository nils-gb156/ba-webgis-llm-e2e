// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
    getActiveBaseLayerTitle,
    isLayerRendered
} from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    await expect.poll(async () => {
        const rendered = await Promise.all([
            isLayerRendered(page, 'Temperature'),
            isLayerRendered(page, 'UV-Index Stations'),
            isLayerRendered(page, 'EUCOS Ground Stations')
        ]);
        return rendered.some(Boolean);
    }).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const printTitle = 'E2E PNG Map Export';

    let titleInput = printingPanel.getByLabel(/title/i);
    if ((await titleInput.count()) === 0) {
        const textboxCount = await printingPanel.getByRole('textbox').count();
        if (textboxCount > 0) {
            titleInput = printingPanel.getByRole('textbox').first();
        }
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    let pngSelected = false;

    const pngRadio = printingPanel.getByRole('radio', { name: 'PNG', exact: true });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
        pngSelected = true;
    }

    if (!pngSelected) {
        let formatCombobox = printingPanel.getByRole('combobox', { name: /format/i });
        if ((await formatCombobox.count()) === 0) {
            const comboboxCount = await printingPanel.getByRole('combobox').count();
            if (comboboxCount > 0) {
                formatCombobox = printingPanel.getByRole('combobox').first();
            }
        }

        if ((await formatCombobox.count()) > 0) {
            await expect(formatCombobox).toBeVisible();
            await formatCombobox.selectOption({ label: 'PNG' });
            await expect(formatCombobox).toHaveValue(/png/i);
            pngSelected = true;
        }
    }

    if (!pngSelected) {
        const pngButton = printingPanel.getByRole('button', { name: 'PNG', exact: true });
        await expect(pngButton).toBeVisible();
        await pngButton.click();
    }

    let exportButton = printingPanel.getByRole('button', { name: /^export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^download$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /export|print|download/i }).first();
    }

    const downloadPromise = page.waitForEvent('download');
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    const download = await downloadPromise;
    const suggestedFilename = download.suggestedFilename();

    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const downloadPath = test.info().outputPath(suggestedFilename);
    await download.saveAs(downloadPath);

    const fileBuffer = await readFile(downloadPath);
    expect(fileBuffer.length).toBeGreaterThan(5000);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(fileBuffer.toString('ascii', 12, 16)).toBe('IHDR');

    const width = fileBuffer.readUInt32BE(16);
    const height = fileBuffer.readUInt32BE(20);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => {
        const rendered = await Promise.all([
            isLayerRendered(page, 'Temperature'),
            isLayerRendered(page, 'UV-Index Stations'),
            isLayerRendered(page, 'EUCOS Ground Stations')
        ]);
        return rendered.some(Boolean);
    }).toBe(true);
});
