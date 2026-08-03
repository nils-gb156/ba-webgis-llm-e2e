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
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const printPanel = page.getByTestId('printing-panel');
    if (!(await printPanel.isVisible().catch(() => false))) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(page.getByTestId('print-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(printPanel).toBeVisible();

    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    await expect(printDialog).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();

    const printTitle = 'Current Weather Map';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const formatSelect = printDialog.getByRole('combobox', { name: 'File format', exact: true });
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });

    await expect
        .poll(async () => {
            return await formatSelect.evaluate((element) => {
                const select = element as HTMLSelectElement;
                return select.selectedOptions[0]?.textContent?.trim();
            });
        })
        .toBe('PNG');

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(fileContent.subarray(0, 8).equals(pngSignature)).toBe(true);
    expect(fileContent.byteLength).toBeGreaterThan(10_000);

    const imageAnalysis = await page.evaluate(async (rawBytes) => {
        const blob = new Blob([new Uint8Array(rawBytes)], { type: 'image/png' });
        const url = URL.createObjectURL(blob);

        try {
            const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to decode PNG image.'));
                img.src = url;
            });

            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const context = canvas.getContext('2d');
            if (!context) {
                return null;
            }

            context.drawImage(image, 0, 0);
            const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);

            let opaquePixels = 0;
            let nonWhitePixels = 0;
            let bluePixels = 0;
            let redPixels = 0;
            let bottomBandPixels = 0;
            let bottomBandDarkPixels = 0;
            let longestDarkRunInBottomQuarter = 0;
            const quantizedColors = new Set<string>();

            for (let y = 0; y < height; y++) {
                let currentDarkRun = 0;

                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];
                    const a = data[index + 3];

                    if (a < 200) {
                        currentDarkRun = 0;
                        continue;
                    }

                    opaquePixels++;

                    if (!(r > 245 && g > 245 && b > 245)) {
                        nonWhitePixels++;
                    }

                    if (b > 120 && b > r + 20 && b > g + 10) {
                        bluePixels++;
                    }

                    if (r > 140 && r > g + 25 && r > b + 25) {
                        redPixels++;
                    }

                    quantizedColors.add(`${r >> 5}-${g >> 5}-${b >> 5}`);

                    const isDarkPixel = r < 130 && g < 130 && b < 130;
                    if (y >= Math.floor(height * 0.85)) {
                        bottomBandPixels++;
                        if (isDarkPixel) {
                            bottomBandDarkPixels++;
                        }
                    }

                    if (y >= Math.floor(height * 0.75) && isDarkPixel) {
                        currentDarkRun++;
                        if (currentDarkRun > longestDarkRunInBottomQuarter) {
                            longestDarkRunInBottomQuarter = currentDarkRun;
                        }
                    } else {
                        currentDarkRun = 0;
                    }
                }
            }

            return {
                width,
                height,
                opaquePixels,
                nonWhiteRatio: opaquePixels === 0 ? 0 : nonWhitePixels / opaquePixels,
                blueRatio: opaquePixels === 0 ? 0 : bluePixels / opaquePixels,
                redRatio: opaquePixels === 0 ? 0 : redPixels / opaquePixels,
                bottomBandDarkRatio: bottomBandPixels === 0 ? 0 : bottomBandDarkPixels / bottomBandPixels,
                quantizedColorCount: quantizedColors.size,
                longestDarkRunInBottomQuarter
            };
        } finally {
            URL.revokeObjectURL(url);
        }
    }, Array.from(fileContent));

    expect(imageAnalysis).not.toBeNull();
    expect(imageAnalysis!.width).toBeGreaterThan(400);
    expect(imageAnalysis!.height).toBeGreaterThan(300);
    expect(imageAnalysis!.opaquePixels).toBeGreaterThan(100_000);
    expect(imageAnalysis!.nonWhiteRatio).toBeGreaterThan(0.1);
    expect(imageAnalysis!.quantizedColorCount).toBeGreaterThan(20);
    expect(imageAnalysis!.blueRatio).toBeGreaterThan(0.0002);
    expect(imageAnalysis!.redRatio).toBeGreaterThan(0.00001);
    expect(imageAnalysis!.bottomBandDarkRatio).toBeGreaterThan(0.001);
    expect(imageAnalysis!.longestDarkRunInBottomQuarter).toBeGreaterThan(20);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
});
