// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const measurementToggle = page.getByTestId('measurement-toggle');
  const temperatureLayerToggle = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationLayerToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const scaleViewer = page.getByTestId('scale-viewer');
  const coordinateViewer = page.getByTestId('coordinate-viewer');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(temperatureLayerToggle).toBeChecked();
  await expect(precipitationLayerToggle).not.toBeChecked();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await temperatureLayerToggle.click({ force: true });
  await expect(temperatureLayerToggle).not.toBeChecked();

  await precipitationLayerToggle.click({ force: true });
  await expect(precipitationLayerToggle).toBeChecked();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const firstSearchResult = page.getByRole('option').first();
  await expect(firstSearchResult).toBeVisible();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
  const initialCoordinateText = ((await coordinateViewer.textContent()) ?? '').trim();

  await firstSearchResult.click();

  await expect(geocoderInput).toHaveValue(/Münster/i);

  await expect.poll(async () => {
    const currentScaleText = ((await scaleViewer.textContent()) ?? '').trim();
    const currentCoordinateText = ((await coordinateViewer.textContent()) ?? '').trim();

    return currentScaleText !== initialScaleText || currentCoordinateText !== initialCoordinateText;
  }).toBe(true);

  await expect(weatherForecastSection).toBeVisible();
  await expect(infoPanel.getByText('Click on the map to load a forecast.')).not.toBeVisible();

  await expect.poll(async () => {
    return await weatherForecastSection.getByRole('listitem').count();
  }).toBe(24);
});
