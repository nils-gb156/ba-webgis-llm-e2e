// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Measurement' button to open the measurement panel
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We click at distinct coordinates to ensure a line is drawn.
  const mapContainer = page.getByTestId('map-container');
  
  // Click first point
  await mapContainer.click({ position: { x: 100, y: 100 } });
  
  // Click second point
  await mapContainer.click({ position: { x: 200, y: 100 } });
  
  // Click third point
  await mapContainer.click({ position: { x: 200, y: 200 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 200, y: 200 } });

  // Expected results:
  // - The measurement panel is visible (already asserted, but ensure it stays visible)
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // We poll for the measurement element to contain text that looks like a number followed by a unit (e.g., "123 m", "1.23 km")
  const measurementLocator = page.getByTestId('measurement');
  
  await expect.poll(async () => {
    const text = await measurementLocator.textContent();
    return text;
  }).toMatch(/[\d.]+\s*(m|km|mi|ft)/i);
});
