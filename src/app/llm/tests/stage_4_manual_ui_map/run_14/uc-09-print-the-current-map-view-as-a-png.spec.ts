// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { stat } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printingPanel.isVisible())) {
        const pressed = await printToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printingPanel).toBeVisible();

    const printingContent = page.getByTestId('printing');
    if (await printingContent.count() > 0) {
        await expect(printingContent).toBeVisible();
    }

    let titleInput = printingPanel.getByLabel(/^title$/i);
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByLabel(/title/i);
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByPlaceholder(/title/i);
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox').first();
    } else {
        titleInput = titleInput.first();
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current weather map');

    const pngRadioOptions = printingPanel.getByRole('radio', { name: /^png$/i });
    if ((await pngRadioOptions.count()) > 0) {
        const pngRadio = pngRadioOptions.first();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const pngButtons = printingPanel.getByRole('button', { name: /^png$/i });
        if ((await pngButtons.count()) > 0) {
            await pngButtons.first().click();
        } else {
            let formatControl = printingPanel.getByRole('combobox', { name: /format/i });
            if ((await formatControl.count()) === 0) {
                formatControl = printingPanel.getByLabel(/format/i);
            }
            if ((await formatControl.count()) === 0) {
                formatControl = printingPanel.getByRole('combobox').first();
            } else {
                formatControl = formatControl.first();
            }

            await expect(formatControl).toBeVisible();

            const tagName = await formatControl.evaluate((element) => element.tagName.toLowerCase());
            if (tagName === 'select') {
                try {
                    await formatControl.selectOption({ label: 'PNG' });
                } catch {
                    await formatControl.selectOption('png');
                }
                await expect.poll(() => formatControl.inputValue()).toMatch(/png/i);
            } else {
                await formatControl.click();
                const pngOption = page.getByRole('option', { name: /^png$/i });
                await expect(pngOption.first()).toBeVisible();
                await pngOption.first().click();
            }
        }
    }

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    let exportButton = printingPanel.getByRole('button', { name: /^export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^download$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /export|print|download/i }).first();
    } else {
        exportButton = exportButton.first();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const targetPath = test.info().outputPath(suggestedFilename);
    await download.saveAs(targetPath);

    const fileStats = await stat(targetPath);
    expect(fileStats.size).toBeGreaterThan(0);
});
