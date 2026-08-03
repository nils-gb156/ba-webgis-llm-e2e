// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printingContent = page.getByTestId('printing');
    const scaleBar = page.getByTestId('scale-bar');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(
        /^(Carto Light|Carto Dark|OpenStreetMap)$/
    );

    const operationalLayerTitles = [
        'UV-Index',
        'Temperature',
        'Precipitation',
        'Clouds',
        'UV-Index Stations',
        'EUCOS Ground Stations'
    ];

    await expect.poll(async () => {
        const rendered = await Promise.all(
            operationalLayerTitles.map((title) => isLayerRendered(page, title))
        );
        return rendered.some(Boolean);
    }).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingContent).toBeVisible();

    const printTitle = 'Current Weather Map';

    let titleInput = printingContent.getByRole('textbox', { name: /title/i });
    if (await titleInput.count() === 0) {
        titleInput = printingContent.getByLabel(/title/i);
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingContent.getByRole('radio', { name: /^PNG$/i });
    const pngButton = printingContent.getByRole('button', { name: /^PNG$/i });

    if (await pngRadio.count() > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await pngButton.count() > 0) {
        await pngButton.click();
        await expect(pngButton).toHaveAttribute('aria-pressed', /true/);
    } else {
        let formatSelect = printingContent.getByRole('combobox', { name: /format/i });
        if (await formatSelect.count() === 0) {
            formatSelect = printingContent.getByLabel(/format/i);
        }
        await expect(formatSelect).toBeVisible();

        try {
            await formatSelect.selectOption({ label: 'PNG' });
        } catch {
            try {
                await formatSelect.selectOption({ value: 'png' });
            } catch {
                await formatSelect.selectOption({ value: 'image/png' });
            }
        }

        await expect.poll(async () => await formatSelect.inputValue()).toMatch(/png/i);
    }

    let exportButton = printingContent.getByRole('button', { name: /^Export$/i });
    if (await exportButton.count() === 0) {
        exportButton = printingContent.getByRole('button', { name: /^Print$/i });
    }
    if (await exportButton.count() === 0) {
        exportButton = printingContent.getByRole('button', { name: /^Download$/i });
    }
    if (await exportButton.count() === 0) {
        exportButton = printingContent.getByRole('button', { name: /export|print|download/i });
    }

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.failure()).toBeNull();

    const outputFile = test.info().outputPath('printed-map.png');
    await download.saveAs(outputFile);

    const fileContent = await readFile(outputFile);
    expect(fileContent.byteLength).toBeGreaterThan(100);

    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(fileContent.subarray(0, 8).equals(pngSignature)).toBe(true);
});
