// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printing = page.getByTestId('printing');
    const scaleBar = page.getByTestId('scale-bar');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect
        .poll(async () => (await getActiveBaseLayerTitle(page)) ?? '')
        .toMatch(/^(Carto Light|Carto Dark|OpenStreetMap)$/);

    await expect
        .poll(async () => {
            const renderedStates = await Promise.all([
                isLayerRendered(page, 'UV-Index'),
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'Precipitation'),
                isLayerRendered(page, 'Clouds'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations')
            ]);
            return renderedStates.some(Boolean);
        })
        .toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printing).toBeVisible();

    const printTitle = 'Current Weather Map';

    const labeledTitleField = printing.getByLabel(/title/i).first();
    if ((await labeledTitleField.count()) > 0) {
        await labeledTitleField.fill(printTitle);
        await expect(labeledTitleField).toHaveValue(printTitle);
    } else {
        const titleTextbox = printing.getByRole('textbox').first();
        await expect(titleTextbox).toBeVisible();
        await titleTextbox.fill(printTitle);
        await expect(titleTextbox).toHaveValue(printTitle);
    }

    const pngRadio = printing.getByRole('radio', { name: /^png$/i }).first();
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatCombobox = printing
            .getByRole('combobox', { name: /format|file format|output format/i })
            .first();

        if ((await formatCombobox.count()) > 0) {
            const tagName = await formatCombobox.evaluate((element) => element.tagName);
            if (tagName === 'SELECT') {
                const pngValue = await formatCombobox.evaluate((element) => {
                    const select = element as HTMLSelectElement;
                    const option = Array.from(select.options).find(
                        (entry) =>
                            /png/i.test(entry.text) ||
                            /png/i.test(entry.label) ||
                            /png/i.test(entry.value)
                    );
                    return option?.value ?? null;
                });

                expect(pngValue).not.toBeNull();
                await formatCombobox.selectOption(pngValue!);
                await expect.poll(() => formatCombobox.inputValue()).toMatch(/png/i);
            } else {
                await formatCombobox.click();

                const pngOption = page.getByRole('option', { name: /png/i }).first();
                if ((await pngOption.count()) > 0) {
                    await pngOption.click();
                } else {
                    const pngMenuItem = page.getByRole('menuitemradio', { name: /png/i }).first();
                    if ((await pngMenuItem.count()) > 0) {
                        await pngMenuItem.click();
                    } else {
                        const pngText = page.getByText(/^PNG$/i).first();
                        await expect(pngText).toBeVisible();
                        await pngText.click();
                    }
                }
            }
        } else {
            const formatButton = printing
                .getByRole('button', { name: /format|file format|output format/i })
                .first();

            if ((await formatButton.count()) > 0) {
                await formatButton.click();

                const pngOption = page.getByRole('option', { name: /png/i }).first();
                if ((await pngOption.count()) > 0) {
                    await pngOption.click();
                } else {
                    const pngMenuItem = page.getByRole('menuitemradio', { name: /png/i }).first();
                    if ((await pngMenuItem.count()) > 0) {
                        await pngMenuItem.click();
                    } else {
                        const pngButton = page.getByRole('button', { name: /^png$/i }).first();
                        await expect(pngButton).toBeVisible();
                        await pngButton.click();
                    }
                }
            } else {
                const pngText = printing.getByText(/^PNG$/i).first();
                await expect(pngText).toBeVisible();
                await pngText.click();
            }
        }
    }

    let exportButton = printing
        .getByRole('button', { name: /^(export|print|download)( map)?$/i })
        .first();
    if ((await exportButton.count()) === 0) {
        exportButton = printing.getByRole('button', { name: /export|print|download/i }).first();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.failure()).toBeNull();

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
});
