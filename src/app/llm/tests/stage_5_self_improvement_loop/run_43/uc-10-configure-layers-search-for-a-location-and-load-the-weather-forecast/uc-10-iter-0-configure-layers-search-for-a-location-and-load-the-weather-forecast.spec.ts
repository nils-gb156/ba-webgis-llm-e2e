// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getMapCenter,
  getMapZoomLevel,
  isLayerRendered,
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInputContainer = page.getByTestId('geocoder-input');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInputContainer).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => getMapCenter(page)).toBeDefined();

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  const initialCenter = await getMapCenter(page);
  if (!initialCenter) {
    throw new Error('Map center was not available after the map became ready.');
  }

  const searchTerm = 'Münster';
  await geocoderInput.click();
  await geocoderInput.fill(searchTerm);

  let resultType = '';
  await expect
    .poll(async () => {
      if ((await geocoderPanel.getByRole('option').count()) > 0) {
        resultType = 'option';
        return true;
      }
      if ((await geocoderPanel.getByRole('listitem').count()) > 0) {
        resultType = 'listitem';
        return true;
      }
      if ((await geocoderPanel.getByRole('button').filter({ hasText: /\S/ }).count()) > 0) {
        resultType = 'button';
        return true;
      }
      if ((await geocoderPanel.getByRole('link').filter({ hasText: /\S/ }).count()) > 0) {
        resultType = 'link';
        return true;
      }
      return false;
    }, { timeout: 15000 })
    .toBe(true);

  let firstResult = geocoderPanel.getByRole('option').first();
  if (resultType === 'listitem') {
    const firstListItem = geocoderPanel.getByRole('listitem').first();
    if ((await firstListItem.getByRole('button').count()) > 0) {
      firstResult = firstListItem.getByRole('button').first();
    } else if ((await firstListItem.getByRole('link').count()) > 0) {
      firstResult = firstListItem.getByRole('link').first();
    } else {
      firstResult = firstListItem;
    }
  } else if (resultType === 'button') {
    firstResult = geocoderPanel.getByRole('button').filter({ hasText: /\S/ }).first();
  } else if (resultType === 'link') {
    firstResult = geocoderPanel.getByRole('link').filter({ hasText: /\S/ }).first();
  }

  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect
    .poll(async () => {
      const center = await getMapCenter(page);
      if (!center) {
        return false;
      }
      const dx = center[0] - initialCenter[0];
      const dy = center[1] - initialCenter[1];
      return Math.hypot(dx, dy) > 50000;
    }, { timeout: 20000 })
    .toBe(true);

  await expect(weatherForecastSection).toBeVisible();
  await expect
    .poll(
      async () =>
        weatherForecastSection.evaluate((section) => {
          const root = section as HTMLElement;
          const isVisible = (element: Element) =>
            element instanceof HTMLElement && element.offsetParent !== null;

          const listItems = Array.from(root.querySelectorAll('[role="listitem"]')).filter(isVisible);
          if (listItems.length > 0) {
            return listItems.length;
          }

          const rows = Array.from(root.querySelectorAll('[role="row"]')).filter(isVisible);
          if (rows.length > 0) {
            const headerRows = rows.filter((row) =>
              row.querySelector('[role="columnheader"], [role="rowheader"]')
            );
            return rows.length - headerRows.length;
          }

          let maxVisibleChildren = 0;
          const elements = [root, ...Array.from(root.querySelectorAll('*'))];
          for (const element of elements) {
            const visibleChildren = Array.from(element.children).filter(isVisible);
            maxVisibleChildren = Math.max(maxVisibleChildren, visibleChildren.length);
          }
          return maxVisibleChildren;
        }),
      { timeout: 20000 }
    )
    .toBe(24);
});
