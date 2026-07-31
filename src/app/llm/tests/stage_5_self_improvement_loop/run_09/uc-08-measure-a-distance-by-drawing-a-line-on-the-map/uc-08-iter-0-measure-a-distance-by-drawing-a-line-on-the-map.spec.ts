// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool.
  await page.getByTestId('measurement-toggle').click();

  // 2. Click several points on the map to draw a line.
  const center = await expect.poll(() => getMapCenter(page));
  expect(center).toBeDefined();
  const [cx, cy] = center!;

  await page.getByTestId('map-container').click({ position: { x: cx - 50, y: cy - 50 } });
  await page.getByTestId('map-container').click({ position: { x: cx + 50, y: cy + 50 } });
  await page.getByTestId('map-container').click({ position: { x: cx + 150, y: cy - 30 } });

  // 3. Double-click to finish the measurement.
  await page.getByTestId('map-container').dblclick({ position: { x: cx + 150, y: cy - 30 } });

  // Expected results: measurement panel is visible and displays a length value with a unit.
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect.poll(() => page.getByTestId('info-panel').innerText()).toMatch(/\d+(\.\d+)?\s*(km|m)/);
});
