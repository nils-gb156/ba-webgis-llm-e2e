// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const printToolbarButton = page.getByRole('button', { name: /^Print Map$/i });
    await expect(printToolbarButton).toBeVisible();

    const printDialog = page.getByRole('dialog', { name: /^Print Map$/i });
    const printRegion = page.getByRole('region', { name: /^Print Map$/i });
    const printPanelHeading = page.getByRole('heading', { name: /^Print Map$/i });

    const dialogVisibleBefore = await printDialog.isVisible().catch(() => false);
    const regionVisibleBefore = await printRegion.isVisible().catch(() => false);
    const headingVisibleBefore = await printPanelHeading.isVisible().catch(() => false);

    if (!dialogVisibleBefore && !regionVisibleBefore && !headingVisibleBefore) {
        await printToolbarButton.click();
    }

    if ((await printDialog.count()) > 0) {
        await expect(printDialog).toBeVisible();
    } else if ((await printRegion.count()) > 0) {
        await expect(printRegion).toBeVisible();
    } else {
        await expect(printPanelHeading).toBeVisible();
    }

    let printContainer = page.locator('body');
    if (await printDialog.isVisible().catch(() => false)) {
        printContainer = printDialog;
    } else if (await printRegion.isVisible().catch(() => false)) {
        printContainer = printRegion;
    }

    const titleInput = printContainer.getByLabel(/title/i);
    await expect(titleInput).toBeVisible();

    const printTitle = `Playwright PNG Export ${Date.now()}`;
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printContainer.getByRole('radio', { name: /^PNG$/i });
    if ((await pngRadio.count()) > 0) {
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatCombobox = printContainer.getByRole('combobox', { name: /format/i });
        await expect(formatCombobox).toBeVisible();
        await formatCombobox.selectOption({ label: 'PNG' });
        await expect(formatCombobox).toHaveValue(/png/i);
    }

    let exportButton = printContainer.getByRole('button', { name: /^Export$/i });
    if (!(await exportButton.isVisible().catch(() => false))) {
        const printButton = printContainer.getByRole('button', { name: /^Print$/i });
        if (await printButton.isVisible().catch(() => false)) {
            exportButton = printButton;
        } else {
            const downloadButton = printContainer.getByRole('button', { name: /^Download$/i });
            if (await downloadButton.isVisible().catch(() => false)) {
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

    if (downloadPath) {
        const fileBuffer = await readFile(downloadPath);
        expect([...fileBuffer.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
        expect(fileBuffer.byteLength).toBeGreaterThan(1000);
    }
});
