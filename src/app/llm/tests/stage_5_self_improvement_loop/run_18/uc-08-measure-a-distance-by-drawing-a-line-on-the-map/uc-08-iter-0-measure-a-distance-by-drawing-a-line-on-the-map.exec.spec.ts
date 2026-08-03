// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementButton = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(measurementButton).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    await measurementButton.click();

    const measurementPanelHeading = page.getByRole('heading', {
        name: 'Measurement',
        exact: true
    });
    await expect(measurementPanelHeading).toBeVisible();

    await mapContainer.click({ position: { x: 520, y: 240 } });
    await mapContainer.click({ position: { x: 650, y: 320 } });
    await mapContainer.click({ position: { x: 780, y: 270 } });
    await mapContainer.dblclick({ position: { x: 900, y: 360 } });

    const measurementResult = page.getByText(/\b\d+(?:[.,]\d+)?\s*(?:km|m)\b/i).nth(1);
    await expect(measurementResult).toBeVisible();
});
