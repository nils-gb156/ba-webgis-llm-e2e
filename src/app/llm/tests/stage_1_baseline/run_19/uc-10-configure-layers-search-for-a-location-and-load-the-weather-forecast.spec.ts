// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const temperatureLayerToggle = page
    .getByRole('checkbox', { name: /temperature/i })
    .or(page.getByRole('switch', { name: /temperature/i }))
    .first();
  const precipitationLayerToggle = page
    .getByRole('checkbox', { name: /precipitation/i })
    .or(page.getByRole('switch', { name: /precipitation/i }))
    .first();
  const searchField = page
    .getByRole('combobox')
    .or(page.getByRole('searchbox'))
    .or(page.getByRole('textbox', { name: /search|suche|location|ort/i }))
    .first();

  await expect(temperatureLayerToggle).toBeVisible();
  await expect(precipitationLayerToggle).toBeVisible();
  await expect(temperatureLayerToggle).toBeChecked();
  await expect(precipitationLayerToggle).not.toBeChecked();
  await expect(searchField).toBeVisible();

  await temperatureLayerToggle.click({ force: true });
  await expect(temperatureLayerToggle).not.toBeChecked();

  await precipitationLayerToggle.click({ force: true });
  await expect(precipitationLayerToggle).toBeChecked();

  await searchField.click();
  await searchField.fill('Münster');

  const firstResult = page.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const selectedResultText = (await firstResult.textContent())?.trim() ?? '';
  const selectedPrimaryLabel = selectedResultText.split(',')[0]?.trim() || 'Münster';
  expect(selectedPrimaryLabel).not.toBe('');

  const forecastRequests: string[] = [];
  page.on('request', (request) => {
    if (/(forecast|weather)/i.test(request.url())) {
      forecastRequests.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse(async (response) => {
    if (!response.ok() || !/(forecast|weather)/i.test(response.url())) {
      return false;
    }

    try {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.length >= 24;
      }
      if (Array.isArray(data?.forecast)) {
        return data.forecast.length >= 24;
      }
      if (Array.isArray(data?.entries)) {
        return data.entries.length >= 24;
      }
      if (Array.isArray(data?.data)) {
        return data.data.length >= 24;
      }
      if (Array.isArray(data?.properties?.timeseries)) {
        return data.properties.timeseries.length >= 24;
      }
      if (Array.isArray(data?.hourly?.time)) {
        return data.hourly.time.length >= 24;
      }
      return true;
    } catch {
      return true;
    }
  });

  forecastRequests.length = 0;
  await firstResult.click();

  await expect.poll(() => forecastRequests.length).toBeGreaterThan(0);
  await expect(searchField).toHaveValue(new RegExp(escapeRegExp(selectedPrimaryLabel), 'i'));

  const forecastResponse = await forecastResponsePromise;
  expect(forecastResponse.ok()).toBeTruthy();

  const forecastHeading = page.getByRole('heading', { name: /forecast|vorhersage/i });
  await expect(forecastHeading).toBeVisible();

  const forecastPanel = page
    .getByRole('complementary')
    .filter({ has: forecastHeading })
    .or(page.getByRole('region').filter({ has: forecastHeading }))
    .or(page.getByRole('tabpanel').filter({ has: forecastHeading }))
    .first();

  await expect(forecastPanel).toBeVisible();
  await expect(forecastPanel.getByRole('listitem')).toHaveCount(24);
});
