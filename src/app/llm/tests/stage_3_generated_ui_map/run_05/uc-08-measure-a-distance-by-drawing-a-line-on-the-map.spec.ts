// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the Measurement button to activate the tool and open the panel
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  // We use the map-container locator to click on the canvas.
  // Coordinates are chosen relative to the center of the viewport to ensure they are on the map.
  const mapContainer = page.getByTestId('map-container');
  const viewportCenter = await page.viewportSize();
  const centerX = (viewportCenter?.width ?? 800) / 2;
  const centerY = (viewportCenter?.height ?? 600) / 2;

  // Click point 1 (center)
  await mapContainer.click({ position: { x: centerX, y: centerY } });
  // Click point 2 (offset right and up)
  await mapContainer.click({ position: { x: centerX + 100, y: centerY - 100 } });
  // Click point 3 (further right and down)
  await mapContainer.click({ position: { x: centerX + 200, y: centerY + 50 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: centerX + 200, y: centerY + 50 } });

  // Expected results: Measurement panel displays a length value with a unit
  // The measurement element should contain text that looks like a number followed by a unit (e.g., "1.23 km")
  const measurementElement = page.getByTestId('measurement');
  await expect(measurementElement).toBeVisible();
  
  // Use poll to wait for the measurement result to appear
  await expect.poll(async () => {
    const text = await measurementElement.textContent();
    return text;
  }).toMatch(/[\d.,]+\s*(m|km|mi|ft)/i);
});
