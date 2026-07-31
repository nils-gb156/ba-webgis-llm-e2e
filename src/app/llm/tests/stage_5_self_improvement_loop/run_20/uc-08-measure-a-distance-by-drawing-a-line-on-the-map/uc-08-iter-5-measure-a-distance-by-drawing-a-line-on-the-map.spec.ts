// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  await page.getByTestId('measurement-toggle').click();

  // The measurement panel (dialog) should be visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  await mapContainer.click({ position: { x: 200, y: 200 } });
  await mapContainer.click({ position: { x: 300, y: 300 } });
  await mapContainer.click({ position: { x: 400, y: 400 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 400, y: 400 } });

  // Expected results
  // The measurement panel is visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // The measurement panel displays a length value with a unit
  await expect.poll(() =>
    page.getByRole('dialog', { name: 'Measurement' }).textContent()
  ).toMatch(/(\d+(\.\d+)?)\s*(m|km)/);
});
