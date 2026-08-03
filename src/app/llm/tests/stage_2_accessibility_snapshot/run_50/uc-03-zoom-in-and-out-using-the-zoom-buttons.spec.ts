// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const mapContainer = page.getByTestId('map-container');
    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');
    const scaleViewer = page.getByTestId('scale-viewer');

    const readScaleDenominator = async () => {
        const text = await scaleViewer.innerText();
        const match = text.match(/1\s*(?::|to)\s*([\d.,\s]+)/i);

        if (!match) {
            throw new Error(`Could not parse scale from text: "${text}"`);
        }

        const denominator = Number(match[1].replace(/[^\d]/g, ''));
        if (Number.isNaN(denominator)) {
            throw new Error(`Parsed scale is not a number: "${text}"`);
        }

        return denominator;
    };

    await expect(mapContainer).toBeVisible();
    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
    await expect(scaleViewer).toBeVisible();

    const initialScale = await readScaleDenominator();

    await zoomInButton.click();

    await expect.poll(async () => await readScaleDenominator()).toBeLessThan(initialScale);

    const zoomedInScale = await readScaleDenominator();

    await zoomOutButton.click();

    await expect.poll(async () => await readScaleDenominator()).toBeGreaterThan(zoomedInScale);
});
