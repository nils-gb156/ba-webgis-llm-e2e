// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const temperatureLegend = page.getByTestId('temperature-legend');

  const temperatureLayerToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationLayerToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await expect(temperatureLayerToggle).toBeChecked();
  await expect(precipitationLayerToggle).not.toBeChecked();
  await expect(temperatureLegend).toBeVisible();

  await temperatureLayerToggle.click({ force: true });
  await expect(temperatureLayerToggle).not.toBeChecked();
  await expect(temperatureLegend).not.toBeVisible();

  await precipitationLayerToggle.click({ force: true });
  await expect(precipitationLayerToggle).toBeChecked();

  const geocoderResponsePromise = page.waitForResponse((response) => {
    if (!response.ok()) {
      return false;
    }

    let url = response.url();
    try {
      url = decodeURIComponent(url);
    } catch {
      // ignore malformed encodings
    }

    return url.toLowerCase().includes('münster');
  });

  await geocoderInput.click();
  await geocoderInput.fill('Münster');
  await geocoderResponsePromise;

  await expect(geocoderPanel).toBeVisible();

  await expect
    .poll(async () => {
      const optionCount = await geocoderPanel.getByRole('option').count();
      if (optionCount > 0) {
        return optionCount;
      }

      const listItemCount = await geocoderPanel.getByRole('listitem').count();
      if (listItemCount > 0) {
        return listItemCount;
      }

      return await geocoderPanel.getByText(/münster/i).count();
    })
    .toBeGreaterThan(0);

  let firstSearchResult = geocoderPanel.getByRole('option').first();
  if ((await geocoderPanel.getByRole('option').count()) === 0) {
    if ((await geocoderPanel.getByRole('listitem').count()) > 0) {
      firstSearchResult = geocoderPanel.getByRole('listitem').first();
    } else {
      firstSearchResult = geocoderPanel.getByText(/münster/i).first();
    }
  }

  await expect(firstSearchResult).toBeVisible();
  await firstSearchResult.click();

  await page.waitForLoadState('networkidle');

  await expect(geocoderInput).toHaveValue(/münster/i);
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).not.toBeVisible();

  await expect
    .poll(async () => {
      const listItemCount = await weatherForecastSection.getByRole('listitem').count();
      if (listItemCount > 0) {
        return listItemCount;
      }

      const rowCount = await weatherForecastSection.getByRole('row').count();
      if (rowCount > 0) {
        return rowCount === 25 ? 24 : rowCount;
      }

      const articleCount = await weatherForecastSection.getByRole('article').count();
      if (articleCount > 0) {
        return articleCount;
      }

      return 0;
    })
    .toBe(24);
});
