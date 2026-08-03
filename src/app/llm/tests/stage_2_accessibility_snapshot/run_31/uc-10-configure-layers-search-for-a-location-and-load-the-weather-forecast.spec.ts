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
  const scaleViewer = page.getByTestId('scale-viewer');
  const forecastPlaceholder = infoPanel.getByText('Click on the map to load a forecast.');
  const temperatureLayerToggle = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationLayerToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(scaleViewer).toContainText(/Current scale:/);
  await expect(temperatureLayerToggle).toBeChecked();
  await expect(precipitationLayerToggle).not.toBeChecked();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(forecastPlaceholder).toBeVisible();

  await temperatureLayerToggle.click({ force: true });
  await expect(temperatureLayerToggle).not.toBeChecked();

  await precipitationLayerToggle.click({ force: true });
  await expect(precipitationLayerToggle).toBeChecked();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect(geocoderPanel).toContainText(/Münster/i);

  let firstSearchResult = geocoderPanel.getByRole('option', { name: /Münster/i }).first();
  if ((await firstSearchResult.count()) === 0) {
    firstSearchResult = geocoderPanel.getByRole('button', { name: /Münster/i }).first();
  }
  if ((await firstSearchResult.count()) === 0) {
    firstSearchResult = geocoderPanel.getByRole('link', { name: /Münster/i }).first();
  }
  if ((await firstSearchResult.count()) === 0) {
    firstSearchResult = geocoderPanel.getByRole('listitem').filter({ hasText: /Münster/i }).first();
  }
  if ((await firstSearchResult.count()) === 0) {
    firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
  }

  await expect(firstSearchResult).toBeVisible();
  await firstSearchResult.click();

  await expect.poll(async () => ((await scaleViewer.textContent()) ?? '').trim()).not.toBe(initialScaleText);
  await expect(forecastPlaceholder).not.toBeVisible();

  await expect.poll(async () => {
    return [
      await weatherForecastSection.getByRole('listitem').count(),
      await weatherForecastSection.getByRole('row').count(),
      await weatherForecastSection.getByRole('button').count(),
      await weatherForecastSection.getByRole('img').count(),
      await weatherForecastSection.locator('img').count(),
    ];
  }).toContain(24);

  await expect(precipitationLayerToggle).toBeChecked();
  await expect(temperatureLayerToggle).not.toBeChecked();
});
