// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    const printingContent = page.getByTestId('printing');

    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingContent).toBeVisible();

    const printTitle = 'Weather map export';
    const labelledTitleInput = printingContent.getByLabel(/title/i);
    const titleInput =
        (await labelledTitleInput.count()) > 0
            ? labelledTitleInput
            : printingContent.getByRole('textbox').first();

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    let pngSelected = false;

    const pngRadio = printingContent.getByRole('radio', { name: /png/i });
    if ((await pngRadio.count()) > 0) {
        if (!(await pngRadio.isChecked())) {
            await pngRadio.click({ force: true });
        }
        await expect(pngRadio).toBeChecked();
        pngSelected = true;
    }

    if (!pngSelected) {
        const namedFormatCombo = printingContent.getByRole('combobox', { name: /format/i });
        if ((await namedFormatCombo.count()) > 0) {
            await expect(namedFormatCombo).toBeVisible();
            await namedFormatCombo.selectOption({ label: 'PNG' });
            await expect(namedFormatCombo).toHaveValue(/png/i);
            pngSelected = true;
        }
    }

    if (!pngSelected) {
        const labelledFormatCombo = printingContent.getByLabel(/format/i);
        if ((await labelledFormatCombo.count()) > 0) {
            await expect(labelledFormatCombo).toBeVisible();
            await labelledFormatCombo.selectOption({ label: 'PNG' });
            await expect(labelledFormatCombo).toHaveValue(/png/i);
            pngSelected = true;
        }
    }

    if (!pngSelected) {
        const pngButton = printingContent.getByRole('button', { name: /png/i });
        if ((await pngButton.count()) > 0) {
            await pngButton.click();
            pngSelected = true;
        }
    }

    if (!pngSelected) {
        const genericFormatCombo = printingContent.getByRole('combobox').first();
        await expect(genericFormatCombo).toBeVisible();
        await genericFormatCombo.selectOption({ label: 'PNG' });
        await expect(genericFormatCombo).toHaveValue(/png/i);
    }

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    let exportButton = printingContent.getByRole('button', { name: /^export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingContent.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingContent.getByRole('button', { name: /^download$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingContent.getByRole('button', { name: /export|print|download/i }).first();
    }

    await expect(exportButton).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent('download'), exportButton.click()]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = test.info().outputPath('printed-map.png');
    await download.saveAs(downloadPath);
    expect(await download.failure()).toBeNull();

    const fileBuffer = await readFile(downloadPath);
    expect(fileBuffer.length).toBeGreaterThan(8);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
