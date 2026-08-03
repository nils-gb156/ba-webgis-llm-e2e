// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  let temperatureToggle = page.getByRole('switch', { name: 'Temperature', exact: true });
  if ((await temperatureToggle.count()) === 0) {
    temperatureToggle = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  }

  let precipitationToggle = page.getByRole('switch', { name: 'Precipitation', exact: true });
  if ((await precipitationToggle.count()) === 0) {
    precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  }

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  const infoPanel = page.getByRole('complementary').first();
  if ((await infoPanel.count()) > 0) {
    await expect(infoPanel).toBeVisible();
  }

  const measureButton = page.getByRole('button', { name: /measure/i }).first();
  if ((await measureButton.count()) > 0) {
    const ariaPressed = await measureButton.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      await expect(measureButton).toHaveAttribute('aria-pressed', 'false');
    }
  }

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  let searchField = page.getByRole('combobox', { name: /search|location|place|address/i }).first();
  if ((await searchField.count()) === 0) {
    searchField = page.getByRole('searchbox', { name: /search|location|place|address/i }).first();
  }
  if ((await searchField.count()) === 0) {
    searchField = page.getByRole('textbox', { name: /search|location|place|address/i }).first();
  }
  if ((await searchField.count()) === 0) {
    searchField = page.getByPlaceholder(/search|location|place|address/i).first();
  }

  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  const resultList = page.getByRole('listbox').first();
  await expect(resultList).toBeVisible();

  let firstResult = resultList.getByRole('option').first();
  if ((await firstResult.count()) === 0) {
    firstResult = resultList.getByRole('button').first();
  }
  if ((await firstResult.count()) === 0) {
    firstResult = resultList.getByRole('listitem').first();
  }

  await expect(firstResult).toBeVisible();
  await expect(firstResult).toContainText(/münster/i);

  const forecastRequestUrls = new Set<string>();
  page.on('request', request => {
    if (/forecast/i.test(request.url()) && request.method() === 'GET') {
      forecastRequestUrls.add(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse(response => {
    return /forecast/i.test(response.url()) && response.request().method() === 'GET' && forecastRequestUrls.has(response.url());
  });

  await firstResult.click();

  await expect(resultList).toBeHidden();
  await expect(searchField).toHaveValue(/münster/i);

  await expect.poll(() => forecastRequestUrls.size).toBeGreaterThan(0);

  const forecastResponse = await forecastResponsePromise;
  expect(forecastResponse.ok()).toBeTruthy();

  const forecastUrl = new URL(forecastResponse.url());
  const latitudeText =
    forecastUrl.searchParams.get('latitude') ??
    forecastUrl.searchParams.get('lat');
  const longitudeText =
    forecastUrl.searchParams.get('longitude') ??
    forecastUrl.searchParams.get('lon') ??
    forecastUrl.searchParams.get('lng');

  expect(latitudeText).not.toBeNull();
  expect(longitudeText).not.toBeNull();

  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);

  expect(Number.isFinite(latitude)).toBeTruthy();
  expect(Number.isFinite(longitude)).toBeTruthy();
  expect(latitude).toBeGreaterThan(51.7);
  expect(latitude).toBeLessThan(52.2);
  expect(longitude).toBeGreaterThan(7.3);
  expect(longitude).toBeLessThan(8.0);

  const forecastData = await forecastResponse.json();
  const forecastEntryCount =
    Array.isArray(forecastData) ? forecastData.length :
    Array.isArray(forecastData?.forecast) ? forecastData.forecast.length :
    Array.isArray(forecastData?.entries) ? forecastData.entries.length :
    Array.isArray(forecastData?.timeseries) ? forecastData.timeseries.length :
    Array.isArray(forecastData?.hourly?.time) ? forecastData.hourly.time.length :
    Array.isArray(forecastData?.properties?.timeseries) ? forecastData.properties.timeseries.length :
    undefined;

  expect(forecastEntryCount).toBe(24);

  let forecastSection = page.getByRole('heading', { name: /forecast|weather/i }).first();
  if ((await forecastSection.count()) === 0) {
    forecastSection = page.getByText(/forecast|weather/i).first();
  }

  await expect(forecastSection).toBeVisible();
});
