// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toHaveText(/\S+/);

    await expect
        .poll(async () => {
            const activeBaseLayer = await getActiveBaseLayerTitle(page);
            return ['Carto Light', 'Carto Dark', 'OpenStreetMap'].includes(activeBaseLayer ?? '');
        })
        .toBe(true);

    await expect
        .poll(async () => {
            const visibleOperationalLayers = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index'),
                isLayerRendered(page, 'Precipitation'),
                isLayerRendered(page, 'Clouds'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations')
            ]);
            return visibleOperationalLayers.some(Boolean);
        })
        .toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    await expect(printToggle).toBeVisible();

    if (!(await printingPanel.isVisible())) {
        if ((await printToggle.getAttribute('aria-pressed')) !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printingPanel).toBeVisible();
    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('printing')).toBeVisible();

    const titleInput = printingPanel.getByLabel(/title/i);
    const mapTitle = 'E2E PNG map export';

    await expect(titleInput).toBeVisible();
    await titleInput.fill(mapTitle);
    await expect(titleInput).toHaveValue(mapTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatSelect = printingPanel.getByRole('combobox', { name: /format/i });
        await expect(formatSelect).toBeVisible();
        await formatSelect.selectOption({ label: 'PNG' });
        await expect(formatSelect).toHaveValue(/png/i);
    }

    let exportButton = printingPanel.getByRole('button', { name: /^export$/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printingPanel.getByRole('button', { name: /export|print/i });
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    await expect.poll(() => download.failure()).toBeNull();

    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();
    if (!stream) {
        throw new Error('Expected PNG download stream to be available.');
    }

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        stream.on('end', resolve);
        stream.on('error', reject);
    });

    const fileBuffer = Buffer.concat(chunks);
    expect(fileBuffer.length).toBeGreaterThan(8);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
