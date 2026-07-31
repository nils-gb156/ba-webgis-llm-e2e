// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // The measurement panel/dialog should now be visible
  const measurementDialog = page.getByTestId('measurement');
  await expect(measurementDialog).toBeVisible();

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
  await expect(measurementDialog).toBeVisible();

  // 5. Assert that the measurement panel displays a length value with a unit.
  // The dialog has a data-testid of "measurement"
  // The result is shown as a paragraph containing a number and unit.
  // The dialog text is "Click in the map to start a measurement." before drawing,
  // so we need to wait for the paragraph to change to the measurement result.
  const measurementText = measurementDialog.getByRole('paragraph');
  await expect(measurementText).not.toBeVisible(); // The initial "Click in the map..." paragraph is hidden
  await expect(measurementText).toBeVisible(); // The result paragraph should be visible
  await expect(measurementText).toContainText(/(\d+(\.\d+)?)\s*(km|m|mi|ft)/);
});
