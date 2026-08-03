// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await page.getByTestId('print-toggle').click();

    await expect.poll(async () => {
        if ((await page.getByRole('textbox', { name: /title/i }).count()) > 0) {
            return true;
        }
        return (await page.getByRole('textbox').count()) > 1;
    }).toBe(true);

    const titleInput =
        (await page.getByRole('textbox', { name: /title/i }).count()) > 0
            ? page.getByRole('textbox', { name: /title/i }).first()
            : page.getByRole('textbox').nth(1);

    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current map view export');

    const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
    const formatCombobox = page.getByRole('combobox', { name: /format/i });
    const pngButton = page.getByRole('button', { name: 'PNG', exact: true });

    if ((await pngRadio.count()) > 0) {
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if ((await formatCombobox.count()) > 0) {
        const formatSelect = formatCombobox.first();
        await expect(formatSelect).toBeVisible();
        await formatSelect.selectOption({ label: 'PNG' });
        await expect.poll(() => formatSelect.inputValue()).toMatch(/png/i);
    } else {
        await expect(pngButton).toBeVisible();
        await pngButton.click();
    }

    let exportButton = page.getByRole('button', { name: /^Export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = page.getByRole('button', { name: /^Download$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = page.getByRole('button', { name: /^Print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = page.getByRole('button', { name: /export/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = page.getByRole('button', { name: /download/i });
    }

    await expect(exportButton.first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.first().click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const tempDir = await mkdtemp(join(tmpdir(), 'playwright-print-'));
    const filePath = join(tempDir, suggestedFilename);
    await download.saveAs(filePath);

    const failure = await download.failure();
    expect(failure).toBeNull();

    const fileBuffer = await readFile(filePath);
    expect(fileBuffer.length).toBeGreaterThan(8);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
