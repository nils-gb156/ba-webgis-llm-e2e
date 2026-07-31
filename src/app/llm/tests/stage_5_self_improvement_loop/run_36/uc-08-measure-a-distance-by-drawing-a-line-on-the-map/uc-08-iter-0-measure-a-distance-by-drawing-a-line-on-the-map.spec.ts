// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click({ force: true });

  // Expected result: The measurement panel is visible.
  await expect(page.getByRole('heading', { name: 'Measurement' })).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We click on the map container at specific positions to draw a line.
  const mapContainer = page.getByTestId('map-container');

  // Click the first point
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Click the second point
  await mapContainer.click({ position: { x: 400, y: 400 } });

  // Click the third point
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Step 3: Double-click to finish the measurement.
  // We double-click on the last point or near it to finish.
  await mapContainer.dblclick({ position: { x: 500, y: 300 } });

  // Expected result: The measurement panel displays a length value with a unit.
  // We check for the presence of a measurement result in the measurement panel.
  const measurementPanel = page.getByRole('heading', { name: 'Measurement' }).locator('..').locator('..');
  await expect(measurementPanel).toContainText(/Length:.*km|Length:.*m/i);
});
