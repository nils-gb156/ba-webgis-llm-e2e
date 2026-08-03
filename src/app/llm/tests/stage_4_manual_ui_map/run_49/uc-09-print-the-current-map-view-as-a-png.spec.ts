// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(
        /^(Carto Light|Carto Dark|OpenStreetMap)$/
    );

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

    const labeledTitleInput = printingPanel.getByLabel(/title/i);
    const titleInput =
        (await labeledTitleInput.count()) > 0
            ? labeledTitleInput.first()
            : printingPanel.getByRole('textbox').first();

    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current weather map');

    let pngFormatSelected = false;

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
        pngFormatSelected = true;
    }

    if (!pngFormatSelected) {
        let formatControl = printingPanel.getByLabel(/format|file format|output format/i);
        if ((await formatControl.count()) === 0) {
            formatControl = printingPanel.getByRole('combobox', {
                name: /format|file format|output format/i
            });
        }
        if ((await formatControl.count()) === 0) {
            formatControl = printingPanel.getByRole('combobox');
        }

        if ((await formatControl.count()) > 0) {
            const combobox = formatControl.first();
            await expect(combobox).toBeVisible();

            try {
                await combobox.selectOption({ label: 'PNG' });
                await expect(combobox).toHaveValue(/png/i);
                pngFormatSelected = true;
            } catch {
                await combobox.click();

                const pngOption = page.getByRole('option', { name: /^png$/i });
                if ((await pngOption.count()) > 0) {
                    await pngOption.first().click();
                    pngFormatSelected = true;
                } else {
                    const pngMenuItem = page.getByRole('menuitemradio', { name: /^png$/i });
                    if ((await pngMenuItem.count()) > 0) {
                        await pngMenuItem.first().click();
                        pngFormatSelected = true;
                    } else {
                        const pngButton = page.getByRole('button', { name: /^png$/i });
                        if ((await pngButton.count()) > 0) {
                            await pngButton.first().click();
                            pngFormatSelected = true;
                        }
                    }
                }
            }
        }
    }

    expect(pngFormatSelected).toBe(true);

    let exportButton = printingPanel.getByRole('button', { name: /^export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /export|print|download/i });
    }

    await expect(exportButton.first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.first().click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const fileBytes = await readFile(downloadPath!);
    expect(fileBytes.byteLength).toBeGreaterThan(1024);
    expect([...fileBytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
