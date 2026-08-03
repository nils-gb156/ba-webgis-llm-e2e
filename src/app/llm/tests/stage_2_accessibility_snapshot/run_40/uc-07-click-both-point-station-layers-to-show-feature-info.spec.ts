// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if (!(await infoPanel.isVisible()) && (await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  if (!(await layerSwitcher.isVisible()) && (await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  const measurementToggle = page.getByTestId('measurement-toggle');
  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  if (!(await uviStationsCheckbox.isChecked())) {
    await uviStationsCheckbox.click({ force: true });
  }
  await expect(uviStationsCheckbox).toBeChecked();

  await page.getByTestId('initial-extent-button').click();

  const mapContainer = page.getByTestId('map-container');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  await expect(mapContainer).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

  type MapCoord = { x: number; y: number };

  const normalizeNumericToken = (token: string): number => {
    let value = token.replace(/\s/g, '');
    const commaCount = (value.match(/,/g) ?? []).length;
    const dotCount = (value.match(/\./g) ?? []).length;

    if (commaCount > 0 && dotCount > 0) {
      if (value.lastIndexOf(',') > value.lastIndexOf('.')) {
        value = value.replace(/\./g, '').replace(',', '.');
      } else {
        value = value.replace(/,/g, '');
      }
    } else if (commaCount > 1) {
      value = value.replace(/,/g, '');
    } else if (dotCount > 1) {
      value = value.replace(/\./g, '');
    } else if (commaCount === 1) {
      value = /^\-?\d{1,3},\d{3}$/.test(value) ? value.replace(',', '') : value.replace(',', '.');
    } else if (dotCount === 1 && /^\-?\d{1,3}\.\d{3}$/.test(value)) {
      value = value.replace('.', '');
    }

    return Number(value);
  };

  const parseCoordinateText = (raw: string): MapCoord | undefined => {
    const tokens = raw.match(/-?[\d.,]+/g) ?? [];
    if (tokens.length < 2) {
      return undefined;
    }

    const x = normalizeNumericToken(tokens[0]);
    const y = normalizeNumericToken(tokens[1]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return undefined;
    }

    return { x, y };
  };

  const readCoordinateAt = async (
    position: { x: number; y: number },
    previous?: MapCoord
  ): Promise<MapCoord> => {
    await mapContainer.hover({ position });

    let latest: MapCoord | undefined;
    await expect.poll(async () => {
      latest = parseCoordinateText((await coordinateViewer.textContent()) ?? '');
      if (!latest) {
        return false;
      }
      if (!previous) {
        return true;
      }
      return Math.abs(latest.x - previous.x) > 1 || Math.abs(latest.y - previous.y) > 1;
    }).toBe(true);

    return latest!;
  };

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const padding = 40;
  const sampleTopLeft = { x: padding, y: padding };
  const sampleTopRight = { x: Math.round(mapBox.width) - padding, y: padding };
  const sampleBottomLeft = { x: padding, y: Math.round(mapBox.height) - padding };

  const coordTopLeft = await readCoordinateAt(sampleTopLeft);
  const coordTopRight = await readCoordinateAt(sampleTopRight, coordTopLeft);
  const coordBottomLeft = await readCoordinateAt(sampleBottomLeft, coordTopRight);

  const xScale = (coordTopRight.x - coordTopLeft.x) / (sampleTopRight.x - sampleTopLeft.x);
  const yScale = (coordBottomLeft.y - coordTopLeft.y) / (sampleBottomLeft.y - sampleTopLeft.y);

  expect(Math.abs(xScale)).toBeGreaterThan(0);
  expect(Math.abs(yScale)).toBeGreaterThan(0);

  const targetCoordinate: MapCoord = { x: 1188692.84, y: 6767643.28 };
  const targetPosition = {
    x: Math.round(sampleTopLeft.x + (targetCoordinate.x - coordTopLeft.x) / xScale),
    y: Math.round(sampleTopLeft.y + (targetCoordinate.y - coordTopLeft.y) / yScale)
  };

  expect(targetPosition.x).toBeGreaterThanOrEqual(0);
  expect(targetPosition.x).toBeLessThanOrEqual(Math.round(mapBox.width));
  expect(targetPosition.y).toBeGreaterThanOrEqual(0);
  expect(targetPosition.y).toBeLessThanOrEqual(Math.round(mapBox.height));

  const hoveredTargetCoordinate = await readCoordinateAt(targetPosition, coordBottomLeft);
  expect(Math.abs(hoveredTargetCoordinate.x - targetCoordinate.x)).toBeLessThan(20000);
  expect(Math.abs(hoveredTargetCoordinate.y - targetCoordinate.y)).toBeLessThan(20000);

  const getFeatureInfoRequests: string[] = [];
  page.on('request', request => {
    if (/getfeatureinfo/i.test(request.url())) {
      getFeatureInfoRequests.push(request.url());
    }
  });

  const getFeatureInfoResponse = page.waitForResponse(response => {
    return /getfeatureinfo/i.test(response.url()) && response.ok();
  });

  await Promise.all([
    getFeatureInfoResponse,
    mapContainer.click({ position: targetPosition })
  ]);

  await expect.poll(() => getFeatureInfoRequests.length > 0).toBe(true);

  await expect(infoPanel.getByText(/UV-Index Station/i)).toBeVisible();
  await expect(infoPanel.getByText(/EUCOS Ground Station/i)).toBeVisible();
});
