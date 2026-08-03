// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const forecastSection = page.getByTestId('weather-forecast-section');
  const forecastHeading = forecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true });
  const initialForecastHint = forecastSection.getByText('Click on the map to load a forecast.', { exact: true });
  const mapContainer = page.getByTestId('map-container');

  await expect(infoPanelToggle).toBeVisible();
  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }

  await expect(infoPanel).toBeVisible();
  await expect(forecastSection).toBeVisible();
  await expect(forecastHeading).toBeVisible();
  await expect(initialForecastHint).toBeVisible();
  await expect(mapContainer).toBeVisible();

  await mapContainer.click({ position: { x: 700, y: 300 } });

  await expect.poll(async () => {
    const coordinate = await getHighlightedCoordinate(page);
    return Array.isArray(coordinate) ? coordinate.length : 0;
  }).toBe(2);

  await expect(forecastSection).toBeVisible();
  await expect(forecastHeading).toBeVisible();
  await expect(initialForecastHint).toBeHidden();

  const countForecastEntries = async (): Promise<number> => {
    const listItems = await forecastSection.getByRole('listitem').count();
    if (listItems > 0) {
      return listItems;
    }

    const bodyRows = await forecastSection.locator('tbody tr').count();
    if (bodyRows > 0) {
      return bodyRows;
    }

    const rows = await forecastSection.getByRole('row').count();
    if (rows > 1) {
      return rows - 1;
    }

    const listElements = await forecastSection.locator('li').count();
    if (listElements > 0) {
      return listElements;
    }

    const text = await forecastSection.textContent();
    return (text?.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length;
  };

  await expect.poll(countForecastEntries).toBe(24);
});
