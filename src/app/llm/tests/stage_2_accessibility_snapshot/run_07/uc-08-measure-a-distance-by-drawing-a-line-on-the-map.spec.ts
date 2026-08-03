// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementHeading = page.getByRole('heading', { name: /measurement/i });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    if (!(await measurementHeading.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementHeading).toBeVisible();

    const initialVisibleDistanceMatchCount = (
        (await page.locator('body').innerText()).match(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/gi) ?? []
    ).length;

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container bounding box is not available.');
    }

    const point1 = {
        x: Math.round(mapBox.width * 0.55),
        y: Math.round(mapBox.height * 0.35)
    };
    const point2 = {
        x: Math.round(mapBox.width * 0.68),
        y: Math.round(mapBox.height * 0.48)
    };
    const point3 = {
        x: Math.round(mapBox.width * 0.8),
        y: Math.round(mapBox.height * 0.62)
    };

    await mapContainer.click({ position: point1 });
    await mapContainer.click({ position: point2 });
    await mapContainer.dblclick({ position: point3 });

    await expect.poll(async () => {
        const visibleText = await page.locator('body').innerText();
        return (visibleText.match(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/gi) ?? []).length;
    }).toBeGreaterThan(initialVisibleDistanceMatchCount);
});
