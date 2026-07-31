// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and get an initial center point for interaction
  await expect.poll(() => getMapCenter(page)).toBeTruthy();
  const center = await getMapCenter(page);
  if (!center) {
    throw new Error('Map center is not available');
  }

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Expected result: The measurement panel is visible.
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: The user clicks several points on the map canvas to draw a line.
  // We click around the center to ensure we are interacting with the map canvas.
  const mapContainer = page.getByTestId('map-container');

  // Click first point (center)
  await mapContainer.click({ position: { x: 100, y: 100 } });
  
  // Click second point (offset from center)
  await mapContainer.click({ position: { x: 150, y: 150 } });
  
  // Click third point (further offset)
  await mapContainer.click({ position: { x: 200, y: 100 } });

  // Step 3: The user double-clicks to finish the measurement.
  await mapContainer.dblclick({ position: { x: 200, y: 100 } });

  // Expected result: The measurement panel displays a length value with a unit.
  // We poll for the measurement element to contain text that looks like a number followed by a unit (e.g., "1.5 km", "500 m").
  const measurementElement = page.getByTestId('measurement');
  await expect.poll(async () => {
    const text = await measurementElement.innerText();
    return text;
  }).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/i);
});
