// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const parseScaleDenominator = (text: string | null): number | undefined => {
        if (!text) {
            return undefined;
        }

        const matches = [...text.matchAll(/\d[\d.,]*/g)].map((match) => match[0].replace(/[^\d]/g, ""));
        if (matches.length < 2) {
            return undefined;
        }

        const denominator = Number(matches[matches.length - 1]);
        return Number.isFinite(denominator) ? denominator : undefined;
    };

    const mapContainer = page.getByTestId('map-container');
    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');
    const scaleViewer = page.getByTestId('scale-viewer');

    await expect(mapContainer).toBeVisible();
    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
    await expect(scaleViewer).toBeVisible();

    let initialScale: number | undefined;
    await expect
        .poll(async () => {
            initialScale = parseScaleDenominator(await scaleViewer.textContent());
            return initialScale ?? 0;
        })
        .toBeGreaterThan(0);

    await zoomInButton.click();

    let zoomedInScale: number | undefined;
    await expect
        .poll(async () => {
            zoomedInScale = parseScaleDenominator(await scaleViewer.textContent());
            return zoomedInScale ?? Number.MAX_SAFE_INTEGER;
        })
        .toBeLessThan(initialScale!);

    await zoomOutButton.click();

    let zoomedOutScale: number | undefined;
    await expect
        .poll(async () => {
            zoomedOutScale = parseScaleDenominator(await scaleViewer.textContent());
            return zoomedOutScale ?? 0;
        })
        .toBeGreaterThan(zoomedInScale!);
});
