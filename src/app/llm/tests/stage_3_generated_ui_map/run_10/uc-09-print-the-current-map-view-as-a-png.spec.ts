// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const scaleBar = page.getByTestId('scale-bar');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect
        .poll(() => getActiveBaseLayerTitle(page))
        .toMatch(/^(Carto Light|Carto Dark|OpenStreetMap)$/);

    await expect
        .poll(async () => {
            const renderedLayers = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations')
            ]);
            return renderedLayers.some(Boolean);
        })
        .toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current map view');
    await expect(titleInput).toHaveValue('Current map view');

    const pngRadio = printingPanel.getByRole('radio', { name: 'PNG', exact: true });
    const formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
    const pngButton = printingPanel.getByRole('button', { name: 'PNG', exact: true });

    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if ((await formatSelect.count()) > 0) {
        const formatControl = formatSelect.first();
        await expect(formatControl).toBeVisible();
        await formatControl.selectOption({ label: 'PNG' });
        await expect(formatControl).toHaveValue(/png/i);
    } else {
        await expect(pngButton).toBeVisible();
        await pngButton.click();
    }

    const downloadPromise = page.waitForEvent('download');
    const exportButton = printingPanel.getByRole('button', {
        name: /^(Export|Print|Download|Print Map)$/i
    });

    await expect(exportButton).toBeVisible();
    await exportButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.failure()).toBeNull();

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(
        fileContent
            .subarray(0, 8)
            .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe(true);
});
