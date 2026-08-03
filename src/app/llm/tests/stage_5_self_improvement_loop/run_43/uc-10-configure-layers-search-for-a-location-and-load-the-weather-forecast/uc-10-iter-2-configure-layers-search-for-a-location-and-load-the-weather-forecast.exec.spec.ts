// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
  getHighlightedCoordinate,
  getMapCenter,
  isLayerRendered,
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const forecastHint = weatherForecastSection.getByText('Click on the map to load a forecast.', {
    exact: true,
  });

  await expect(mapContainer).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(forecastHint).toBeVisible();

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
  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

  const initialCenter = await getMapCenter(page);
  if (!initialCenter) {
    throw new Error('Initial map center was not available after the map became ready.');
  }

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  const searchTerm = 'Münster';
  await geocoderInput.click();
  await geocoderInput.fill('');
  await geocoderInput.pressSequentially(searchTerm);
  await expect(geocoderInput).toHaveValue(searchTerm);

  const geocoderOptions = page.getByRole('option');
  const geocoderListItems = geocoderPanel.getByRole('listitem');

  await expect
    .poll(
      async () => {
        if ((await geocoderOptions.count()) > 0) {
          return 'option';
        }
        if ((await geocoderListItems.count()) > 0) {
          return 'listitem';
        }
        return '';
      },
      { timeout: 15000 }
    )
    .not.toBe('');

  if ((await geocoderOptions.count()) > 0) {
    const firstOption = geocoderOptions.first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();
  } else {
    const firstResult = geocoderListItems.first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();
  }

  await expect.poll(() => getHighlightedCoordinate(page), { timeout: 20000 }).not.toBeUndefined();

  await expect
    .poll(
      async () => {
        const center = await getMapCenter(page);
        const highlight = await getHighlightedCoordinate(page);
        if (!center || !highlight) {
          return false;
        }

        const distanceFromInitial = Math.hypot(
          center[0] - initialCenter[0],
          center[1] - initialCenter[1]
        );
        const distanceToHighlight = Math.hypot(center[0] - highlight[0], center[1] - highlight[1]);

        return distanceFromInitial > 100000 && distanceToHighlight < 20000;
      },
      { timeout: 20000 }
    )
    .toBe(true);

  if (await forecastHint.isVisible()) {
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
  }

  await expect(forecastHint).toBeHidden();

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
