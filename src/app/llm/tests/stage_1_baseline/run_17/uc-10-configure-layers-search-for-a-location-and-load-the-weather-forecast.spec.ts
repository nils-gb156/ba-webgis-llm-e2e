// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const getForecastEntryCount = (payload: any): number | undefined => {
    if (Array.isArray(payload)) {
      return payload.length;
    }

    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const directCandidates = [
      payload.entries,
      payload.forecast,
      payload.list,
      payload.items,
      payload.data,
      payload['24hForecast'],
      payload.properties?.timeseries
    ];

    for (const candidate of directCandidates) {
      if (Array.isArray(candidate)) {
        return candidate.length;
      }
    }

    if (Array.isArray(payload.hourly?.time)) {
      return payload.hourly.time.length;
    }

    if (payload.hourly && typeof payload.hourly === 'object') {
      for (const value of Object.values(payload.hourly)) {
        if (Array.isArray(value)) {
          return value.length;
        }
      }
    }

    return undefined;
  };

  const temperatureToggle = page.getByRole('checkbox', { name: /temperature/i });
  const precipitationToggle = page.getByRole('checkbox', { name: /precipitation/i });
  const searchField = page.getByRole('combobox').first();

  await expect(page.getByText(/temperature/i)).toBeVisible();
  await expect(page.getByText(/precipitation/i)).toBeVisible();
  await expect(searchField).toBeVisible();

  const measurementButton = page.getByRole('button', { name: /measure/i }).first();
  if (await measurementButton.isVisible()) {
    await expect(measurementButton).toHaveAttribute('aria-pressed', 'false');
  }

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  await searchField.click();
  await searchField.fill('Münster');

  const resultList = page.getByRole('listbox');
  const firstResult = resultList.getByRole('option').first();

  await expect(firstResult).toBeVisible();

  const forecastResponsePromise = page.waitForResponse(async (response) => {
    const contentType = response.headers()['content-type'] ?? '';
    return response.ok() && /application\/json/i.test(contentType) && /forecast|weather/i.test(response.url());
  });

  await firstResult.click();

  await expect(resultList).not.toBeVisible();
  await expect(searchField).toHaveValue(/münster/i);

  const forecastResponse = await forecastResponsePromise;
  const forecastPayload = await forecastResponse.json();
  const forecastEntryCount = getForecastEntryCount(forecastPayload);

  expect(forecastEntryCount).toBe(24);

  const forecastHeading = page.getByRole('heading', { name: /weather forecast|forecast/i });
  await expect(forecastHeading).toBeVisible();

  const forecastRegion = page.getByRole('region', { name: /weather forecast|forecast/i });
  if ((await forecastRegion.count()) > 0) {
    await expect(forecastRegion).toBeVisible();

    const forecastItems = forecastRegion.getByRole('listitem');
    if ((await forecastItems.count()) > 0) {
      await expect.poll(async () => await forecastItems.count()).toBe(24);
    }
  }
});
