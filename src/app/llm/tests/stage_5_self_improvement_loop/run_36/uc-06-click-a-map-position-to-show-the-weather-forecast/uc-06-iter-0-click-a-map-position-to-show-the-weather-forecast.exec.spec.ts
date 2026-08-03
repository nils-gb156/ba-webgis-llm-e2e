// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
  getActiveBaseLayerTitle,
  getHighlightedCoordinate,
  getMapCenter,
  getMapZoomLevel,
} from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click();
  }

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(
    weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
  ).toBeVisible();
  await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
  await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

  let captureForecastResponses = false;
  let forecastEntryCountFromResponse: number | undefined;

  page.on('response', async (response) => {
    if (!captureForecastResponses || forecastEntryCountFromResponse === 24) {
      return;
    }

    const contentType =
      response.headers()['content-type'] ?? response.headers()['Content-Type'] ?? '';
    if (!contentType.toLowerCase().includes('json')) {
      return;
    }

    try {
      const body: unknown = await response.json();
      const record =
        typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
      const hourly =
        typeof record.hourly === 'object' && record.hourly !== null
          ? (record.hourly as Record<string, unknown>)
          : undefined;
      const properties =
        typeof record.properties === 'object' && record.properties !== null
          ? (record.properties as Record<string, unknown>)
          : undefined;

      const counts = [
        Array.isArray(body) ? body.length : undefined,
        Array.isArray(record.forecast) ? record.forecast.length : undefined,
        Array.isArray(record.entries) ? record.entries.length : undefined,
        Array.isArray(record.hourly) ? record.hourly.length : undefined,
        Array.isArray(hourly?.time) ? hourly.time.length : undefined,
        Array.isArray(record.timeseries) ? record.timeseries.length : undefined,
        Array.isArray(record.data) ? record.data.length : undefined,
        Array.isArray(properties?.timeseries) ? properties.timeseries.length : undefined,
      ].filter((count): count is number => typeof count === 'number');

      if (counts.includes(24)) {
        forecastEntryCountFromResponse = 24;
      }
    } catch {
      // Ignore non-JSON or non-forecast responses.
    }
  });

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  captureForecastResponses = true;
  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width * 0.45),
      y: Math.round(mapBox.height * 0.4),
    },
  });

  await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await weatherForecastSection.getByRole('row').count();
    if (rowCount > 0) {
      return rowCount === 25 ? 24 : rowCount;
    }

    return forecastEntryCountFromResponse ?? 0;
  }).toBe(24);
});
