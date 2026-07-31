// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible. The accessibility tree shows it is already pressed/visible,
  // but we assert visibility to satisfy the precondition.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click the center of the map canvas to trigger the forecast request.
  await page.getByTestId('map-container').click({ position: { x: 300, y: 300 } });

  // Wait for the weather forecast section to appear and contain the expected number of entries.
  // The forecast entries are likely inside the `weather-forecast-section`.
  // We poll for the number of forecast items to ensure the async load has completed.
  await expect.poll(async () => {
    const section = page.getByTestId('weather-forecast-section');
    // Assuming forecast entries are list items or similar distinct elements within the section.
    // If the structure is a list, we count the items.
    const count = await section.locator('li').count();
    return count;
  }).toBe(24);

  // Verify the info panel still contains the weather forecast section (implicit from the poll above, but explicit check for robustness)
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
});
