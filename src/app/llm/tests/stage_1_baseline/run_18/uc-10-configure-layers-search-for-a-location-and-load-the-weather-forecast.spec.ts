// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractFirstCoordinate(data: any): { lat: number; lon: number } | undefined {
  const first =
    (Array.isArray(data) && data[0]) ||
    (Array.isArray(data?.features) && data.features[0]) ||
    (Array.isArray(data?.results) && data.results[0]) ||
    (Array.isArray(data?.items) && data.items[0]) ||
    data?.result;

  if (!first) {
    return undefined;
  }

  const lat =
    first.lat ??
    first.latitude ??
    first.y ??
    first.center?.[1] ??
    first.geometry?.coordinates?.[1] ??
    first.coordinates?.[1];

  const lon =
    first.lon ??
    first.lng ??
    first.long ??
    first.longitude ??
    first.x ??
    first.center?.[0] ??
    first.geometry?.coordinates?.[0] ??
    first.coordinates?.[0];

  const parsedLat = Number(lat);
  const parsedLon = Number(lon);

  if (Number.isFinite(parsedLat) && Number.isFinite(parsedLon)) {
    return { lat: parsedLat, lon: parsedLon };
  }

  return undefined;
}

function extractForecastEntryCount(data: any): number | undefined {
  if (Array.isArray(data)) {
    return data.length;
  }

  if (Array.isArray(data?.entries)) {
    return data.entries.length;
  }

  if (Array.isArray(data?.forecast)) {
    return data.forecast.length;
  }

  if (Array.isArray(data?.list)) {
    return data.list.length;
  }

  if (Array.isArray(data?.data)) {
    return data.data.length;
  }

  if (Array.isArray(data?.items)) {
    return data.items.length;
  }

  if (Array.isArray(data?.properties?.timeseries)) {
    return data.properties.timeseries.length;
  }

  if (Array.isArray(data?.hourly?.time)) {
    return data.hourly.time.length;
  }

  if (Array.isArray(data?.hourlyForecast)) {
    return data.hourlyForecast.length;
  }

  return undefined;
}

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const findLayerToggle = async (name: string) => {
    const checkbox = page.getByRole('checkbox', { name, exact: true });
    if ((await checkbox.count()) > 0) {
      return checkbox.first();
    }

    const switchToggle = page.getByRole('switch', { name, exact: true });
    return switchToggle.first();
  };

  const temperatureToggle = await findLayerToggle('Temperature');
  const precipitationToggle = await findLayerToggle('Precipitation');

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();
  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  const searchField = page.getByRole('combobox').first();
  await expect(searchField).toBeVisible();
  await expect(searchField).toBeEditable();

  const complementaryPanels = page.getByRole('complementary');
  const infoPanel =
    (await complementaryPanels.count()) > 0
      ? complementaryPanels.first()
      : page.getByRole('region', { name: /info|forecast/i }).first();
  await expect(infoPanel).toBeVisible();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const geocoderResponsePromise = page.waitForResponse(
    (response) =>
      response.ok() &&
      /search|geocode|nominatim/i.test(response.url()) &&
      /(m%C3%BCnster|münster|munster)/i.test(response.url())
  );

  await searchField.click();
  await searchField.fill('Münster');

  const geocoderResponse = await geocoderResponsePromise;
  const geocoderData = await geocoderResponse.json();
  const selectedCoordinates = extractFirstCoordinate(geocoderData);
  expect(selectedCoordinates).toBeDefined();

  const resultsList = page.getByRole('listbox').first();
  await expect(resultsList).toBeVisible();

  const firstResult = resultsList.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const selectedResultText = ((await firstResult.textContent()) ?? '').trim();
  const selectedResultMainLine = selectedResultText.split('\n')[0]?.trim() ?? 'Münster';

  const forecastRequestUrls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (
      /forecast|weather/i.test(url) &&
      /(latitude|lat)=/i.test(url) &&
      /(longitude|lon)=/i.test(url)
    ) {
      forecastRequestUrls.push(url);
    }
  });

  const weatherResponsePromise = page.waitForResponse(
    (response) =>
      response.ok() &&
      /forecast|weather/i.test(response.url()) &&
      /(latitude|lat)=/i.test(response.url()) &&
      /(longitude|lon)=/i.test(response.url())
  );

  await firstResult.click();

  if (selectedResultMainLine) {
    await expect(searchField).toHaveValue(new RegExp(escapeRegex(selectedResultMainLine), 'i'));
  }

  const weatherResponse = await weatherResponsePromise;
  const weatherData = await weatherResponse.json().catch(() => undefined);
  const forecastEntryCountFromResponse = extractForecastEntryCount(weatherData);

  await expect
    .poll(() => {
      const latestUrl = forecastRequestUrls.at(-1);
      if (!latestUrl || !selectedCoordinates) {
        return false;
      }

      const parsedUrl = new URL(latestUrl);
      const requestLat = Number(
        parsedUrl.searchParams.get('latitude') ?? parsedUrl.searchParams.get('lat')
      );
      const requestLon = Number(
        parsedUrl.searchParams.get('longitude') ?? parsedUrl.searchParams.get('lon')
      );

      if (!Number.isFinite(requestLat) || !Number.isFinite(requestLon)) {
        return false;
      }

      return (
        Math.abs(requestLat - selectedCoordinates.lat) < 0.1 &&
        Math.abs(requestLon - selectedCoordinates.lon) < 0.1
      );
    })
    .toBe(true);

  const weatherForecastHeading = page.getByRole('heading', { name: /weather forecast|forecast/i });
  await expect(weatherForecastHeading).toBeVisible();

  await expect
    .poll(async () => {
      const listItems = await infoPanel.getByRole('listitem').count();
      if (listItems === 24) {
        return 24;
      }

      const rows = await infoPanel.getByRole('row').count();
      const columnHeaders = await infoPanel.getByRole('columnheader').count();
      if (rows === 24) {
        return 24;
      }
      if (rows === 25 && columnHeaders > 0) {
        return 24;
      }

      const articles = await infoPanel.getByRole('article').count();
      if (articles === 24) {
        return 24;
      }

      const gridCells = await infoPanel.getByRole('gridcell').count();
      if (gridCells === 24) {
        return 24;
      }

      return forecastEntryCountFromResponse ?? 0;
    })
    .toBe(24);
});
