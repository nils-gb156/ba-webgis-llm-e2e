// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
    await expect(printMapButton).toBeVisible();

    const titleInputCandidates = [
        page.getByLabel('Title', { exact: true }),
        page.getByRole('textbox', { name: /title/i })
    ];

    let titleInput = titleInputCandidates[0];
    for (const candidate of titleInputCandidates) {
        if ((await candidate.count()) > 0) {
            titleInput = candidate;
            break;
        }
    }

    if (!(await titleInput.isVisible())) {
        await printMapButton.click();
    }

    await expect(titleInput).toBeVisible();

    const mapTitle = 'Current map view PNG export';
    await titleInput.fill(mapTitle);
    await expect(titleInput).toHaveValue(mapTitle);

    const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatSelectCandidates = [
            page.getByLabel('Format', { exact: true }),
            page.getByLabel(/format/i),
            page.getByRole('combobox', { name: /format/i })
        ];

        let formatSelect = formatSelectCandidates[0];
        for (const candidate of formatSelectCandidates) {
            if ((await candidate.count()) > 0) {
                formatSelect = candidate;
                break;
            }
        }

        await expect(formatSelect).toBeVisible();
        await formatSelect.selectOption({ label: 'PNG' });
        await expect(formatSelect).toHaveValue(/png/i);
    }

    const exportButtonCandidates = [
        page.getByRole('button', { name: 'Export', exact: true }),
        page.getByRole('button', { name: 'Print', exact: true }),
        page.getByRole('button', { name: 'Download', exact: true })
    ];

    let exportButton = exportButtonCandidates[0];
    for (const candidate of exportButtonCandidates) {
        if ((await candidate.count()) > 0) {
            exportButton = candidate;
            break;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    expect(await download.failure()).toBeNull();

    const buffer = await readFile(downloadPath!);
    expect(buffer.length).toBeGreaterThan(1024);
    expect([...buffer.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    expect(width).toBeGreaterThan(100);
    expect(height).toBeGreaterThan(100);

    const imageStats = await page.evaluate(async (base64: string) => {
        return await new Promise<{
            sampleCount: number;
            nonTransparent: number;
            nonWhite: number;
            darkPixels: number;
            lightPixels: number;
            colorBuckets: number;
        } | null>((resolve) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                const context = canvas.getContext('2d');
                if (!context) {
                    resolve(null);
                    return;
                }

                context.drawImage(img, 0, 0);

                const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
                const totalPixels = data.length / 4;
                const sampleStep = Math.max(1, Math.floor(totalPixels / 5000));

                let sampleCount = 0;
                let nonTransparent = 0;
                let nonWhite = 0;
                let darkPixels = 0;
                let lightPixels = 0;
                const colorBuckets = new Set<string>();

                for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += sampleStep) {
                    const i = pixelIndex * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    sampleCount += 1;

                    if (a > 0) {
                        nonTransparent += 1;
                    }
                    if (!(r > 245 && g > 245 && b > 245)) {
                        nonWhite += 1;
                    }
                    if (a > 0 && r < 40 && g < 40 && b < 40) {
                        darkPixels += 1;
                    }
                    if (a > 0 && r > 215 && g > 215 && b > 215) {
                        lightPixels += 1;
                    }

                    colorBuckets.add(
                        `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}-${Math.round(a / 64)}`
                    );
                }

                resolve({
                    sampleCount,
                    nonTransparent,
                    nonWhite,
                    darkPixels,
                    lightPixels,
                    colorBuckets: colorBuckets.size
                });
            };

            img.onerror = () => resolve(null);
            img.src = `data:image/png;base64,${base64}`;
        });
    }, buffer.toString('base64'));

    expect(imageStats).not.toBeNull();
    if (!imageStats) {
        throw new Error('Failed to decode the downloaded PNG image.');
    }

    expect(imageStats.nonTransparent).toBeGreaterThan(Math.floor(imageStats.sampleCount * 0.9));
    expect(imageStats.nonWhite).toBeGreaterThan(Math.floor(imageStats.sampleCount * 0.1));
    expect(imageStats.colorBuckets).toBeGreaterThan(10);
    expect(imageStats.darkPixels).toBeGreaterThan(0);
    expect(imageStats.lightPixels).toBeGreaterThan(0);
});
