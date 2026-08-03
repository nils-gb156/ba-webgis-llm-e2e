// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const normalizeText = (value: string) =>
    value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const asNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number') {
      return Number.isNaN(value) ? undefined : value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };

  const extractCoordinates = (payload: any): { latitude: number; longitude: number } | undefined => {
    const first =
      Array.isArray(payload) ? payload[0] : Array.isArray(payload?.features) ? payload.features[0] : payload;

    if (!first) {
      return undefined;
    }

    const latitude =
      asNumber(first.lat) ??
      asNumber(first.latitude) ??
      asNumber(first?.properties?.lat) ??
      asNumber(first?.properties?.latitude) ??
      asNumber(first?.center?.[1]) ??
      asNumber(first?.geometry?.coordinates?.[1]);

    const longitude =
      asNumber(first.lon) ??
      asNumber(first.lng) ??
      asNumber(first.longitude) ??
      asNumber(first?.properties?.lon) ??
      asNumber(first?.properties?.lng) ??
      asNumber(first?.properties?.longitude) ??
      asNumber(first?.center?.[0]) ??
      asNumber(first?.geometry?.coordinates?.[0]);

    if (latitude === undefined || longitude === undefined) {
      return undefined;
    }

    return { latitude, longitude };
  };

  const countForecastEntries = (payload: any): number | undefined => {
    const candidates = [
      payload?.entries,
      payload?.forecast,
      payload?.forecasts,
      payload?.items,
      payload?.list,
      payload?.properties?.periods,
      payload?.hourly?.time,
      payload?.hourly?.temperature_2m
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.length;
      }
    }

    return undefined;
  };

  const temperatureToggle =
    (await page.getByRole('checkbox', { name: /^Temperature\b/i }).count()) > 0
      ? page.getByRole('checkbox', { name: /^Temperature\b/i })
      : page.getByRole('switch', { name: /^Temperature\b/i });

  const precipitationToggle =
    (await page.getByRole('checkbox', { name: /^Precipitation\b/i }).count()) > 0
      ? page.getByRole('checkbox', { name: /^Precipitation\b/i })
      : page.getByRole('switch', { name: /^Precipitation\b/i });

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  const infoPanel = page.getByRole('complementary');
  if ((await infoPanel.count()) > 0) {
    await expect(infoPanel.first()).toBeVisible();
  }

  const measureToggle = page.getByRole('button', { name: /measure/i });
  if ((await measureToggle.count()) > 0) {
    const ariaPressed = await measureToggle.first().getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      await expect(measureToggle.first()).toHaveAttribute('aria-pressed', 'false');
    }
  }

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const searchField =
    (await page.getByRole('combobox').count()) > 0
      ? page.getByRole('combobox').first()
      : page.getByRole('textbox', { name: /search|location|place/i }).first();

  await expect(searchField).toBeVisible();

  const geocoderResponsePromise = page.waitForResponse(async (response) => {
    if (!response.ok()) {
      return false;
    }

    const responseUrl = response.url();
    if (!/search|geocode|nominatim/i.test(responseUrl)) {
      return false;
    }

    try {
      const url = new URL(responseUrl);
      const query = [
        url.searchParams.get('q'),
        url.searchParams.get('query'),
        url.searchParams.get('text'),
        url.searchParams.get('search')
      ]
        .filter((value): value is string => !!value)
        .join(' ');

      return normalizeText(query).includes('munster');
    } catch {
      return normalizeText(responseUrl).includes('munster');
    }
  });

  await searchField.click();
  await searchField.fill('Münster');

  const geocoderResponse = await geocoderResponsePromise;
  const geocoderPayload = await geocoderResponse.json();
  const selectedCoordinates = extractCoordinates(geocoderPayload);

  const resultsList = page.getByRole('listbox').first();
  await expect(resultsList).toBeVisible();

  const firstResult = resultsList.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const forecastRequests: Array<{ latitude: number; longitude: number; url: string }> = [];
  page.on('request', (request) => {
    try {
      const url = new URL(request.url());
      const latitude = asNumber(url.searchParams.get('latitude') ?? url.searchParams.get('lat'));
      const longitude = asNumber(
        url.searchParams.get('longitude') ?? url.searchParams.get('lon') ?? url.searchParams.get('lng')
      );

      if (/forecast/i.test(url.href) && latitude !== undefined && longitude !== undefined) {
        forecastRequests.push({ latitude, longitude, url: request.url() });
      }
    } catch {
      // Ignore unparsable request URLs.
    }
  });

  const forecastResponsePromise = page.waitForResponse(async (response) => {
    if (!response.ok()) {
      return false;
    }

    try {
      const url = new URL(response.url());
      return (
        /forecast/i.test(url.href) &&
        (url.searchParams.has('latitude') || url.searchParams.has('lat')) &&
        (url.searchParams.has('longitude') || url.searchParams.has('lon') || url.searchParams.has('lng'))
      );
    } catch {
      return /forecast/i.test(response.url());
    }
  });

  await firstResult.click();

  await expect(searchField).toHaveValue(/m(ü|u)nster/i);

  const forecastResponse = await forecastResponsePromise;
  const forecastPayload = await forecastResponse.json();
  const forecastEntryCount = countForecastEntries(forecastPayload);

  if (selectedCoordinates) {
    await expect.poll(() => {
      return forecastRequests.some((request) => {
        return (
          Math.abs(request.latitude - selectedCoordinates.latitude) < 0.2 &&
          Math.abs(request.longitude - selectedCoordinates.longitude) < 0.2
        );
      });
    }).toBe(true);
  } else {
    await expect.poll(() => forecastRequests.length).toBeGreaterThan(0);
  }

  const forecastHeading = page.getByRole('heading', { name: /forecast/i }).first();
  await expect(forecastHeading).toBeVisible();

  expect(forecastEntryCount).toBe(24);
});
