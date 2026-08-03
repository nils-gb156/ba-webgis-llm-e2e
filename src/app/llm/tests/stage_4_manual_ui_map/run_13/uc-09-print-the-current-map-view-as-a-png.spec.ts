// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const overlayTitles = [
        'UV-Index',
        'Temperature',
        'Precipitation',
        'Clouds',
        'UV-Index Stations',
        'EUCOS Ground Stations'
    ];

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(
        /^(Carto Light|Carto Dark|OpenStreetMap)$/
    );

    await expect
        .poll(async () => {
            for (const title of overlayTitles) {
                if (await isLayerRendered(page, title)) {
                    return title;
                }
            }
            return undefined;
        })
        .toMatch(/^(UV-Index|Temperature|Precipitation|Clouds|UV-Index Stations|EUCOS Ground Stations)$/);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();

    const printingContent = printingPanel.getByTestId('printing');
    if (await printingContent.count()) {
        await expect(printingContent).toBeVisible();
    }

    const printTitle = 'Current Weather Map';

    let titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByLabel(/title/i);
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox').first();
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    let pngSelected = false;

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
        pngSelected = true;
    }

    if (!pngSelected) {
        let formatCombobox = printingPanel.getByRole('combobox', { name: /format/i });
        if ((await formatCombobox.count()) === 0) {
            formatCombobox = printingPanel.getByRole('combobox').first();
        }

        if ((await formatCombobox.count()) > 0) {
            await expect(formatCombobox).toBeVisible();

            try {
                await formatCombobox.selectOption({ label: 'PNG' });
                try {
                    await expect.poll(() => formatCombobox.inputValue()).toMatch(/png/i);
                } catch {
                    await expect(formatCombobox).toContainText(/png/i);
                }
                pngSelected = true;
            } catch {
                await formatCombobox.click();

                const pngOption = page.getByRole('option', { name: /^png$/i });
                if ((await pngOption.count()) > 0) {
                    await pngOption.first().click();
                    pngSelected = true;
                } else {
                    const pngMenuItem = page.getByRole('menuitemradio', { name: /^png$/i });
                    if ((await pngMenuItem.count()) > 0) {
                        await pngMenuItem.first().click();
                        pngSelected = true;
                    } else {
                        const pngButton = printingPanel.getByRole('button', { name: /^png$/i });
                        if ((await pngButton.count()) > 0) {
                            await pngButton.first().click();
                            pngSelected = true;
                        }
                    }
                }
            }
        }
    }

    expect(pngSelected).toBe(true);

    let exportButton = printingPanel.getByRole('button', { name: /^export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /download/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /(export|print|download)/i });
    }

    await expect(exportButton.first()).toBeVisible();
    await expect(exportButton.first()).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.first().click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (downloadPath) {
        const fileContent = await readFile(downloadPath);
        expect(fileContent.length).toBeGreaterThan(100);
        expect(fileContent.subarray(0, 8)).toEqual(
            Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        );
    }
});
