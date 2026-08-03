// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getHighlightedCoordinate,
  getMapCenter,
  getMapZoomLevel,
  isLayerRendered,
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');

  if (!(await layerSwitcher.isVisible())) {
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

  await expect(mapContainer).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(
    weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true })
  ).toBeVisible();

  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => getMapCenter(page)).toBeDefined();

  const initialCenter = await getMapCenter(page);
  const initialZoom = await getMapZoomLevel(page);
  if (!initialCenter || initialZoom === undefined) {
    throw new Error('Map state was not available after the map became ready.');
  }

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'Temperature',
    exact: true,
  });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'Precipitation',
    exact: true,
  });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  const searchTerm = 'Münster';
  await geocoderInput.click();
  await geocoderInput.fill(searchTerm);
  await expect(geocoderInput).toHaveValue(searchTerm);

  await expect
    .poll(
      async () =>
        (await page.getByRole('option').count()) +
        (await geocoderPanel.getByRole('listitem').count()),
      { timeout: 15000 }
    )
    .toBeGreaterThan(0);

  if ((await page.getByRole('option').count()) > 0) {
    await geocoderInput.press('ArrowDown');
    await geocoderInput.press('Enter');
  } else {
    const firstResult = geocoderPanel.getByRole('listitem').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();
  }

  await expect.poll(() => getHighlightedCoordinate(page), { timeout: 20000 }).toBeDefined();

  await expect
    .poll(
      async () => {
        const center = await getMapCenter(page);
        const zoom = await getMapZoomLevel(page);
        const highlight = await getHighlightedCoordinate(page);
        if (!center || zoom === undefined || !highlight) {
          return false;
        }

        const distanceFromInitial = Math.hypot(
          center[0] - initialCenter[0],
          center[1] - initialCenter[1]
        );
        const distanceToHighlight = Math.hypot(
          center[0] - highlight[0],
          center[1] - highlight[1]
        );

        return distanceToHighlight < 10000 && (distanceFromInitial > 10000 || zoom > initialZoom);
      },
      { timeout: 20000 }
    )
    .toBe(true);

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width / 2),
      y: Math.round(mapBox.height / 2),
    },
  });

  await expect(
    weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true })
  ).toBeHidden();

  await expect
    .poll(
      async () =>
        await weatherForecastSection.evaluate((section) => {
          const root = section as HTMLElement;

          const isVisible = (element: Element) =>
            element instanceof HTMLElement && element.offsetParent !== null;

          const listItems = Array.from(root.querySelectorAll('[role="listitem"]')).filter(isVisible);
          if (listItems.length > 0) {
            return listItems.length;
          }

          const rows = Array.from(root.querySelectorAll('[role="row"]')).filter(isVisible);
          const dataRows = rows.filter(
            (row) => !row.querySelector('[role="columnheader"], [role="rowheader"]')
          );
          if (dataRows.length > 0) {
            return dataRows.length;
          }

          const candidateCounts = [root, ...Array.from(root.querySelectorAll('*'))]
            .map((element) => Array.from((element as HTMLElement).children).filter(isVisible).length)
            .filter((count) => count >= 20 && count <= 30);

          return candidateCounts.length > 0 ? Math.max(...candidateCounts) : 0;
        }),
      { timeout: 20000 }
    )
    .toBe(24);
});
