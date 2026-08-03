// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('UC9 - Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printingRoot = page.getByTestId('printing');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await expect(printToggle).toHaveAttribute('aria-pressed', 'false');
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingRoot).toBeVisible();
    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');

    const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current weather map');
    await expect(titleInput).toHaveValue('Current weather map');

    const formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
    await expect(formatSelect).toBeVisible();

    const pngOptionValue = await formatSelect.locator('option').evaluateAll((options) => {
        const match = options.find((option) => {
            const element = option as HTMLOptionElement;
            return /png/i.test(element.label) || /png/i.test(element.textContent ?? '') || /png/i.test(element.value);
        }) as HTMLOptionElement | undefined;
        return match?.value;
    });

    expect(pngOptionValue).toBeTruthy();
    await formatSelect.selectOption(pngOptionValue!);
    await expect(formatSelect).toHaveValue(pngOptionValue!);

    const exportButton = printingPanel.getByRole('button', { name: /^(print|export|download)$/i });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
