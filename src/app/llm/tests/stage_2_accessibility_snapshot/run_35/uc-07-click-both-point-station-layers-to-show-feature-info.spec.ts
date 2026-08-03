// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

type MapPoint = { x: number; y: number };

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

  const eucosGroundStationsCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  const uvIndexStationsCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });

  await expect(eucosGroundStationsCheckbox).toBeChecked();
  await expect(uvIndexStationsCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const normalizeNumber = (token: string): number => {
    if (token.includes(',') && token.includes('.')) {
      return Number.parseFloat(token.replace(/,/g, ''));
    }
    if (token.includes(',')) {
      return Number.parseFloat(token.replace(',', '.'));
    }
    return Number.parseFloat(token);
  };

  const readPointerCoordinate = async (): Promise<MapPoint | undefined> => {
    const text = await coordinateViewer.innerText();
    const numericTokens = text.match(/-?[\d.,]+/g) ?? [];
    const values = numericTokens.map(normalizeNumber).filter((value) => Number.isFinite(value));
    if (values.length < 2) {
      return undefined;
    }
    return {
      x: values[values.length - 2],
      y: values[values.length - 1]
    };
  };

  const sampleAtPixel = async (
    pixelX: number,
    pixelY: number,
    previous?: MapPoint
  ): Promise<{ pixel: MapPoint; coordinate: MapPoint }> => {
    await page.mouse.move(box.x + pixelX, box.y + pixelY);

    let coordinate: MapPoint | undefined;
    await expect
      .poll(async () => {
        coordinate = await readPointerCoordinate();
        if (!coordinate) {
          return 'missing';
        }
        if (
          previous &&
          Math.abs(coordinate.x - previous.x) < 1 &&
          Math.abs(coordinate.y - previous.y) < 1
        ) {
          return 'unchanged';
        }
        return 'ready';
      })
      .toBe('ready');

    return {
      pixel: { x: pixelX, y: pixelY },
      coordinate: coordinate!
    };
  };

  const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  };

  const calibrationA = await sampleAtPixel(box.width * 0.35, box.height * 0.35);
  const calibrationB = await sampleAtPixel(
    box.width * 0.65,
    box.height * 0.65,
    calibrationA.coordinate
  );

  const scaleX =
    (calibrationB.coordinate.x - calibrationA.coordinate.x) /
    (calibrationB.pixel.x - calibrationA.pixel.x);
  const scaleY =
    (calibrationB.coordinate.y - calibrationA.coordinate.y) /
    (calibrationB.pixel.y - calibrationA.pixel.y);

  expect(Math.abs(scaleX)).toBeGreaterThan(0);
  expect(Math.abs(scaleY)).toBeGreaterThan(0);

  const targetCoordinate: MapPoint = {
    x: 1188692.84,
    y: 6767643.28
  };

  let clickX = clamp(
    calibrationA.pixel.x + (targetCoordinate.x - calibrationA.coordinate.x) / scaleX,
    10,
    box.width - 10
  );
  let clickY = clamp(
    calibrationA.pixel.y + (targetCoordinate.y - calibrationA.coordinate.y) / scaleY,
    10,
    box.height - 10
  );

  for (let attempt = 0; attempt < 3; attempt++) {
    const sample = await sampleAtPixel(clickX, clickY);
    const deltaX = targetCoordinate.x - sample.coordinate.x;
    const deltaY = targetCoordinate.y - sample.coordinate.y;

    clickX = clamp(sample.pixel.x + deltaX / scaleX, 10, box.width - 10);
    clickY = clamp(sample.pixel.y + deltaY / scaleY, 10, box.height - 10);
  }

  const finalSample = await sampleAtPixel(clickX, clickY);
  const toleranceX = Math.max(Math.abs(scaleX) * 10, 1000);
  const toleranceY = Math.max(Math.abs(scaleY) * 10, 1000);

  expect(Math.abs(finalSample.coordinate.x - targetCoordinate.x)).toBeLessThanOrEqual(toleranceX);
  expect(Math.abs(finalSample.coordinate.y - targetCoordinate.y)).toBeLessThanOrEqual(toleranceY);

  await mapContainer.click({
    position: {
      x: Math.round(clickX),
      y: Math.round(clickY)
    }
  });

  await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
