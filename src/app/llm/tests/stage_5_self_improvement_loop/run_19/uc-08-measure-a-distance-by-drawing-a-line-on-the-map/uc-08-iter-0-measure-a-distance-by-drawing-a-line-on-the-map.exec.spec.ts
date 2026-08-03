// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const lengthValues = page.getByText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/);

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const initialLengthValueCount = await lengthValues.count();

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed !== 'true') {
        await measurementToggle.click();
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');

    await mapContainer.click({ position: { x: 650, y: 280 } });
    await mapContainer.click({ position: { x: 800, y: 340 } });
    await mapContainer.dblclick({ position: { x: 960, y: 400 } });

    await expect.poll(() => lengthValues.count()).toBeGreaterThan(initialLengthValueCount);
});
