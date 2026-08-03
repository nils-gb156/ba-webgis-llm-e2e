// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const findForecastEntryCount = (value: unknown): number | undefined => {
    if (Array.isArray(value)) {
      if (value.length === 24) {
        return value.length;
      }
      for (const nested of value) {
        const nestedCount = findForecastEntryCount(nested);
        if (nestedCount !== undefined) {
          return nestedCount;
        }
      }
      return undefined;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;

      const hourly = record.hourly;
      if (hourly && typeof hourly === 'object' && !Array.isArray(hourly)) {
        const hourlyRecord = hourly as Record<string, unknown>;
        if (Array.isArray(hourlyRecord.time) && hourlyRecord.time.length === 24) {
          return hourlyRecord.time.length;
        }
        for (const nested of Object.values(hourlyRecord)) {
          if (Array.isArray(nested) && nested.length === 24) {
            return nested.length;
          }
        }
      }

      for (const nested of Object.values(record)) {
        const nestedCount = findForecastEntryCount(nested);
        if (nestedCount !== undefined) {
          return nestedCount;
        }
      }
    }

    return undefined;
  };

  const temperatureName = /^(Temperature|Temperatur)$/i;
  const precipitationName = /^(Precipitation|Niederschlag)$/i;
  const forecastHeadingName = /(weather forecast|forecast|wettervorhersage|vorhersage)/i;
  const searchFieldName = /(search|suche|location|ort|address|adresse)/i;

  const temperatureToggle = page
    .getByRole('checkbox', { name: temperatureName })
    .or(page.getByRole('switch', { name: temperatureName }))
    .first();

  const precipitationToggle = page
    .getByRole('checkbox', { name: precipitationName })
    .or(page.getByRole('switch', { name: precipitationName }))
    .first();

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  const searchField = page
    .getByRole('combobox', { name: searchFieldName })
    .or(page.getByRole('textbox', { name: searchFieldName }))
    .or(page.getByRole('combobox'))
    .first();

  await expect(searchField).toBeVisible();

  const infoPanel = page
    .getByRole('complementary')
    .or(page.getByRole('region', { name: /(info|information|details)/i }))
    .first();

  await expect(infoPanel).toBeVisible();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  await searchField.click();
  await searchField.fill('Münster');
  await expect(searchField).toHaveValue(/münster/i);

  const resultList = page.getByRole('listbox').first();
  await expect(resultList).toBeVisible();

  const firstResult = resultList.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const firstResultText = ((await firstResult.textContent()) ?? '').trim();
  const firstResultMainLabel = firstResultText.split(',')[0]?.trim() ?? 'Münster';

  let forecastRequestUrl: string | undefined;
  let forecastEntryCount: number | undefined;

  page.on('request', (request) => {
    const url = request.url().toLowerCase();
    if (
      request.method() === 'GET' &&
      (url.includes('forecast') || url.includes('weather') || url.includes('open-meteo'))
    ) {
      forecastRequestUrl = request.url();
    }
  });

  page.on('response', async (response) => {
    const url = response.url().toLowerCase();
    const contentType = response.headers()['content-type'] ?? '';
    if (
      !response.ok() ||
      !contentType.includes('application/json') ||
      !(url.includes('forecast') || url.includes('weather') || url.includes('open-meteo'))
    ) {
      return;
    }

    try {
      const body = await response.json();
      const count = findForecastEntryCount(body);
      if (count !== undefined) {
        forecastEntryCount = count;
      }
    } catch {
      // Ignore non-JSON or unreadable responses.
    }
  });

  await firstResult.click();

  await expect(resultList).toBeHidden();
  await expect(searchField).toHaveValue(new RegExp(escapeRegExp(firstResultMainLabel), 'i'));

  await expect.poll(() => forecastRequestUrl ?? '').toMatch(/forecast|weather|open-meteo/i);

  const forecastHeading = page.getByRole('heading', { name: forecastHeadingName }).first();
  await expect(forecastHeading).toBeVisible();

  await expect.poll(() => forecastEntryCount ?? -1).toBe(24);
});
