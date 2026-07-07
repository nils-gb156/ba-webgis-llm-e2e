// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  await expect(page.locator('#map-container')).toBeVisible();

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: The user clicks several points on the map canvas to draw a line.
  // We need to click on the map canvas. The map container is the interactive element.
  const mapContainer = page.locator('#map-container');
  
  // Click first point
  await mapContainer.click({ position: { x: 100, y: 100 } });
  
  // Click second point
  await mapContainer.click({ position: { x: 200, y: 200 } });
  
  // Click third point
  await mapContainer.click({ position: { x: 300, y: 100 } });

  // Step 3: The user double-clicks to finish the measurement.
  await mapContainer.dblclick({ position: { x: 300, y: 100 } });

  // Expected result: The measurement panel displays a length value with a unit.
  // We use expect.poll because the measurement result might take a moment to render after the double-click.
  await expect.poll(async () => {
    const measurementElement = page.getByTestId('measurement');
    const text = await measurementElement.textContent();
    return text;
  }).toMatch(/[\d.]+\s*(m|km|mi|ft)/i);
});
