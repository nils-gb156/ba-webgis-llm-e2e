// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printingPanel.isVisible().catch(() => false))) {
        const pressed = await printToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(printingPanel).toBeVisible();

    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    await expect(printDialog).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();

    const printTitle = 'Use Case 9 PNG Export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const formatSelect = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });

    await expect
        .poll(() =>
            formatSelect.evaluate((element) => {
                const select = element as HTMLSelectElement;
                return select.selectedOptions[0]?.textContent?.trim();
            })
        )
        .toBe('PNG');

    const downloadPromise = page.waitForEvent('download');
    await printDialog.getByRole('button', { name: 'Export map', exact: true }).click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadPath = path.join(os.tmpdir(), suggestedFilename);
    await download.saveAs(downloadPath);

    const fileBuffer = await fs.readFile(downloadPath);
    expect(fileBuffer.length).toBeGreaterThan(1000);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(fileBuffer.subarray(12, 16).toString('ascii')).toBe('IHDR');

    const width = fileBuffer.readUInt32BE(16);
    const height = fileBuffer.readUInt32BE(20);
    expect(width).toBeGreaterThan(100);
    expect(height).toBeGreaterThan(100);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
});
