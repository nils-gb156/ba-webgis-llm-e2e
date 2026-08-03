// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toBeVisible();
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  const eucosStationsCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  if (!(await eucosStationsCheckbox.isChecked())) {
    await eucosStationsCheckbox.click({ force: true });
  }
  await expect(eucosStationsCheckbox).toBeChecked();

  const uviStationsCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  if (!(await uviStationsCheckbox.isChecked())) {
    await uviStationsCheckbox.click({ force: true });
  }
  await expect(uviStationsCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
    await expect
      .poll(async () => await measurementToggle.getAttribute('aria-pressed'))
      .not.toBe('true');
  }

  type Point = { x: number; y: number };
  type MapCoordinate = [number, number];

  const parseDisplayedCoordinates = (text: string | null): MapCoordinate | undefined => {
    const matches = text?.match(/-?\d+(?:\.\d+)?/g)?.map((value) => Number(value));
    if (!matches || matches.length < 2) {
      return undefined;
    }

    const [x, y] = matches.slice(-2) as [number, number];
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return undefined;
    }

    return [x, y];
  };

  const readCoordinatesFromViewer = async (): Promise<MapCoordinate | undefined> => {
    return parseDisplayedCoordinates(await coordinateViewer.textContent());
  };

  const moveMouseAndReadCoordinates = async (point: Point): Promise<MapCoordinate> => {
    await page.mouse.move(point.x, point.y);

    let coordinates: MapCoordinate | undefined;
    await expect.poll(async () => {
      coordinates = await readCoordinatesFromViewer();
      return coordinates ? `${coordinates[0]},${coordinates[1]}` : '';
    }).toMatch(/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/);

    return coordinates!;
  };

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const clampToMap = (point: Point): Point => ({
    x: Math.min(Math.max(point.x, box.x + 5), box.x + box.width - 5),
    y: Math.min(Math.max(point.y, box.y + 5), box.y + box.height - 5)
  });

  const samplePixel1 = clampToMap({
    x: box.x + box.width * 0.35,
    y: box.y + box.height * 0.35
  });
  const samplePixel2 = clampToMap({
    x: box.x + box.width * 0.65,
    y: box.y + box.height * 0.35
  });
  const samplePixel3 = clampToMap({
    x: box.x + box.width * 0.35,
    y: box.y + box.height * 0.65
  });

  const sampleMap1 = await moveMouseAndReadCoordinates(samplePixel1);
  const sampleMap2 = await moveMouseAndReadCoordinates(samplePixel2);
  const sampleMap3 = await moveMouseAndReadCoordinates(samplePixel3);

  const mapBasis11 = sampleMap2[0] - sampleMap1[0];
  const mapBasis12 = sampleMap3[0] - sampleMap1[0];
  const mapBasis21 = sampleMap2[1] - sampleMap1[1];
  const mapBasis22 = sampleMap3[1] - sampleMap1[1];
  const determinant = mapBasis11 * mapBasis22 - mapBasis12 * mapBasis21;

  expect(Math.abs(determinant)).toBeGreaterThan(1);

  const mapDeltaToPageDelta = (deltaMapX: number, deltaMapY: number): Point => {
    const coefficient1 = (deltaMapX * mapBasis22 - mapBasis12 * deltaMapY) / determinant;
    const coefficient2 = (mapBasis11 * deltaMapY - deltaMapX * mapBasis21) / determinant;

    return {
      x:
        coefficient1 * (samplePixel2.x - samplePixel1.x) +
        coefficient2 * (samplePixel3.x - samplePixel1.x),
      y:
        coefficient1 * (samplePixel2.y - samplePixel1.y) +
        coefficient2 * (samplePixel3.y - samplePixel1.y)
    };
  };

  const mapToPage = (targetMapX: number, targetMapY: number): Point => {
    const delta = mapDeltaToPageDelta(targetMapX - sampleMap1[0], targetMapY - sampleMap1[1]);
    return clampToMap({
      x: samplePixel1.x + delta.x,
      y: samplePixel1.y + delta.y
    });
  };

  const targetMapCoordinate: MapCoordinate = [1188692.84, 6767643.28];

  let targetPagePoint = mapToPage(targetMapCoordinate[0], targetMapCoordinate[1]);
  let hoveredCoordinate = await moveMouseAndReadCoordinates(targetPagePoint);

  const correctionDelta = mapDeltaToPageDelta(
    targetMapCoordinate[0] - hoveredCoordinate[0],
    targetMapCoordinate[1] - hoveredCoordinate[1]
  );

  targetPagePoint = clampToMap({
    x: targetPagePoint.x + correctionDelta.x,
    y: targetPagePoint.y + correctionDelta.y
  });

  hoveredCoordinate = await moveMouseAndReadCoordinates(targetPagePoint);

  await expect.poll(async () => {
    const currentCoordinate = await readCoordinatesFromViewer();
    if (!currentCoordinate) {
      return false;
    }

    return (
      Math.abs(currentCoordinate[0] - targetMapCoordinate[0]) < 15000 &&
      Math.abs(currentCoordinate[1] - targetMapCoordinate[1]) < 15000
    );
  }).toBe(true);

  await mapContainer.click({
    position: {
      x: Math.round(targetPagePoint.x - box.x),
      y: Math.round(targetPagePoint.y - box.y)
    }
  });

  await expect.poll(async () => (await infoPanel.textContent()) ?? '').toMatch(/UV-Index Station/i);
  await expect.poll(async () => (await infoPanel.textContent()) ?? '').toMatch(/EUCOS Ground Station/i);
});
