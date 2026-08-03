// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanelTitle = page
        .getByRole('heading', { name: 'Measurement', exact: true })
        .or(page.getByText(/^Measurement$/));
    const measurementValuePattern = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i;

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const measurementValueCountBefore = await page.getByText(measurementValuePattern).count();

    await measurementToggle.click();

    await expect(measurementPanelTitle).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(mapBox.width * 0.42),
        y: Math.round(mapBox.height * 0.32)
    };
    const secondPoint = {
        x: Math.round(mapBox.width * 0.55),
        y: Math.round(mapBox.height * 0.45)
    };
    const thirdPoint = {
        x: Math.round(mapBox.width * 0.68),
        y: Math.round(mapBox.height * 0.52)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.dblclick({ position: thirdPoint });

    await expect.poll(() => page.getByText(measurementValuePattern).count()).toBeGreaterThan(
        measurementValueCountBefore
    );
});
