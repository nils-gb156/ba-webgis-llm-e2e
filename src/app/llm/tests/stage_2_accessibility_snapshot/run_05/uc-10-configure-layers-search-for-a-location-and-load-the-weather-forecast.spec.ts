// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const matchesMunster = (value: string) => {
    const normalized = decodeURIComponent(value).toLowerCase();
    return normalized.includes('münster') || normalized.includes('munster') || normalized.includes('muenster');
  };

  const findArrayOf24 = (value: unknown): number | undefined => {
    if (Array.isArray(value)) {
      if (value.length === 24) {
        return value.length;
      }

      for (const item of value) {
        const nested = findArrayOf24(item);
        if (nested !== undefined) {
          return nested;
        }
      }

      return undefined;
    }

    if (value && typeof value === 'object') {
      for (const nestedValue of Object.values(value as Record<string, unknown>)) {
        const nested = findArrayOf24(nestedValue);
        if (nested !== undefined) {
          return nested;
        }
      }
    }

    return undefined;
  };

  const findFirstSearchResult = async (): Promise<any> => {
    const namePattern = /m(?:ü|u|ue)nster/i;

    const option = page.getByRole('option').filter({ hasText: namePattern }).first();
    if (await option.count()) {
      return option;
    }

    const listItem = page.getByRole('listitem').filter({ hasText: namePattern }).first();
    if (await listItem.count()) {
      return listItem;
    }

    const button = page.getByRole('button', { name: namePattern }).first();
    if (await button.count()) {
      return button;
    }

    const text = page.getByText(namePattern).first();
    if (await text.count()) {
      return text;
    }

    return null;
  };

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');

  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const temperatureLayerToggle = layerSwitcher.getByRole('checkbox', {
    name: 'Temperature',
    exact: true
  });
  const precipitationLayerToggle = layerSwitcher.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true
  });

  await expect(temperatureLayerToggle).toBeChecked();
  await expect(precipitationLayerToggle).not.toBeChecked();

  const initialCoordinateText =
    (await coordinateViewer.count()) > 0 ? ((await coordinateViewer.textContent()) ?? '').trim() : '';

  await temperatureLayerToggle.click({ force: true });
  await expect(temperatureLayerToggle).not.toBeChecked();

  await precipitationLayerToggle.click({ force: true });
  await expect(precipitationLayerToggle).toBeChecked();

  const capturedRequestUrls: string[] = [];
  page.on('request', request => {
    capturedRequestUrls.push(request.url());
  });

  let forecastEntryCountFromResponse: number | undefined;
  const forecastResponsePromise = page.waitForResponse(async response => {
    if (!response.ok()) {
      return false;
    }

    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      return false;
    }

    try {
      const json = await response.json();
      const entryCount = findArrayOf24(json);
      if (entryCount === 24) {
        forecastEntryCountFromResponse = entryCount;
        return true;
      }
    } catch {
      return false;
    }

    return false;
  });

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect.poll(() => capturedRequestUrls.some(url => matchesMunster(url))).toBe(true);

  await expect.poll(async () => {
    const firstSearchResult = await findFirstSearchResult();
    return firstSearchResult ? 'found' : '';
  }).toBe('found');

  const firstSearchResult = await findFirstSearchResult();
  await expect(firstSearchResult).toBeVisible();
  await firstSearchResult.click();

  await expect(geocoderInput).toHaveValue(/m(?:ü|u|ue)nster/i);

  await forecastResponsePromise;
  expect(forecastEntryCountFromResponse).toBe(24);

  if (initialCoordinateText) {
    await expect.poll(async () => ((await coordinateViewer.textContent()) ?? '').trim()).not.toBe(initialCoordinateText);
  }

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate(element =>
      Array.from(element.children).filter(child => (child.textContent ?? '').trim().length > 0).length
    );
  }).toBe(24);

  await expect(page.getByText('Click on the map to load a forecast.')).not.toBeVisible();
});
