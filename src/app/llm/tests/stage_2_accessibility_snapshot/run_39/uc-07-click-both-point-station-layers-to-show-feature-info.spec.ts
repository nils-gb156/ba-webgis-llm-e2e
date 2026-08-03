// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');

  await expect(mapContainer).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  const isMeasurementActive = async () =>
    (await measurementToggle.getAttribute('aria-pressed')) === 'true';

  if (await isMeasurementActive()) {
    await measurementToggle.click();
  }
  await expect.poll(isMeasurementActive).toBe(false);

  const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  const uviCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });

  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();
  await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  type Coordinate = { x: number; y: number };
  type Position = { x: number; y: number };

  const targetCoordinate: Coordinate = {
    x: 1188692.84,
    y: 6767643.28
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const parseLocalizedNumber = (raw: string): number => {
    const value = raw.trim();
    const lastComma = value.lastIndexOf(',');
    const lastDot = value.lastIndexOf('.');

    if (lastComma !== -1 && lastDot !== -1) {
      const decimalSeparator = lastComma > lastDot ? ',' : '.';
      const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
      return Number.parseFloat(
        value.split(thousandsSeparator).join('').replace(decimalSeparator, '.')
      );
    }

    if (lastComma !== -1) {
      const parts = value.split(',');
      if (parts.length > 2) {
        return Number.parseFloat(parts.join(''));
      }
      return Number.parseFloat(value.replace(',', '.'));
    }

    if (lastDot !== -1) {
      const parts = value.split('.');
      if (parts.length > 2) {
        return Number.parseFloat(parts.join(''));
      }
    }

    return Number.parseFloat(value);
  };

  const extractCoordinate = (text: string): Coordinate | null => {
    const matches = text.match(/-?(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d+)?/g);
    if (!matches || matches.length < 2) {
      return null;
    }

    const x = parseLocalizedNumber(matches[0]);
    const y = parseLocalizedNumber(matches[1]);

    if (Number.isNaN(x) || Number.isNaN(y)) {
      return null;
    }

    return { x, y };
  };

  const readCoordinateAt = async (position: Position): Promise<Coordinate> => {
    const roundedPosition = {
      x: Math.round(position.x),
      y: Math.round(position.y)
    };

    await mapContainer.hover({ position: roundedPosition });

    await expect
      .poll(async () => {
        const text = (await coordinateViewer.textContent()) ?? '';
        return extractCoordinate(text) !== null;
      })
      .toBe(true);

    const text = (await coordinateViewer.textContent()) ?? '';
    const coordinate = extractCoordinate(text);
    expect(coordinate).not.toBeNull();

    if (!coordinate) {
      throw new Error(`Could not parse coordinate viewer text: ${text}`);
    }

    return coordinate;
  };

  const margin = 20;
  const sample1: Position = {
    x: Math.round(box.width * 0.2),
    y: Math.round(box.height * 0.2)
  };
  const sample2: Position = {
    x: Math.round(box.width * 0.8),
    y: sample1.y
  };
  const sample3: Position = {
    x: sample1.x,
    y: Math.round(box.height * 0.8)
  };

  const coord1 = await readCoordinateAt(sample1);
  const coord2 = await readCoordinateAt(sample2);
  const coord3 = await readCoordinateAt(sample3);

  const scaleX = (coord2.x - coord1.x) / (sample2.x - sample1.x);
  const scaleY = (coord3.y - coord1.y) / (sample3.y - sample1.y);

  expect(Math.abs(scaleX)).toBeGreaterThan(0);
  expect(Math.abs(scaleY)).toBeGreaterThan(0);

  const offsetX = coord1.x - scaleX * sample1.x;
  const offsetY = coord1.y - scaleY * sample1.y;

  let clickPosition: Position = {
    x: clamp((targetCoordinate.x - offsetX) / scaleX, margin, box.width - margin),
    y: clamp((targetCoordinate.y - offsetY) / scaleY, margin, box.height - margin)
  };

  for (let i = 0; i < 3; i++) {
    const observed = await readCoordinateAt(clickPosition);
    const deltaX = targetCoordinate.x - observed.x;
    const deltaY = targetCoordinate.y - observed.y;

    clickPosition = {
      x: clamp(clickPosition.x + deltaX / scaleX, margin, box.width - margin),
      y: clamp(clickPosition.y + deltaY / scaleY, margin, box.height - margin)
    };
  }

  const finalObservedCoordinate = await readCoordinateAt(clickPosition);
  const xTolerance = Math.abs(scaleX) * 8;
  const yTolerance = Math.abs(scaleY) * 8;

  expect(Math.abs(finalObservedCoordinate.x - targetCoordinate.x)).toBeLessThanOrEqual(
    xTolerance
  );
  expect(Math.abs(finalObservedCoordinate.y - targetCoordinate.y)).toBeLessThanOrEqual(
    yTolerance
  );

  const featureInfoResponsePromise = page.waitForResponse((response) =>
    /getfeatureinfo/i.test(response.url())
  );

  await mapContainer.click({
    position: {
      x: Math.round(clickPosition.x),
      y: Math.round(clickPosition.y)
    }
  });

  const featureInfoResponse = await featureInfoResponsePromise;
  expect(featureInfoResponse.ok()).toBeTruthy();

  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
});
