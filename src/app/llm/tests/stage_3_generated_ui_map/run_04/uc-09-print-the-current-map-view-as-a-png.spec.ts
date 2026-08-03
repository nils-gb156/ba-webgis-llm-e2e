// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('UC9 - Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(
        /^(Carto Light|Carto Dark|OpenStreetMap)$/
    );
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

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    const printing = page.getByTestId('printing');
    await expect(printing).toBeVisible();

    const title = 'Current Weather Map';
    const labeledTitleInput = printing.getByLabel(/title/i);
    const titleInput =
        (await labeledTitleInput.count()) > 0
            ? labeledTitleInput
            : printing.getByRole('textbox').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);
    await expect(titleInput).toHaveValue(title);

    const pngRadio = printing.getByRole('radio', { name: 'PNG', exact: true });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const labeledFormatSelect = printing.getByRole('combobox', { name: /format/i });
        const formatSelect =
            (await labeledFormatSelect.count()) > 0
                ? labeledFormatSelect
                : printing.getByRole('combobox').first();

        await expect(formatSelect).toBeVisible();
        await formatSelect.selectOption({ label: 'PNG' }).catch(async () => {
            await formatSelect.selectOption({ value: 'png' }).catch(async () => {
                await formatSelect.selectOption('PNG');
            });
        });

        await expect
            .poll(async () => {
                const value = await formatSelect.inputValue();
                if (value) {
                    return value;
                }
                return await formatSelect.evaluate((element) => {
                    if (element instanceof HTMLSelectElement) {
                        return element.selectedOptions[0]?.label ?? element.value;
                    }
                    return (element as HTMLInputElement).value;
                });
            })
            .toMatch(/png/i);
    }

    const exactExportButton = printing.getByRole('button', { name: /^(Export|Print)$/i });
    const exportButton =
        (await exactExportButton.count()) > 0
            ? exactExportButton
            : printing.getByRole('button', { name: /export|print/i }).first();

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    const download = await downloadPromise;
    await expect.poll(() => download.failure()).toBeNull();

    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await fs.readFile(downloadPath!);
    expect(fileContent.length).toBeGreaterThan(1000);
    expect(fileContent.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});
