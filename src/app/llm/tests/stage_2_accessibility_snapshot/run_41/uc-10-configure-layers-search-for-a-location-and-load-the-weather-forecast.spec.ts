// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const scaleViewer = page.getByTestId('scale-viewer');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(page.getByTestId('geocoder-input')).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(scaleViewer).toBeVisible();

  const temperatureLayerToggle = layerSwitcher.getByRole('checkbox', {
    name: 'Temperature',
    exact: true
  });
  const precipitationLayerToggle = layerSwitcher.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });

  await expect(temperatureLayerToggle).toBeChecked();
  await expect(precipitationLayerToggle).not.toBeChecked();

  await temperatureLayerToggle.click({ force: true });
  await expect(temperatureLayerToggle).not.toBeChecked();

  await precipitationLayerToggle.click({ force: true });
  await expect(precipitationLayerToggle).toBeChecked();

  const geocoderInput = page.getByRole('textbox', {
    name: 'Geocoder search',
    exact: true
  });

  await expect(geocoderInput).toBeVisible();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
  await expect(initialScaleText).not.toBe('');

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const firstGeocoderResult = geocoderPanel.getByText(/Münster/i).first();
  await expect(firstGeocoderResult).toBeVisible();
  await firstGeocoderResult.click();

  await expect.poll(async () => ((await scaleViewer.textContent()) ?? '').trim()).not.toBe(initialScaleText);

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toHaveCount(0);

  const forecastEntries = weatherForecastSection.locator('[role="listitem"], li, [role="row"], tr');
  await expect(forecastEntries).toHaveCount(24);
});
