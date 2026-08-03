// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();
    await expect(page.getByTestId('legend')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    const printToggle = page.getByTestId('print-toggle');
    await expect(printToggle).toBeVisible();
    await printToggle.click();

    await expect.poll(async () => {
        return (await page.getByLabel(/title/i).count()) > 0 || (await page.getByRole('textbox', { name: /title/i }).count()) > 0;
    }).toBe(true);

    const labeledTitleInput = page.getByLabel(/title/i);
    const titleInput =
        (await labeledTitleInput.count()) > 0
            ? labeledTitleInput.first()
            : page.getByRole('textbox', { name: /title/i }).first();

    await expect(titleInput).toBeVisible();
    await titleInput.fill('Playwright print export');

    const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
    const namedFormatCombobox = page.getByRole('combobox', { name: /format/i });

    await expect.poll(async () => {
        const totalComboboxes = await page.getByRole('combobox').count();
        return (await pngRadio.count()) > 0 || (await namedFormatCombobox.count()) > 0 || totalComboboxes > 1;
    }).toBe(true);

    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatCombobox =
            (await namedFormatCombobox.count()) > 0
                ? namedFormatCombobox.first()
                : page.getByRole('combobox').last();

        await expect(formatCombobox).toBeVisible();
        await formatCombobox.selectOption({ label: 'PNG' });
        await expect(formatCombobox).toHaveValue(/png/i);
    }

    const exportButton = page.getByRole('button', { name: /^(Export( map)?|Print|Download|Generate)$/i });
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const filePath = await download.path();
    if (!filePath) {
        throw new Error('Expected the print export to produce a downloadable file.');
    }

    const fileContent = await readFile(filePath);
    expect(fileContent.length).toBeGreaterThan(0);
    expect(fileContent.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();
});
