// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button to open the measurement panel
  await page.getByTestId('measurement-toggle').click({ force: true });

  // Verify measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // The map container is identified by data-testid. We need to click on the canvas
  // part of the map container. Using positions that are likely on the canvas.
  const mapContainer = page.getByTestId('map-container');
  
  // Click first point
  await mapContainer.click({ position: { x: 300, y: 300 } });
  
  // Click second point
  await mapContainer.click({ position: { x: 400, y: 400 } });
  
  // Click third point
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Step 3: Double-click to finish the measurement.
  // The double-click should be on the last point or nearby to finalize.
  await mapContainer.dblclick({ position: { x: 500, y: 300 } });

  // Expected results:
  // - The measurement panel is visible.
  // - The measurement panel displays a length value with a unit.

  // Wait for the measurement result to appear in the panel.
  // The panel content might be dynamic, so we poll for a value with a unit (e.g., "123 km" or "123 m").
  await expect.poll(async () => {
    const panel = page.getByTestId('measurement-panel');
    const text = await panel.innerText();
    return text;
  }).toMatch(/[\d.]+\s*(km|m|mi|ft)/);
});
