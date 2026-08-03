// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect
        .poll(() => getActiveBaseLayerTitle(page))
        .toMatch(/^(Carto Light|Carto Dark|OpenStreetMap)$/);

    await expect
        .poll(async () => {
            const visibleStates = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations'),
                isLayerRendered(page, 'UV-Index'),
                isLayerRendered(page, 'Precipitation'),
                isLayerRendered(page, 'Clouds')
            ]);
            return visibleStates.some(Boolean);
        })
        .toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const printTitle = `Playwright PNG Export ${Date.now()}`;

    let titleInput = printingPanel.getByLabel(/title/i);
    if ((await titleInput.count()) > 0) {
        titleInput = titleInput.first();
    } else {
        titleInput = printingPanel.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const labelledFormatControl = printingPanel.getByLabel(/format/i);
        if ((await labelledFormatControl.count()) > 0) {
            const formatControl = labelledFormatControl.first();
            try {
                await formatControl.selectOption({ label: 'PNG' });
            } catch {
                try {
                    await formatControl.selectOption('png');
                } catch {
                    await formatControl.click();
                    const pngOption = page.getByRole('option', { name: /^png$/i });
                    await expect(pngOption).toBeVisible();
                    await pngOption.click();
                }
            }
        } else if ((await printingPanel.getByRole('combobox').count()) > 0) {
            const combobox = printingPanel.getByRole('combobox').first();
            await expect(combobox).toBeVisible();
            await combobox.click();
            const pngOption = page.getByRole('option', { name: /^png$/i });
            await expect(pngOption).toBeVisible();
            await pngOption.click();
        } else {
            const pngButton = printingPanel.getByRole('button', { name: /^png$/i });
            await expect(pngButton).toBeVisible();
            await pngButton.click();
        }
    }

    const downloadPromise = page.waitForEvent('download');

    let exportButton = printingPanel.getByRole('button', { name: /^export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^download$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^print map$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button').last();
    }

    await expect(exportButton).toBeVisible();
    await exportButton.click();

    const download = await downloadPromise;
    await expect.poll(() => download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = test.info().outputPath(`printed-map-${Date.now()}.png`);
    await download.saveAs(downloadPath);

    const pngData = await readFile(downloadPath);
    expect(pngData.length).toBeGreaterThan(24);
    expect([...pngData.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(pngData.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect(pngData.readUInt32BE(16)).toBeGreaterThan(0);
    expect(pngData.readUInt32BE(20)).toBeGreaterThan(0);
});
