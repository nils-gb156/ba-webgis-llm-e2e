// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const findArrayOfLength = (value: unknown, targetLength: number): number | undefined => {
    if (Array.isArray(value)) {
      if (value.length === targetLength) {
        return value.length;
      }
      for (const item of value) {
        const found = findArrayOfLength(item, targetLength);
        if (found !== undefined) {
          return found;
        }
      }
      return undefined;
    }

    if (value !== null && typeof value === 'object') {
      for (const child of Object.values(value as Record<string, unknown>)) {
        const found = findArrayOfLength(child, targetLength);
        if (found !== undefined) {
          return found;
        }
      }
    }

    return undefined;
  };

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = geocoderPanel.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const forecastInstruction = weatherForecastSection.getByText('Click on the map to load a forecast.');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const scaleViewer = page.getByTestId('scale-viewer');
  const mapContainer = page.getByTestId('map-container');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(forecastInstruction).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(scaleViewer).toBeVisible();
  await expect(mapContainer).toBeVisible();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
  expect(initialScaleText).not.toBe('');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  let geocoderRequestSent = false;
  page.on('request', (request) => {
    const requestPayload = `${request.url()} ${request.postData() ?? ''}`.toLowerCase();
    if (requestPayload.includes('münster') || requestPayload.includes('m%c3%bcnster')) {
      geocoderRequestSent = true;
    }
  });

  const mapRequestsAfterSearch: string[] = [];
  page.on('request', (request) => {
    const url = request.url().toLowerCase();
    if (
      request.resourceType() === 'image' ||
      url.includes('bbox=') ||
      url.includes('tile') ||
      url.includes('wms') ||
      url.includes('wmts')
    ) {
      mapRequestsAfterSearch.push(request.url());
    }
  });

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect.poll(() => geocoderRequestSent).toBe(true);

  const firstSearchResult = page.getByRole('option').filter({ hasText: /münster/i }).first();
  await expect(firstSearchResult).toBeVisible();

  mapRequestsAfterSearch.length = 0;
  await firstSearchResult.click();

  await expect(firstSearchResult).toBeHidden();
  await expect(geocoderInput).toHaveValue(/münster/i);

  await expect.poll(async () => {
    const currentScaleText = ((await scaleViewer.textContent()) ?? '').trim();
    return currentScaleText !== initialScaleText || mapRequestsAfterSearch.length > 0;
  }).toBe(true);

  let forecastEntryCount: number | undefined;
  page.on('response', (response) => {
    void (async () => {
      if (!response.ok()) {
        return;
      }

      const contentType = (response.headers()['content-type'] ?? '').toLowerCase();
      if (!contentType.includes('json')) {
        return;
      }

      const data = await response.json().catch(() => undefined);
      const found = findArrayOfLength(data, 24);
      if (found === 24) {
        forecastEntryCount = found;
      }
    })();
  });

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: mapBox.width / 2,
      y: mapBox.height / 2
    }
  });

  await expect(forecastInstruction).toBeHidden();
  await expect.poll(() => forecastEntryCount).toBe(24);

  await expect(temperatureCheckbox).not.toBeChecked();
  await expect(precipitationCheckbox).toBeChecked();
});
