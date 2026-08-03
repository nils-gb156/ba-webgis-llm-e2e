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

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();
  await expect(layerSwitcherToggle).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  }

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

  const parseLocalizedNumber = (token: string): number | undefined => {
    let normalized = token.replace(/\s/g, '');
    const hasDot = normalized.includes('.');
    const hasComma = normalized.includes(',');

    if (hasDot && hasComma) {
      const lastDot = normalized.lastIndexOf('.');
      const lastComma = normalized.lastIndexOf(',');
      const decimalSeparator = lastDot > lastComma ? '.' : ',';
      const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
      normalized = normalized.split(thousandsSeparator).join('');
      if (decimalSeparator === ',') {
        normalized = normalized.replace(',', '.');
      }
    } else if (hasComma) {
      const parts = normalized.split(',');
      if (parts.length > 2) {
        const trailing = parts.pop()!;
        normalized = `${parts.join('')}${trailing.length <= 2 ? `.${trailing}` : trailing}`;
      } else if (parts.length === 2 && parts[1].length <= 2) {
        normalized = `${parts[0]}.${parts[1]}`;
      } else {
        normalized = parts.join('');
      }
    } else if (hasDot) {
      const parts = normalized.split('.');
      if (parts.length > 2) {
        const trailing = parts.pop()!;
        normalized = `${parts.join('')}${trailing.length <= 2 ? `.${trailing}` : trailing}`;
      } else if (parts.length === 2 && parts[1].length === 3) {
        normalized = parts.join('');
      }
    }

    const value = Number(normalized);
    return Number.isFinite(value) ? value : undefined;
  };

  const extractCoordinates = (text: string | null): [number, number] | undefined => {
    if (!text) {
      return undefined;
    }

    const tokens = text.match(/[-+]?\d[\d.,]*/g) ?? [];
    const values: number[] = [];

    for (const token of tokens) {
      const value = parseLocalizedNumber(token);
      if (value !== undefined) {
        values.push(value);
      }
      if (values.length === 2) {
        return [values[0], values[1]];
      }
    }

    return undefined;
  };

  const readMapCoordinatesAt = async (
    screenX: number,
    screenY: number,
    previous?: [number, number]
  ): Promise<[number, number]> => {
    await page.mouse.move(screenX, screenY);

    await expect
      .poll(async () => {
        const coords = extractCoordinates(await coordinateViewer.textContent());
        if (!coords) {
          return '';
        }
        if (
          previous &&
          Math.abs(coords[0] - previous[0]) < 1 &&
          Math.abs(coords[1] - previous[1]) < 1
        ) {
          return '';
        }
        return `${coords[0]},${coords[1]}`;
      })
      .not.toBe('');

    const coords = extractCoordinates(await coordinateViewer.textContent());
    if (!coords) {
      throw new Error('Could not read map coordinates from the coordinate viewer.');
    }
    return coords;
  };

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const leftX = mapBox.x + mapBox.width * 0.2;
  const centerX = mapBox.x + mapBox.width * 0.5;
  const rightX = mapBox.x + mapBox.width * 0.8;
  const topY = mapBox.y + mapBox.height * 0.2;
  const centerY = mapBox.y + mapBox.height * 0.5;
  const bottomY = mapBox.y + mapBox.height * 0.8;

  const leftCoords = await readMapCoordinatesAt(leftX, centerY);
  const rightCoords = await readMapCoordinatesAt(rightX, centerY, leftCoords);
  const topCoords = await readMapCoordinatesAt(centerX, topY);
  const bottomCoords = await readMapCoordinatesAt(centerX, bottomY, topCoords);

  const scaleX = (rightCoords[0] - leftCoords[0]) / (rightX - leftX);
  const scaleY = (bottomCoords[1] - topCoords[1]) / (bottomY - topY);

  expect(scaleX).not.toBe(0);
  expect(scaleY).not.toBe(0);

  const targetMapX = 1188692.84;
  const targetMapY = 6767643.28;

  let targetScreenX = leftX + (targetMapX - leftCoords[0]) / scaleX;
  let targetScreenY = topY + (targetMapY - topCoords[1]) / scaleY;

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  for (let i = 0; i < 3; i++) {
    targetScreenX = clamp(targetScreenX, mapBox.x + 1, mapBox.x + mapBox.width - 1);
    targetScreenY = clamp(targetScreenY, mapBox.y + 1, mapBox.y + mapBox.height - 1);

    const currentCoords = await readMapCoordinatesAt(targetScreenX, targetScreenY);
    targetScreenX += (targetMapX - currentCoords[0]) / scaleX;
    targetScreenY += (targetMapY - currentCoords[1]) / scaleY;
  }

  targetScreenX = clamp(targetScreenX, mapBox.x + 1, mapBox.x + mapBox.width - 1);
  targetScreenY = clamp(targetScreenY, mapBox.y + 1, mapBox.y + mapBox.height - 1);

  await mapContainer.click({
    position: {
      x: Math.round(targetScreenX - mapBox.x),
      y: Math.round(targetScreenY - mapBox.y)
    }
  });

  await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
