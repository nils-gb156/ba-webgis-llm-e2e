// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementButton = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(measurementButton).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    await measurementButton.click();

    await expect(
        mapContainer.getByText(/(?:Measurement|Measure|Length|Distance)/i).first()
    ).toBeVisible();

    await mapContainer.click({ position: { x: 430, y: 220 } });
    await mapContainer.click({ position: { x: 620, y: 290 } });
    await mapContainer.dblclick({ position: { x: 810, y: 360 } });

    const measurementResult = mapContainer
        .getByText(/(?:Length|Distance)[\s\S]{0,200}\d+(?:[.,]\d+)?\s?(?:m|km)\b/i)
        .first();

    await expect(measurementResult).toBeVisible();
});
