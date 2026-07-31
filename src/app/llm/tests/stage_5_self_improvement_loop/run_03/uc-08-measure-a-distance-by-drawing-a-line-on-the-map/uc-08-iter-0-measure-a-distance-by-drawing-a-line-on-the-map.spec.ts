// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC8 - Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and get a stable center point to click on
  const initialCenter = await expect.poll(() => getMapCenter(page)).toBeDefined();

  // 1. Click the 'Measurement' button in the toolbar to open the measurement panel
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // 2. The measurement panel is visible
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();

  // 3. Click several points on the map canvas to draw a line
  // We click at offsets from the initial center to ensure we are clicking on the map canvas
  const mapContainer = page.getByTestId('map-container');

  // First point (near the center)
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Second point
  await mapContainer.click({ position: { x: 600, y: 400 } });

  // Third point
  await mapContainer.click({ position: { x: 700, y: 300 } });

  // 4. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 700, y: 300 } });

  // 5. The measurement panel displays a length value with a unit
  // The map-controls-panel should still be visible and contain the measurement result
  const mapControlsPanel = page.getByTestId('map-controls-panel');
  await expect(mapControlsPanel).toBeVisible();
  
  // Check for a length value with a unit (e.g., "12.34 km", "1.23 m")
  // We look for text matching a number followed by a unit
  await expect(mapControlsPanel.getByText(/[\d.]+\s*(km|m|mi|ft)/i)).toBeVisible();

  // Additionally, verify that a highlight marker is present on the map
  const highlightedCoord = await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();
  expect(highlightedCoord).toBeDefined();
});
