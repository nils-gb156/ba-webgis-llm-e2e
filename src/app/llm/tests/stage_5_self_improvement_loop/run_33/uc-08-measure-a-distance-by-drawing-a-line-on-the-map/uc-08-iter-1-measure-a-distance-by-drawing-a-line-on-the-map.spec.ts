// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map to be ready and get the initial center for click coordinates
  await expect.poll(() => getMapCenter(page)).toBeTruthy();
  const center = await getMapCenter(page)!;
  const [cx, cy] = center;

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  // Ensure it is not already active (pressed)
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }
  await measurementToggle.click({ force: true });
  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');

  // 2. Click several points on the map to draw a line
  // Click 1: slightly right and down from center
  await page.getByTestId('map-container').click({
    position: { x: cx + 50, y: cy + 50 },
    force: true,
  });
  // Click 2: further right and down
  await page.getByTestId('map-container').click({
    position: { x: cx + 150, y: cy + 150 },
    force: true,
  });
  // Click 3: even further right and down
  await page.getByTestId('map-container').click({
    position: { x: cx + 300, y: cy + 300 },
    force: true,
  });

  // 3. Double-click to finish the measurement
  await page.getByTestId('map-container').dblclick({
    position: { x: cx + 300, y: cy + 300 },
    force: true,
  });

  // Verify: measurement panel is visible and displays a length value with a unit
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // The measurement result should contain a number followed by a unit (e.g. "123.45 m" or "1.23 km")
  await expect(measurementPanel.getByText(/[\d,.]+\s*(m|km)/i)).toBeVisible();
});
