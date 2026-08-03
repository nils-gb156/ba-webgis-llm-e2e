// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const initialExtentButton = page.getByTestId('initial-extent-button');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await page.waitForLoadState('domcontentloaded');
  await expect(mapContainer).toBeVisible();

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

  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (measurementPressed === 'true') {
    await measurementToggle.click();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  }

  await initialExtentButton.click();

  await expect(coordinateViewer).toBeVisible();

  const parseCoordinates = (text: string): [number, number] | null => {
    const matches = text.match(/[-+]?\d+(?:\.\d+)?/g);
    if (!matches || matches.length < 2) {
      return null;
    }

    const values = matches.slice(-2).map((value) => Number(value));
    if (values.some((value) => Number.isNaN(value))) {
      return null;
    }

    return [values[0], values[1]];
  };

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box is not available.');
  }

  const readCoordinatesAt = async (
    relativeX: number,
    relativeY: number,
    previous?: [number, number]
  ): Promise<[number, number]> => {
    await page.mouse.move(mapBox.x + relativeX, mapBox.y + relativeY);

    let latest: [number, number] | null = null;
    await expect
      .poll(async () => {
        const parsed = parseCoordinates(await coordinateViewer.innerText());
        if (!parsed) {
          return null;
        }

        if (
          previous &&
          Math.abs(parsed[0] - previous[0]) < 1 &&
          Math.abs(parsed[1] - previous[1]) < 1
        ) {
          return null;
        }

        latest = parsed;
        return parsed;
      })
      .not.toBeNull();

    if (!latest) {
      throw new Error('Could not read coordinates from the coordinate viewer.');
    }

    return latest;
  };

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
  let clickPosition = {
    x: mapBox.width / 2,
    y: mapBox.height / 2
  };

  try {
    const leftX = mapBox.width * 0.35;
    const rightX = mapBox.width * 0.65;
    const midX = mapBox.width * 0.5;
    const topY = mapBox.height * 0.35;
    const bottomY = mapBox.height * 0.65;
    const midY = mapBox.height * 0.5;

    const leftCoord = await readCoordinatesAt(leftX, midY);
    const rightCoord = await readCoordinatesAt(rightX, midY, leftCoord);
    const topCoord = await readCoordinatesAt(midX, topY);
    const bottomCoord = await readCoordinatesAt(midX, bottomY, topCoord);

    const scaleX = (rightCoord[0] - leftCoord[0]) / (rightX - leftX);
    const scaleY = (bottomCoord[1] - topCoord[1]) / (bottomY - topY);

    if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX === 0 || scaleY === 0) {
      throw new Error('Could not derive a valid coordinate-to-pixel scale from the map.');
    }

    const targetX = leftX + (targetCoordinate[0] - leftCoord[0]) / scaleX;
    const targetY = topY + (targetCoordinate[1] - topCoord[1]) / scaleY;

    if (
      !Number.isFinite(targetX) ||
      !Number.isFinite(targetY) ||
      targetX < 10 ||
      targetX > mapBox.width - 10 ||
      targetY < 10 ||
      targetY > mapBox.height - 10
    ) {
      throw new Error('Computed map click position is outside the visible map area.');
    }

    await page.mouse.move(mapBox.x + targetX, mapBox.y + targetY);
    await expect
      .poll(async () => {
        const parsed = parseCoordinates(await coordinateViewer.innerText());
        if (!parsed) {
          return Number.POSITIVE_INFINITY;
        }

        return Math.hypot(parsed[0] - targetCoordinate[0], parsed[1] - targetCoordinate[1]);
      })
      .toBeLessThan(25000);

    clickPosition = { x: targetX, y: targetY };
  } catch {
    clickPosition = {
      x: mapBox.width / 2,
      y: mapBox.height / 2
    };
  }

  const featureInfoResponsePromise = page.waitForResponse(
    (response) => response.ok() && response.url().toLowerCase().includes('getfeatureinfo')
  );

  await mapContainer.click({ position: clickPosition });
  await featureInfoResponsePromise;

  await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();

  await expect
    .poll(async () => ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim())
    .toMatch(/UV-Index Station[\s\S]*EUCOS Ground Station|EUCOS Ground Station[\s\S]*UV-Index Station/);
});
