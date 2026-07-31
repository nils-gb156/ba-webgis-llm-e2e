// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate measurement tool
  // The button is already in the unpressed state, so clicking it will open the panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click({ force: true });

  // Verify measurement panel is visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // 2. Click several points on the map to draw a line
  // Use pixel offsets from the center of the map-container element to place clicks
  // on the canvas. Using relative pixel offsets avoids coordinate system confusion
  // and ensures clicks land on the canvas regardless of the map's current view.
  const mapContainer = page.getByTestId('map-container');
  const center = await mapContainer.boundingBox();
  expect(center).toBeDefined();

  // Point 1: near center
  await mapContainer.click({
    position: { x: center!.width / 2, y: center!.height / 2 },
  });

  // Point 2: offset from center
  await mapContainer.click({
    position: { x: center!.width / 2 + 100, y: center!.height / 2 - 100 },
  });

  // Point 3: further offset
  await mapContainer.click({
    position: { x: center!.width / 2 + 200, y: center!.height / 2 - 50 },
  });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({
    position: { x: center!.width / 2 + 200, y: center!.height / 2 - 50 },
  });

  // Wait for the measurement result to settle
  // The dialog contains a paragraph with the measurement result.
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement' });
  await expect(measurementDialog).toBeVisible();

  // Verify measurement panel displays a length value with a unit
  // Check that the panel contains a length value with a unit (e.g., "12.5 km" or similar)
  await expect(measurementDialog.locator('text=/\\d+\\.?\\d*\\s*(km|m|mi|ft)/')).toBeVisible();
});
