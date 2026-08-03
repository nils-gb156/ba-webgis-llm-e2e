// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    const readMapSignature = async (): Promise<{ key: string; samples: number[] } | undefined> => {
        return await page.evaluate(() => {
            const canvases = Array.from(document.querySelectorAll('canvas'));

            const rankedCanvases = canvases
                .map((canvas) => ({
                    canvas,
                    rect: canvas.getBoundingClientRect()
                }))
                .filter(({ rect }) => rect.width > 100 && rect.height > 100)
                .sort((a, b) => b.rect.width * b.rect.height - a.rect.width * a.rect.height);

            for (const { canvas } of rankedCanvases) {
                const context = canvas.getContext('2d');
                if (!context || canvas.width === 0 || canvas.height === 0) {
                    continue;
                }

                try {
                    const columns = 12;
                    const rows = 12;
                    const samples: number[] = [];
                    let nonTransparentSamples = 0;

                    for (let row = 1; row <= rows; row += 1) {
                        const y = Math.floor(((canvas.height - 1) * row) / (rows + 1));

                        for (let column = 1; column <= columns; column += 1) {
                            const x = Math.floor(((canvas.width - 1) * column) / (columns + 1));
                            const pixel = context.getImageData(x, y, 1, 1).data;
                            const [r, g, b, a] = pixel;
                            const gray = Math.round((r + g + b) / 3);

                            samples.push(gray, a);

                            if (a > 0) {
                                nonTransparentSamples += 1;
                            }
                        }
                    }

                    if (nonTransparentSamples > 0) {
                        return {
                            key: samples.join(','),
                            samples
                        };
                    }
                } catch {
                    continue;
                }
            }

            return undefined;
        });
    };

    const manhattanDistance = (first: number[], second: number[]): number => {
        return first.reduce((sum, value, index) => sum + Math.abs(value - second[index]), 0);
    };

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const zoomInButton = page.getByRole('button', { name: /^(Zoom in|\+)$/i });
    const zoomOutButton = page.getByRole('button', { name: /^(Zoom out|−|–|-)$/i });

    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();

    await expect.poll(async () => (await readMapSignature())?.key).toBeTruthy();

    const initialSignature = await readMapSignature();
    expect(initialSignature).toBeDefined();

    await zoomInButton.click();
    await page.waitForLoadState('networkidle');

    await expect.poll(async () => {
        const currentSignature = await readMapSignature();
        if (!initialSignature || !currentSignature) {
            return 0;
        }
        return manhattanDistance(currentSignature.samples, initialSignature.samples);
    }).toBeGreaterThan(0);

    const zoomInSignature = await readMapSignature();
    expect(zoomInSignature).toBeDefined();

    const zoomInDistanceFromInitial = manhattanDistance(
        zoomInSignature!.samples,
        initialSignature!.samples
    );
    expect(zoomInDistanceFromInitial).toBeGreaterThan(0);

    await zoomOutButton.click();
    await page.waitForLoadState('networkidle');

    await expect.poll(async () => {
        const currentSignature = await readMapSignature();
        if (!zoomInSignature || !currentSignature) {
            return 0;
        }
        return manhattanDistance(currentSignature.samples, zoomInSignature.samples);
    }).toBeGreaterThan(0);

    await expect.poll(async () => {
        const currentSignature = await readMapSignature();
        if (!initialSignature || !currentSignature) {
            return Number.POSITIVE_INFINITY;
        }
        return manhattanDistance(currentSignature.samples, initialSignature.samples);
    }).toBeLessThan(zoomInDistanceFromInitial);
});
