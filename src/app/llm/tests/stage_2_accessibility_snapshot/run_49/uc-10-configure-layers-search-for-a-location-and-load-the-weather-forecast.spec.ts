// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const forecastSection = page.getByTestId('weather-forecast-section');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const measurementToggle = page.getByTestId('measurement-toggle');
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const temperatureLegend = page.getByTestId('temperature-legend');
  const scaleViewer = page.getByTestId('scale-viewer');
  const coordinateViewer = page.getByTestId('coordinate-viewer');

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(forecastSection).toBeVisible();
  await expect(forecastSection).toContainText('Click on the map to load a forecast.');
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();
  await expect(temperatureLegend).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();
  await expect(temperatureLegend).not.toBeVisible();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const initialScaleText = (await scaleViewer.innerText()).trim();
  const hasCoordinateViewer = (await coordinateViewer.count()) > 0;
  const initialCoordinateText = hasCoordinateViewer
    ? (((await coordinateViewer.textContent()) ?? '').trim())
    : '';

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const firstResult = geocoderPanel.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  await firstResult.click();

  await expect.poll(async () => {
    const currentScaleText = (await scaleViewer.innerText()).trim();
    const currentCoordinateText = hasCoordinateViewer
      ? (((await coordinateViewer.textContent()) ?? '').trim())
      : initialCoordinateText;
    return currentScaleText !== initialScaleText || currentCoordinateText !== initialCoordinateText;
  }).toBe(true);

  await expect(forecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    return [
      await forecastSection.getByRole('listitem').count(),
      await forecastSection.getByRole('row').count(),
      await forecastSection.getByRole('img').count()
    ];
  }).toContain(24);
});
