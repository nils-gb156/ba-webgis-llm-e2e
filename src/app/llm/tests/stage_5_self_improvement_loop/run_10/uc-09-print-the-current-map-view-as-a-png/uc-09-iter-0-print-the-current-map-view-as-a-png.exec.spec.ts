// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const titleInput = page.getByRole('textbox', { name: /title/i });
    if (!(await titleInput.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(titleInput).toBeVisible();

    const printHeading = page.getByRole('heading', { name: /print/i });
    if (await printHeading.isVisible()) {
        await expect(printHeading).toBeVisible();
    }

    await titleInput.fill('Use Case 9 PNG Export');

    const pngRadio = page.getByRole('radio', { name: /png/i });
    const pngButton = page.getByRole('button', { name: /^PNG$/i });
    const formatCombobox = page.getByRole('combobox', { name: /format/i });

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await pngButton.isVisible()) {
        await pngButton.click();
    } else {
        await expect(formatCombobox).toBeVisible();
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            await formatCombobox.click();
            await page.getByRole('option', { name: /png/i }).click();
        }
        await expect(formatCombobox).toHaveValue(/png/i);
    }

    const exportButton = page.getByRole('button', { name: /^Export$/i });
    const downloadButton = page.getByRole('button', { name: /^Download$/i });
    const printButton = page.getByRole('button', { name: /^Print$/i });

    const downloadPromise = page.waitForEvent('download');

    if (await exportButton.isVisible()) {
        await exportButton.click();
    } else if (await downloadButton.isVisible()) {
        await downloadButton.click();
    } else {
        await expect(printButton).toBeVisible();
        await printButton.click();
    }

    const download = await downloadPromise;
    await expect.poll(() => download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadedFilePath = test.info().outputPath(suggestedFilename);
    await download.saveAs(downloadedFilePath);

    const fileContents = await readFile(downloadedFilePath);
    expect(fileContents.length).toBeGreaterThan(5000);
    expect(Array.from(fileContents.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
