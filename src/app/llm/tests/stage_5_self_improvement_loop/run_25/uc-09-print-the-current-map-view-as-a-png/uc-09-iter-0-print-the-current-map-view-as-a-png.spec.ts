// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC9 Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const titleInput = page
        .getByRole('textbox', { name: /title/i })
        .or(page.getByLabel(/title/i))
        .first();

    if (!(await titleInput.isVisible())) {
        await printToggle.click();
    }

    await expect(titleInput).toBeVisible();

    const printTitle = 'Current weather map';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: /^png$/i });
    const pngButton = page.getByRole('button', { name: /^png$/i });
    const formatSelect = page
        .getByRole('combobox', { name: /file format|format/i })
        .or(page.getByLabel(/file format|format/i))
        .first();

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await pngButton.isVisible()) {
        await pngButton.click();
        await expect(pngButton).toHaveAttribute('aria-pressed', /true/);
    } else {
        await expect(formatSelect).toBeVisible();
        try {
            await formatSelect.selectOption({ label: 'PNG' });
        } catch {
            try {
                await formatSelect.selectOption('png');
            } catch {
                await formatSelect.selectOption('PNG');
            }
        }
        await expect.poll(() => formatSelect.inputValue()).toMatch(/png/i);
    }

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const exportButton = page
        .getByRole('button', { name: /^export$/i })
        .or(page.getByRole('button', { name: /^print$/i }))
        .or(page.getByRole('button', { name: /^download$/i }))
        .first();

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.failure()).toBeNull();

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (downloadPath) {
        const fileContent = await readFile(downloadPath);
        expect(fileContent.length).toBeGreaterThan(8);
        expect([...fileContent.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    }
});
