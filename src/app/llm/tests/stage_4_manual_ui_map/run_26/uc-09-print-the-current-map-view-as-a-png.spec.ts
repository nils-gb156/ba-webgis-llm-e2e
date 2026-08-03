// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(
        /^(Carto Light|Carto Dark|OpenStreetMap)$/
    );

    await expect
        .poll(async () => {
            const [temperatureVisible, uviStationsVisible, eucosStationsVisible] =
                await Promise.all([
                    isLayerRendered(page, 'Temperature'),
                    isLayerRendered(page, 'UV-Index Stations'),
                    isLayerRendered(page, 'EUCOS Ground Stations')
                ]);
            return temperatureVisible || uviStationsVisible || eucosStationsVisible;
        })
        .toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();

    const printingContent = page.getByTestId('printing');
    await expect(printingContent).toBeVisible();

    const printTitle = 'Weather map export';

    let titleInput = printingContent.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = printingContent.getByLabel(/title/i);
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingContent.getByRole('textbox').first();
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingContent.getByRole('radio', { name: /^PNG$/i });
    let formatCombobox = printingContent.getByRole('combobox', { name: /format/i });
    if ((await formatCombobox.count()) === 0) {
        formatCombobox = printingContent.getByLabel(/format/i);
    }
    const pngTab = printingContent.getByRole('tab', { name: /^PNG$/i });
    const pngButton = printingContent.getByRole('button', { name: /^PNG$/i });

    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if ((await formatCombobox.count()) > 0) {
        await expect(formatCombobox).toBeVisible();
        await formatCombobox.selectOption({ label: 'PNG' });
        await expect(formatCombobox).toHaveValue(/png/i);
    } else if ((await pngTab.count()) > 0) {
        await pngTab.click();
        await expect(pngTab).toHaveAttribute('aria-selected', 'true');
    } else {
        await expect(pngButton).toBeVisible();
        await pngButton.click();
    }

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(
        /^(Carto Light|Carto Dark|OpenStreetMap)$/
    );
    await expect
        .poll(async () => {
            const [temperatureVisible, uviStationsVisible, eucosStationsVisible] =
                await Promise.all([
                    isLayerRendered(page, 'Temperature'),
                    isLayerRendered(page, 'UV-Index Stations'),
                    isLayerRendered(page, 'EUCOS Ground Stations')
                ]);
            return temperatureVisible || uviStationsVisible || eucosStationsVisible;
        })
        .toBe(true);

    let exportButton = printingContent.getByRole('button', {
        name: /^(export|print|download)$/i
    });
    if ((await exportButton.count()) === 0) {
        exportButton = printingContent.getByRole('button', {
            name: /export|print|download/i
        }).first();
    }

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.byteLength).toBeGreaterThan(0);
    expect(fileContent.subarray(0, 8)).toEqual(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    );
});
