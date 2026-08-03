// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const mapContainer = page.getByTestId('map-container');

  await expect(mapContainer).toBeVisible();
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const uvIndexStationsCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  const eucosGroundStationsCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });

  if (!(await uvIndexStationsCheckbox.isChecked())) {
    await uvIndexStationsCheckbox.click({ force: true });
  }
  if (!(await eucosGroundStationsCheckbox.isChecked())) {
    await eucosGroundStationsCheckbox.click({ force: true });
  }

  await expect(uvIndexStationsCheckbox).toBeChecked();
  await expect(eucosGroundStationsCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  const clickPosition = await expect
    .poll(async () => {
      return await page.evaluate((coordinate) => {
        const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (c: [number, number]) => number[] | undefined } } }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        if (!Array.isArray(pixel) || pixel.length < 2) {
          return undefined;
        }
        return {
          x: Math.round(pixel[0]),
          y: Math.round(pixel[1])
        };
      }, targetCoordinate);
    })
    .toBeTruthy();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  expect(clickPosition).toBeTruthy();
  expect(clickPosition!.x).toBeGreaterThan(0);
  expect(clickPosition!.y).toBeGreaterThan(0);
  expect(clickPosition!.x).toBeLessThan(mapBox!.width);
  expect(clickPosition!.y).toBeLessThan(mapBox!.height);

  const requestedUrls: string[] = [];
  page.on('request', (request) => {
    requestedUrls.push(request.url());
  });

  const getFeatureInfoResponsePromise = page.waitForResponse((response) => {
    return response.ok() && /getfeatureinfo/i.test(response.url());
  });

  await mapContainer.click({
    position: {
      x: clickPosition!.x,
      y: clickPosition!.y
    }
  });

  await getFeatureInfoResponsePromise;
  await expect.poll(() => requestedUrls.some((url) => /getfeatureinfo/i.test(url))).toBe(true);

  await expect.poll(async () => {
    const highlight = await getHighlightedCoordinate(page);
    return highlight
      ? Math.hypot(highlight[0] - targetCoordinate[0], highlight[1] - targetCoordinate[1])
      : Number.POSITIVE_INFINITY;
  }).toBeLessThan(500);

  await expect(infoPanel.getByTestId('uvi-station-section')).toBeVisible();
  await expect(infoPanel.getByTestId('uvi-station-info')).toBeVisible();

  await expect.poll(async () => {
    const text = ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    return text;
  }, { timeout: 15000 }).toMatch(/UV-Index Station.{0,300}(?:Identifier|Name|Country)/i);

  await expect.poll(async () => {
    const text = ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    return text;
  }, { timeout: 15000 }).toMatch(/EUCOS Ground Stations?.{0,300}(?:Type|Name|Country|Identifier|WMO|ICAO)/i);
});
