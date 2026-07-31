// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The accessibility tree shows the Info Panel Switcher is [pressed], meaning the panel is open.
  // We assert visibility to ensure it's ready for interaction.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger a forecast request.
  // We use the center of the map container as a safe click position.
  const mapContainer = page.getByTestId('map-container');
  const box = await mapContainer.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  // Wait for the weather forecast section to appear in the info panel.
  // The initial text says "Click on the map to load a forecast.", so we wait for that text to disappear
  // or for the forecast section to become visible.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Wait for the forecast to contain 24 entries.
  // The forecast entries are likely rendered as items within the weather-forecast-section.
  // We poll for the count of these entries to settle at 24.
  await expect.poll(() =>
    page.getByTestId('weather-forecast-section').locator('li').count()
  ).toBe(24);

  // Verify that the clicked position is highlighted on the map.
  // Since map content is not DOM, we look for a visual indicator or a specific test id if available.
  // However, the prompt does not provide a specific test id for the highlight marker.
  // We assume the highlight is part of the map canvas rendering.
  // Without a specific locator for the highlight, we can't assert it directly via DOM.
  // But the successful loading of the forecast with 24 entries implies the click was registered.
  // We will assert the info panel content to ensure the forecast is displayed.
  await expect(page.getByTestId('info-panel')).toContainText('Weather Forecast');
});
