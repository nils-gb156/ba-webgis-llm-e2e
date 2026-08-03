// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('load');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    await expect(printToggle).toBeVisible();

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const printTitle = 'Current Weather Map';

    let titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    if (!(await titleInput.count())) {
        titleInput = printingPanel.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);

    let pngSelected = false;

    let formatCombobox = printingPanel.getByRole('combobox', { name: /format/i });
    if (!(await formatCombobox.count())) {
        formatCombobox = printingPanel.getByRole('combobox').first();
    }

    if (await formatCombobox.count()) {
        await expect(formatCombobox).toBeVisible();
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
            pngSelected = true;
        } catch {
            try {
                await formatCombobox.selectOption('png');
                pngSelected = true;
            } catch {
                try {
                    await formatCombobox.selectOption({ value: 'image/png' });
                    pngSelected = true;
                } catch {
                    await formatCombobox.click();
                    const pngOption = page.getByRole('option', { name: /^PNG$/i }).first();
                    if (await pngOption.count()) {
                        await pngOption.click();
                        pngSelected = true;
                    }
                }
            }
        }
    }

    if (!pngSelected) {
        const pngRadio = printingPanel.getByRole('radio', { name: /png/i }).first();
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
        pngSelected = true;
    }

    expect(pngSelected).toBe(true);

    let exportButton = printingPanel.getByRole('button', { name: /^export$/i });
    if (!(await exportButton.count())) {
        exportButton = printingPanel.getByRole('button', { name: /^print$/i });
    }
    if (!(await exportButton.count())) {
        exportButton = printingPanel.getByRole('button', { name: /export|print/i }).first();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    if (!downloadPath) {
        throw new Error('Downloaded file path is unavailable.');
    }

    const fileBuffer = await readFile(downloadPath);
    expect(fileBuffer.length).toBeGreaterThan(8);
    expect([...fileBuffer.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect(page.getByTestId('scale-bar')).toBeVisible();
});
