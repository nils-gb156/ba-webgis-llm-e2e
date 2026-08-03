// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    await expect(printingPanel).toBeHidden();

    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();

    const printTitle = `Playwright PNG Export ${Date.now()}`;

    let titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    if (!(await titleInput.count())) {
        titleInput = printingPanel.getByRole('textbox');
    }

    await expect(titleInput.first()).toBeVisible();
    await titleInput.first().fill(printTitle);
    await expect(titleInput.first()).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^PNG$/ });
    if (await pngRadio.count()) {
        await expect(pngRadio.first()).toBeVisible();
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
    } else {
        let formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
        if (!(await formatSelect.count())) {
            formatSelect = printingPanel.getByRole('combobox');
        }

        await expect(formatSelect.first()).toBeVisible();
        await formatSelect.first().selectOption({ label: 'PNG' });
        await expect(formatSelect.first()).toHaveValue(/png/i);
    }

    const exportButton = printingPanel.getByRole('button', {
        name: /^(Export|Print|Download)( Map)?$/i
    });

    await expect(exportButton.first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.first().click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = test.info().outputPath(download.suggestedFilename());
    await download.saveAs(downloadPath);

    const fileContent = await fs.readFile(downloadPath);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
    ]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
