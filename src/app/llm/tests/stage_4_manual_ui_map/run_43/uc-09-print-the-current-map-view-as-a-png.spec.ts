// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const toolbar = page.getByTestId('map-toolbar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printingRoot = printingPanel.getByTestId('printing');
    const scaleBar = page.getByTestId('scale-bar');

    await expect(mapContainer).toBeVisible();
    await expect(toolbar).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(
        /^(Carto Light|Carto Dark|OpenStreetMap)$/
    );

    await expect.poll(async () => {
        const layerVisibility = await Promise.all([
            isLayerRendered(page, 'UV-Index'),
            isLayerRendered(page, 'Temperature'),
            isLayerRendered(page, 'Precipitation'),
            isLayerRendered(page, 'Clouds'),
            isLayerRendered(page, 'UV-Index Stations'),
            isLayerRendered(page, 'EUCOS Ground Stations')
        ]);
        return layerVisibility.some(Boolean);
    }).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingRoot).toBeVisible();

    const printTitle = 'Playwright PNG Map';

    let titleInput = printingRoot.getByRole('textbox', { name: /^Title$/i }).first();
    if (!(await titleInput.count())) {
        titleInput = printingRoot.getByRole('textbox', { name: /title/i }).first();
    }
    if (!(await titleInput.count())) {
        titleInput = printingRoot.getByLabel(/^Title$/i).first();
    }
    if (!(await titleInput.count())) {
        titleInput = printingRoot.getByLabel(/title/i).first();
    }
    if (!(await titleInput.count())) {
        titleInput = printingRoot.getByPlaceholder(/title/i).first();
    }
    if (!(await titleInput.count())) {
        titleInput = printingRoot.getByRole('textbox').first();
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingRoot.getByRole('radio', { name: /^PNG$/i }).first();
    if (await pngRadio.count()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatSelect = printingRoot.getByRole('combobox', { name: /^Format$/i }).first();
        if (!(await formatSelect.count())) {
            formatSelect = printingRoot.getByRole('combobox', { name: /format/i }).first();
        }
        if (!(await formatSelect.count())) {
            formatSelect = printingRoot.getByRole('combobox').first();
        }

        if (await formatSelect.count()) {
            await expect(formatSelect).toBeVisible();
            try {
                await formatSelect.selectOption({ value: 'png' });
            } catch {
                await formatSelect.selectOption({ label: 'PNG' });
            }
            await expect.poll(() => formatSelect.inputValue()).toMatch(/png/i);
        } else {
            const pngButton = printingRoot.getByRole('button', { name: /^PNG$/i }).first();
            await expect(pngButton).toBeVisible();
            await pngButton.click();
        }
    }

    let exportButton = printingRoot.getByRole('button', { name: /^Export$/i }).first();
    if (!(await exportButton.count())) {
        exportButton = printingRoot.getByRole('button', { name: /^Print$/i }).first();
    }
    if (!(await exportButton.count())) {
        exportButton = printingRoot.getByRole('button', { name: /^Download$/i }).first();
    }
    if (!(await exportButton.count())) {
        exportButton = printingRoot.getByRole('button', { name: /export|print|download|create/i }).first();
    }
    if (!(await exportButton.count())) {
        exportButton = printingRoot.getByRole('button').last();
    }

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    await expect.soft(scaleBar).toBeVisible();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (downloadPath) {
        const [fileInfo, fileBuffer] = await Promise.all([stat(downloadPath), readFile(downloadPath)]);
        expect(fileInfo.size).toBeGreaterThan(0);
        expect(fileBuffer.subarray(0, 8)).toEqual(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );
    }
});
