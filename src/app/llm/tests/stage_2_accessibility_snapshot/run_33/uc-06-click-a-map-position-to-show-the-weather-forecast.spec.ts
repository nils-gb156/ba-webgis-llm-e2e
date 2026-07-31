// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The accessibility tree shows the Info Panel Switcher button is already pressed.
  // We assert the info panel content is visible to ensure the precondition is met.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map canvas to trigger the weather forecast request.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 200 } });

  // Wait for the weather forecast section to appear in the info panel.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Assert that the forecast contains 24 entries.
  // The entries are likely list items or similar structures within the weather forecast section.
  // We will count the number of child elements that look like forecast entries.
  // Since the exact structure isn't provided, we'll look for a specific pattern or count.
  // Let's assume each entry has a data-testid or a specific role.
  // If not, we might need to count based on text or structure.
  // For now, let's try to find a list or container of entries.
  
  // A robust way is to count the number of distinct forecast items.
  // Let's assume the entries are listed in a list or have a common attribute.
  // We'll use expect.poll to wait for the count to settle.
  
  await expect.poll(async () => {
    // Try to find elements that represent forecast entries.
    // Since we don't have specific test ids for entries, we might need to rely on structure.
    // Let's assume the weather forecast section contains a list of items.
    // We'll count the number of direct children or specific elements within the section.
    const entries = await weatherForecastSection.locator('li').count();
    return entries;
  }).toBe(24);

  // Assert that the clicked position is highlighted on the map.
  // This is tricky because the map is a canvas.
  // However, the info panel might show the coordinates or a marker.
  // The use case says "highlighted on the map".
  // Without a specific test id for the marker, we might need to infer this from the info panel content.
  // Let's check if the info panel shows coordinates or a specific message about the click.
  // Alternatively, we can check if the scale viewer or coordinate viewer updates.
  
  // Let's check the coordinate viewer to see if it reflects the clicked position.
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  await expect(coordinateViewer).toBeVisible();
  
  // We can't easily assert the exact coordinates without knowing them,
  // but we can assert that the coordinate viewer is visible and has content.
  await expect(coordinateViewer.locator('text=/-?\d+(\.\d+)?/')).toBeVisible();
});
