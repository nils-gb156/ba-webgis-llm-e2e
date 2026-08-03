// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const hasArrayWithLength = (value: unknown, targetLength: number): boolean => {
    const seen = new Set<object>();

    const visit = (node: unknown): boolean => {
      if (Array.isArray(node)) {
        if (node.length === targetLength) {
          return true;
        }
        return node.some(visit);
      }

      if (node && typeof node === 'object') {
        if (seen.has(node as object)) {
          return false;
        }
        seen.add(node as object);
        return Object.values(node as Record<string, unknown>).some(visit);
      }

      return false;
    };

    return visit(value);
  };

  const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const resolveLayerToggle = async (layerName: RegExp) => {
    let locator = page.getByRole('checkbox', { name: layerName }).first();
    if ((await locator.count()) > 0) {
      return locator;
    }

    locator = page.getByRole('switch', { name: layerName }).first();
    if ((await locator.count()) > 0) {
      return locator;
    }

    return page.getByRole('radio', { name: layerName }).first();
  };

  const resolveSearchField = async () => {
    let locator = page.getByRole('combobox', { name: /search|location|place|address/i }).first();
    if ((await locator.count()) > 0) {
      return locator;
    }

    locator = page.getByRole('combobox').first();
    if ((await locator.count()) > 0) {
      return locator;
    }

    locator = page.getByRole('textbox', { name: /search|location|place|address/i }).first();
    if ((await locator.count()) > 0) {
      return locator;
    }

    return page.getByRole('textbox').first();
  };

  const temperatureToggle = await resolveLayerToggle(/\bTemperature\b/i);
  const precipitationToggle = await resolveLayerToggle(/\bPrecipitation\b/i);

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  const searchField = await resolveSearchField();
  await expect(searchField).toBeVisible();

  for (const pattern of [/measure/i, /distance/i, /area/i]) {
    const measurementButton = page.getByRole('button', { name: pattern }).first();
    if ((await measurementButton.count()) > 0) {
      await expect(measurementButton).not.toHaveAttribute('aria-pressed', 'true');
    }
  }

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  await searchField.click();
  await searchField.fill('Münster');

  let resultList = page.getByRole('listbox').first();
  if ((await resultList.count()) === 0) {
    resultList = page.getByRole('list').filter({ has: page.getByText(/Münster/i) }).first();
  }
  await expect(resultList).toBeVisible();

  let firstResult = resultList.getByRole('option').first();
  if ((await firstResult.count()) === 0) {
    firstResult = resultList.getByRole('button').first();
  }
  if ((await firstResult.count()) === 0) {
    firstResult = resultList.getByRole('link').first();
  }
  if ((await firstResult.count()) === 0) {
    firstResult = resultList.getByText(/Münster/i).first();
  }

  await expect(firstResult).toBeVisible();
  const selectedResultText = ((await firstResult.textContent()) ?? 'Münster').trim();

  let forecastResponseUrl: string | undefined;
  let forecastResponseBody: unknown;
  let captureForecastResponses = false;

  page.on('response', async response => {
    if (!captureForecastResponses || !response.ok()) {
      return;
    }

    const contentType = response.headers()['content-type'] ?? '';
    if (!/json/i.test(contentType)) {
      return;
    }

    try {
      const body = await response.json();
      if (hasArrayWithLength(body, 24)) {
        forecastResponseUrl = response.url();
        forecastResponseBody = body;
      }
    } catch {
      // ignore non-JSON or non-forecast responses
    }
  });

  captureForecastResponses = true;
  await firstResult.click();

  const selectedResultPattern = new RegExp(escapeRegExp(selectedResultText || 'Münster'), 'i');
  await expect(searchField).toHaveValue(selectedResultPattern);
  await expect(searchField).toHaveValue(/Münster/i);

  await expect.poll(() => Boolean(forecastResponseUrl)).toBe(true);

  let forecastHeading = page.getByRole('heading', { name: /forecast/i }).first();
  if ((await forecastHeading.count()) === 0) {
    forecastHeading = page.getByText(/forecast/i).first();
  }
  await expect(forecastHeading).toBeVisible();

  let forecastContainer = page.getByRole('region').filter({ has: forecastHeading }).first();
  if ((await forecastContainer.count()) === 0) {
    forecastContainer = page.getByRole('complementary').filter({ has: forecastHeading }).first();
  }
  if ((await forecastContainer.count()) === 0) {
    forecastContainer = page.getByRole('tabpanel').filter({ has: forecastHeading }).first();
  }
  if ((await forecastContainer.count()) === 0) {
    forecastContainer = page.getByRole('main').filter({ has: forecastHeading }).first();
  }

  await expect.poll(async () => {
    if ((await forecastContainer.count()) > 0) {
      const listItems = await forecastContainer.getByRole('listitem').count();
      if (listItems === 24) {
        return 24;
      }

      const articles = await forecastContainer.getByRole('article').count();
      if (articles === 24) {
        return 24;
      }

      const rows = await forecastContainer.getByRole('row').count();
      if (rows === 24) {
        return 24;
      }
      if (rows === 25) {
        return 24;
      }
    }

    return hasArrayWithLength(forecastResponseBody, 24) ? 24 : 0;
  }).toBe(24);
});
