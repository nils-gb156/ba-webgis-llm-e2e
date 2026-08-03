// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const geocoderInput = page.getByTestId('geocoder-input');
  const geocoderTextbox = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const measurementToggle = page.getByTestId('measurement-toggle');

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  const getGeocoderResultKind = async (): Promise<string> => {
    if ((await geocoderPanel.getByRole('option').count()) > 0) return 'option';
    if ((await geocoderPanel.getByRole('button').count()) > 0) return 'button';
    if ((await geocoderPanel.getByRole('link').count()) > 0) return 'link';
    if ((await geocoderPanel.getByRole('listitem').count()) > 0) return 'listitem';
    return '';
  };

  const getForecastEntryCount = async (): Promise<number> => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await weatherForecastSection.getByRole('row').count();
    if (rowCount > 0) {
      const headerCount = await weatherForecastSection.getByRole('columnheader').count();
      return headerCount > 0 ? rowCount - 1 : rowCount;
    }

    const articleCount = await weatherForecastSection.getByRole('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    const imageCount = await weatherForecastSection.getByRole('img').count();
    if (imageCount === 24) {
      return imageCount;
    }

    return 0;
  };

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');
  await expect(geocoderInput).toBeVisible();
  await expect(geocoderTextbox).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  await geocoderTextbox.click();
  await geocoderTextbox.fill('Münster');

  await expect(geocoderPanel).toBeVisible();
  await expect.poll(getGeocoderResultKind, { timeout: 15000 }).not.toBe('');

  const resultKind = await getGeocoderResultKind();
  let firstResult = geocoderPanel.getByRole('option').first();

  if (resultKind === 'button') {
    firstResult = geocoderPanel.getByRole('button').first();
  } else if (resultKind === 'link') {
    firstResult = geocoderPanel.getByRole('link').first();
  } else if (resultKind === 'listitem') {
    firstResult = geocoderPanel.getByRole('listitem').first();
  }

  await expect(firstResult).toBeVisible();

  const postSelectionRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/(forecast|weather|open-meteo|GetMap|GetTile|tile|wms|wmts|arcgis|png|jpg|jpeg)/i.test(url)) {
      postSelectionRequests.push(url);
    }
  });

  if (resultKind === 'listitem' && (await firstResult.getByRole('button').count()) > 0) {
    await firstResult.getByRole('button').first().click();
  } else if (resultKind === 'listitem' && (await firstResult.getByRole('link').count()) > 0) {
    await firstResult.getByRole('link').first().click();
  } else {
    await firstResult.click();
  }

  await expect.poll(() => postSelectionRequests.length, { timeout: 15000 }).toBeGreaterThan(0);
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
  await expect.poll(getForecastEntryCount, { timeout: 30000 }).toBe(24);
});
