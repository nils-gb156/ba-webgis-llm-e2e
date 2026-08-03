// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const toc = page
    .getByRole('region', { name: /layers|table of contents|toc|layer switcher/i })
    .or(page.getByRole('complementary', { name: /layers|table of contents|toc|layer switcher/i }))
    .or(page.getByRole('heading', { name: /layers|table of contents|toc|layer switcher/i }))
    .first();
  await expect(toc).toBeVisible();

  const temperatureToggle = page
    .getByRole('switch', { name: /temperature/i })
    .or(page.getByRole('checkbox', { name: /temperature/i }))
    .first();
  const precipitationToggle = page
    .getByRole('switch', { name: /precipitation/i })
    .or(page.getByRole('checkbox', { name: /precipitation/i }))
    .first();

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  const searchField = page
    .getByRole('combobox', { name: /search|address|location|place/i })
    .or(page.getByRole('searchbox', { name: /search|address|location|place/i }))
    .or(page.getByRole('textbox', { name: /search|address|location|place/i }))
    .or(page.getByPlaceholder(/search|address|location|place/i))
    .first();
  await expect(searchField).toBeVisible();

  const infoPanel = page
    .getByRole('region', { name: /info/i })
    .or(page.getByRole('complementary', { name: /info/i }))
    .or(page.getByRole('heading', { name: /^info$/i }))
    .first();
  await expect(infoPanel).toBeVisible();

  const measurementToggle = page.getByRole('button', { name: /measurement|measure/i });
  if ((await measurementToggle.count()) > 0) {
    await expect(measurementToggle.first()).toHaveAttribute('aria-pressed', 'false');
  }

  let forecastRequestCount = 0;
  let lastForecastRequestUrl: string | undefined;
  page.on('request', request => {
    const url = request.url();
    if (/forecast|weather/i.test(url)) {
      forecastRequestCount += 1;
      lastForecastRequestUrl = url;
    }
  });

  const initialForecastRequestCount = forecastRequestCount;

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  await searchField.click();
  await searchField.fill('Münster');

  const firstSearchResult = page
    .getByRole('option')
    .first()
    .or(page.getByRole('button', { name: /münster/i }).first())
    .or(page.getByRole('link', { name: /münster/i }).first())
    .or(page.getByRole('listitem').filter({ hasText: /münster/i }).first());

  await expect(firstSearchResult).toBeVisible();
  const selectedResultText = ((await firstSearchResult.textContent()) ?? '').trim();

  const forecastResponsePromise = page.waitForResponse(
    response => /forecast|weather/i.test(response.url()) && response.ok()
  );

  await firstSearchResult.click();

  if (selectedResultText) {
    const selectedLabel = selectedResultText.split('\n')[0].trim();
    await expect(searchField).toHaveValue(new RegExp(selectedLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }

  await expect.poll(() => forecastRequestCount).toBeGreaterThan(initialForecastRequestCount);
  await expect.poll(() => lastForecastRequestUrl).toMatch(/forecast|weather/i);

  const forecastResponse = await forecastResponsePromise;
  const forecastData = await forecastResponse.json();

  const forecastEntryCount = Array.isArray(forecastData)
    ? forecastData.length
    : Array.isArray(forecastData.hourly)
      ? forecastData.hourly.length
      : Array.isArray(forecastData.list)
        ? forecastData.list.length
        : Array.isArray(forecastData.entries)
          ? forecastData.entries.length
          : Array.isArray(forecastData.forecast)
            ? forecastData.forecast.length
            : Array.isArray(forecastData.timeseries)
              ? forecastData.timeseries.length
              : Array.isArray(forecastData.properties?.timeseries)
                ? forecastData.properties.timeseries.length
                : undefined;

  expect(forecastEntryCount).toBe(24);

  const weatherForecastSection = page
    .getByRole('heading', { name: /weather forecast/i })
    .or(page.getByText(/weather forecast/i))
    .first();
  await expect(weatherForecastSection).toBeVisible();
});
