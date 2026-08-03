// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    await expect(printToggle).toBeVisible();

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const printTitle = `Current map view ${Date.now()}`;
    const titleInput = printingPanel.getByLabel(/title/i);
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatSelect = printingPanel.getByLabel(/format/i);
        await expect(formatSelect).toBeVisible();

        const pngOption = formatSelect.getByRole('option', { name: /png/i });
        if ((await pngOption.count()) > 0) {
            const optionLabel = (await pngOption.first().textContent())?.trim();
            if (!optionLabel) {
                throw new Error('PNG option exists but has no selectable label.');
            }
            await formatSelect.selectOption({ label: optionLabel });
        } else {
            await formatSelect.selectOption({ value: 'png' });
        }

        await expect.poll(async () => (await formatSelect.inputValue()).toLowerCase()).toMatch(/png/);
    }

    const exportButton = printingPanel.getByRole('button', { name: /export|print/i });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    await expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    if (!downloadPath) {
        throw new Error('Expected a downloadable PNG file, but no download path was available.');
    }

    const fileContent = await readFile(downloadPath);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(fileContent.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
});
