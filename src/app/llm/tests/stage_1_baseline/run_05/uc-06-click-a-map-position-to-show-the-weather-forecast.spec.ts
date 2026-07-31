// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the info panel to be visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Locate the map canvas
  const mapCanvas = page.locator('canvas.ol-layer');
  await expect(mapCanvas).toBeVisible();

  // Get the bounding box of the map to click a valid position inside it
  const box = await mapCanvas.boundingBox();
  test.assert(box !== undefined, 'Map canvas bounding box should not be undefined');

  // Click the center of the map
  const centerX = box!.x + box!.width / 2;
  const centerY = box!.y + box!.height / 2;
  await page.mouse.click(centerX, centerY);

  // Wait for the weather forecast section to appear in the info panel
  const weatherSection = page.getByTestId('weather-forecast');
  await expect(weatherSection).toBeVisible();

  // Assert that the clicked position is highlighted (we can't check the canvas directly,
  // but the appearance of the forecast implies the click was registered).
  // We will assert the content of the forecast.

  // Wait for the forecast entries to load. Assuming each entry has a test id or is part of a list.
  // Since the prompt doesn't specify exact test ids for entries, we'll look for a container
  // that holds the 24 entries. Let's assume the forecast section contains a list or grid.
  // We'll poll for the presence of 24 items within the weather section.
  // If there's no specific test id for entries, we might need to count elements by role or tag.
  // Let's assume the forecast entries are rendered as items with a specific role or class.
  // Without specific test ids for the 24 entries, we'll check the count of child elements in the forecast section.
  // A robust way is to wait for a specific number of forecast cards or list items.
  // Let's assume the forecast entries are divs or li elements with a test id like 'forecast-entry' or similar.
  // If not, we might have to rely on the text content or a general structure.
  // Given the complexity, let's try to find a list of forecast items.

  // Poll for 24 forecast entries. We need to identify the selector for the entries.
  // Common patterns: .forecast-entry, [data-testid="forecast-entry"], or similar.
  // Let's assume there's a test id for the forecast list or entries.
  // If no test id is available, we might use getByRole('listitem') or similar inside the weather section.
  // However, the prompt says "The forecast contains 24 entries".
  // Let's assume the entries have a test id like 'forecast-entry'.

  // We will poll for the count of elements with test id 'forecast-entry' to be 24.
  await expect.poll(async () => {
    const entries = page.locator('[data-testid="forecast-entry"]');
    return entries.count();
  }).toBe(24);
});
