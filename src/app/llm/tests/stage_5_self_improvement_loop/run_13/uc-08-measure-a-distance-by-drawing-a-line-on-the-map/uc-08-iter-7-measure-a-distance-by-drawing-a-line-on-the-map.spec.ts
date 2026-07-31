// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // The measurement panel should now be visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click a first point
  await mapContainer.click({ position: { x: 300, y: 300 }, force: true });
  // Click a second point
  await mapContainer.click({ position: { x: 400, y: 300 }, force: true });
  // Click a third point
  await mapContainer.click({ position: { x: 400, y: 400 }, force: true });

  // 3. Double-click to finish the measurement
  // Use force: true because the map canvas intercepts pointer events.
  await mapContainer.dblclick({ position: { x: 400, y: 400 }, force: true });

  // 4. Assert that the measurement panel is visible
  await expect(measurementPanel).toBeVisible();

  // 5. Assert that the measurement panel displays a length value with a unit.
  // The measurement result is shown as a paragraph containing a number and unit.
  // The dialog has a data-testid of "measurement"
  const measurementText = page.getByTestId('measurement').getByRole('paragraph', {
    name: /(\d+(\.\d+)?)\s*(km|m|mi|ft)/,
  });
  await expect(measurementText).toBeVisible();
});
