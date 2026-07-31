// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by checking the map container is visible
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // 1. Click the Measurement button to open the measurement panel
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel/dialog is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  // Use the center of the map container to click points
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }

  // Click 3 points to form a line: center, right, bottom-right
  const point1 = { x: mapBox.width / 2, y: mapBox.height / 2 };
  const point2 = { x: mapBox.width * 0.75, y: mapBox.height / 2 };
  const point3 = { x: mapBox.width * 0.75, y: mapBox.height * 0.75 };

  await mapContainer.click({ position: point1 });
  await mapContainer.click({ position: point2 });
  await mapContainer.click({ position: point3 });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: point3 });

  // Expected results: The measurement panel displays a length value with a unit
  // The measurement panel is already visible.
  // The application displays the measurement result in a tooltip on the map canvas,
  // e.g., "570.51 km". We assert that a tooltip containing a number followed by a unit is visible.
  const measurementResultTooltip = page.getByRole('tooltip', { name: /[\d.,]+\s*(km|m|mi|ft)/i });
  await expect(measurementResultTooltip).toBeVisible();
});
