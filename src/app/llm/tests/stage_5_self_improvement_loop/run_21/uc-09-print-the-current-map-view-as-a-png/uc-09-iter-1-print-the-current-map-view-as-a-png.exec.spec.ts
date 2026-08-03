// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile, stat } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });

    if (!(await printDialog.isVisible().catch(() => false))) {
        if ((await printToggle.getAttribute('aria-pressed')) !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printDialog).toBeVisible();
    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('printing-panel')).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Playwright PNG export');
    await expect(titleInput).toHaveValue('Playwright PNG export');

    const formatSelect = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });
    await expect.poll(() => formatSelect.inputValue()).toMatch(/png/i);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (!downloadPath) {
        throw new Error('Expected the generated PNG to be stored on disk.');
    }

    await expect.poll(async () => (await stat(downloadPath)).size).toBeGreaterThan(100);

    const fileContent = await readFile(downloadPath);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
