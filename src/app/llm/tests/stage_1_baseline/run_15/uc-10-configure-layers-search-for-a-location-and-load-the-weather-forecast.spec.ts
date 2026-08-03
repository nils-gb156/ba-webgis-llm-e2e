// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  const extractForecastEntryCount = (data: unknown): number | undefined => {
    if (Array.isArray(data)) {
      return data.length;
    }

    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const record = data as Record<string, unknown>;

    if (Array.isArray(record.entries)) {
      return record.entries.length;
    }

    if (Array.isArray(record.forecast)) {
      return record.forecast.length;
    }

    if (Array.isArray(record.timeseries)) {
      return record.timeseries.length;
    }

    if (record.hourly && typeof record.hourly === 'object') {
      const hourly = record.hourly as Record<string, unknown>;

      if (Array.isArray(hourly.time)) {
        return hourly.time.length;
      }

      const firstHourlyArray = Object.values(hourly).find(Array.isArray) as unknown[] | undefined;
      if (firstHourlyArray) {
        return firstHourlyArray.length;
      }
    }

    const firstArray = Object.values(record).find(Array.isArray) as unknown[] | undefined;
    return firstArray?.length;
  };

  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const temperatureLabel = page.getByText('Temperature', { exact: true }).first();
  const precipitationLabel = page.getByText('Precipitation', { exact: true }).first();

  await expect(temperatureLabel).toBeVisible();
  await expect(precipitationLabel).toBeVisible();

  const temperatureToggle = page
    .getByRole('checkbox', { name: 'Temperature', exact: true })
    .or(page.getByRole('switch', { name: 'Temperature', exact: true }))
    .first();

  const precipitationToggle = page
    .getByRole('checkbox', { name: 'Precipitation', exact: true })
    .or(page.getByRole('switch', { name: 'Precipitation', exact: true }))
    .first();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const searchField = page
    .getByRole('combobox', { name: /search|location|place/i })
    .or(page.getByRole('searchbox'))
    .or(page.getByRole('textbox', { name: /search|location|place/i }))
    .or(page.getByPlaceholder(/search|location|place/i))
    .first();

  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  const resultList = page.getByRole('listbox').first();
  await expect(resultList).toBeVisible();

  const firstResult = resultList.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const selectedResultText = ((await firstResult.textContent()) ?? 'Münster').trim();
  const selectedLocationToken = (selectedResultText.split(',')[0] || 'Münster').trim();
  const selectedLocationPattern = new RegExp(escapeRegExp(selectedLocationToken), 'i');

  let forecastEntryCount: number | undefined;
  const forecastResponsePromise = page.waitForResponse(async (response) => {
    if (!response.ok()) {
      return false;
    }

    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.toLowerCase().includes('json')) {
      return false;
    }

    try {
      const count = extractForecastEntryCount(await response.json());
      if (count === 24) {
        forecastEntryCount = count;
        return true;
      }
    } catch {
      return false;
    }

    return false;
  });

  await firstResult.click();

  await expect.poll(async () => await searchField.inputValue()).toMatch(selectedLocationPattern);
  await forecastResponsePromise;

  const forecastHeading = page
    .getByRole('heading', { name: /weather forecast|forecast|wettervorhersage|vorhersage/i })
    .first();

  await expect(forecastHeading).toBeVisible();
  expect(forecastEntryCount).toBe(24);
});
