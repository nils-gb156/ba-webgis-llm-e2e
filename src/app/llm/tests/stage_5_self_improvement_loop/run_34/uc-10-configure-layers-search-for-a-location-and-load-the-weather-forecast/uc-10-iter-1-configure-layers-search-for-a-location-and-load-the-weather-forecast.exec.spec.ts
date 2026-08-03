// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  const measurementToggle = page.getByTestId('measurement-toggle');
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const geocoderInput = page.getByTestId('geocoder-input');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderInput).toBeVisible();
  await expect(geocoderPanel).toBeVisible();

  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  let initialCenter: [number, number] | undefined;
  await expect
    .poll(async () => {
      initialCenter = await getMapCenter(page);
      return initialCenter;
    })
    .not.toBeUndefined();

  const geocodeResponsePromise = page.waitForResponse(
    (response) => {
      const url = decodeURIComponent(response.url()).toLowerCase();
      return response.ok() && (url.includes('münster') || url.includes('munster'));
    },
    { timeout: 15000 }
  );

  await geocoderInput.click();
  await geocoderInput.fill('Münster');
  await geocodeResponsePromise;

  await expect(geocoderPanel.getByText(/münster/i).first()).toBeVisible({ timeout: 15000 });

  const optionResults = geocoderPanel.getByRole('option', { name: /münster/i });
  const buttonResults = geocoderPanel.getByRole('button', { name: /münster/i });
  const listItemResults = geocoderPanel.getByRole('listitem').filter({ hasText: /münster/i });

  if ((await optionResults.count()) > 0) {
    await optionResults.first().click();
  } else if ((await buttonResults.count()) > 0) {
    await buttonResults.first().click();
  } else if ((await listItemResults.count()) > 0) {
    await listItemResults.first().click();
  } else {
    await geocoderInput.click();
    await geocoderInput.press('ArrowDown');
    await geocoderInput.press('Enter');
  }

  await expect.poll(
    async () => {
      const currentCenter = await getMapCenter(page);
      if (!initialCenter || !currentCenter) {
        return 0;
      }

      return Math.hypot(currentCenter[0] - initialCenter[0], currentCenter[1] - initialCenter[1]);
    },
    { timeout: 20000 }
  ).toBeGreaterThan(5000);

  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();
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

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  const getForecastEntryCount = async () => {
    return await weatherForecastSection.evaluate((section) => {
      const isVisible = (element: Element) => {
        const style = window.getComputedStyle(element as HTMLElement);
        return style.display !== 'none' && style.visibility !== 'hidden';
      };

      const candidates = [section, ...Array.from(section.querySelectorAll('*'))];
      let maxVisibleChildren = 0;

      for (const candidate of candidates) {
        const visibleChildren = Array.from(candidate.children).filter(isVisible);
        if (visibleChildren.length === 0) {
          continue;
        }

        const informativeChildren = visibleChildren.filter((child) => {
          const text = child.textContent?.trim() ?? '';
          return text.length > 0 || child.querySelector('img, svg, canvas') !== null;
        });

        if (informativeChildren.length === visibleChildren.length) {
          maxVisibleChildren = Math.max(maxVisibleChildren, visibleChildren.length);
        }
      }

      return maxVisibleChildren;
    });
  };

  await expect.poll(getForecastEntryCount, { timeout: 30000 }).toBe(24);
});
