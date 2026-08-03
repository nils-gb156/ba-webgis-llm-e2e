// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }
    await expect(printingPanel).toBeVisible();

    const printingContent =
        (await printingPanel.getByTestId('printing').count()) > 0
            ? printingPanel.getByTestId('printing')
            : printingPanel;

    if ((await printingPanel.getByTestId('printing').count()) > 0) {
        await expect(printingContent).toBeVisible();
    }

    const titleText = `Playwright PNG Export ${Date.now()}`;

    let titleInput = printingContent.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = printingContent.getByLabel(/title/i);
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingContent.getByRole('textbox').first();
    }
    await expect(titleInput.first()).toBeVisible();
    await titleInput.first().fill(titleText);
    await expect(titleInput.first()).toHaveValue(titleText);

    const pngRadio = printingContent.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
    } else {
        let formatCombobox = printingContent.getByRole('combobox', { name: /format/i });
        if ((await formatCombobox.count()) === 0) {
            formatCombobox = printingContent.getByRole('combobox');
        }

        if ((await formatCombobox.count()) > 0) {
            await formatCombobox.first().selectOption({ label: 'PNG' });
            await expect(formatCombobox.first()).toHaveValue(/png/i);
        } else {
            let pngOption = printingContent.getByRole('option', { name: /^png$/i });
            if ((await pngOption.count()) > 0) {
                await pngOption.first().click();
            } else {
                pngOption = printingContent.getByText(/^png$/i);
                await expect(pngOption.first()).toBeVisible();
                await pngOption.first().click();
            }
        }
    }

    let exportButton = printingContent.getByRole('button', { name: /^(export|print)$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingContent.getByRole('button', { name: /export|print/i });
    }
    await expect(exportButton.first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.first().click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    await expect.poll(() => download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (downloadPath) {
        const fileBytes = await readFile(downloadPath);
        expect(fileBytes.length).toBeGreaterThan(8);
        expect(Array.from(fileBytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    }
});
