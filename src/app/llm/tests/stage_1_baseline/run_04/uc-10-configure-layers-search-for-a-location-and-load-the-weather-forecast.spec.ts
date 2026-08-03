// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  let temperatureToggle = page.getByRole('checkbox', { name: /temperature/i });
  if ((await temperatureToggle.count()) === 0) {
    temperatureToggle = page.getByRole('switch', { name: /temperature/i });
  }

  let precipitationToggle = page.getByRole('checkbox', { name: /precipitation/i });
  if ((await precipitationToggle.count()) === 0) {
    precipitationToggle = page.getByRole('switch', { name: /precipitation/i });
  }

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  let searchField = page.getByRole('combobox', { name: /search/i });
  if ((await searchField.count()) === 0) {
    searchField = page.getByRole('combobox');
  }
  if ((await searchField.count()) === 0) {
    searchField = page.getByRole('textbox', { name: /search/i });
  }
  if ((await searchField.count()) === 0) {
    searchField = page.getByRole('textbox');
  }

  await expect(searchField).toBeVisible();
  await expect(searchField).toBeEditable();

  const complementary = page.getByRole('complementary');
  const infoPanel = (await complementary.count()) > 0 ? complementary.first() : page;
  if ((await complementary.count()) > 0) {
    await expect(infoPanel).toBeVisible();
  }

  const measureButton = page.getByRole('button', { name: /measure/i });
  if ((await measureButton.count()) > 0) {
    await expect(measureButton.first()).toHaveAttribute('aria-pressed', 'false');
  }

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const geocoderResponsePromise = page.waitForResponse((response) => {
    const url = decodeURIComponent(response.url()).toLowerCase();
    const type = response.request().resourceType();
    return response.ok() && (type === 'fetch' || type === 'xhr') && url.includes('münster');
  });

  await searchField.click();
  await searchField.fill('Münster');
  await geocoderResponsePromise;

  let resultList = page.getByRole('listbox');
  await expect(resultList).toBeVisible();

  let firstResult = resultList.getByRole('option').first();
  if ((await firstResult.count()) === 0) {
    firstResult = resultList.getByRole('button').first();
  }
  if ((await firstResult.count()) === 0) {
    firstResult = resultList.getByRole('listitem').first();
  }

  await expect(firstResult).toBeVisible();

  const selectedLocation = ((await firstResult.textContent()) ?? '').trim();
  expect(selectedLocation).not.toBe('');

  const forecastRequestUrls: string[] = [];
  page.on('request', (request) => {
    const url = request.url().toLowerCase();
    const type = request.resourceType();
    if ((type === 'fetch' || type === 'xhr') && url.includes('forecast')) {
      forecastRequestUrls.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse((response) => {
    const url = response.url().toLowerCase();
    const type = response.request().resourceType();
    return response.ok() && (type === 'fetch' || type === 'xhr') && url.includes('forecast');
  });

  await firstResult.click();
  await expect(resultList).toBeHidden();
  await expect(searchField).toHaveValue(/münster/i);

  await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(0);
  await forecastResponsePromise;

  const forecastHeading = infoPanel.getByRole('heading', { name: /weather forecast/i });
  await expect(forecastHeading).toBeVisible();

  let forecastContainer = infoPanel.getByRole('region').filter({
    has: infoPanel.getByRole('heading', { name: /weather forecast/i })
  }).first();

  if ((await forecastContainer.count()) === 0) {
    forecastContainer = infoPanel;
  }

  await expect.poll(async () => {
    const listItemCount = await forecastContainer.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }
    return await forecastContainer.getByText(/\b\d{1,2}:\d{2}\b/).count();
  }).toBe(24);
});
