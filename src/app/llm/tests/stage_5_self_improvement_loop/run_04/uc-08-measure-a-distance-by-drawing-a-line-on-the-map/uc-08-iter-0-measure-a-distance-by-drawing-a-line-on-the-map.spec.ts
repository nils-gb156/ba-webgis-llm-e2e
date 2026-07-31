// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapZoomLevel, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and fully rendered
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click({ force: true });
  await expect(measurementToggle).toBeChecked();

  // Wait for the measurement panel to become visible
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  // Get the center of the map to click relative to it
  const center = await getMapCenter(page);
  if (!center) {
    throw new Error('Map center is not available');
  }

  // Click the first point (center)
  await page.locator('[data-testid="map-container"]').click({ position: { x: 0, y: 0 } });

  // Click a second point (offset to the right)
  await page.locator('[data-testid="map-container"]').click({ position: { x: 50, y: 50 } });

  // Click a third point (further right and down)
  await page.locator('[data-testid="map-container"]').click({ position: { x: 100, y: 100 } });

  // 3. Double-click to finish the measurement
  await page.locator('[data-testid="map-container"]').dblclick({ position: { x: 100, y: 100 } });

  // Expected results
  // The measurement panel is visible
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();

  // The measurement panel displays a length value with a unit
  // The measurement panel usually appears in the map-controls-panel or a dedicated overlay.
  // Let's look for text that looks like a measurement (e.g., "123.45 m" or "km")
  // We'll poll for a regex matching a number followed by a unit
  await expect.poll(() => page.getByTestId('map-controls-panel').textContent()).toMatch(/\d+\.?\d*\s*(m|km|mi|ft)/i);
});
