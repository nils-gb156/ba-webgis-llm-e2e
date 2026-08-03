// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  const munsterPattern = /m(?:ü|u)nster/i;

  const extractFirstCoordinate = (payload: unknown): { lat: number; lon: number } | undefined => {
    if (Array.isArray(payload) && payload.length > 0) {
      const first = payload[0] as Record<string, unknown>;

      const lat = Number(first?.lat);
      const lon = Number(first?.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { lat, lon };
      }

      const center = first?.center;
      if (Array.isArray(center) && center.length >= 2) {
        const centerLon = Number(center[0]);
        const centerLat = Number(center[1]);
        if (Number.isFinite(centerLat) && Number.isFinite(centerLon)) {
          return { lat: centerLat, lon: centerLon };
        }
      }
    }

    const featureCollection = payload as {
      features?: Array<{
        geometry?: { coordinates?: unknown[] };
        center?: unknown[];
        properties?: Record<string, unknown>;
        lat?: unknown;
        lon?: unknown;
      }>;
    };

    const firstFeature = featureCollection?.features?.[0];
    const coordinates = firstFeature?.geometry?.coordinates;
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const lon = Number(coordinates[0]);
      const lat = Number(coordinates[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { lat, lon };
      }
    }

    const featureCenter = firstFeature?.center;
    if (Array.isArray(featureCenter) && featureCenter.length >= 2) {
      const lon = Number(featureCenter[0]);
      const lat = Number(featureCenter[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { lat, lon };
      }
    }

    const propertyLat = Number(firstFeature?.properties?.lat ?? firstFeature?.lat);
    const propertyLon = Number(firstFeature?.properties?.lon ?? firstFeature?.lon);
    if (Number.isFinite(propertyLat) && Number.isFinite(propertyLon)) {
      return { lat: propertyLat, lon: propertyLon };
    }

    return undefined;
  };

  const extractForecastEntryCount = (payload: unknown): number | undefined => {
    if (Array.isArray(payload)) {
      return payload.length;
    }

    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const data = payload as Record<string, unknown>;

    const directArrays = [
      data.entries,
      data.forecast,
      data.timeseries,
      (data.properties as Record<string, unknown> | undefined)?.timeseries,
      data.hourly,
      data.data
    ];

    for (const candidate of directArrays) {
      if (Array.isArray(candidate)) {
        return candidate.length;
      }
    }

    const hourly = data.hourly;
    if (hourly && typeof hourly === 'object') {
      const hourlyRecord = hourly as Record<string, unknown>;

      if (Array.isArray(hourlyRecord.time)) {
        return hourlyRecord.time.length;
      }

      for (const value of Object.values(hourlyRecord)) {
        if (Array.isArray(value)) {
          return value.length;
        }
      }
    }

    return undefined;
  };

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  const temperatureToggle = page
    .getByRole('checkbox', { name: /^Temperature$/i })
    .or(page.getByRole('switch', { name: /^Temperature$/i }))
    .first();
  const precipitationToggle = page
    .getByRole('checkbox', { name: /^Precipitation$/i })
    .or(page.getByRole('switch', { name: /^Precipitation$/i }))
    .first();

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();
  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  const searchField = page
    .getByRole('combobox', { name: /search|location|place/i })
    .or(page.getByRole('searchbox', { name: /search|location|place/i }))
    .or(page.getByRole('textbox', { name: /search|location|place/i }))
    .or(page.getByPlaceholder(/search|location|place/i))
    .first();

  await expect(searchField).toBeVisible();

  const infoPanel = page
    .getByRole('complementary')
    .or(page.getByRole('heading', { name: /forecast|weather/i }))
    .first();
  await expect(infoPanel).toBeVisible();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const geocoderResponsePromise = page.waitForResponse((response) => {
    const url = decodeURIComponent(response.url()).toLowerCase();
    return response.ok() && /(nominatim|geocod|search)/.test(url) && (url.includes('münster') || url.includes('munster'));
  });

  await searchField.click();
  await searchField.fill('Münster');
  await expect(searchField).toHaveValue('Münster');

  const geocoderResponse = await geocoderResponsePromise;
  const geocoderPayload = await geocoderResponse.json();
  const selectedLocation = extractFirstCoordinate(geocoderPayload);

  expect(selectedLocation).toBeDefined();
  if (!selectedLocation) {
    throw new Error('Could not extract coordinates from the geocoder response.');
  }

  const firstSearchResult = page
    .getByRole('option')
    .filter({ hasText: munsterPattern })
    .first()
    .or(page.getByRole('button', { name: munsterPattern }).first())
    .or(page.getByRole('listitem').filter({ hasText: munsterPattern }).first())
    .first();

  await expect(firstSearchResult).toBeVisible();

  let forecastRequestUrl: string | undefined;
  page.on('request', (request) => {
    const url = request.url();
    if (!/(forecast|weather)/i.test(url)) {
      return;
    }

    try {
      const parsedUrl = new URL(url);
      const lat = Number(parsedUrl.searchParams.get('latitude') ?? parsedUrl.searchParams.get('lat'));
      const lon = Number(parsedUrl.searchParams.get('longitude') ?? parsedUrl.searchParams.get('lon'));

      if (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        Math.abs(lat - selectedLocation.lat) < 0.1 &&
        Math.abs(lon - selectedLocation.lon) < 0.1
      ) {
        forecastRequestUrl = url;
      }
    } catch {
      // ignore non-URL values
    }
  });

  const forecastResponsePromise = page.waitForResponse((response) => {
    if (!response.ok() || !/(forecast|weather)/i.test(response.url())) {
      return false;
    }

    try {
      const parsedUrl = new URL(response.url());
      const lat = Number(parsedUrl.searchParams.get('latitude') ?? parsedUrl.searchParams.get('lat'));
      const lon = Number(parsedUrl.searchParams.get('longitude') ?? parsedUrl.searchParams.get('lon'));

      return (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        Math.abs(lat - selectedLocation.lat) < 0.1 &&
        Math.abs(lon - selectedLocation.lon) < 0.1
      );
    } catch {
      return false;
    }
  });

  await firstSearchResult.click();

  await expect.poll(() => forecastRequestUrl).toBeTruthy();

  const parsedForecastRequestUrl = new URL(forecastRequestUrl!);
  const requestLat = Number(parsedForecastRequestUrl.searchParams.get('latitude') ?? parsedForecastRequestUrl.searchParams.get('lat'));
  const requestLon = Number(parsedForecastRequestUrl.searchParams.get('longitude') ?? parsedForecastRequestUrl.searchParams.get('lon'));

  expect(Number.isFinite(requestLat)).toBe(true);
  expect(Number.isFinite(requestLon)).toBe(true);
  expect(Math.abs(requestLat - selectedLocation.lat)).toBeLessThan(0.1);
  expect(Math.abs(requestLon - selectedLocation.lon)).toBeLessThan(0.1);

  const forecastResponse = await forecastResponsePromise;
  const forecastPayload = await forecastResponse.json();
  const forecastEntryCount = extractForecastEntryCount(forecastPayload);

  expect(forecastEntryCount).toBe(24);

  const forecastHeading = page.getByRole('heading', { name: /forecast|weather/i }).first();
  await expect(forecastHeading).toBeVisible();
});
