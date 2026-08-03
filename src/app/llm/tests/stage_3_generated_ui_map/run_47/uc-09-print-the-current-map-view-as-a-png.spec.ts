// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile, stat } from 'fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect
        .poll(() => getActiveBaseLayerTitle(page))
        .toMatch(/^(Carto Light|Carto Dark|OpenStreetMap)$/);

    const overlayTitles = ['Temperature', 'UV-Index Stations', 'EUCOS Ground Stations'];
    await expect
        .poll(async () => {
            const visibleStates = await Promise.all(
                overlayTitles.map((title) => isLayerRendered(page, title))
            );
            return visibleStates.some(Boolean);
        })
        .toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const titleValue = 'Use Case 9 PNG Export';
    let titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByLabel(/title/i);
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox');
    }
    await expect(titleInput.first()).toBeVisible();
    await titleInput.first().fill(titleValue);
    await expect(titleInput.first()).toHaveValue(titleValue);

    const pngRadio = printingPanel.getByRole('radio', { name: 'PNG', exact: true });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
    } else {
        let formatCombobox = printingPanel.getByRole('combobox', { name: /format/i });
        if ((await formatCombobox.count()) === 0) {
            formatCombobox = printingPanel.getByRole('combobox');
        }

        if ((await formatCombobox.count()) > 0) {
            const formatControl = formatCombobox.first();
            await expect(formatControl).toBeVisible();

            let selected = false;
            for (const option of ['png', 'PNG', 'image/png']) {
                try {
                    await formatControl.selectOption(option);
                    selected = true;
                    break;
                } catch {
                    // try next selector strategy
                }
            }
            if (!selected) {
                try {
                    await formatControl.selectOption({ label: 'PNG' });
                    selected = true;
                } catch {
                    // fall back to opening the list and selecting the visible option
                }
            }
            if (!selected) {
                await formatControl.click();
                await page.getByRole('option', { name: 'PNG', exact: true }).click();
            }

            await expect(formatControl).toHaveValue(/png/i);
        } else {
            const pngButton = printingPanel.getByRole('button', { name: 'PNG', exact: true });
            await expect(pngButton.first()).toBeVisible();
            await pngButton.first().click();
        }
    }

    let exportButton = printingPanel.getByRole('button', { name: 'Export', exact: true });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: 'Print', exact: true });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /export/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /print/i });
    }

    await expect(exportButton.first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.first().click();
    const download = await downloadPromise;

    await expect.poll(async () => await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (downloadPath) {
        const fileStats = await stat(downloadPath);
        expect(fileStats.size).toBeGreaterThan(0);

        const fileContent = await readFile(downloadPath);
        expect(Array.from(fileContent.subarray(0, 8))).toEqual([
            137, 80, 78, 71, 13, 10, 26, 10
        ]);
    }

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect
        .poll(() => getActiveBaseLayerTitle(page))
        .toMatch(/^(Carto Light|Carto Dark|OpenStreetMap)$/);
    await expect
        .poll(async () => {
            const visibleStates = await Promise.all(
                overlayTitles.map((title) => isLayerRendered(page, title))
            );
            return visibleStates.some(Boolean);
        })
        .toBe(true);
});
