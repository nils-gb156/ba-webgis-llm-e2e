// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('load');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const printTitle = 'Current Weather Map';

    let titleInput = printingPanel.getByRole('textbox', { name: /title/i }).first();
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByLabel(/title/i).first();
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox').first();
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^PNG$/i });
    const pngButton = printingPanel.getByRole('button', { name: /^PNG$/i });
    let formatSelected = false;

    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
        formatSelected = true;
    } else if ((await pngButton.count()) > 0) {
        await pngButton.click();
        formatSelected = true;
    } else {
        let formatControl = printingPanel.getByRole('combobox', { name: /format|file format/i }).first();
        if ((await formatControl.count()) === 0) {
            formatControl = printingPanel.getByLabel(/format|file format/i).first();
        }
        if ((await formatControl.count()) === 0) {
            formatControl = printingPanel.getByRole('combobox').first();
        }

        await expect(formatControl).toBeVisible();

        const tagName = await formatControl.evaluate((element) => element.tagName.toLowerCase());
        if (tagName === 'select') {
            await formatControl.selectOption({ label: 'PNG' });
            await expect(formatControl).toHaveValue(/png/i);
        } else {
            await formatControl.click();
            await printingPanel.getByRole('option', { name: /^PNG$/i }).click();
        }

        formatSelected = true;
    }

    expect(formatSelected).toBe(true);

    const exportButton = printingPanel.getByRole('button', { name: /export|print/i }).first();
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) {
        throw new Error('Expected a downloadable file path for the exported PNG.');
    }

    const fileBuffer = await fs.readFile(downloadPath);
    expect(fileBuffer.length).toBeGreaterThan(100);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
