// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const parseCoordinateText = (text: string | null): { x: number; y: number } => {
    if (!text) {
      throw new Error('Coordinate viewer is empty.');
    }

    const matches = text.match(/-?\d+(?:\.\d+)?/g);
    if (!matches || matches.length < 2) {
      throw new Error(`Could not parse coordinates from: ${text}`);
    }

    const numbers = matches.map((value) => Number(value));
    return {
      x: numbers[numbers.length - 2],
      y: numbers[numbers.length - 1]
    };
  };

  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(max, Math.max(min, value));
  };

  const map = page.getByTestId('map-container');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const initialExtentButton = page.getByTestId('initial-extent-button');

  await expect(map).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  const uviStationsCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  if (!(await uviStationsCheckbox.isChecked())) {
    await uviStationsCheckbox.click({ force: true });
  }
  await expect(uviStationsCheckbox).toBeChecked();

  const eucosStationsCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  if (!(await eucosStationsCheckbox.isChecked())) {
    await eucosStationsCheckbox.click({ force: true });
  }
  await expect(eucosStationsCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  if ((await measurementToggle.getAttribute('aria-pressed')) !== null) {
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  }

  await initialExtentButton.click();

  await expect(coordinateViewer).toBeVisible();

  const mapBox = await map.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map bounding box is unavailable.');
  }

  const hoverAndReadCoordinates = async (
    position: { x: number; y: number },
    previous?: { x: number; y: number }
  ): Promise<{ x: number; y: number }> => {
    await map.hover({ position });

    await expect
      .poll(async () => {
        try {
          return parseCoordinateText(await coordinateViewer.textContent());
        } catch {
          return undefined;
        }
      })
      .not.toBeUndefined();

    if (previous) {
      await expect
        .poll(async () => {
          try {
            const current = parseCoordinateText(await coordinateViewer.textContent());
            return Math.abs(current.x - previous.x) + Math.abs(current.y - previous.y);
          } catch {
            return 0;
          }
        })
        .toBeGreaterThan(0);
    }

    return parseCoordinateText(await coordinateViewer.textContent());
  };

  const inset = 40;
  const centerX = mapBox.width / 2;
  const centerY = mapBox.height / 2;

  const leftPoint = { x: inset, y: centerY };
  const rightPoint = { x: mapBox.width - inset, y: centerY };
  const topPoint = { x: centerX, y: inset };
  const bottomPoint = { x: centerX, y: mapBox.height - inset };

  const leftCoords = await hoverAndReadCoordinates(leftPoint);
  const rightCoords = await hoverAndReadCoordinates(rightPoint, leftCoords);
  const topCoords = await hoverAndReadCoordinates(topPoint, rightCoords);
  const bottomCoords = await hoverAndReadCoordinates(bottomPoint, topCoords);

  const scaleX = (rightCoords.x - leftCoords.x) / (rightPoint.x - leftPoint.x);
  const scaleY = (bottomCoords.y - topCoords.y) / (bottomPoint.y - topPoint.y);

  expect(scaleX).not.toBe(0);
  expect(scaleY).not.toBe(0);

  const offsetX = leftCoords.x - scaleX * leftPoint.x;
  const offsetY = topCoords.y - scaleY * topPoint.y;

  const targetMapCoordinate = { x: 1188692.84, y: 6767643.28 };

  let targetPixel = {
    x: (targetMapCoordinate.x - offsetX) / scaleX,
    y: (targetMapCoordinate.y - offsetY) / scaleY
  };

  let lastRead = topCoords;
  const toleranceX = Math.abs(scaleX) * 4;
  const toleranceY = Math.abs(scaleY) * 4;

  for (let attempt = 0; attempt < 3; attempt++) {
    targetPixel = {
      x: clamp(targetPixel.x, inset, mapBox.width - inset),
      y: clamp(targetPixel.y, inset, mapBox.height - inset)
    };

    lastRead = await hoverAndReadCoordinates(targetPixel);

    const deltaMapX = targetMapCoordinate.x - lastRead.x;
    const deltaMapY = targetMapCoordinate.y - lastRead.y;

    if (Math.abs(deltaMapX) <= toleranceX && Math.abs(deltaMapY) <= toleranceY) {
      break;
    }

    targetPixel = {
      x: targetPixel.x + deltaMapX / scaleX,
      y: targetPixel.y + deltaMapY / scaleY
    };
  }

  expect(Math.abs(lastRead.x - targetMapCoordinate.x)).toBeLessThanOrEqual(toleranceX);
  expect(Math.abs(lastRead.y - targetMapCoordinate.y)).toBeLessThanOrEqual(toleranceY);

  await map.click({
    position: {
      x: clamp(targetPixel.x, inset, mapBox.width - inset),
      y: clamp(targetPixel.y, inset, mapBox.height - inset)
    }
  });

  await expect(infoPanel.getByText(/UV-Index Station/i)).toBeVisible();
  await expect(infoPanel.getByText(/EUCOS Ground Station/i)).toBeVisible();
});
