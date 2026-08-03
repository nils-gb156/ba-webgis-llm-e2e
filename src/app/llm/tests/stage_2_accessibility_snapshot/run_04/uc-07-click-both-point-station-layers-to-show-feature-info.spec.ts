// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const legendToggle = page.getByTestId('legend-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const initialExtentButton = page.getByTestId('initial-extent-button');

  await expect(mapContainer).toBeVisible();

  if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  }

  if ((await layerSwitcherToggle.getAttribute('aria-pressed')) === 'true') {
    await layerSwitcherToggle.click();
    await expect(layerSwitcher).not.toBeVisible();
  }

  if ((await legendToggle.getAttribute('aria-pressed')) === 'true') {
    await legendToggle.click();
    await expect(legendToggle).toHaveAttribute('aria-pressed', 'false');
  }

  await expect(infoPanel).toBeVisible();

  const parseLocalizedNumber = (value: string): number => {
    let normalized = value.replace(/\u00a0/g, ' ').replace(/\s+/g, '');
    const commaCount = (normalized.match(/,/g) ?? []).length;
    const dotCount = (normalized.match(/\./g) ?? []).length;

    if (commaCount > 0 && dotCount > 0) {
      if (normalized.lastIndexOf('.') > normalized.lastIndexOf(',')) {
        normalized = normalized.replace(/,/g, '');
      } else {
        normalized = normalized.replace(/\./g, '').replace(/,/g, '.');
      }
    } else if (commaCount > 1) {
      normalized = normalized.replace(/,/g, '');
    } else if (dotCount > 1) {
      normalized = normalized.replace(/\./g, '');
    } else if (commaCount === 1 && dotCount === 0) {
      const parts = normalized.split(',');
      normalized = parts[1]?.length === 3 ? normalized.replace(/,/g, '') : normalized.replace(',', '.');
    }

    return Number(normalized);
  };

  const parseCoordinateText = (text: string | null): [number, number] | undefined => {
    if (!text) {
      return undefined;
    }

    const matches = text.match(/-?(?:\d[\d.,\s]*\d|\d)/g) ?? [];
    const values = matches
      .map((match) => parseLocalizedNumber(match))
      .filter((value) => Number.isFinite(value));

    if (values.length < 2) {
      return undefined;
    }

    return [values[0], values[1]];
  };

  const mercatorXToLon = (x: number): number => (x / 20037508.34) * 180;
  const latToMercatorY = (lat: number): number =>
    6378137 * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

  const readCoordinatesAt = async (
    x: number,
    y: number,
    previous?: [number, number]
  ): Promise<[number, number]> => {
    let latest: [number, number] | undefined;

    await mapContainer.hover({ position: { x, y } });

    await expect
      .poll(async () => {
        const parsed = parseCoordinateText(await coordinateViewer.textContent());
        if (!parsed) {
          return null;
        }

        latest = parsed;

        if (!previous) {
          return parsed;
        }

        const changed =
          Math.abs(parsed[0] - previous[0]) > 1 || Math.abs(parsed[1] - previous[1]) > 1;

        return changed ? parsed : null;
      })
      .not.toBeNull();

    return latest!;
  };

  await expect(coordinateViewer).toBeVisible();
  await initialExtentButton.click();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const mapWidth = Math.floor(mapBox.width);
  const mapHeight = Math.floor(mapBox.height);

  const leftX = Math.round(mapWidth * 0.22);
  const rightX = Math.round(mapWidth * 0.58);
  const centerX = Math.round(mapWidth * 0.4);
  const topY = Math.round(mapHeight * 0.2);
  const bottomY = Math.round(mapHeight * 0.82);
  const centerY = Math.round(mapHeight * 0.5);

  const centerRaw = await readCoordinatesAt(centerX, centerY);
  const leftRaw = await readCoordinatesAt(leftX, centerY, centerRaw);
  const rightRaw = await readCoordinatesAt(rightX, centerY, leftRaw);
  const topRaw = await readCoordinatesAt(centerX, topY, rightRaw);
  const bottomRaw = await readCoordinatesAt(centerX, bottomY, topRaw);

  const horizontalDelta0 = Math.abs(rightRaw[0] - leftRaw[0]);
  const horizontalDelta1 = Math.abs(rightRaw[1] - leftRaw[1]);
  const xIndex = horizontalDelta0 >= horizontalDelta1 ? 0 : 1;
  const yIndex = xIndex === 0 ? 1 : 0;

  const isLonLatViewer =
    Math.abs(centerRaw[xIndex]) <= 180 && Math.abs(centerRaw[yIndex]) <= 90;

  const toInterpolationUnits = (coords: [number, number]): [number, number] => {
    const xValue = coords[xIndex];
    const yValue = coords[yIndex];

    return isLonLatViewer ? [xValue, latToMercatorY(yValue)] : [xValue, yValue];
  };

  const leftUnits = toInterpolationUnits(leftRaw);
  const rightUnits = toInterpolationUnits(rightRaw);
  const topUnits = toInterpolationUnits(topRaw);
  const bottomUnits = toInterpolationUnits(bottomRaw);

  const targetMercator: [number, number] = [1188692.84, 6767643.28];
  const targetUnits: [number, number] = isLonLatViewer
    ? [mercatorXToLon(targetMercator[0]), targetMercator[1]]
    : targetMercator;

  const horizontalUnitsPerPixel = (rightUnits[0] - leftUnits[0]) / (rightX - leftX);
  const verticalUnitsPerPixel = (bottomUnits[1] - topUnits[1]) / (bottomY - topY);

  expect(Math.abs(horizontalUnitsPerPixel)).toBeGreaterThan(0);
  expect(Math.abs(verticalUnitsPerPixel)).toBeGreaterThan(0);

  let clickX =
    leftX + (targetUnits[0] - leftUnits[0]) / horizontalUnitsPerPixel;
  let clickY =
    topY + (targetUnits[1] - topUnits[1]) / verticalUnitsPerPixel;

  for (let i = 0; i < 2; i++) {
    clickX = Math.min(mapWidth - 2, Math.max(1, clickX));
    clickY = Math.min(mapHeight - 2, Math.max(1, clickY));

    const actualRaw = await readCoordinatesAt(Math.round(clickX), Math.round(clickY));
    const actualUnits = toInterpolationUnits(actualRaw);

    clickX += (targetUnits[0] - actualUnits[0]) / horizontalUnitsPerPixel;
    clickY += (targetUnits[1] - actualUnits[1]) / verticalUnitsPerPixel;
  }

  clickX = Math.min(mapWidth - 2, Math.max(1, clickX));
  clickY = Math.min(mapHeight - 2, Math.max(1, clickY));

  const finalRaw = await readCoordinatesAt(Math.round(clickX), Math.round(clickY));
  const finalUnits = toInterpolationUnits(finalRaw);

  expect(Math.abs(finalUnits[0] - targetUnits[0])).toBeLessThan(
    Math.abs(horizontalUnitsPerPixel) * 3
  );
  expect(Math.abs(finalUnits[1] - targetUnits[1])).toBeLessThan(
    Math.abs(verticalUnitsPerPixel) * 3
  );

  await mapContainer.click({
    position: { x: Math.round(clickX), y: Math.round(clickY) }
  });

  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
});
