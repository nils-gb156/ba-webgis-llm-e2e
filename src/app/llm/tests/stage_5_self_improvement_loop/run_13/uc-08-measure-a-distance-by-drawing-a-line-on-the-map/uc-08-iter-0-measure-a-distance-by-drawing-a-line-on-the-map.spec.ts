// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect(page.locator('#map-container')).toBeVisible();

  // 1. Activate the measurement tool
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.locator('#map-container');

  // Click a first point
  await mapContainer.click({ position: { x: 300, y: 300 } });
  // Click a second point
  await mapContainer.click({ position: { x: 400, y: 300 } });
  // Click a third point
  await mapContainer.click({ position: { x: 400, y: 400 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 400, y: 400 } });

  // 4. Assert that the measurement panel is visible
  const measurementPanel = page.getByTestId('info-panel');
  await expect(measurementPanel).toBeVisible();

  // 5. Assert that the measurement panel displays a length value with a unit
  // The measurement result typically appears in the info panel or a dedicated measurement panel.
  // We'll look for text that resembles a distance measurement (e.g., "km" or "m").
  const measurementText = page.getByTestId('info-panel').getByText(/(\d+(\.\d+)?)\s*(km|m|mi|ft)/);
  await expect(measurementText).toBeVisible();
});
