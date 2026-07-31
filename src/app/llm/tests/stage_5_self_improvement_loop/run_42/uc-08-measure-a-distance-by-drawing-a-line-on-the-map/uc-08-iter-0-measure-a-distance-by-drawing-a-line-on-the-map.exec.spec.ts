// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the 'Measurement' button to open the measurement tool
  await page.getByRole('button', { name: 'Measurement' }).click();

  // Wait for the measurement panel to become visible
  await expect(page.getByRole('region', { name: 'Measurement' })).toBeVisible();

  // Get the current map center to click nearby on the map canvas
  const center = await getMapCenter(page);
  expect(center).toBeDefined();
  const [cx, cy] = center!;

  // 2. Click several points on the map canvas to draw a line
  // The map canvas is identified by data-testid="map-container"
  const mapContainer = page.locator('[data-testid="map-container"]');

  // Click a few points to form a line.
  // We use the map container to get the viewport coordinates, then click relative to the center.
  // Since the map is interactive, we click on the canvas directly.
  const clickOffset = 100; // pixels from center
  await mapContainer.click({ position: { x: clickOffset, y: clickOffset } });
  await mapContainer.click({ position: { x: -clickOffset, y: clickOffset } });
  await mapContainer.click({ position: { x: -clickOffset, y: -clickOffset } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick();

  // Expected results:
  // - The measurement panel is visible (already asserted)
  // - The measurement panel displays a length value with a unit.
  // We look for a text pattern like "1.23 km" or "1234 m" inside the measurement panel.
  const measurementPanel = page.getByRole('region', { name: 'Measurement' });
  
  // Wait for the measurement result to appear. It should contain a number followed by a unit like "km" or "m".
  await expect.poll(() => measurementPanel.locator('text=/[\\d,.]+\\s*(km|m|mi|ft)/').first().isVisible()).toBe(true);
});
