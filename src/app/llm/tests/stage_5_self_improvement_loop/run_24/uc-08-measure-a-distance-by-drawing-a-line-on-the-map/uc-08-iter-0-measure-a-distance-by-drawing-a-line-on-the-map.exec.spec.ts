// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const measurementToggle = page.getByTestId('measurement-toggle');
    await expect(measurementToggle).toBeVisible();
    await measurementToggle.click();

    const measurementPanelIndicator = page
        .getByRole('heading', { name: 'Measurement', exact: true })
        .or(page.getByRole('dialog', { name: 'Measurement', exact: true }))
        .or(page.getByText(/^Length$/i));
    await expect(measurementPanelIndicator.first()).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const point1 = { x: Math.round(mapBox.width * 0.38), y: Math.round(mapBox.height * 0.30) };
    const point2 = { x: Math.round(mapBox.width * 0.50), y: Math.round(mapBox.height * 0.42) };
    const point3 = { x: Math.round(mapBox.width * 0.62), y: Math.round(mapBox.height * 0.36) };
    const point4 = { x: Math.round(mapBox.width * 0.72), y: Math.round(mapBox.height * 0.48) };

    await mapContainer.click({ position: point1 });
    await mapContainer.click({ position: point2 });
    await mapContainer.click({ position: point3 });
    await mapContainer.dblclick({ position: point4 });

    const measurementResult = page.getByText(/\b\d{3,}(?:[.,]\d+)?\s*km\b/i).first();
    await expect(measurementResult).toBeVisible();
});
