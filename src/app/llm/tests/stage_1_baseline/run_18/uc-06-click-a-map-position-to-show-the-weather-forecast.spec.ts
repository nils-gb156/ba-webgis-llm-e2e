// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and the map to be ready
  // We assume the map canvas has a specific test id or we can locate it by role
  // Since no specific test ids are provided in the prompt for the map container,
  // we will try to locate the map canvas or a container that holds it.
  // Often, maps in such apps are inside a div. Let's try to find the map container.
  // If there's a specific test id for the map, we should use it.
  // Let's assume there is a test id for the map container, e.g., 'map-container'.
  // If not, we might need to rely on the fact that the map is the main interactive element.
  // However, the prompt mentions "map canvas is interactive", so let's try to find the canvas.
  
  // Let's try to find the map container by a common test id or role.
  // If the app uses OpenLayers, the canvas is inside a div.
  // Let's try to click on the center of the page if we can't find a specific locator,
  // but that's fragile. Let's look for a map container.
  
  // Since the prompt doesn't give specific test ids, we have to make reasonable assumptions.
  // Let's assume the map is in a container with test id 'map-container' or similar.
  // If that fails, we might need to use a more generic approach.
  
  // Let's try to locate the map canvas directly.
  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  // Get the bounding box of the map canvas to click on it
  const boundingBox = await mapCanvas.boundingBox();
  if (!boundingBox) {
    throw new Error('Map canvas bounding box not found');
  }

  // Click on the center of the map canvas
  const clickX = boundingBox.x + boundingBox.width / 2;
  const clickY = boundingBox.y + boundingBox.height / 2;

  await page.mouse.click(clickX, clickY);

  // Wait for the info panel to load the forecast
  // The info panel might have a test id, e.g., 'info-panel'
  // Let's assume there is a test id for the info panel
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Check if the clicked position is highlighted on the map
  // This might be represented by a marker or a circle on the map.
  // Since the map is a canvas, we can't directly assert on DOM elements.
  // However, the prompt mentions that map state can be read via helper functions if provided.
  // Since no helpers are provided, we might need to rely on visual assertions or other indicators.
  // Let's assume there is a test id for the highlighted position marker, e.g., 'highlighted-position-marker'.
  const highlightedMarker = page.getByTestId('highlighted-position-marker');
  await expect(highlightedMarker).toBeVisible();

  // Check if the info panel displays a weather forecast section
  // Let's assume there is a test id for the weather forecast section, e.g., 'weather-forecast-section'
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Check if the forecast contains 24 entries
  // Let's assume each forecast entry has a test id, e.g., 'forecast-entry'
  const forecastEntries = page.getByTestId('forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
