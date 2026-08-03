// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();
    await expect(printToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();

    const titleInputByLabel = printingPanel.getByRole('textbox', { name: /title/i });
    const titleInput =
        (await titleInputByLabel.count()) > 0
            ? titleInputByLabel
            : printingPanel.getByRole('textbox').first();

    await expect(titleInput).toBeVisible();

    const printTitle = 'Current Weather Map';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const formatCombobox = printingPanel.getByRole('combobox', { name: /format/i });
    if ((await formatCombobox.count()) > 0) {
        await expect(formatCombobox).toBeVisible();
        await formatCombobox.selectOption({ label: 'PNG' });
        await expect(formatCombobox).toHaveValue(/png/i);
    } else {
        const pngRadio = printingPanel.getByRole('radio', { name: 'PNG', exact: true });
        if ((await pngRadio.count()) > 0) {
            await pngRadio.click({ force: true });
            await expect(pngRadio).toBeChecked();
        } else {
            const anyCombobox = printingPanel.getByRole('combobox').first();
            if ((await anyCombobox.count()) > 0) {
                await anyCombobox.click();
                await printingPanel.getByRole('option', { name: 'PNG', exact: true }).click();
            } else {
                await printingPanel.getByRole('button', { name: 'PNG', exact: true }).click();
            }
        }
    }

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    let exportButton = printingPanel.getByRole('button', { name: 'Export', exact: true });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: 'Print', exact: true });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: 'Download', exact: true });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button').last();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileBytes = await readFile(downloadPath!);
    expect(fileBytes.byteLength).toBeGreaterThan(1000);
    expect(fileBytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});
