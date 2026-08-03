// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
    getActiveBaseLayerTitle,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getMapZoomLevel(page)) ?? -1).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printTitle = 'Use Case 9 PNG Export';
    const titleInput = page.getByRole('textbox', { name: /title/i });

    let printPanelVisible = false;
    if ((await titleInput.count()) > 0) {
        printPanelVisible = await titleInput.first().isVisible();
    }

    if (!printPanelVisible) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatCombobox = page.getByRole('combobox', { name: /format/i });
        if ((await formatCombobox.count()) > 0) {
            await expect(formatCombobox).toBeVisible();
            try {
                await formatCombobox.selectOption({ label: 'PNG' });
            } catch {
                await formatCombobox.selectOption('png');
            }
            await expect(formatCombobox).toHaveValue(/png/i);
        } else {
            const formatButton = page.getByRole('button', { name: /format/i });
            await expect(formatButton).toBeVisible();
            await formatButton.click();

            const pngOption = page.getByRole('option', { name: /^png$/i });
            if ((await pngOption.count()) > 0) {
                await pngOption.click();
            } else {
                const pngMenuItem = page.getByRole('menuitemradio', { name: /^png$/i });
                await pngMenuItem.click();
                await expect(pngMenuItem).toHaveAttribute('aria-checked', 'true');
            }
        }
    }

    let exportButton = page.getByRole('button', { name: /^export$/i });
    if ((await exportButton.count()) === 0) {
        const printButton = page.getByRole('button', { name: /^print$/i });
        if ((await printButton.count()) > 0) {
            exportButton = printButton;
        } else {
            const downloadButton = page.getByRole('button', { name: /^download$/i });
            if ((await downloadButton.count()) > 0) {
                exportButton = downloadButton;
            }
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    const download = await downloadPromise;
    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) {
        throw new Error('Expected a downloaded PNG file, but no download path was available.');
    }

    const fileContent = await readFile(downloadPath);
    expect(fileContent.length).toBeGreaterThan(1024);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
