// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(/\S+/);
    await expect
        .poll(async () => {
            const visibleOverlays = await Promise.all([
                isLayerRendered(page, 'UV-Index'),
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'Precipitation'),
                isLayerRendered(page, 'Clouds'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations')
            ]);
            return visibleOverlays.some(Boolean);
        })
        .toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printingPanel.isVisible())) {
        const printTogglePressed = await printToggle.getAttribute('aria-pressed');
        if (printTogglePressed !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printingPanel).toBeVisible();

    const printingContent = printingPanel.getByTestId('printing');
    await expect(printingContent).toBeVisible();

    const printTitle = 'Current map view PNG export';

    let titleInput = printingContent.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = printingContent.getByLabel(/title/i);
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const formatCombobox = printingContent.getByRole('combobox', { name: /format/i });
    if ((await formatCombobox.count()) > 0) {
        await expect(formatCombobox).toBeVisible();
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            try {
                await formatCombobox.selectOption({ value: 'PNG' });
            } catch {
                await formatCombobox.selectOption({ value: 'png' });
            }
        }
        await expect.poll(async () => await formatCombobox.inputValue()).toMatch(/png/i);
    } else {
        let pngRadio = printingContent.getByRole('radio', { name: /^png$/i });
        if ((await pngRadio.count()) === 0) {
            pngRadio = printingContent.getByRole('radio', { name: /png/i });
        }
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    }

    let exportButton = printingContent.getByRole('button', { name: /^(print|export|download)( map)?$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingContent.getByRole('button', { name: /print|export|download/i });
    }
    const exportAction = exportButton.first();
    await expect(exportAction).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportAction.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileBuffer = await readFile(downloadPath!);
    expect(fileBuffer.length).toBeGreaterThan(8);
    expect(fileBuffer.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
});
