// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }
    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const labelledTitleInput = printingPanel.getByRole('textbox', { name: /title/i });
    const titleInput =
        (await labelledTitleInput.count()) > 0
            ? labelledTitleInput
            : printingPanel.getByRole('textbox').first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current Weather Map');

    const pngRadio = printingPanel.getByRole('radio', { name: 'PNG', exact: true });
    if ((await pngRadio.count()) > 0) {
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatSelect = printingPanel.getByRole('combobox').first();
        await expect(formatSelect).toBeVisible();
        await formatSelect.selectOption({ label: 'PNG' });
        await expect(formatSelect).toHaveValue(/png/i);
    }

    const exportButton = printingPanel.getByRole('button', { name: /^(print|export|download)$/i }).first();
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();

    const chunks: Buffer[] = [];
    for await (const chunk of stream!) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const fileBytes = Buffer.concat(chunks);

    expect(fileBytes.length).toBeGreaterThan(8);
    expect(
        fileBytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe(true);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
