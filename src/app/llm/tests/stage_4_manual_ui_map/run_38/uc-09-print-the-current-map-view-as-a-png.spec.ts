// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
    getActiveBaseLayerTitle,
    isLayerRendered
} from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    const printingContent = page.getByTestId('printing');
    await expect(printingContent).toBeVisible();

    const title = 'Playwright PNG export';
    const labeledTitleInput = printingContent.getByLabel(/title/i);
    const titleInput =
        (await labeledTitleInput.count()) > 0
            ? labeledTitleInput.first()
            : printingContent.getByRole('textbox').first();

    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);
    await expect(titleInput).toHaveValue(title);

    let pngSelected = false;

    const pngRadio = printingContent.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
        pngSelected = true;
    }

    if (!pngSelected) {
        const labeledFormatField = printingContent.getByLabel(/format/i);
        if ((await labeledFormatField.count()) > 0) {
            const formatField = labeledFormatField.first();
            await expect(formatField).toBeVisible();
            const tagName = await formatField.evaluate((element) => element.tagName.toLowerCase());

            if (tagName === 'select') {
                try {
                    await formatField.selectOption({ label: 'PNG' });
                } catch {
                    try {
                        await formatField.selectOption({ value: 'png' });
                    } catch {
                        await formatField.selectOption('PNG');
                    }
                }
                await expect.poll(() => formatField.inputValue()).toMatch(/png/i);
                pngSelected = true;
            } else {
                await formatField.click();
                const pngOption = page.getByRole('option', { name: /^png$/i });
                if ((await pngOption.count()) > 0) {
                    await pngOption.click();
                    pngSelected = true;
                } else {
                    const pngMenuItem = page.getByRole('menuitemradio', { name: /^png$/i });
                    if ((await pngMenuItem.count()) > 0) {
                        await pngMenuItem.click({ force: true });
                        pngSelected = true;
                    }
                }
            }
        }
    }

    if (!pngSelected) {
        const comboboxes = printingContent.getByRole('combobox');
        if ((await comboboxes.count()) > 0) {
            const formatCombobox = comboboxes.first();
            await expect(formatCombobox).toBeVisible();
            const tagName = await formatCombobox.evaluate((element) => element.tagName.toLowerCase());

            if (tagName === 'select') {
                try {
                    await formatCombobox.selectOption({ label: 'PNG' });
                } catch {
                    try {
                        await formatCombobox.selectOption({ value: 'png' });
                    } catch {
                        await formatCombobox.selectOption('PNG');
                    }
                }
                await expect.poll(() => formatCombobox.inputValue()).toMatch(/png/i);
                pngSelected = true;
            } else {
                await formatCombobox.click();
                const pngOption = page.getByRole('option', { name: /^png$/i });
                if ((await pngOption.count()) > 0) {
                    await pngOption.click();
                    pngSelected = true;
                }
            }
        }
    }

    if (!pngSelected) {
        const pngButton = printingContent.getByRole('button', { name: /^png$/i });
        if ((await pngButton.count()) > 0) {
            await expect(pngButton).toBeVisible();
            await pngButton.click();
            pngSelected = true;
        }
    }

    expect(pngSelected).toBe(true);

    const exportButton = printingContent.getByRole('button', { name: /export|print|download/i }).first();
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    await expect.poll(() => download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContents = await readFile(downloadPath!);
    expect(fileContents.length).toBeGreaterThan(8);
    expect(Array.from(fileContents.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
