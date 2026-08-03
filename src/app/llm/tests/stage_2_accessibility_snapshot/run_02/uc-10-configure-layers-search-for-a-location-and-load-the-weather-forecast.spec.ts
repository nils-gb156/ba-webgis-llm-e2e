// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
  expect(measurementPressed === null || measurementPressed === 'false').toBeTruthy();

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect.poll(async () => {
    const optionCount = await page.getByRole('option').count();
    const buttonCount = await page.getByRole('button', { name: /Münster/i }).count();
    const linkCount = await page.getByRole('link', { name: /Münster/i }).count();
    return optionCount + buttonCount + linkCount;
  }).toBeGreaterThan(0);

  if ((await page.getByRole('option').count()) > 0) {
    const firstResult = page.getByRole('option').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();
  } else if ((await page.getByRole('button', { name: /Münster/i }).count()) > 0) {
    const firstResult = page.getByRole('button', { name: /Münster/i }).first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();
  } else if ((await page.getByRole('link', { name: /Münster/i }).count()) > 0) {
    const firstResult = page.getByRole('link', { name: /Münster/i }).first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();
  } else {
    await geocoderInput.press('ArrowDown');
    await geocoderInput.press('Enter');
  }

  await expect(geocoderInput).toHaveValue(/Münster/i);

  await expect.poll(async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await weatherForecastSection.getByRole('row').count();
    if (rowCount > 0) {
      return rowCount;
    }

    const articleCount = await weatherForecastSection.locator('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    return 0;
  }).toBe(24);
});
