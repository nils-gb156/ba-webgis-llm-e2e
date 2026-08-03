// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const titleInput = page.getByLabel(/title/i);

    if (!(await titleInput.isVisible().catch(() => false))) {
        await printToggle.click();
    }

    await expect(titleInput).toBeVisible();

    const printTitle = 'Current weather map';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });

    if (await pngRadio.isVisible().catch(() => false)) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatCombobox = page.getByRole('combobox', { name: /format|file format|output format/i });

        if (!(await formatCombobox.isVisible().catch(() => false))) {
            const comboboxes = page.getByRole('combobox');
            const comboCount = await comboboxes.count();
            expect(comboCount).toBeGreaterThan(1);
            formatCombobox = comboboxes.nth(comboCount - 1);
        }

        await expect(formatCombobox).toBeVisible();

        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            try {
                await formatCombobox.selectOption({ value: 'png' });
            } catch {
                try {
                    await formatCombobox.selectOption({ value: 'image/png' });
                } catch {
                    await formatCombobox.click();
                    await page.getByRole('option', { name: 'PNG', exact: true }).click();
                }
            }
        }

        await expect.poll(async () => (await formatCombobox.inputValue()).toLowerCase()).toMatch(/png/);
    }

    const downloadPromise = page.waitForEvent('download');
    let exportTriggered = false;

    const printDialog = page.getByRole('dialog');
    if (await printDialog.isVisible().catch(() => false)) {
        const dialogAction = printDialog.getByRole('button', { name: /^(Export|Download|Print)$/i });
        if ((await dialogAction.count()) > 0 && (await dialogAction.first().isVisible().catch(() => false))) {
            await dialogAction.first().click();
            exportTriggered = true;
        }
    }

    if (!exportTriggered) {
        const exportButton = page.getByRole('button', { name: 'Export', exact: true });
        const exportMapButton = page.getByRole('button', { name: 'Export Map', exact: true });
        const downloadButton = page.getByRole('button', { name: 'Download', exact: true });
        const printButton = page.getByRole('button', { name: 'Print', exact: true });

        if (await exportButton.isVisible().catch(() => false)) {
            await exportButton.click();
        } else if (await exportMapButton.isVisible().catch(() => false)) {
            await exportMapButton.click();
        } else if (await downloadButton.isVisible().catch(() => false)) {
            await downloadButton.click();
        } else {
            await expect(printButton).toBeVisible();
            await printButton.click();
        }
    }

    const download = await downloadPromise;
    await expect.poll(() => download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const outputPath = test.info().outputPath(suggestedFilename);
    await download.saveAs(outputPath);

    const fileBytes = await readFile(outputPath);
    expect(fileBytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(fileBytes.length).toBeGreaterThan(5000);
});
