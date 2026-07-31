// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // 1. Activate the measurement tool
  // The measurement toggle is a button. It is not in the pressed state initially.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click({ force: true });

  // The measurement panel appears as a dialog
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement' });
  await expect(measurementDialog).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  // Get the map container for clicking
  const mapContainer = page.getByTestId('map-container');

  // Click the first point (center)
  await mapContainer.click({ position: { x: 0, y: 0 } });

  // Click a second point (offset to the right and down)
  await mapContainer.click({ position: { x: 100, y: 100 } });

  // Click a third point (further right and down)
  await mapContainer.click({ position: { x: 200, y: 200 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 200, y: 200 } });

  // Expected results
  // The measurement panel is visible
  await expect(measurementDialog).toBeVisible();

  // The measurement panel displays a length value with a unit
  // We poll for text matching a number followed by a unit (m, km, mi, ft) inside the dialog
  await expect.poll(() => measurementDialog.textContent()).toMatch(/\d+\.?\d*\s*(m|km|mi|ft)/i);
});
