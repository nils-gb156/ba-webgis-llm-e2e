// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printingContent = page.getByTestId('printing');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();
    await expect(printToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingContent).toBeVisible();

    const printTitle = 'Current Weather Map';

    let titleInput = printingPanel.getByLabel(/title/i);
    if (!(await titleInput.isVisible())) {
        titleInput = printingPanel.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    const pngButton = printingPanel.getByRole('button', { name: /^png$/i });

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await pngButton.isVisible()) {
        await pngButton.click();
        await expect(pngButton).toHaveAttribute('aria-pressed', /true/);
    } else {
        let formatControl = printingPanel.getByLabel(/format/i);
        if (!(await formatControl.isVisible())) {
            formatControl = printingPanel.getByRole('combobox').first();
        }
        await expect(formatControl).toBeVisible();

        try {
            await formatControl.selectOption({ label: 'PNG' });
        } catch {
            await formatControl.click();
            await printingPanel.getByRole('option', { name: /png/i }).click();
        }

        await expect(formatControl).toHaveValue(/png/i);
    }

    let exportButton = printingPanel.getByRole('button', { name: /^(print|export|download)$/i });
    if (!(await exportButton.isVisible())) {
        exportButton = printingPanel.getByRole('button', { name: /print|export|download/i }).first();
    }
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.suggestedFilename()).toMatch(/\.png$/i);

    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();

    const chunks: Buffer[] = [];
    for await (const chunk of stream!) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const fileBytes = Buffer.concat(chunks);
    expect(fileBytes.length).toBeGreaterThan(8);
    expect(fileBytes.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
});
