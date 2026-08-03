// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

type Coordinates = {
  lat: number;
  lon: number;
};

function toFiniteNumber(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number' || typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractCoordinates(value: unknown): Coordinates | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const coordinates = extractCoordinates(item);
      if (coordinates) {
        return coordinates;
      }
    }
    return undefined;
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  const lat = toFiniteNumber(record.lat ?? record.latitude ?? record.y);
  const lon = toFiniteNumber(record.lon ?? record.lng ?? record.longitude ?? record.x);
  if (lat !== undefined && lon !== undefined) {
    return { lat, lon };
  }

  const geometry = record.geometry;
  if (geometry && typeof geometry === 'object' && !Array.isArray(geometry)) {
    const geometryRecord = geometry as Record<string, unknown>;
    const coordinates = geometryRecord.coordinates;
    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      const geometryLon = toFiniteNumber(coordinates[0]);
      const geometryLat = toFiniteNumber(coordinates[1]);
      if (geometryLat !== undefined && geometryLon !== undefined) {
        return { lat: geometryLat, lon: geometryLon };
      }
    }
  }

  if (Array.isArray(record.features)) {
    const featureCoordinates = extractCoordinates(record.features);
    if (featureCoordinates) {
      return featureCoordinates;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const nestedCoordinates = extractCoordinates(nestedValue);
    if (nestedCoordinates) {
      return nestedCoordinates;
    }
  }

  return undefined;
}

function isForecastRequestUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const lowerUrl = url.href.toLowerCase();
    const hasCoordinateParameter = ['lat', 'latitude', 'lon', 'lng', 'longitude', 'x', 'y'].some(
      (parameter) => url.searchParams.has(parameter)
    );

    return (
      hasCoordinateParameter &&
      (lowerUrl.includes('forecast') ||
        lowerUrl.includes('open-meteo') ||
        lowerUrl.includes('weather'))
    );
  } catch {
    return false;
  }
}

function requestMatchesCoordinates(urlString: string, coordinates: Coordinates): boolean {
  try {
    const url = new URL(urlString);
    const lat = toFiniteNumber(
      url.searchParams.get('lat') ??
        url.searchParams.get('latitude') ??
        url.searchParams.get('y')
    );
    const lon = toFiniteNumber(
      url.searchParams.get('lon') ??
        url.searchParams.get('lng') ??
        url.searchParams.get('longitude') ??
        url.searchParams.get('x')
    );

    return (
      lat !== undefined &&
      lon !== undefined &&
      Math.abs(lat - coordinates.lat) < 0.5 &&
      Math.abs(lon - coordinates.lon) < 0.5
    );
  } catch {
    return false;
  }
}

test('UC10 Configure layers, search for a location and load the weather forecast', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderInputByTestId = page.getByTestId('geocoder-input');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInputByTestId).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  const geocoderResponsePromise = page.waitForResponse((response) => {
    try {
      const url = new URL(response.url());
      const lowerUrl = url.href.toLowerCase();
      const searchValues = [...url.searchParams.values()].join(' ').toLowerCase();

      return (
        response.ok() &&
        (lowerUrl.includes('geocode') || lowerUrl.includes('nominatim') || lowerUrl.includes('search')) &&
        searchValues.includes('münster')
      );
    } catch {
      return false;
    }
  });

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const geocoderResponse = await geocoderResponsePromise;
  const geocoderPayload = await geocoderResponse.json();
  const selectedLocationCoordinates = extractCoordinates(geocoderPayload);

  expect(selectedLocationCoordinates).toBeDefined();

  await expect(geocoderPanel).toBeVisible();

  await expect.poll(async () => {
    const optionCount = await geocoderPanel.getByRole('option').count();
    const buttonCount = await geocoderPanel.getByRole('button').count();
    const linkCount = await geocoderPanel.getByRole('link').count();
    const munsterTextCount = await geocoderPanel.getByText(/m[uü]nster/i).count();

    return optionCount + buttonCount + linkCount + munsterTextCount;
  }).toBeGreaterThan(0);

  let firstResult = geocoderPanel.getByRole('option').first();
  if ((await geocoderPanel.getByRole('option').count()) === 0) {
    if ((await geocoderPanel.getByRole('button').count()) > 0) {
      firstResult = geocoderPanel.getByRole('button').first();
    } else if ((await geocoderPanel.getByRole('link').count()) > 0) {
      firstResult = geocoderPanel.getByRole('link').first();
    } else {
      firstResult = geocoderPanel.getByText(/m[uü]nster/i).first();
    }
  }

  await expect(firstResult).toBeVisible();

  const forecastRequestUrls: string[] = [];
  page.on('request', (request) => {
    if (isForecastRequestUrl(request.url())) {
      forecastRequestUrls.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse(
    (response) => response.ok() && isForecastRequestUrl(response.url())
  );

  await firstResult.click();

  await expect(geocoderInput).toHaveValue(/m[uü]nster/i);

  const forecastResponse = await forecastResponsePromise;
  await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(0);
  await expect
    .poll(() =>
      forecastRequestUrls.some((requestUrl) =>
        requestMatchesCoordinates(requestUrl, selectedLocationCoordinates as Coordinates)
      )
    )
    .toBe(true);

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(
    weatherForecastSection.getByText('Click on the map to load a forecast.')
  ).not.toBeVisible();

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((element) => {
      const root = element as HTMLElement;

      const roleListItemCount = root.querySelectorAll('[role="listitem"]').length;
      if (roleListItemCount > 0) {
        return roleListItemCount;
      }

      const listItemCount = root.querySelectorAll('li').length;
      if (listItemCount > 0) {
        return listItemCount;
      }

      const articleCount = root.querySelectorAll('article').length;
      if (articleCount > 0) {
        return articleCount;
      }

      const timeLabelCount =
        root.innerText.match(/\b(?:[01]\d|2[0-3]):[0-5]\d\b/g)?.length ?? 0;
      return timeLabelCount;
    });
  }).toBe(24);

  const forecastPayload = await forecastResponse.json();
  expect(forecastPayload).toBeTruthy();
});
