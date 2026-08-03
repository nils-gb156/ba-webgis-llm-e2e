// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();
    await expect(printToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }
    await expect(printingPanel).toBeVisible();

    const printTitle = 'Current Weather Map';

    let titleInput = printingPanel.getByLabel(/title/i).first();
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox', { name: /title/i }).first();
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox').first();
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i }).first();
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatControl = printingPanel.getByRole('combobox', { name: /format/i }).first();
        if ((await formatControl.count()) === 0) {
            formatControl = printingPanel.getByRole('combobox').first();
        }

        if ((await formatControl.count()) > 0) {
            await expect(formatControl).toBeVisible();

            let pngSelected = false;
            for (const option of ['PNG', 'png', 'image/png', '.png']) {
                if (!pngSelected) {
                    try {
                        await formatControl.selectOption({ label: option });
                        pngSelected = true;
                    } catch {}
                }
                if (!pngSelected) {
                    try {
                        await formatControl.selectOption(option);
                        pngSelected = true;
                    } catch {}
                }
            }

            expect(pngSelected).toBeTruthy();
            await expect.poll(() => formatControl.inputValue()).toMatch(/png/i);
        } else {
            const pngButton = printingPanel.getByRole('button', { name: /^png$/i }).first();
            await expect(pngButton).toBeVisible();
            await pngButton.click();
        }
    }

    let exportButton = printingPanel.getByRole('button', { name: /export/i }).first();
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^print$/i }).first();
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /download/i }).first();
    }

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath as string);
    expect(fileContent.length).toBeGreaterThan(100);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
