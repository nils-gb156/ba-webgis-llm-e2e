// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');

  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  const uviLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

  const uviSection = page.getByTestId('uvi-station-section');
  const uviInfo = page.getByTestId('uvi-station-info');
  const eucosSection = page.getByTestId('eucos-station-section');
  const eucosInfo = page.getByTestId('eucos-station-info');

  const normalizeText = async (locator: ReturnType<typeof page.getByTestId>) =>
    ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();
  await expect.poll(() => infoPanelToggle.getAttribute('aria-pressed')).toBe('true');

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

  if (!(await eucosLayerCheckbox.isChecked())) {
    await eucosLayerCheckbox.click({ force: true });
  }
  if (!(await uviLayerCheckbox.isChecked())) {
    await uviLayerCheckbox.click({ force: true });
  }

  await expect(eucosLayerCheckbox).toBeChecked();
  await expect(uviLayerCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  await expect(uviSection).toBeHidden();
  await expect(eucosSection).toBeHidden();

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
  let clickPosition: { x: number; y: number } | undefined;

  await expect
    .poll(async () => {
      clickPosition = await page.evaluate((coordinate: [number, number]) => {
        const map = (globalThis as {
          __openPioneerMap?: {
            olMap?: {
              getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
              getSize?: () => number[] | undefined;
            };
          };
        }).__openPioneerMap;

        const olMap = map?.olMap;
        const pixel = olMap?.getPixelFromCoordinate?.(coordinate);
        const size = olMap?.getSize?.();

        if (!Array.isArray(pixel) || pixel.length < 2 || !Array.isArray(size) || size.length < 2) {
          return undefined;
        }

        const x = Math.round(pixel[0]);
        const y = Math.round(pixel[1]);
        const width = size[0];
        const height = size[1];

        if (x < 0 || y < 0 || x >= width || y >= height) {
          return undefined;
        }

        return { x, y };
      }, targetCoordinate);

      return clickPosition ? `${clickPosition.x},${clickPosition.y}` : undefined;
    })
    .toMatch(/^\d+,\d+$/);

  if (!clickPosition) {
    throw new Error('Could not resolve a clickable pixel for the target map coordinate.');
  }

  const featureInfoRequests: string[] = [];
  page.on('request', (request) => {
    if (/getfeatureinfo/i.test(request.url())) {
      featureInfoRequests.push(request.url());
    }
  });

  const featureInfoResponsePromise = page.waitForResponse(
    (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
  );

  await Promise.all([
    featureInfoResponsePromise,
    mapContainer.click({ position: clickPosition })
  ]);

  await expect.poll(() => featureInfoRequests.length).toBeGreaterThan(0);

  await expect
    .poll(async () => {
      const highlightedCoordinate = await getHighlightedCoordinate(page);
      if (!highlightedCoordinate) {
        return Number.POSITIVE_INFINITY;
      }

      return Math.hypot(
        highlightedCoordinate[0] - targetCoordinate[0],
        highlightedCoordinate[1] - targetCoordinate[1]
      );
    })
    .toBeLessThan(2000);

  await expect(uviSection).toBeVisible({ timeout: 15000 });
  await expect(eucosSection).toBeVisible({ timeout: 15000 });
  await expect(uviInfo).toBeVisible();
  await expect(eucosInfo).toBeVisible();

  await expect(
    uviSection.getByRole('heading', { name: 'UV-Index Station', exact: true })
  ).toBeVisible();
  await expect(
    eucosSection.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })
  ).toBeVisible();

  await expect.poll(() => normalizeText(uviInfo)).toMatch(/Identifier\s*\S+/i);
  await expect.poll(() => normalizeText(uviInfo)).toMatch(/Name\s*\S+/i);
  await expect.poll(() => normalizeText(uviInfo)).toMatch(/Country\s*\S+/i);

  await expect.poll(() => normalizeText(eucosInfo)).toMatch(/WMO Identifier\s*\S+/i);
  await expect.poll(() => normalizeText(eucosInfo)).toMatch(/Name\s*\S+/i);
  await expect.poll(() => normalizeText(eucosInfo)).toMatch(/Country\s*\S+/i);
});
