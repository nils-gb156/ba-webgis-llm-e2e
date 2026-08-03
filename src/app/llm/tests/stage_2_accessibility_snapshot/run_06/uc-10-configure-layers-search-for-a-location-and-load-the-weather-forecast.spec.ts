// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const geocoderTextbox = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(geocoderTextbox).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');
  await expect(coordinateViewer).toBeVisible();
  await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) ?? 'false').not.toBe('true');

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  await geocoderTextbox.click();
  await geocoderTextbox.fill('Münster');

  const firstResult = geocoderPanel.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const coordinateBeforeSelection = ((await coordinateViewer.textContent()) ?? '').trim();

  await firstResult.click();
  await expect(geocoderTextbox).toHaveValue(/Münster/i);

  if (coordinateBeforeSelection.length > 0) {
    await expect.poll(async () => ((await coordinateViewer.textContent()) ?? '').trim()).not.toBe(
      coordinateBeforeSelection
    );
  }

  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
  await expect(weatherForecastSection.getByRole('listitem')).toHaveCount(24);
});
