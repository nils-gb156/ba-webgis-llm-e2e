// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printingPanel.isVisible().catch(() => false))) {
        await printToggle.click();
    }

    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(printingPanel).toBeVisible();

    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    await expect(printDialog).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    const fileFormatCombobox = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });

    await expect(titleInput).toBeVisible();
    await expect(fileFormatCombobox).toBeVisible();
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const printTitle = 'UC9 Playwright PNG Export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    await fileFormatCombobox.selectOption({ label: 'PNG' });
    await expect.poll(() => fileFormatCombobox.inputValue()).toMatch(/png/i);

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const outputFile = test.info().outputPath(download.suggestedFilename());
    await download.saveAs(outputFile);

    const fileContent = await readFile(outputFile);
    expect(fileContent.length).toBeGreaterThan(5_000);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
