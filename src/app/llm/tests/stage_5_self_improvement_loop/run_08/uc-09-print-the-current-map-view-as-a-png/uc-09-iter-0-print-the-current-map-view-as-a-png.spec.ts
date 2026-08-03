// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC-9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const titleInput = page.getByRole('textbox', { name: /title/i });

    if (!(await titleInput.isVisible())) {
        await printToggle.click();
    }

    await expect(titleInput).toBeVisible();

    const formatCombobox = page.getByRole('combobox', { name: /format/i });
    const pngRadio = page.getByRole('radio', { name: /png/i });

    if (await pngRadio.count()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        await expect(formatCombobox).toBeVisible();

        const options = await formatCombobox.evaluate((element) => {
            const select = element as HTMLSelectElement;
            return Array.from(select.options).map((option) => ({
                label: option.label,
                value: option.value
            }));
        });

        const pngOption = options.find((option) => /png/i.test(option.label) || /png/i.test(option.value));
        expect(pngOption).toBeDefined();

        if (pngOption?.value) {
            await formatCombobox.selectOption(pngOption.value);
            await expect.poll(() => formatCombobox.inputValue()).toBe(pngOption.value);
        } else if (pngOption) {
            await formatCombobox.selectOption({ label: pngOption.label });
        }
    }

    const printTitle = 'Current weather map';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const exportButtonCandidates = [
        page.getByRole('button', { name: 'Export', exact: true }),
        page.getByRole('button', { name: 'Download', exact: true }),
        page.getByRole('button', { name: 'Print', exact: true }),
        page.getByRole('button', { name: 'Export Map', exact: true })
    ];

    let exportButton = exportButtonCandidates[0];
    let exportButtonFound = false;

    for (const candidate of exportButtonCandidates) {
        if (await candidate.count()) {
            exportButton = candidate;
            exportButtonFound = true;
            break;
        }
    }

    expect(exportButtonFound).toBe(true);
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect(download.failure()).resolves.toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const downloadPath = join(tmpdir(), suggestedFilename);
    await download.saveAs(downloadPath);

    const fileContent = await readFile(downloadPath);
    expect(fileContent.byteLength).toBeGreaterThan(0);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
