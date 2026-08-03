// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const scaleViewer = page.getByTestId('scale-viewer');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const operationalLayers = page.getByRole('list', { name: 'Operational layers' });
  const temperatureLayerToggle = operationalLayers.getByRole('checkbox', {
    name: 'Temperature',
    exact: true
  });
  const precipitationLayerToggle = operationalLayers.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });

  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  await expect(temperatureLayerToggle).toBeChecked();
  await expect(precipitationLayerToggle).not.toBeChecked();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
  await expect(scaleViewer).toBeVisible();
  expect(initialScaleText).not.toBe('');

  await temperatureLayerToggle.click({ force: true });
  await expect(temperatureLayerToggle).not.toBeChecked();

  await precipitationLayerToggle.click({ force: true });
  await expect(precipitationLayerToggle).toBeChecked();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');
  await expect(geocoderInput).toHaveValue('Münster');

  const optionResults = geocoderPanel.getByRole('option', { name: /Münster/i });
  const buttonResults = geocoderPanel.getByRole('button', { name: /Münster/i });
  const listItemResults = geocoderPanel.getByRole('listitem').filter({ hasText: /Münster/i });

  await expect
    .poll(async () => {
      return (
        (await optionResults.count()) +
        (await buttonResults.count()) +
        (await listItemResults.count())
      );
    })
    .toBeGreaterThan(0);

  let firstResult = optionResults.first();
  if ((await optionResults.count()) === 0) {
    if ((await buttonResults.count()) > 0) {
      firstResult = buttonResults.first();
    } else {
      firstResult = listItemResults.first();
    }
  }

  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(geocoderInput).toHaveValue(/Münster/i);
  await expect
    .poll(async () => ((await scaleViewer.textContent()) ?? '').trim())
    .not.toBe(initialScaleText);

  const emptyForecastMessage = weatherForecastSection.getByText('Click on the map to load a forecast.');
  await expect(emptyForecastMessage).not.toBeVisible();

  await expect
    .poll(async () => {
      const listItemCount = await weatherForecastSection.getByRole('listitem').count();
      const articleCount = await weatherForecastSection.getByRole('article').count();
      const rowCount = await weatherForecastSection.getByRole('row').count();

      return [listItemCount, articleCount, rowCount, Math.max(rowCount - 1, 0)];
    })
    .toContain(24);
});
