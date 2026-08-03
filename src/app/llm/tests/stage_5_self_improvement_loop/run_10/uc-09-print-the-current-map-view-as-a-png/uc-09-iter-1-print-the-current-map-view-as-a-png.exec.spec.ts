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

    const printToggle = page.getByTestId('print-toggle');
    const printPanel = page.getByTestId('printing-panel');

    if (!(await printPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(printPanel).toBeVisible();

    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    await expect(printDialog).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Use Case 9 PNG Export');

    const formatCombobox = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(formatCombobox).toBeVisible();
    await formatCombobox.selectOption({ label: 'PNG' });
    await expect(formatCombobox).toHaveValue(/png/i);

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

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
