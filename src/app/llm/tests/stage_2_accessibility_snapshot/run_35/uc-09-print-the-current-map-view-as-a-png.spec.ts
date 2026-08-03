// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    const basemapsCombobox = page.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapsCombobox).toBeVisible();
    await expect(basemapsCombobox).toContainText(/carto light/i);

    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    await expect(eucosCheckbox).toBeChecked();
    await expect(temperatureCheckbox).toBeChecked();
    await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();
    await expect(page.getByTestId('temperature-legend')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await page.getByTestId('print-toggle').click();

    const printHeading = page.getByRole('heading', { name: /print/i });
    const globalTitleTextbox = page.getByRole('textbox', { name: /title/i });

    await expect.poll(async () => {
        if (await printHeading.first().isVisible().catch(() => false)) {
            return 'heading';
        }
        if (await globalTitleTextbox.first().isVisible().catch(() => false)) {
            return 'title';
        }
        return '';
    }).not.toBe('');

    let panelRoot = page.locator('body');
    const printDialog = page.getByRole('dialog');
    if ((await printDialog.count()) > 0 && (await printDialog.first().isVisible().catch(() => false))) {
        panelRoot = printDialog.first();
    }

    let titleInput = panelRoot.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = panelRoot.getByPlaceholder(/title/i);
    }
    await expect(titleInput.first()).toBeVisible();

    const printTitle = 'Weather forecast map export';
    await titleInput.first().fill(printTitle);
    await expect(titleInput.first()).toHaveValue(printTitle);

    const pngRadio = panelRoot.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
    } else {
        let formatControl = panelRoot.getByRole('combobox', { name: /format|file format/i });
        if ((await formatControl.count()) === 0) {
            formatControl = panelRoot.getByLabel(/format|file format/i);
        }
        await expect(formatControl.first()).toBeVisible();

        const tagName = await formatControl.first().evaluate((element) => element.tagName.toLowerCase());
        if (tagName === 'select') {
            const pngValue = await formatControl.first().evaluate((element) => {
                const select = element as HTMLSelectElement;
                const option = Array.from(select.options).find((entry) =>
                    /png/i.test(entry.label) || /png/i.test(entry.text) || /png/i.test(entry.value)
                );
                return option?.value ?? '';
            });

            expect(pngValue).not.toBe('');
            await formatControl.first().selectOption(pngValue);
            await expect.poll(async () => formatControl.first().inputValue()).toBe(pngValue);
        } else {
            await formatControl.first().click();
            const pngOption = page.getByRole('option', { name: /png/i });
            await expect(pngOption.first()).toBeVisible();
            await pngOption.first().click();
            await expect(formatControl.first()).toContainText(/png/i);
        }
    }

    let exportButtonCandidates = panelRoot.getByRole('button', { name: /export|download|create/i });
    if ((await exportButtonCandidates.count()) === 0) {
        exportButtonCandidates = panelRoot.getByRole('button', { name: /^print(?: map)?$/i });
    }
    const exportButton = exportButtonCandidates.first();
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileBuffer = await fs.readFile(downloadPath!);
    expect(fileBuffer.length).toBeGreaterThan(8);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
