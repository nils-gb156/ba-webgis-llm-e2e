// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import * as fs from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const toolbar = page.getByRole('toolbar').first();
    let printMapButton = toolbar.getByRole('button', { name: 'Print Map', exact: true });
    if ((await printMapButton.count()) === 0) {
        printMapButton = page.getByRole('button', { name: 'Print Map', exact: true }).first();
    }
    await expect(printMapButton).toBeVisible();

    const printPanelDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    const printPanelRegion = page.getByRole('region', { name: 'Print Map', exact: true });
    const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });

    const panelVisibleBeforeOpen =
        (await printPanelDialog.isVisible()) ||
        (await printPanelRegion.isVisible()) ||
        (await printPanelHeading.isVisible());

    if (!panelVisibleBeforeOpen) {
        await printMapButton.click();
    }

    await expect
        .poll(async () => {
            return (
                (await printPanelDialog.isVisible()) ||
                (await printPanelRegion.isVisible()) ||
                (await printPanelHeading.isVisible())
            );
        })
        .toBe(true);

    const panelScope = (await printPanelDialog.isVisible())
        ? printPanelDialog
        : (await printPanelRegion.isVisible())
          ? printPanelRegion
          : page;

    let titleInput = panelScope.getByRole('textbox', { name: 'Title', exact: true });
    if ((await titleInput.count()) === 0) {
        titleInput = panelScope.getByRole('textbox', { name: /title/i }).first();
    }
    await expect(titleInput).toBeVisible();

    const printTitle = 'Use Case 9 PNG Export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = panelScope.getByRole('radio', { name: 'PNG', exact: true });
    if ((await pngRadio.count()) > 0) {
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatSelect = panelScope.getByRole('combobox', { name: 'Format', exact: true });
        if ((await formatSelect.count()) === 0) {
            formatSelect = panelScope.getByRole('combobox', { name: /format/i }).first();
        }
        await expect(formatSelect).toBeVisible();

        try {
            await formatSelect.selectOption({ label: 'PNG' });
        } catch {
            try {
                await formatSelect.selectOption('png');
            } catch {
                await formatSelect.selectOption({ value: 'PNG' });
            }
        }

        await expect(formatSelect).toHaveValue(/png/i);
    }

    const exportCandidates = [
        panelScope.getByRole('button', { name: 'Export', exact: true }),
        panelScope.getByRole('button', { name: 'Print', exact: true }),
        panelScope.getByRole('button', { name: 'Export Map', exact: true }),
        panelScope.getByRole('button', { name: 'Print Map', exact: true }),
        panelScope.getByRole('button', { name: /^(Export|Print|Download)( Map)?$/i }).first()
    ];

    let exportButton = exportCandidates[0];
    for (const candidate of exportCandidates) {
        if ((await candidate.count()) > 0) {
            exportButton = candidate;
            break;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const savedFile = test.info().outputPath(suggestedFilename);
    await download.saveAs(savedFile);

    const fileContent = await fs.readFile(savedFile);
    expect(fileContent.byteLength).toBeGreaterThan(500);
    expect(fileContent.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
});
