// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('legend')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    await expect(printToggle).toBeVisible();
    await printToggle.click();

    let titleInput = page.getByRole('textbox', { name: /title/i }).first();
    if (!(await titleInput.isVisible().catch(() => false))) {
        titleInput = page.getByRole('textbox').nth(1);
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current map view PNG export');

    const pngRadio = page.getByRole('radio', { name: /^PNG$/i }).first();
    const pngButton = page.getByRole('button', { name: /^PNG$/i }).first();

    if (await pngRadio.isVisible().catch(() => false)) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await pngButton.isVisible().catch(() => false)) {
        await pngButton.click();
    } else {
        let formatCombobox = page.getByRole('combobox', { name: /format|file format|export format/i }).first();
        if (!(await formatCombobox.isVisible().catch(() => false))) {
            formatCombobox = page.getByRole('combobox').nth(1);
        }

        await expect(formatCombobox).toBeVisible();

        let selected = false;
        for (const option of [
            { label: 'PNG' },
            { value: 'png' },
            { value: 'PNG' },
            { label: 'Portable Network Graphics (PNG)' }
        ]) {
            try {
                await formatCombobox.selectOption(option);
                selected = true;
                break;
            } catch {
                // try next option variant
            }
        }

        expect(selected).toBe(true);
        await expect.poll(async () => (await formatCombobox.inputValue()).toLowerCase()).toContain('png');
    }

    let exportButton = page.getByRole('button', { name: /^Export$/i }).first();
    const exportCandidates = [
        page.getByRole('button', { name: /^Export$/i }).first(),
        page.getByRole('button', { name: /^Print$/i }).first(),
        page.getByRole('button', { name: /^Download$/i }).first()
    ];

    let foundExportButton = false;
    for (const candidate of exportCandidates) {
        if (await candidate.isVisible().catch(() => false)) {
            exportButton = candidate;
            foundExportButton = true;
            break;
        }
    }

    expect(foundExportButton).toBe(true);
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.byteLength).toBeGreaterThan(1024);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
