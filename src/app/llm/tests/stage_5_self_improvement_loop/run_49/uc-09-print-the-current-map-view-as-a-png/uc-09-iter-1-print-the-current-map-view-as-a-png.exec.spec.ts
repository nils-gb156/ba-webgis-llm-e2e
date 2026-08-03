// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    await expect(printToggle).toBeVisible();

    if (!(await printingPanel.isVisible())) {
        const pressed = await printToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await printToggle.click();
        }
    }

    await expect(printingPanel).toBeVisible();

    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    await expect(printDialog).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();

    const printTitle = 'E2E PNG export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const fileFormat = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(fileFormat).toBeVisible();
    await fileFormat.selectOption({ label: 'PNG' });
    await expect(fileFormat).toHaveValue(/png/i);

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.failure()).toBeNull();

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const buffer = await readFile(downloadPath!);
    expect(buffer.byteLength).toBeGreaterThan(10_000);
    expect(
        buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe(true);

    const analysis = await page.evaluate(
        async ({ base64 }) => {
            const img = new Image();
            const loaded = new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load the downloaded PNG.'));
            });

            img.src = `data:image/png;base64,${base64}`;
            await loaded;

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not create a 2D canvas context for PNG inspection.');
            }

            ctx.drawImage(img, 0, 0);

            const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

            let opaquePixels = 0;
            let beigePixels = 0;
            let bluePixels = 0;
            let redPixels = 0;
            let bottomCenterDarkPixels = 0;
            let bottomCenterLightPixels = 0;

            const bottomStartY = Math.floor(height * 0.78);
            const bottomMinX = Math.floor(width * 0.25);
            const bottomMaxX = Math.ceil(width * 0.75);

            for (let pixelIndex = 0, i = 0; i < data.length; i += 4, pixelIndex++) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a < 200) {
                    continue;
                }

                opaquePixels++;

                if (r > 170 && g > 160 && b > 110 && r >= g && g >= b - 10) {
                    beigePixels++;
                }

                if (b > 130 && b > r + 35 && b > g + 25) {
                    bluePixels++;
                }

                if (r > 150 && r > g + 35 && r > b + 20) {
                    redPixels++;
                }

                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);

                if (y >= bottomStartY && x >= bottomMinX && x <= bottomMaxX) {
                    if (r < 70 && g < 70 && b < 70) {
                        bottomCenterDarkPixels++;
                    }
                    if (r > 220 && g > 220 && b > 220) {
                        bottomCenterLightPixels++;
                    }
                }
            }

            return {
                width,
                height,
                opaquePixels,
                beigePixels,
                bluePixels,
                redPixels,
                bottomCenterDarkPixels,
                bottomCenterLightPixels
            };
        },
        { base64: buffer.toString('base64') }
    );

    expect(analysis.width).toBeGreaterThan(300);
    expect(analysis.height).toBeGreaterThan(200);
    expect(analysis.beigePixels).toBeGreaterThan(analysis.opaquePixels * 0.03);
    expect(analysis.bluePixels + analysis.redPixels).toBeGreaterThan(100);
    expect(analysis.bottomCenterDarkPixels).toBeGreaterThan(20);
    expect(analysis.bottomCenterLightPixels).toBeGreaterThan(100);
});
