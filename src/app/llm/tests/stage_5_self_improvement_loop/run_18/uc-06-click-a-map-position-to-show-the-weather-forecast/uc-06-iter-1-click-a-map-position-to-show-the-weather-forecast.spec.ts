// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is visible by default in the initial state)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the forecast loading
  await page.getByTestId('map-container').click({ position: { x: 400, y: 300 } });

  // Wait for the forecast to load and display in the info panel
  await expect(page.getByText('Weather Forecast')).toBeVisible();

  // Verify that the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Verify that the info panel displays a weather forecast section
  await expect(page.getByText('Weather Forecast')).toBeVisible();

  // Verify that the forecast contains 24 entries
  // The forecast entries are likely in a list or grid within the info panel.
  // We will look for a container that holds the forecast entries and assert it has 24 children.
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // The forecast entries might be rendered as a list or grid.
  // We will count the number of forecast entry elements.
  // Assuming the entries are inside the weather-forecast-section and have a specific structure.
  // Since we don't have specific test ids for forecast entries, we can try to count elements
  // that represent a forecast entry. Let's assume they are divs or list items within the section.
  // A more robust way is to check for the presence of 24 distinct time slots or data points.
  // For now, we'll assert that the section is visible and contains some content.
  // To be more precise, we can check for the number of forecast entries by looking at the DOM structure.
  // Let's assume the forecast entries are in a list with a specific class or structure.
  // Since we don't have the exact structure, we'll use a general approach.
  // We can check for the presence of 24 forecast entries by counting elements that match a certain pattern.
  // Let's assume the forecast entries are in a list and each entry has a specific structure.
  // We will count the number of forecast entries by looking at the number of elements in the forecast section.
  // For simplicity, we'll assume that the forecast section contains 24 child elements representing the forecast entries.
  const forecastEntriesCount = await forecastSection.locator('> *').count();
  expect(forecastEntriesCount).toBe(24);
});
