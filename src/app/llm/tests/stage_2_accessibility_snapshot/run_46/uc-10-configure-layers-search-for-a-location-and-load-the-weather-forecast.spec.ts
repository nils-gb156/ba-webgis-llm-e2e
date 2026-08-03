// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = geocoderPanel.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const measurementToggle = page.getByTestId('measurement-toggle');
  const scaleViewer = page.getByTestId('scale-viewer');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  const temperatureLayerToggle = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationLayerToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(measurementToggle).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await expect(temperatureLayerToggle).toBeChecked();
  await expect(precipitationLayerToggle).not.toBeChecked();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
  expect(initialScaleText).not.toBe('');

  await temperatureLayerToggle.click({ force: true });
  await expect(temperatureLayerToggle).not.toBeChecked();

  await precipitationLayerToggle.click({ force: true });
  await expect(precipitationLayerToggle).toBeChecked();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const firstSearchResult = page.getByRole('option').first();
  await expect(firstSearchResult).toBeVisible();

  await firstSearchResult.click();

  await expect.poll(async () => ((await scaleViewer.textContent()) ?? '').trim()).not.toBe(initialScaleText);

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  const getForecastEntryCount = async (): Promise<number> => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await weatherForecastSection.getByRole('row').count();
    if (rowCount > 1) {
      return rowCount - 1;
    }

    const liCount = await weatherForecastSection.locator('li').count();
    if (liCount > 0) {
      return liCount;
    }

    const trCount = await weatherForecastSection.locator('tr').count();
    if (trCount > 1) {
      return trCount - 1;
    }

    return 0;
  };

  await expect.poll(getForecastEntryCount).toBe(24);
});
