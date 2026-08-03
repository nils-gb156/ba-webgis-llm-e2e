// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const geocoderInput = page.getByTestId('geocoder-input');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const scaleViewer = page.getByTestId('scale-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const temperatureLayerCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationLayerCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  const findForecastEntryCount = (value: unknown): number | undefined => {
    if (Array.isArray(value)) {
      if (
        value.length === 24 &&
        value.every(
          item =>
            item !== null &&
            (typeof item === 'object' || typeof item === 'string' || typeof item === 'number')
        )
      ) {
        return 24;
      }

      for (const item of value) {
        const nestedCount = findForecastEntryCount(item);
        if (nestedCount !== undefined) {
          return nestedCount;
        }
      }

      return undefined;
    }

    if (value && typeof value === 'object') {
      for (const nestedValue of Object.values(value as Record<string, unknown>)) {
        const nestedCount = findForecastEntryCount(nestedValue);
        if (nestedCount !== undefined) {
          return nestedCount;
        }
      }
    }

    return undefined;
  };

  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(geocoderInput).toBeVisible();
  await expect(scaleViewer).toBeVisible();
  await expect(scaleViewer).toContainText(/Current scale:/);
  await expect(temperatureLayerCheckbox).toBeChecked();
  await expect(precipitationLayerCheckbox).not.toBeChecked();
  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

  await temperatureLayerCheckbox.click({ force: true });
  await expect(temperatureLayerCheckbox).not.toBeChecked();

  await precipitationLayerCheckbox.click({ force: true });
  await expect(precipitationLayerCheckbox).toBeChecked();

  const scaleBeforeSelection = ((await scaleViewer.textContent()) ?? '').trim();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect(geocoderPanel).toBeVisible();

  const firstSearchResult = geocoderPanel
    .locator('[role="option"], [role="button"], li')
    .filter({ hasText: /\S/ })
    .first();

  await expect(firstSearchResult).toBeVisible();

  const firstSearchResultText = ((await firstSearchResult.textContent()) ?? '').trim();
  expect(firstSearchResultText.length).toBeGreaterThan(0);

  let forecastEntryCount: number | undefined;

  const forecastResponsePromise = page.waitForResponse(async response => {
    const contentType = response.headers()['content-type'] ?? '';
    if (!response.ok() || !contentType.toLowerCase().includes('json')) {
      return false;
    }

    try {
      const json = await response.json();
      const detectedCount = findForecastEntryCount(json);
      if (detectedCount === 24) {
        forecastEntryCount = detectedCount;
        return true;
      }
    } catch {
      return false;
    }

    return false;
  });

  await firstSearchResult.click();

  await expect(geocoderInput).toHaveValue(/Münster/i);

  await expect.poll(async () => ((await scaleViewer.textContent()) ?? '').trim()).not.toBe(scaleBeforeSelection);

  await forecastResponsePromise;
  expect(forecastEntryCount).toBe(24);

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
});
