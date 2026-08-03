// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();

    const basemapSelect = page.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapSelect).toBeVisible();
    await expect(basemapSelect).toHaveValue(/.+/);

    const temperatureLayerCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    await expect(temperatureLayerCheckbox).toBeChecked();
    await expect(page.getByTestId('temperature-legend')).toBeVisible();

    const printToggle = page.getByTestId('print-toggle');
    const printPanelAlreadyOpen =
        (await page.getByRole('textbox', { name: /title/i }).first().isVisible()) ||
        (await page.getByLabel(/title/i).first().isVisible()) ||
        (await page.getByPlaceholder(/title/i).first().isVisible()) ||
        (await page.getByRole('combobox', { name: /format/i }).first().isVisible()) ||
        (await page.getByRole('radio', { name: /^png$/i }).first().isVisible());

    if (!printPanelAlreadyOpen) {
        await printToggle.click();
    }

    await expect.poll(async () => {
        if (await page.getByRole('textbox', { name: /title/i }).first().isVisible()) return 'title-role';
        if (await page.getByLabel(/title/i).first().isVisible()) return 'title-label';
        if (await page.getByPlaceholder(/title/i).first().isVisible()) return 'title-placeholder';
        if (await page.getByRole('combobox', { name: /format/i }).first().isVisible()) return 'format-combobox';
        if (await page.getByRole('radio', { name: /^png$/i }).first().isVisible()) return 'format-radio';
        return '';
    }).not.toBe('');

    let titleInput = page.getByRole('textbox', { name: /title/i }).first();
    if (!(await titleInput.isVisible())) {
        titleInput = page.getByLabel(/title/i).first();
    }
    if (!(await titleInput.isVisible())) {
        titleInput = page.getByPlaceholder(/title/i).first();
    }

    await expect(titleInput).toBeVisible();

    const printTitle = 'Current Weather Map';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const formatSelect = page.getByRole('combobox', { name: /format/i }).first();
    if (await formatSelect.isVisible()) {
        const options = await formatSelect.evaluate((element) =>
            Array.from((element as HTMLSelectElement).options).map((option) => ({
                label: option.label,
                value: option.value
            }))
        );
        const pngOption = options.find((option) => /png/i.test(option.label) || /png/i.test(option.value));
        expect(pngOption).toBeDefined();
        await formatSelect.selectOption(pngOption!.value);
        await expect(formatSelect).toHaveValue(pngOption!.value);
    } else {
        const pngRadio = page.getByRole('radio', { name: /^png$/i }).first();
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    }

    await expect.poll(async () => {
        if (await page.getByRole('button', { name: /^export$/i }).first().isVisible()) return 'export';
        if (await page.getByRole('button', { name: /^download$/i }).first().isVisible()) return 'download';
        if (await page.getByRole('button', { name: /^print$/i }).first().isVisible()) return 'print';
        return '';
    }).not.toBe('');

    let exportButton = page.getByRole('button', { name: /^export$/i }).first();
    if (!(await exportButton.isVisible())) {
        exportButton = page.getByRole('button', { name: /^download$/i }).first();
    }
    if (!(await exportButton.isVisible())) {
        exportButton = page.getByRole('button', { name: /^print$/i }).first();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const failure = await download.failure();
    expect(failure).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();

    const chunks: Buffer[] = [];
    for await (const chunk of stream!) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const fileContent = Buffer.concat(chunks);
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    expect(fileContent.length).toBeGreaterThan(1024);
    expect(fileContent.subarray(0, 8).equals(pngSignature)).toBeTruthy();
});
