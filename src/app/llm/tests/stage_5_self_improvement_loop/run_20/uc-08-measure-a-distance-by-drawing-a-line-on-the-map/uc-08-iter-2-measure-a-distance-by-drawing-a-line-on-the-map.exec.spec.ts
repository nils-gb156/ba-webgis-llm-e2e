// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  await page.getByTestId('measurement-toggle').click();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  await mapContainer.click({ position: { x: 200, y: 200 } });
  await mapContainer.click({ position: { x: 300, y: 300 } });
  await mapContainer.click({ position: { x: 400, y: 400 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 400, y: 400 } });

  // Expected results
  // The measurement panel is visible (it is a dialog)
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // The measurement panel displays a length value with a unit
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
  // Wait for the measurement result to appear (the panel initially says "Click in the map to start...")
  await expect.poll(() => measurementPanel.getByText(/(\d+(\.\d+)?)\s*(m|km)/)).toBeVisible();
});
