// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printingPanel = page.getByTestId('printing-panel');
    const printToggle = page.getByTestId('print-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect
        .poll(async () => (await getActiveBaseLayerTitle(page)) ?? '')
        .toMatch(/\S+/);

    await expect
        .poll(async () => {
            const states = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations'),
                isLayerRendered(page, 'UV-Index'),
                isLayerRendered(page, 'Precipitation'),
                isLayerRendered(page, 'Clouds')
            ]);
            return states.some(Boolean);
        })
        .toBe(true);

    if (!(await printingPanel.isVisible())) {
        const pressed = await printToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printingPanel).toBeVisible();

    const printTitle = 'Current weather map';

    let titleInput = printingPanel.getByLabel(/title/i);
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox').first();
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect.poll(() => titleInput.inputValue()).toBe(printTitle);

    let pngSelected = false;

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
        pngSelected = true;
    } else {
        let formatControl = printingPanel.getByLabel(/format/i);
        if ((await formatControl.count()) === 0) {
            formatControl = printingPanel.getByRole('combobox', { name: /format/i });
        }
        if ((await formatControl.count()) === 0) {
            formatControl = printingPanel.getByRole('combobox').first();
        }

        if ((await formatControl.count()) > 0) {
            await expect(formatControl).toBeVisible();

            for (const option of [
                { label: 'PNG' },
                { label: 'png' },
                { value: 'png' },
                { value: 'PNG' },
                { value: 'image/png' }
            ]) {
                try {
                    await formatControl.selectOption(option);
                    pngSelected = true;
                    break;
                } catch {
                    // try next option shape/value
                }
            }

            if (!pngSelected) {
                await formatControl.click();
                const pngOption = page.getByRole('option', { name: /^png$/i });
                if ((await pngOption.count()) > 0) {
                    await pngOption.first().click();
                    pngSelected = true;
                }
            }

            if (pngSelected) {
                await expect
                    .poll(() =>
                        formatControl.evaluate((element) => {
                            if (element instanceof HTMLSelectElement) {
                                return (
                                    element.selectedOptions[0]?.textContent?.trim() ??
                                    element.value
                                );
                            }
                            return (
                                (element as HTMLInputElement).value ??
                                element.getAttribute('aria-activedescendant') ??
                                element.textContent ??
                                ''
                            );
                        })
                    )
                    .toMatch(/png/i);
            }
        }
    }

    if (!pngSelected) {
        let pngButton = printingPanel.getByRole('button', { name: /^png$/i });
        if ((await pngButton.count()) === 0) {
            pngButton = printingPanel.getByText(/^png$/i);
        }
        await expect(pngButton).toBeVisible();
        await pngButton.click();
        pngSelected = true;
    }

    expect(pngSelected).toBe(true);

    let exportButton = printingPanel.getByRole('button', { name: /^export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /export|print/i });
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadedPath = await download.path();
    expect(downloadedPath).not.toBeNull();

    const fileBytes = await readFile(downloadedPath as string);
    expect(Array.from(fileBytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(fileBytes.byteLength).toBeGreaterThan(1000);
});
