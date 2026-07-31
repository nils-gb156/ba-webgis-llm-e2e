// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  await page.getByTestId('map-container').waitFor({ state: 'visible' });

  // 1. Click the 'Measurement' button in the toolbar
  await page.getByRole('button', { name: 'Measurement' }).click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  // Get the map container for coordinate-based clicking
  const mapContainer = page.getByTestId('map-container');
  
  // Click first point (approximate center-left)
  await mapContainer.click({ position: { x: 200, y: 200 } });
  
  // Click second point (approximate center-right)
  await mapContainer.click({ position: { x: 400, y: 200 } });
  
  // Click third point (approximate bottom-center)
  await mapContainer.click({ position: { x: 300, y: 400 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 300, y: 400 } });

  // Wait for the measurement result to appear
  // The result is likely in the info panel or a specific measurement result container
  // Based on the context, the info panel is already open. We look for text that looks like a distance measurement.
  await expect.poll(() => page.getByTestId('info-panel').textContent()).toMatch(/\d+(\.\d+)?\s*(km|m|mi|ft)/);
});
