// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect
        .poll(async () => {
            const activeBaseLayer = await getActiveBaseLayerTitle(page);
            return (
                activeBaseLayer !== undefined &&
                ['Carto Light', 'Carto Dark', 'OpenStreetMap'].includes(activeBaseLayer)
            );
        })
        .toBe(true);

    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const printTitle = 'E2E PNG map export';

    const namedTitleTextbox = printingPanel.getByRole('textbox', { name: /title/i });
    const titleTextbox =
        (await namedTitleTextbox.count()) > 0
            ? namedTitleTextbox.first()
            : printingPanel.getByRole('textbox').first();

    await expect(titleTextbox).toBeVisible();
    await titleTextbox.fill(printTitle);
    await expect(titleTextbox).toHaveValue(printTitle);

    let formatSelected = false;

    const selectPngFromCombobox = async (comboboxLocator: ReturnType<typeof printingPanel.getByRole>) => {
        if ((await comboboxLocator.count()) === 0) {
            return false;
        }

        const combobox = comboboxLocator.first();
        await expect(combobox).toBeVisible();

        const optionTexts = (await combobox.getByRole('option').allTextContents()).map((text) => text.trim());
        const pngOptionLabel = optionTexts.find((text) => /png/i.test(text));
        if (!pngOptionLabel) {
            return false;
        }

        await combobox.selectOption({ label: pngOptionLabel });
        await expect
            .poll(async () => {
                return await combobox.evaluate((element) => {
                    const select = element as HTMLSelectElement;
                    return select.selectedOptions[0]?.textContent?.trim() ?? '';
                });
            })
            .toMatch(/png/i);

        return true;
    };

    formatSelected = await selectPngFromCombobox(printingPanel.getByRole('combobox', { name: /format/i }));

    if (!formatSelected) {
        formatSelected = await selectPngFromCombobox(printingPanel.getByRole('combobox'));
    }

    if (!formatSelected) {
        const pngRadio = printingPanel.getByRole('radio', { name: /^PNG$/i });
        if ((await pngRadio.count()) > 0) {
            await pngRadio.first().click({ force: true });
            await expect(pngRadio.first()).toBeChecked();
            formatSelected = true;
        }
    }

    if (!formatSelected) {
        const pngButton = printingPanel.getByRole('button', { name: /^PNG$/i });
        if ((await pngButton.count()) > 0) {
            await pngButton.first().click();
            formatSelected = true;
        }
    }

    expect(formatSelected).toBe(true);

    let exportButton = printingPanel.getByRole('button', { name: /^(Export|Export Map)$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^(Print|Print Map)$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^(Download|Download Map)$/i });
    }

    const downloadPromise = page.waitForEvent('download');
    await expect(exportButton.first()).toBeVisible();
    await exportButton.first().click();

    const download = await downloadPromise;
    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadedFilePath = await download.path();
    expect(downloadedFilePath).not.toBeNull();

    const fileContent = await readFile(downloadedFilePath!);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect(page.getByTestId('scale-bar')).toBeVisible();
});
