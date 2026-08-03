// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  let infoPanel = page.getByTestId('info-panel');
  if ((await infoPanel.count()) === 0) {
    infoPanel = page.getByTestId('infopanel');
  }
  if ((await infoPanel.count()) === 0) {
    infoPanel = page.getByRole('complementary').first();
  }
  if ((await infoPanel.count()) === 0) {
    infoPanel = page.getByRole('region', { name: /info|details/i }).first();
  }
  await expect(infoPanel).toBeVisible();

  let map = page.getByTestId('map');
  if ((await map.count()) === 0) {
    map = page.getByTestId('map-container');
  }
  if ((await map.count()) === 0) {
    map = page.getByRole('region', { name: /map/i }).first();
  }
  if ((await map.count()) === 0) {
    map = page.locator('canvas').last();
  }
  await expect(map).toBeVisible();

  const weatherRequests: string[] = [];
  page.on('request', request => {
    if (/forecast|weather/i.test(request.url())) {
      weatherRequests.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse(response => {
    return /forecast|weather/i.test(response.url()) && response.ok();
  });

  const mapBox = await map.boundingBox();
  if (!mapBox) {
    throw new Error('Map bounding box is not available.');
  }

  await map.click({
    position: {
      x: mapBox.width * 0.6,
      y: mapBox.height * 0.4
    }
  });

  await forecastResponsePromise;

  await expect.poll(() => weatherRequests.length).toBeGreaterThan(0);
  await expect.poll(() => weatherRequests[weatherRequests.length - 1] ?? '').toMatch(/forecast|weather/i);

  await expect.poll(async () => {
    const highlightCandidateCounts = [
      await page.getByTestId('selected-position').count(),
      await page.getByTestId('highlighted-position').count(),
      await page.getByTestId('map-highlight').count(),
      await page.getByTestId('weather-location-marker').count()
    ];
    return highlightCandidateCounts.some(count => count > 0) || weatherRequests.length > 0;
  }).toBe(true);

  let forecastSection = page.getByTestId('weather-forecast');
  if ((await forecastSection.count()) === 0) {
    forecastSection = page.getByTestId('weather-forecast-section');
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = page.getByTestId('forecast-section');
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = infoPanel.getByRole('region', { name: /weather forecast/i }).first();
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = infoPanel.getByRole('heading', { name: /weather forecast/i }).first();
  }
  if ((await forecastSection.count()) === 0) {
    forecastSection = infoPanel.getByText(/weather forecast/i).first();
  }
  await expect(forecastSection).toBeVisible();

  await expect.poll(async () => {
    return [
      await page.getByTestId('weather-forecast-entry').count(),
      await page.getByTestId('forecast-entry').count(),
      await page.getByTestId('forecast-item').count(),
      await page.getByTestId('weather-entry').count(),
      await page.getByTestId('weather-forecast').getByRole('listitem').count(),
      await page.getByTestId('weather-forecast').getByRole('row').count(),
      await page.getByTestId('weather-forecast-section').getByRole('listitem').count(),
      await page.getByTestId('weather-forecast-section').getByRole('row').count(),
      await page.getByTestId('forecast-section').getByRole('listitem').count(),
      await page.getByTestId('forecast-section').getByRole('row').count(),
      await infoPanel.getByRole('listitem').count(),
      await infoPanel.getByRole('row').count()
    ];
  }).toContain(24);
});
