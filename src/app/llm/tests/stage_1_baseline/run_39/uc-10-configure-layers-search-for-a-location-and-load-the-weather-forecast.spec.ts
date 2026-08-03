// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const getLayerToggle = async (layerName: string) => {
    let locator = page.getByRole('switch', { name: new RegExp(layerName, 'i') });
    if (await locator.count()) {
      return { locator: locator.first(), kind: 'checkable' as const };
    }

    locator = page.getByRole('checkbox', { name: new RegExp(layerName, 'i') });
    if (await locator.count()) {
      return { locator: locator.first(), kind: 'checkable' as const };
    }

    locator = page.getByRole('button', { name: new RegExp(layerName, 'i') });
    return { locator: locator.first(), kind: 'button' as const };
  };

  const expectLayerVisibility = async (
    toggle: { locator: any; kind: 'checkable' | 'button' },
    visible: boolean
  ) => {
    await expect(toggle.locator).toBeVisible();

    if (toggle.kind === 'checkable') {
      if (visible) {
        await expect(toggle.locator).toBeChecked();
      } else {
        await expect(toggle.locator).not.toBeChecked();
      }
    } else {
      await expect(toggle.locator).toHaveAttribute('aria-pressed', visible ? 'true' : 'false');
    }
  };

  const clickLayerToggle = async (toggle: { locator: any; kind: 'checkable' | 'button' }) => {
    if (toggle.kind === 'checkable') {
      await toggle.locator.click({ force: true });
    } else {
      await toggle.locator.click();
    }
  };

  const getForecastEntryCount = (body: any): number | undefined => {
    if (Array.isArray(body)) {
      return body.length;
    }
    if (Array.isArray(body?.entries)) {
      return body.entries.length;
    }
    if (Array.isArray(body?.forecast)) {
      return body.forecast.length;
    }
    if (Array.isArray(body?.timeseries)) {
      return body.timeseries.length;
    }
    if (Array.isArray(body?.list)) {
      return body.list.length;
    }
    if (Array.isArray(body?.data)) {
      return body.data.length;
    }
    if (body?.hourly) {
      if (Array.isArray(body.hourly.time)) {
        return body.hourly.time.length;
      }
      if (Array.isArray(body.hourly.data)) {
        return body.hourly.data.length;
      }
    }
    return undefined;
  };

  const temperatureToggle = await getLayerToggle('Temperature');
  const precipitationToggle = await getLayerToggle('Precipitation');

  await expect(temperatureToggle.locator).toBeVisible();
  await expect(precipitationToggle.locator).toBeVisible();

  await expectLayerVisibility(temperatureToggle, true);
  await expectLayerVisibility(precipitationToggle, false);

  for (const name of [/^Measure$/i, /^Measurement$/i, /Ruler/i]) {
    const measurementButton = page.getByRole('button', { name }).first();
    if (await measurementButton.count()) {
      const pressed = await measurementButton.getAttribute('aria-pressed');
      if (pressed !== null) {
        expect(pressed).toBe('false');
      }
      break;
    }
  }

  let searchField = page.getByRole('combobox', { name: /search/i }).first();
  if (!(await searchField.count())) {
    searchField = page.getByRole('textbox', { name: /search/i }).first();
  }
  await expect(searchField).toBeVisible();

  await clickLayerToggle(temperatureToggle);
  await expectLayerVisibility(temperatureToggle, false);

  await clickLayerToggle(precipitationToggle);
  await expectLayerVisibility(precipitationToggle, true);

  await searchField.click();
  await searchField.fill('Münster');

  let firstResult = page.getByRole('option', { name: /Münster/i }).first();
  if (!(await firstResult.count())) {
    firstResult = page.getByRole('button', { name: /Münster/i }).first();
  }
  if (!(await firstResult.count())) {
    firstResult = page.getByText(/Münster/i).first();
  }

  await expect(firstResult).toBeVisible();

  const forecastRequestUrls: string[] = [];
  page.on('request', (request) => {
    if (/forecast|open-meteo/i.test(request.url())) {
      forecastRequestUrls.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse(
    (response) => /forecast|open-meteo/i.test(response.url()) && response.ok()
  );

  await firstResult.click();

  await expect(searchField).toHaveValue(/Münster/i);
  await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(0);

  const forecastResponse = await forecastResponsePromise;
  const forecastUrl = forecastRequestUrls[forecastRequestUrls.length - 1];

  expect(forecastUrl).toMatch(/(?:lat|latitude)=/i);
  expect(forecastUrl).toMatch(/(?:lon|lng|longitude)=/i);

  let forecastHeading = page.getByRole('heading', { name: /forecast/i }).first();
  if (!(await forecastHeading.count())) {
    forecastHeading = page.getByRole('heading', { name: /weather/i }).first();
  }
  await expect(forecastHeading).toBeVisible();

  const forecastBody = await forecastResponse.json();
  expect(getForecastEntryCount(forecastBody)).toBe(24);

  await expectLayerVisibility(temperatureToggle, false);
  await expectLayerVisibility(precipitationToggle, true);
});
