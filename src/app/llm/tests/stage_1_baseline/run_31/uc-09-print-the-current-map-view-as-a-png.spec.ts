// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }, testInfo) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
    await expect(printMapButton).toBeVisible();

    const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
    await expect(scaleBar).toBeVisible();

    const printPanel = page.getByRole('dialog', { name: 'Print Map', exact: true });

    if (!(await printPanel.isVisible())) {
        await printMapButton.click();
    }

    await expect(printPanel).toBeVisible();

    const titleInput = printPanel.getByRole('textbox', { name: /title/i });
    await expect(titleInput).toBeVisible();

    const printTitle = 'E2E PNG Export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printPanel.getByRole('radio', { name: 'PNG', exact: true });
    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatSelect = printPanel.getByRole('combobox', { name: /format/i });
        await expect(formatSelect).toBeVisible();
        try {
            await formatSelect.selectOption({ label: 'PNG' });
        } catch {
            await formatSelect.selectOption('png');
        }
        await expect(formatSelect).toHaveValue(/png/i);
    }

    const exportButton = printPanel.getByRole('button', { name: /^(Export|Print)$/i });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(downloadPath);

    const fileBuffer = await readFile(downloadPath);
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    expect(fileBuffer.subarray(0, 8)).toEqual(pngSignature);
    expect(fileBuffer.length).toBeGreaterThan(1000);
});
