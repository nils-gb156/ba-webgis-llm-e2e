// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const scaleViewer = page.getByTestId('scale-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');

  const temperatureLayerToggle = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationLayerToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const geocoderSearch = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const emptyForecastMessage = weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(temperatureLayerToggle).toBeChecked();
  await expect(precipitationLayerToggle).not.toBeChecked();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderSearch).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(weatherForecastSection).toBeVisible();
  await expect(emptyForecastMessage).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  const initialScaleText = (await scaleViewer.innerText()).trim();

  await temperatureLayerToggle.click({ force: true });
  await expect(temperatureLayerToggle).not.toBeChecked();

  await precipitationLayerToggle.click({ force: true });
  await expect(precipitationLayerToggle).toBeChecked();

  await geocoderSearch.click();
  await geocoderSearch.fill('Münster');

  await expect.poll(async () => {
    const optionCount = await geocoderPanel.getByRole('option', { name: /münster/i }).count();
    if (optionCount > 0) return optionCount;

    const buttonCount = await geocoderPanel.getByRole('button', { name: /münster/i }).count();
    if (buttonCount > 0) return buttonCount;

    const linkCount = await geocoderPanel.getByRole('link', { name: /münster/i }).count();
    if (linkCount > 0) return linkCount;

    return await geocoderPanel.getByRole('listitem', { name: /münster/i }).count();
  }).toBeGreaterThan(0);

  let firstSearchResult = geocoderPanel.getByRole('option', { name: /münster/i }).first();
  if ((await geocoderPanel.getByRole('option', { name: /münster/i }).count()) === 0) {
    firstSearchResult = geocoderPanel.getByRole('button', { name: /münster/i }).first();
  }
  if ((await firstSearchResult.count()) === 0) {
    firstSearchResult = geocoderPanel.getByRole('link', { name: /münster/i }).first();
  }
  if ((await firstSearchResult.count()) === 0) {
    firstSearchResult = geocoderPanel.getByRole('listitem', { name: /münster/i }).first();
  }

  await expect(firstSearchResult).toBeVisible();
  await firstSearchResult.click();

  await expect.poll(async () => await geocoderSearch.inputValue()).toMatch(/münster/i);

  await expect.poll(async () => (await scaleViewer.innerText()).trim()).not.toBe(initialScaleText);

  await expect(emptyForecastMessage).not.toBeVisible();

  const countForecastEntries = async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const timeElementCount = await weatherForecastSection.locator('time').count();
    if (timeElementCount > 0) {
      return timeElementCount;
    }

    const rowCount = await weatherForecastSection.getByRole('row').count();
    if (rowCount > 0) {
      const headerCount = await weatherForecastSection.getByRole('columnheader').count();
      return headerCount > 0 ? rowCount - 1 : rowCount;
    }

    return 0;
  };

  await expect.poll(countForecastEntries).toBe(24);
});
