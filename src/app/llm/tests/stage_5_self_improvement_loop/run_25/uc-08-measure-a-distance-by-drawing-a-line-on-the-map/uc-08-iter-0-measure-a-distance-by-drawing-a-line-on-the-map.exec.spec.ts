// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and have a zoom level before interacting
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click({ force: true });

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click the first point (center of the map)
  await mapContainer.click({ position: { x: 500, y: 300 } });
  // Click the second point
  await mapContainer.click({ position: { x: 550, y: 300 } });
  // Click the third point
  await mapContainer.click({ position: { x: 600, y: 350 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 600, y: 350 } });

  // Expected results:
  // - The measurement panel is visible.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // The info panel contains the measurement results. We look for text that matches a number followed by a unit (e.g., "1.2 km", "1200 m").
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByText(/^[0-9.,]+\s*(m|km|mi|ft)$/i)).toBeVisible();
});
