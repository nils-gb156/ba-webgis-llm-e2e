// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printingContent = page.getByTestId('printing');
    const scaleBar = page.getByTestId('scale-bar');

    await expect(mapContainer).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingContent).toBeVisible();

    let titleInput = printingContent.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = printingContent.getByRole('textbox').first();
    }

    const printTitle = 'Current Weather Map';
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingContent.getByRole('radio', { name: /^PNG$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatCombobox = printingContent.getByRole('combobox', { name: /format/i });
        if ((await formatCombobox.count()) === 0) {
            formatCombobox = printingContent.getByRole('combobox').first();
        }

        if ((await formatCombobox.count()) > 0) {
            await expect(formatCombobox).toBeVisible();
            const tagName = await formatCombobox.evaluate((element) => element.tagName);
            if (tagName === 'SELECT') {
                await formatCombobox.selectOption({ label: 'PNG' });
                await expect(formatCombobox).toHaveValue(/png/i);
            } else {
                await formatCombobox.click();
                const pngOption = page.getByRole('option', { name: /^PNG$/i });
                await expect(pngOption).toBeVisible();
                await pngOption.click({ force: true });
            }
        } else {
            const pngButton = printingContent.getByRole('button', { name: /^PNG$/i });
            await expect(pngButton).toBeVisible();
            await pngButton.click();
            const pressed = await pngButton.getAttribute('aria-pressed');
            if (pressed !== null) {
                expect(pressed).toBe('true');
            }
        }
    }

    let exportButton = printingContent.getByRole('button', { name: /^(Export|Print|Download)$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingContent.getByRole('button', { name: /export|print|download/i }).first();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (downloadPath) {
        const fileBytes = await readFile(downloadPath);
        expect(fileBytes.length).toBeGreaterThan(8);
        expect(Array.from(fileBytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    }
});
