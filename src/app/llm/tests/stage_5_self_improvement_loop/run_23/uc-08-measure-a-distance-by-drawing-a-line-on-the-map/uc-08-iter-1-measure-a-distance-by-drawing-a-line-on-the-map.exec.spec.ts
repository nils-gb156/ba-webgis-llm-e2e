// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button to open the measurement panel
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel (dialog) is visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  // The map container has a canvas that intercepts pointer events, so we use force: true
  const mapContainer = page.getByTestId('map-container');

  // Get the bounding box of the map container to calculate click positions
  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).toBeTruthy();
  const { x: mapX, y: mapY, width: mapW, height: mapH } = mapBox!;

  // Calculate positions relative to the map container
  // Point 1: slightly left of center
  const point1 = { x: mapX + mapW * 0.3, y: mapY + mapH * 0.5 };
  // Point 2: slightly right of center
  const point2 = { x: mapX + mapW * 0.7, y: mapY + mapH * 0.5 };
  // Point 3: slightly above center
  const point3 = { x: mapX + mapW * 0.5, y: mapY + mapH * 0.3 };

  await mapContainer.click({ force: true, position: point1 });
  await mapContainer.click({ force: true, position: point2 });
  await mapContainer.click({ force: true, position: point3 });

  // Step 3: Double-click to finish the measurement
  // Double-click on the last point or near it
  await mapContainer.dblclick({ force: true, position: point3 });

  // Expected results: The measurement panel displays a length value with a unit
  // Wait for the measurement result to appear in the dialog
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement' });
  await expect.poll(() => measurementDialog.textContent()).toMatch(/[\d.]+\s*(km|m|mi|ft)/);
});
