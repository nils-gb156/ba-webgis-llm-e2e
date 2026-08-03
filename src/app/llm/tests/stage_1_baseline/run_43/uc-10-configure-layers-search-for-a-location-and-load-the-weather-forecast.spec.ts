// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const getNamedToggle = async (name: string) => {
    const switchLocator = page.getByRole('switch', { name, exact: true });
    if ((await switchLocator.count()) > 0) {
      return switchLocator;
    }

    const checkboxLocator = page.getByRole('checkbox', { name, exact: true });
    if ((await checkboxLocator.count()) > 0) {
      return checkboxLocator;
    }

    return page.getByRole('button', { name, exact: true });
  };

  const getSearchField = async () => {
    const combobox = page.getByRole('combobox', { name: /search/i });
    if ((await combobox.count()) > 0) {
      return combobox.first();
    }

    const searchbox = page.getByRole('searchbox', { name: /search/i });
    if ((await searchbox.count()) > 0) {
      return searchbox.first();
    }

    const textbox = page.getByRole('textbox', { name: /search/i });
    if ((await textbox.count()) > 0) {
      return textbox.first();
    }

    return page.getByPlaceholder(/search/i).first();
  };

  const getForecastHeading = async () => {
    const weatherForecastHeading = page.getByRole('heading', { name: /weather forecast/i });
    if ((await weatherForecastHeading.count()) > 0) {
      return weatherForecastHeading.first();
    }

    const forecastHeading = page.getByRole('heading', { name: /forecast/i });
    if ((await forecastHeading.count()) > 0) {
      return forecastHeading.first();
    }

    return page.getByText(/weather forecast|forecast/i).first();
  };

  const extractForecastEntryCount = (value: unknown): number | undefined => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const data = value as Record<string, unknown>;

    if ('hourly' in data && data.hourly && typeof data.hourly === 'object') {
      const hourly = data.hourly as Record<string, unknown>;
      if (Array.isArray(hourly.time)) {
        return hourly.time.length;
      }
      for (const key of Object.keys(hourly)) {
        const candidate = hourly[key];
        if (Array.isArray(candidate)) {
          return candidate.length;
        }
      }
    }

    for (const key of ['forecast', 'entries', 'items', 'timeseries', 'data']) {
      const candidate = data[key];
      if (Array.isArray(candidate)) {
        return candidate.length;
      }
    }

    for (const nested of Object.values(data)) {
      const nestedCount = extractForecastEntryCount(nested);
      if (nestedCount !== undefined) {
        return nestedCount;
      }
    }

    return undefined;
  };

  const temperatureToggle = await getNamedToggle('Temperature');
  const precipitationToggle = await getNamedToggle('Precipitation');

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const searchField = await getSearchField();
  await expect(searchField).toBeVisible();

  const geocoderResponsePromise = page.waitForResponse((response) => {
    const url = response.url();
    const resourceType = response.request().resourceType();
    return response.ok() && (resourceType === 'fetch' || resourceType === 'xhr') && /geocod|nominatim|search/i.test(url);
  });

  await searchField.click();
  await searchField.fill('Münster');
  await geocoderResponsePromise;

  const optionResults = page.getByRole('option');
  const buttonResults = page.getByRole('button', { name: /münster/i });
  const listItemResults = page.getByRole('listitem').filter({ hasText: /münster/i });

  await expect
    .poll(async () => {
      if ((await optionResults.count()) > 0) {
        return 'option';
      }
      if ((await buttonResults.count()) > 0) {
        return 'button';
      }
      if ((await listItemResults.count()) > 0) {
        return 'listitem';
      }
      return '';
    })
    .not.toBe('');

  let firstResult = optionResults.first();
  if ((await optionResults.count()) === 0 && (await buttonResults.count()) > 0) {
    firstResult = buttonResults.first();
  }
  if ((await optionResults.count()) === 0 && (await buttonResults.count()) === 0) {
    firstResult = listItemResults.first();
  }

  await expect(firstResult).toBeVisible();
  const selectedResultLabel = ((await firstResult.textContent()) ?? 'Münster').trim();

  let weatherRequestUrl: string | undefined;
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    if ((resourceType === 'fetch' || resourceType === 'xhr') && /forecast|weather/i.test(request.url())) {
      weatherRequestUrl = request.url();
    }
  });

  const weatherResponsePromise = page.waitForResponse((response) => {
    const url = response.url();
    const resourceType = response.request().resourceType();
    return response.ok() && (resourceType === 'fetch' || resourceType === 'xhr') && /forecast|weather/i.test(url);
  });

  await firstResult.click();

  await expect(searchField).toHaveValue(new RegExp(escapeRegExp(selectedResultLabel.split(',')[0].trim() || 'Münster'), 'i'));
  await expect.poll(() => weatherRequestUrl).toMatch(/forecast|weather/i);

  const weatherResponse = await weatherResponsePromise;
  const weatherJson = await weatherResponse.json();

  const forecastHeading = await getForecastHeading();
  await expect(forecastHeading).toBeVisible();

  let domForecastEntryCount: number | undefined;
  const forecastRegionByWeatherName = page.getByRole('region', { name: /weather forecast/i });
  const forecastRegionByForecastName = page.getByRole('region', { name: /forecast/i });

  let forecastRegion = forecastRegionByWeatherName;
  if ((await forecastRegionByWeatherName.count()) === 0 && (await forecastRegionByForecastName.count()) > 0) {
    forecastRegion = forecastRegionByForecastName;
  }

  if ((await forecastRegion.count()) > 0) {
    const region = forecastRegion.first();
    const listItems = region.getByRole('listitem');
    const rows = region.getByRole('row');

    if ((await listItems.count()) > 0) {
      domForecastEntryCount = await listItems.count();
    } else if ((await rows.count()) > 0) {
      domForecastEntryCount = await rows.count();
    }
  }

  if (domForecastEntryCount !== undefined) {
    expect(domForecastEntryCount).toBe(24);
  } else {
    expect(extractForecastEntryCount(weatherJson)).toBe(24);
  }
});
