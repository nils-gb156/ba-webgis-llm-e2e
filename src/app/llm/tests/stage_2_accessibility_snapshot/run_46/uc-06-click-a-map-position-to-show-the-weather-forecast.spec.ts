// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toBeVisible();
    const isPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  const forecastRequestUrls: string[] = [];
  page.on('request', request => {
    if (
      (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') &&
      /(forecast|weather)/i.test(request.url())
    ) {
      forecastRequestUrls.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse(response => {
    const request = response.request();
    return (
      (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') &&
      request.method() === 'GET' &&
      response.ok() &&
      /(forecast|weather)/i.test(response.url())
    );
  });

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.floor(box.width / 2),
      y: Math.floor(box.height / 2)
    }
  });

  await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(0);

  const forecastResponse = await forecastResponsePromise;
  const forecastData = (await forecastResponse.json()) as unknown;

  const collectArrayLengths = (value: unknown): number[] => {
    if (Array.isArray(value)) {
      return [value.length, ...value.flatMap(item => collectArrayLengths(item))];
    }

    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).flatMap(item => collectArrayLengths(item));
    }

    return [];
  };

  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  const arrayLengths = collectArrayLengths(forecastData);
  expect(arrayLengths).toContain(24);

  await expect.poll(async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await weatherForecastSection.getByRole('row').count();
    if (rowCount > 0) {
      return rowCount;
    }

    const articleCount = await weatherForecastSection.locator('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    return await weatherForecastSection.getByRole('img').count();
  }).toBe(24);
});
