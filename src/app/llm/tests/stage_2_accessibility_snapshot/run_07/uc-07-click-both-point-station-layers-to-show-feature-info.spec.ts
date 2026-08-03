// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const mapContainer = page.getByTestId('map-container');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');

  const targetCoordinate = { x: 1188692.84, y: 6767643.28 };

  const normalizeNumber = (token: string): number => {
    let value = token.trim().replace(/\s/g, '');

    if (value.includes('.') && value.includes(',')) {
      if (value.lastIndexOf(',') > value.lastIndexOf('.')) {
        value = value.replace(/\./g, '').replace(',', '.');
      } else {
        value = value.replace(/,/g, '');
      }
    } else if ((value.match(/,/g) ?? []).length > 1) {
      value = value.replace(/,/g, '');
    } else if ((value.match(/\./g) ?? []).length > 1) {
      const lastDot = value.lastIndexOf('.');
      value = value.slice(0, lastDot).replace(/\./g, '') + value.slice(lastDot);
    } else if (value.includes(',') && !value.includes('.')) {
      const parts = value.split(',');
      value = parts.length === 2 && parts[1].length <= 2 ? `${parts[0]}.${parts[1]}` : parts.join('');
    }

    return Number(value);
  };

  const parseCoordinates = (text: string): [number, number] | null => {
    const matches = text.match(/-?\d[\d.,]*/g);
    if (!matches || matches.length < 2) {
      return null;
    }

    const numbers = matches.map(normalizeNumber).filter((n) => !Number.isNaN(n));
    if (numbers.length < 2) {
      return null;
    }

    return [numbers[0], numbers[1]];
  };

  const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

  const readMapCoordinatesAt = async (position: { x: number; y: number }): Promise<[number, number]> => {
    await mapContainer.hover({ position: { x: Math.round(position.x), y: Math.round(position.y) } });

    let lastText = '';
    await expect
      .poll(async () => {
        lastText = (await coordinateViewer.textContent())?.trim() ?? '';
        return parseCoordinates(lastText);
      })
      .not.toBeNull();

    const coordinates = parseCoordinates(lastText);
    if (!coordinates) {
      throw new Error(`Could not parse coordinates from coordinate viewer text: "${lastText}"`);
    }

    return coordinates;
  };

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
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

  const eucosCheckbox = layerSwitcher.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  const uviCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await expect(mapContainer).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const margin = 40;
  const sampleTopLeft = { x: margin, y: margin };
  const sampleBottomRight = { x: mapBox.width - margin, y: mapBox.height - margin };

  const topLeftCoords = await readMapCoordinatesAt(sampleTopLeft);
  const bottomRightCoords = await readMapCoordinatesAt(sampleBottomRight);

  const drawableWidth = sampleBottomRight.x - sampleTopLeft.x;
  const drawableHeight = sampleBottomRight.y - sampleTopLeft.y;

  const unitsPerPixelX = (bottomRightCoords[0] - topLeftCoords[0]) / drawableWidth;
  const unitsPerPixelY = (topLeftCoords[1] - bottomRightCoords[1]) / drawableHeight;

  let clickPosition = {
    x: sampleTopLeft.x + (targetCoordinate.x - topLeftCoords[0]) / unitsPerPixelX,
    y: sampleTopLeft.y + (topLeftCoords[1] - targetCoordinate.y) / unitsPerPixelY
  };

  for (let i = 0; i < 3; i++) {
    clickPosition = {
      x: clamp(clickPosition.x, margin, mapBox.width - margin),
      y: clamp(clickPosition.y, margin, mapBox.height - margin)
    };

    const observedCoords = await readMapCoordinatesAt(clickPosition);
    const deltaX = targetCoordinate.x - observedCoords[0];
    const deltaY = targetCoordinate.y - observedCoords[1];

    if (
      Math.abs(deltaX) <= Math.abs(unitsPerPixelX) * 2 &&
      Math.abs(deltaY) <= Math.abs(unitsPerPixelY) * 2
    ) {
      break;
    }

    clickPosition = {
      x: clickPosition.x + deltaX / unitsPerPixelX,
      y: clickPosition.y - deltaY / unitsPerPixelY
    };
  }

  clickPosition = {
    x: clamp(clickPosition.x, margin, mapBox.width - margin),
    y: clamp(clickPosition.y, margin, mapBox.height - margin)
  };

  await mapContainer.click({
    position: { x: Math.round(clickPosition.x), y: Math.round(clickPosition.y) }
  });

  await expect
    .poll(async () => (await infoPanel.textContent()) ?? '')
    .toMatch(/UV-Index Station[\s\S]*EUCOS Ground Station|EUCOS Ground Station[\s\S]*UV-Index Station/);

  await expect(infoPanel.getByText('UV-Index Station', { exact: false })).toBeVisible();
  await expect(infoPanel.getByText('EUCOS Ground Station', { exact: false })).toBeVisible();
});
