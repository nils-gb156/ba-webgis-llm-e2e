// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('UC9 - Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }
    await expect(printingPanel).toBeVisible();

    const title = 'Current weather map';
    const titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);
    await expect(titleInput).toHaveValue(title);

    const pngRadio = printingPanel.getByRole('radio', { name: 'PNG', exact: true });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatCombobox = printingPanel.getByRole('combobox', { name: /format/i });
        if ((await formatCombobox.count()) > 0) {
            await expect(formatCombobox).toBeVisible();
            await formatCombobox.selectOption({ label: 'PNG' });
            await expect.poll(async () => (await formatCombobox.inputValue()).toLowerCase()).toContain('png');
        } else {
            const pngButton = printingPanel.getByRole('button', { name: 'PNG', exact: true });
            await expect(pngButton).toBeVisible();
            await pngButton.click();
        }
    }

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const exactExportButtonCandidates = [
        printingPanel.getByRole('button', { name: 'Export', exact: true }),
        printingPanel.getByRole('button', { name: 'Export Map', exact: true }),
        printingPanel.getByRole('button', { name: 'Print', exact: true }),
        printingPanel.getByRole('button', { name: 'Print Map', exact: true }),
        printingPanel.getByRole('button', { name: 'Download', exact: true })
    ];

    let exportButton = printingPanel.getByRole('button', { name: /print|export|download/i }).first();
    for (const candidate of exactExportButtonCandidates) {
        if ((await candidate.count()) > 0) {
            exportButton = candidate;
            break;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (downloadPath) {
        const buffer = await readFile(downloadPath);
        expect(buffer.length).toBeGreaterThan(8);
        expect(Array.from(buffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    }
});
