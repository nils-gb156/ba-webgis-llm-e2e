// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
  getMapCenter,
  getHighlightedCoordinate,
  isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  const temperatureLegend = page.getByTestId('temperature-legend');
  const precipitationLegend = page.getByTestId('precipitation-legend');
  const placeholderText = infoPanel.getByText('Click on the map to load a forecast.', { exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(geocoderInput).toBeEnabled();
  await expect(weatherForecastSection).toBeVisible();
  await expect(measurementToggle).toBeVisible();
  await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect(temperatureLegend).toBeVisible();
  await expect(precipitationLegend).toBeHidden();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await expect.poll(() => getMapCenter(page), { timeout: 20000 }).not.toBeUndefined();
  const centerBeforeSearch = await getMapCenter(page);
  if (!centerBeforeSearch) {
    throw new Error('Map center was not available before the geocoder interaction.');
  }

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 20000 }).toBe(false);
  await expect(temperatureLegend).toBeHidden();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 20000 }).toBe(true);
  await expect(precipitationLegend).toBeVisible();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const geocoderResults = page.getByTestId('geocoder-results');
  const firstSearchResult = page.getByTestId('geocoder-result-item-0');

  await expect(geocoderResults).toBeVisible({ timeout: 10000 });
  await expect(firstSearchResult).toBeVisible({ timeout: 10000 });
  await expect(firstSearchResult).toContainText(/m[üu]nster/i);

  await firstSearchResult.click();

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    if (!center) {
      return false;
    }
    return center[0] !== centerBeforeSearch[0] || center[1] !== centerBeforeSearch[1];
  }, { timeout: 20000 }).toBe(true);

  await expect.poll(() => getHighlightedCoordinate(page), { timeout: 20000 }).not.toBeUndefined();

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    const highlight = await getHighlightedCoordinate(page);
    if (!center || !highlight) {
      return false;
    }
    return Math.abs(center[0] - highlight[0]) < 50000 && Math.abs(center[1] - highlight[1]) < 50000;
  }, { timeout: 20000 }).toBe(true);

  await expect(weatherForecastSection).toBeVisible();
  await expect(placeholderText).toBeHidden({ timeout: 30000 });
  await expect(infoPanel.getByText(/Location:\s*Münster/i)).toBeVisible({ timeout: 30000 });

  const weatherForecast = page.getByTestId('weather-forecast');
  const forecastEntries = page.getByTestId('weather-forecast-entry');

  await expect(weatherForecast).toBeVisible({ timeout: 30000 });
  await expect(forecastEntries).toHaveCount(24, { timeout: 30000 });
});
