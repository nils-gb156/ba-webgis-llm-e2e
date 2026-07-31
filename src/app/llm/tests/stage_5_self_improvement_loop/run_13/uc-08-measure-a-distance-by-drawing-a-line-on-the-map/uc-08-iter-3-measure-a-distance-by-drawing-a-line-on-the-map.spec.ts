// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  // The button is already in the correct state (unpressed), so we can click it directly.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click a first point
  await mapContainer.click({ position: { x: 300, y: 300 } });
  // Click a second point
  await mapContainer.click({ position: { x: 400, y: 300 } });
  // Click a third point
  await mapContainer.click({ position: { x: 400, y: 400 } });

  // 3. Double-click to finish the measurement
  // Use force: true because the map canvas intercepts pointer events.
  await mapContainer.dblclick({ position: { x: 400, y: 400 }, force: true });

  // 4. Assert that the measurement panel is visible
  // The measurement panel is a dialog with the title "Measurement".
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
  await expect(measurementPanel).toBeVisible();

  // 5. Assert that the measurement panel displays a length value with a unit.
  // After finishing, the panel updates to show the result. The text contains a number followed by a unit.
  // We use a regex that matches common units.
  const measurementText = page.getByRole('dialog', { name: 'Measurement' }).getByText(/(\d+(\.\d+)?)\s*(km|m|mi|ft)/);
  await expect(measurementText).toBeVisible();
});
