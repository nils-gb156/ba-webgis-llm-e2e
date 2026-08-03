// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

type ParsedPng = {
    width: number;
    height: number;
    channels: number;
    data: Buffer;
};

function paethPredictor(a: number, b: number, c: number): number {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);

    if (pa <= pb && pa <= pc) {
        return a;
    }
    if (pb <= pc) {
        return b;
    }
    return c;
}

function parsePng(buffer: Buffer): ParsedPng {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(buffer.subarray(0, 8).equals(signature)).toBe(true);

    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    let interlaceMethod = 0;
    const idatChunks: Buffer[] = [];

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        offset += 4;

        const type = buffer.toString('ascii', offset, offset + 4);
        offset += 4;

        const data = buffer.subarray(offset, offset + length);
        offset += length;

        offset += 4;

        if (type === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            bitDepth = data.readUInt8(8);
            colorType = data.readUInt8(9);
            interlaceMethod = data.readUInt8(12);
        } else if (type === 'IDAT') {
            idatChunks.push(data);
        } else if (type === 'IEND') {
            break;
        }
    }

    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(bitDepth).toBe(8);
    expect(interlaceMethod).toBe(0);

    let channels: number;
    if (colorType === 6) {
        channels = 4;
    } else if (colorType === 2) {
        channels = 3;
    } else if (colorType === 0) {
        channels = 1;
    } else {
        throw new Error(`Unsupported PNG color type: ${colorType}`);
    }

    const bytesPerPixel = channels;
    const rowLength = width * channels;
    const inflated = inflateSync(Buffer.concat(idatChunks));
    const output = Buffer.alloc(rowLength * height);

    let inOffset = 0;
    let outOffset = 0;

    for (let y = 0; y < height; y += 1) {
        const filterType = inflated[inOffset];
        inOffset += 1;

        for (let x = 0; x < rowLength; x += 1) {
            const raw = inflated[inOffset];
            inOffset += 1;

            const left = x >= bytesPerPixel ? output[outOffset + x - bytesPerPixel] : 0;
            const up = y > 0 ? output[outOffset - rowLength + x] : 0;
            const upLeft =
                y > 0 && x >= bytesPerPixel
                    ? output[outOffset - rowLength + x - bytesPerPixel]
                    : 0;

            let value: number;
            switch (filterType) {
                case 0:
                    value = raw;
                    break;
                case 1:
                    value = (raw + left) & 0xff;
                    break;
                case 2:
                    value = (raw + up) & 0xff;
                    break;
                case 3:
                    value = (raw + Math.floor((left + up) / 2)) & 0xff;
                    break;
                case 4:
                    value = (raw + paethPredictor(left, up, upLeft)) & 0xff;
                    break;
                default:
                    throw new Error(`Unsupported PNG filter type: ${filterType}`);
            }

            output[outOffset + x] = value;
        }

        outOffset += rowLength;
    }

    return { width, height, channels, data: output };
}

test('UC-09 Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect(page.getByTestId('scale-viewer')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
    const printingPanel = page.getByTestId('printing-panel');

    if (!(await printDialog.isVisible())) {
        await printToggle.click();
    }

    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(printDialog).toBeVisible();
    await expect(printingPanel).toBeVisible();

    const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current weather map');
    await expect(titleInput).toHaveValue('Current weather map');

    const formatCombobox = printDialog.getByRole('combobox', {
        name: 'File format',
        exact: true
    });
    await expect(formatCombobox).toBeVisible();

    const tagName = await formatCombobox.evaluate((element) => element.tagName.toLowerCase());
    if (tagName === 'select') {
        await formatCombobox.selectOption({ label: 'PNG' });
    } else {
        await formatCombobox.click();
        await printDialog.getByRole('option', { name: 'PNG', exact: true }).click();
    }

    await expect
        .poll(async () =>
            formatCombobox.evaluate((element) => {
                if (element instanceof HTMLSelectElement) {
                    return element.selectedOptions[0]?.textContent?.trim() ?? '';
                }
                return element.textContent?.trim() ?? '';
            })
        )
        .toMatch(/PNG/i);

    const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(async () => download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadedPath = await download.path();
    expect(downloadedPath).not.toBeNull();
    if (!downloadedPath) {
        throw new Error('Download path is not available.');
    }

    const fileContent = await readFile(downloadedPath);
    expect(fileContent.length).toBeGreaterThan(1000);

    const parsedPng = parsePng(fileContent);
    expect(parsedPng.width).toBeGreaterThan(500);
    expect(parsedPng.height).toBeGreaterThan(300);

    let bluePixels = 0;
    let redPixels = 0;
    let darkPixels = 0;
    let lightPixels = 0;
    let greenishBasePixels = 0;
    let darkPixelsInBottomBand = 0;
    let lightPixelsInBottomBand = 0;
    const colorBuckets = new Set<string>();

    const bottomBandStartRow = Math.floor(parsedPng.height * 0.85);

    for (let y = 0; y < parsedPng.height; y += 1) {
        for (let x = 0; x < parsedPng.width; x += 1) {
            const index = (y * parsedPng.width + x) * parsedPng.channels;
            const r = parsedPng.data[index] ?? 0;
            const g =
                parsedPng.channels >= 3 ? parsedPng.data[index + 1] ?? 0 : parsedPng.data[index] ?? 0;
            const b =
                parsedPng.channels >= 3 ? parsedPng.data[index + 2] ?? 0 : parsedPng.data[index] ?? 0;
            const a = parsedPng.channels === 4 ? parsedPng.data[index + 3] ?? 255 : 255;

            if (a === 0) {
                continue;
            }

            colorBuckets.add(`${r >> 5}-${g >> 5}-${b >> 5}`);

            if (b >= 150 && r <= 120 && g <= 180) {
                bluePixels += 1;
            }
            if (r >= 150 && g <= 140 && b <= 140) {
                redPixels += 1;
            }
            if (r <= 60 && g <= 60 && b <= 60) {
                darkPixels += 1;
                if (y >= bottomBandStartRow) {
                    darkPixelsInBottomBand += 1;
                }
            }
            if (r >= 220 && g >= 220 && b >= 220) {
                lightPixels += 1;
                if (y >= bottomBandStartRow) {
                    lightPixelsInBottomBand += 1;
                }
            }
            if (g >= r && g >= b && r >= 170 && g >= 180 && b >= 150) {
                greenishBasePixels += 1;
            }
        }
    }

    expect(colorBuckets.size).toBeGreaterThan(20);
    expect(greenishBasePixels).toBeGreaterThan(1000);
    expect(bluePixels).toBeGreaterThan(50);
    expect(redPixels).toBeGreaterThan(5);
    expect(darkPixels).toBeGreaterThan(50);
    expect(lightPixels).toBeGreaterThan(1000);
    expect(darkPixelsInBottomBand).toBeGreaterThan(10);
    expect(lightPixelsInBottomBand).toBeGreaterThan(100);
});
