// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC3 - Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');
    const scaleViewer = page.getByTestId('scale-viewer');

    const readScaleDenominator = async (): Promise<number | undefined> => {
        const text = await scaleViewer.textContent();
        const match = text?.match(/1\s+to\s+([\d.,\s]+)/i);
        if (!match) {
            return undefined;
        }

        const value = Number(match[1].replace(/[^\d]/g, ''));
        return Number.isNaN(value) ? undefined : value;
    };

    await expect(mapContainer).toBeVisible();
    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
    await expect(scaleViewer).toBeVisible();

    let initialScale: number | undefined;
    await expect
        .poll(async () => {
            initialScale = await readScaleDenominator();
            return initialScale;
        })
        .toBeGreaterThan(0);

    await zoomInButton.click();

    let zoomedInScale: number | undefined;
    await expect
        .poll(async () => {
            zoomedInScale = await readScaleDenominator();
            return zoomedInScale;
        })
        .toBeLessThan(initialScale!);

    await zoomOutButton.click();

    let zoomedOutScale: number | undefined;
    await expect
        .poll(async () => {
            zoomedOutScale = await readScaleDenominator();
            return zoomedOutScale;
        })
        .toBeGreaterThan(zoomedInScale!);
});
