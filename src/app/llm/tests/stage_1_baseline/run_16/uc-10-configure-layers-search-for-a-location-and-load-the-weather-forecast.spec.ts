// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  const findFirstExisting = async (...locators: any[]) => {
    for (const locator of locators) {
      if ((await locator.count()) > 0) {
        return locator;
      }
    }
    throw new Error('None of the expected locators exists on the page.');
  };

  const asNumber = (...values: any[]) => {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return undefined;
  };

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const temperatureToggle = await findFirstExisting(
    page.getByRole('switch', { name: /temperature/i }),
    page.getByRole('checkbox', { name: /temperature/i })
  );
  const precipitationToggle = await findFirstExisting(
    page.getByRole('switch', { name: /precipitation/i }),
    page.getByRole('checkbox', { name: /precipitation/i })
  );

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  const searchInput = await findFirstExisting(
    page.getByRole('searchbox', { name: /search|location|place|address/i }),
    page.getByRole('combobox', { name: /search|location|place|address/i }),
    page.getByRole('textbox', { name: /search|location|place|address/i }),
    page.getByPlaceholder(/search|location|place|address/i),
    page.getByRole('searchbox'),
    page.getByRole('combobox')
  );

  await expect(searchInput).toBeVisible();
  await expect(searchInput).toBeEditable();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const geocoderResponsePromise = page.waitForResponse((response) => {
    const url = decodeURIComponent(response.url()).toLowerCase();
    return response.ok() && /geocod|search/.test(url) && !/forecast/.test(url);
  });

  await searchInput.click();
  await searchInput.fill('Münster');

  const geocoderResponse = await geocoderResponsePromise;
  const geocoderData = await geocoderResponse.json();

  const geocoderResults = Array.isArray(geocoderData?.results)
    ? geocoderData.results
    : Array.isArray(geocoderData?.features)
      ? geocoderData.features
      : [];

  expect(geocoderResults.length).toBeGreaterThan(0);

  const selectedResult = geocoderResults[0];
  const selectedLatitude = asNumber(
    selectedResult?.latitude,
    selectedResult?.lat,
    selectedResult?.center?.[1],
    selectedResult?.geometry?.coordinates?.[1],
    selectedResult?.properties?.latitude,
    selectedResult?.properties?.lat
  );
  const selectedLongitude = asNumber(
    selectedResult?.longitude,
    selectedResult?.lon,
    selectedResult?.center?.[0],
    selectedResult?.geometry?.coordinates?.[0],
    selectedResult?.properties?.longitude,
    selectedResult?.properties?.lon
  );

  expect(selectedLatitude).not.toBeUndefined();
  expect(selectedLongitude).not.toBeUndefined();

  const firstSearchResult = await findFirstExisting(
    page.getByRole('option', { name: /m[üu]nster/i }).first(),
    page.getByRole('button', { name: /m[üu]nster/i }).first(),
    page.getByRole('link', { name: /m[üu]nster/i }).first(),
    page.getByRole('listitem').filter({ hasText: /m[üu]nster/i }).first(),
    page.getByText(/m[üu]nster/i).first()
  );

  await expect(firstSearchResult).toBeVisible();

  let forecastRequestUrl: string | undefined;
  page.on('request', (request) => {
    if (/forecast/i.test(request.url())) {
      forecastRequestUrl = request.url();
    }
  });

  const forecastResponsePromise = page.waitForResponse((response) => {
    const url = response.url().toLowerCase();
    return response.ok() && /forecast/.test(url);
  });

  await firstSearchResult.click();

  await expect.poll(() => forecastRequestUrl).toBeTruthy();

  const parsedForecastRequestUrl = new URL(forecastRequestUrl!);
  const requestedLatitude = asNumber(
    parsedForecastRequestUrl.searchParams.get('latitude'),
    parsedForecastRequestUrl.searchParams.get('lat')
  );
  const requestedLongitude = asNumber(
    parsedForecastRequestUrl.searchParams.get('longitude'),
    parsedForecastRequestUrl.searchParams.get('lon')
  );

  expect(requestedLatitude).not.toBeUndefined();
  expect(requestedLongitude).not.toBeUndefined();
  expect(requestedLatitude!).toBeCloseTo(selectedLatitude!, 2);
  expect(requestedLongitude!).toBeCloseTo(selectedLongitude!, 2);

  const forecastResponse = await forecastResponsePromise;
  const forecastData = await forecastResponse.json();

  const forecastEntryCount = Array.isArray(forecastData?.hourly?.time)
    ? forecastData.hourly.time.length
    : Array.isArray(forecastData?.forecast)
      ? forecastData.forecast.length
      : Array.isArray(forecastData?.entries)
        ? forecastData.entries.length
        : undefined;

  expect(forecastEntryCount).toBe(24);

  const forecastHeading = await findFirstExisting(
    page.getByRole('heading', { name: /weather forecast|forecast/i }),
    page.getByText(/weather forecast|forecast/i).first()
  );

  await expect(forecastHeading).toBeVisible();
});
