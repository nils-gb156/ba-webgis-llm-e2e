// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  const measurementToggle = page.getByTestId('measurement-toggle');
  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

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

  const mapContainer = page.getByTestId('map-container');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  await expect(mapContainer).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  type Coordinate = { x: number; y: number };
  type Position = { x: number; y: number };

  const parseCoordinate = (text: string | null): Coordinate | undefined => {
    const matches = (text ?? '').match(/-?\d+(?:\.\d+)?/g);
    if (!matches || matches.length < 2) {
      return undefined;
    }
    return {
      x: Number(matches[0]),
      y: Number(matches[1])
    };
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const readCoordinateAt = async (position: Position, previous?: Coordinate): Promise<Coordinate> => {
    const safePosition = {
      x: clamp(position.x, 1, box.width - 1),
      y: clamp(position.y, 1, box.height - 1)
    };

    await mapContainer.hover({ position: safePosition, force: true });

    let parsed: Coordinate | undefined;
    await expect
      .poll(async () => {
        parsed = parseCoordinate(await coordinateViewer.textContent());
        if (!parsed) {
          return false;
        }
        if (!previous) {
          return true;
        }
        return Math.abs(parsed.x - previous.x) > 1 || Math.abs(parsed.y - previous.y) > 1;
      })
      .toBe(true);

    return parsed!;
  };

  const sample1: Position = { x: box.width * 0.25, y: box.height * 0.25 };
  const sample2: Position = { x: box.width * 0.75, y: box.height * 0.75 };

  const coord1 = await readCoordinateAt(sample1);
  const coord2 = await readCoordinateAt(sample2, coord1);

  const scaleX = (coord2.x - coord1.x) / (sample2.x - sample1.x);
  const scaleY = (coord2.y - coord1.y) / (sample2.y - sample1.y);

  expect(scaleX).not.toBe(0);
  expect(scaleY).not.toBe(0);

  const targetCoordinate: Coordinate = { x: 1188692.84, y: 6767643.28 };

  let targetPosition: Position = {
    x: sample1.x + (targetCoordinate.x - coord1.x) / scaleX,
    y: sample1.y + (targetCoordinate.y - coord1.y) / scaleY
  };

  for (let i = 0; i < 2; i++) {
    targetPosition = {
      x: clamp(targetPosition.x, 1, box.width - 1),
      y: clamp(targetPosition.y, 1, box.height - 1)
    };

    const actualCoordinate = await readCoordinateAt(targetPosition);
    const deltaX = targetCoordinate.x - actualCoordinate.x;
    const deltaY = targetCoordinate.y - actualCoordinate.y;

    if (Math.abs(deltaX) <= 1000 && Math.abs(deltaY) <= 1000) {
      break;
    }

    targetPosition = {
      x: targetPosition.x + deltaX / scaleX,
      y: targetPosition.y + deltaY / scaleY
    };
  }

  await mapContainer.click({
    position: {
      x: clamp(targetPosition.x, 1, box.width - 1),
      y: clamp(targetPosition.y, 1, box.height - 1)
    },
    force: true
  });

  await expect(infoPanel.getByRole('heading', { name: /UV-Index Station/i })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: /EUCOS Ground Station/i })).toBeVisible();
});
