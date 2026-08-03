// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  const mapContainer = page.getByTestId('map-container');
  const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const temperatureLegend = page.getByTestId('temperature-legend');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const scaleViewer = page.getByTestId('scale-viewer');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();
  await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) ?? 'false').toBe('false');

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();
  await expect(temperatureLegend).toBeVisible();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();
  await expect(temperatureLegend).toBeHidden();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
  expect(initialScaleText).not.toBe('');

  await geocoderInput.click();
  await geocoderInput.fill('Münster');
  await expect(geocoderInput).toHaveValue('Münster');

  const searchResults = geocoderPanel.getByText(/Münster/i);
  await expect.poll(async () => await searchResults.count()).toBeGreaterThan(0);

  await geocoderInput.press('ArrowDown');
  await geocoderInput.press('Enter');

  await page.waitForLoadState('networkidle');

  await expect.poll(async () => {
    const currentScaleText = ((await scaleViewer.textContent()) ?? '').trim();
    return currentScaleText !== '' && currentScaleText !== initialScaleText;
  }).toBe(true);

  await expect(weatherForecastSection).toBeVisible();
  await expect(infoPanel.getByText('Click on the map to load a forecast.')).toBeHidden();

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((section) => {
      const ariaListItems = section.querySelectorAll('[role="listitem"]').length;
      if (ariaListItems > 0) {
        return ariaListItems;
      }

      const listItems = section.querySelectorAll('li').length;
      if (listItems > 0) {
        return listItems;
      }

      const articles = section.querySelectorAll('article').length;
      if (articles > 0) {
        return articles;
      }

      const timeLabels = Array.from(section.querySelectorAll('*'))
        .map((element) => (element.textContent ?? '').trim())
        .filter((text) => /^\d{1,2}:\d{2}$/.test(text));

      return new Set(timeLabels).size;
    });
  }).toBe(24);
});
