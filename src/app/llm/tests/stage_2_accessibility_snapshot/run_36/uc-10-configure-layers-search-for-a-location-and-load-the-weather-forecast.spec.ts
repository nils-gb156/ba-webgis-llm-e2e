// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInputContainer = page.getByTestId('geocoder-input');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const measurementToggle = page.getByTestId('measurement-toggle');
  const mapContainer = page.getByTestId('map-container');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInputContainer).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

  const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect(geocoderPanel).toBeVisible();
  const firstResult = geocoderPanel.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const mapBeforeSelection = await mapContainer.screenshot();

  const requestsAfterSelection: string[] = [];
  page.on('request', (request) => {
    requestsAfterSelection.push(request.url());
  });

  await firstResult.click();

  await expect(geocoderInput).toHaveValue(/Münster/i);
  await expect.poll(() => requestsAfterSelection.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    const currentMapScreenshot = await mapContainer.screenshot();
    return !currentMapScreenshot.equals(mapBeforeSelection);
  }).toBe(true);

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((section) => {
      const withText = (elements: Iterable<Element>) =>
        Array.from(elements).filter((element) => (element.textContent ?? '').trim().length > 0);

      const list = section.querySelector('ul, ol, [role="list"]');
      if (list) {
        const items = withText(list.children);
        if (items.length > 0) {
          return items.length;
        }
      }

      const bodyRows = withText(section.querySelectorAll('tbody tr'));
      if (bodyRows.length > 0) {
        return bodyRows.length;
      }

      const semanticItems = withText(section.querySelectorAll('li, [role="listitem"], article, [role="row"]'));
      if (semanticItems.length > 0) {
        return semanticItems.length;
      }

      const directChildren = withText(
        Array.from(section.children).filter((element) => {
          const tag = element.tagName.toLowerCase();
          return !['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tag);
        })
      );
      if (directChildren.length > 0) {
        return directChildren.length;
      }

      const timeMatches = (section.textContent ?? '').match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) ?? [];
      return new Set(timeMatches).size;
    });
  }).toBe(24);
});
