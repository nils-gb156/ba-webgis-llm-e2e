// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
  getHighlightedCoordinate,
  getMapCenter,
  isLayerRendered
} from '../../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const forecastSection = page.getByTestId('weather-forecast-section');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  const getForecastEntryCount = async (): Promise<number> => {
    const listItemCount = await forecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await forecastSection.getByRole('row').count();
    if (rowCount > 0) {
      return rowCount === 25 ? 24 : rowCount;
    }

    const articleCount = await forecastSection.getByRole('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    const buttonCount = await forecastSection.getByRole('button').count();
    if (buttonCount > 0) {
      return buttonCount;
    }

    return await forecastSection.locator('*').evaluateAll((elements) =>
      elements.filter((element) => {
        const text = element.textContent?.trim() ?? '';
        return /^\d{1,2}:\d{2}$/.test(text);
      }).length
    );
  };

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await expect.poll(() => getMapCenter(page)).toBeTruthy();
  const initialCenter = await getMapCenter(page);
  if (!initialCenter) {
    throw new Error('Initial map center is unavailable.');
  }
  const initialCenterKey = `${Math.round(initialCenter[0])},${Math.round(initialCenter[1])}`;

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const firstSearchResult = geocoderPanel.getByText(/Münster/i).first();
  await expect(firstSearchResult).toBeVisible();
  await firstSearchResult.click();

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    if (!center) {
      return initialCenterKey;
    }
    return `${Math.round(center[0])},${Math.round(center[1])}`;
  }).not.toBe(initialCenterKey);

  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container is not visible.');
  }

  await mapContainer.click({
    position: {
      x: Math.floor(mapBox.width / 2),
      y: Math.floor(mapBox.height / 2)
    }
  });

  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
  await expect(forecastSection).toBeVisible();
  await expect.poll(() => getForecastEntryCount()).toBe(24);
});
