// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderInputContainer = page.getByTestId('geocoder-input');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const measurementToggle = page.getByTestId('measurement-toggle');
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const temperatureLegend = page.getByTestId('temperature-legend');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const scaleViewer = page.getByTestId('scale-viewer');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInputContainer).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(measurementToggle).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect(temperatureLegend).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
  expect(initialScaleText).not.toBe('');

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect(temperatureLegend).not.toBeVisible();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect(geocoderPanel).toBeVisible();
  const firstGeocoderResult = geocoderPanel.getByText(/Münster/i).first();
  await expect(firstGeocoderResult).toBeVisible();
  await firstGeocoderResult.click();

  await expect.poll(async () => {
    return ((await scaleViewer.textContent()) ?? '').trim() !== initialScaleText;
  }).toBe(true);

  await expect(infoPanel.getByText('Click on the map to load a forecast.')).not.toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    const rowCount = Math.max(0, (await weatherForecastSection.getByRole('row').count()) - 1);
    const imageCount = await weatherForecastSection.getByRole('img').count();
    const buttonCount = await weatherForecastSection.getByRole('button').count();
    const articleCount = await weatherForecastSection.locator('article').count();

    return [listItemCount, rowCount, imageCount, buttonCount, articleCount].includes(24);
  }).toBe(true);
});
