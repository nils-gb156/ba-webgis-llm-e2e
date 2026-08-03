// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const app = page.getByRole('application', { name: 'webgis map', exact: true });
    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

    await expect(app).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    if (!(await measurementHeading.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementHeading).toBeVisible();

    const distanceValuePattern = /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/g;
    const getVisibleDistanceValueCount = async (): Promise<number> => {
        const text = await app.innerText();
        return (text.match(distanceValuePattern) ?? []).length;
    };

    const initialDistanceValueCount = await getVisibleDistanceValueCount();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(mapBox.width * 0.42), y: Math.round(mapBox.height * 0.38) },
        { x: Math.round(mapBox.width * 0.52), y: Math.round(mapBox.height * 0.48) },
        { x: Math.round(mapBox.width * 0.61), y: Math.round(mapBox.height * 0.43) },
        { x: Math.round(mapBox.width * 0.70), y: Math.round(mapBox.height * 0.51) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    await expect(measurementHeading).toBeVisible();
    await expect.poll(getVisibleDistanceValueCount).toBeGreaterThan(initialDistanceValueCount);
});
