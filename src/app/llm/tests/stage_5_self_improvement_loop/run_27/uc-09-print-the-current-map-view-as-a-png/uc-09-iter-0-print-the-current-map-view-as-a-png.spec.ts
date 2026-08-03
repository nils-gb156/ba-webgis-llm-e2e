// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await page.getByTestId('print-toggle').click();

    const printDialog = page.getByRole('dialog');
    await expect(printDialog).toBeVisible();

    let titleInput = printDialog.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = printDialog.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();

    const printTitle = 'Current weather map export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printDialog.getByRole('radio', { name: /png/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatSelect = printDialog.getByRole('combobox', { name: /format/i });
        if ((await formatSelect.count()) === 0) {
            formatSelect = printDialog.getByRole('combobox').first();
        }
        await expect(formatSelect).toBeVisible();

        const formatOptions: Array<{ label?: string; value?: string }> = [
            { label: 'PNG' },
            { label: 'png' },
            { value: 'png' },
            { value: 'image/png' }
        ];

        let pngSelected = false;
        for (const option of formatOptions) {
            try {
                await formatSelect.selectOption(option);
                pngSelected = true;
                break;
            } catch {
                // try next PNG option variant
            }
        }

        expect(pngSelected).toBeTruthy();
        await expect(formatSelect).toHaveValue(/png/i);
    }

    const exportButtonCandidates = [
        printDialog.getByRole('button', { name: /^export$/i }),
        printDialog.getByRole('button', { name: /^download$/i }),
        printDialog.getByRole('button', { name: /^print$/i }),
        printDialog.getByRole('button', { name: /export|download|print/i })
    ];

    let exportButton = exportButtonCandidates[0];
    for (const candidate of exportButtonCandidates) {
        if ((await candidate.count()) > 0) {
            exportButton = candidate.first();
            break;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) {
        throw new Error('Expected a downloaded PNG file, but no download path was available.');
    }

    const fileContent = await readFile(downloadPath);
    expect(fileContent.length).toBeGreaterThan(1024);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
