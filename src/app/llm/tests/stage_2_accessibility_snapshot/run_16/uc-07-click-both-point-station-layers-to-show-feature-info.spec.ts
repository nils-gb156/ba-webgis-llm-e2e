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
  const measurementToggle = page.getByTestId('measurement-toggle');
  const initialExtentButton = page.getByTestId('initial-extent-button');

  await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await mapContainer.scrollIntoViewIfNeeded();

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

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const eucosStationsCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  const uviStationsCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });

  if (!(await eucosStationsCheckbox.isChecked())) {
    await eucosStationsCheckbox.click({ force: true });
  }
  await expect(eucosStationsCheckbox).toBeChecked();

  if (!(await uviStationsCheckbox.isChecked())) {
    await uviStationsCheckbox.click({ force: true });
  }
  await expect(uviStationsCheckbox).toBeChecked();

  await initialExtentButton.click();

  const parseLocalizedNumber = (raw: string): number => {
    const normalized = raw.replace(/\s+/g, '');
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');
    const decimalSeparatorIndex = Math.max(lastComma, lastDot);

    if (decimalSeparatorIndex === -1) {
      return Number(normalized.replace(/[^\d-]/g, ''));
    }

    const integerPart = normalized.slice(0, decimalSeparatorIndex).replace(/[^\d-]/g, '');
    const fractionPart = normalized.slice(decimalSeparatorIndex + 1).replace(/[^\d]/g, '');

    return Number(`${integerPart}.${fractionPart}`);
  };

  const parseCoordinateText = (text: string): { x: number; y: number } | undefined => {
    const matches = text.match(/-?[\d][\d\s.,]*/g) ?? [];
    const numbers = matches
      .map((match) => parseLocalizedNumber(match))
      .filter((value) => Number.isFinite(value));

    if (numbers.length < 2) {
      return undefined;
    }

    return { x: numbers[0], y: numbers[1] };
  };

  const readMapCoordinate = async (position: { x: number; y: number }) => {
    await mapContainer.hover({
      position: {
        x: Math.round(position.x),
        y: Math.round(position.y)
      }
    });

    await expect
      .poll(async () => {
        const parsed = parseCoordinateText(await coordinateViewer.innerText());
        return parsed ? `${Math.round(parsed.x)},${Math.round(parsed.y)}` : '';
      })
      .toMatch(/^-?\d+,-?\d+$/);

    const parsed = parseCoordinateText(await coordinateViewer.innerText());
    if (!parsed) {
      throw new Error('Unable to read map coordinates from the coordinate viewer.');
    }

    return parsed;
  };

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Unable to determine the map container size.');
  }

  const targetCoordinate = { x: 1188692.84, y: 6767643.28 };
  const mapWidth = mapBox.width;
  const mapHeight = mapBox.height;
  let clickPosition = { x: mapWidth / 2, y: mapHeight / 2 };

  try {
    await expect(coordinateViewer).toBeVisible();

    const margin = Math.max(30, Math.min(mapWidth, mapHeight) * 0.08);
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const leftSample = await readMapCoordinate({ x: margin, y: mapHeight / 2 });
    const rightSample = await readMapCoordinate({ x: mapWidth - margin, y: mapHeight / 2 });
    const topSample = await readMapCoordinate({ x: mapWidth / 2, y: margin });
    const bottomSample = await readMapCoordinate({ x: mapWidth / 2, y: mapHeight - margin });

    const scaleX = (rightSample.x - leftSample.x) / (mapWidth - 2 * margin);
    const scaleY = (bottomSample.y - topSample.y) / (mapHeight - 2 * margin);

    if (Number.isFinite(scaleX) && scaleX !== 0 && Number.isFinite(scaleY) && scaleY !== 0) {
      clickPosition = {
        x: margin + (targetCoordinate.x - leftSample.x) / scaleX,
        y: margin + (targetCoordinate.y - topSample.y) / scaleY
      };

      for (let i = 0; i < 3; i += 1) {
        clickPosition = {
          x: clamp(clickPosition.x, margin, mapWidth - margin),
          y: clamp(clickPosition.y, margin, mapHeight - margin)
        };

        const currentCoordinate = await readMapCoordinate(clickPosition);

        clickPosition = {
          x: clickPosition.x + (targetCoordinate.x - currentCoordinate.x) / scaleX,
          y: clickPosition.y + (targetCoordinate.y - currentCoordinate.y) / scaleY
        };
      }

      clickPosition = {
        x: clamp(clickPosition.x, margin, mapWidth - margin),
        y: clamp(clickPosition.y, margin, mapHeight - margin)
      };

      const finalCoordinate = await readMapCoordinate(clickPosition);
      expect(Math.abs(finalCoordinate.x - targetCoordinate.x)).toBeLessThan(
        Math.max(Math.abs(scaleX) * 10, 1000)
      );
      expect(Math.abs(finalCoordinate.y - targetCoordinate.y)).toBeLessThan(
        Math.max(Math.abs(scaleY) * 10, 1000)
      );
    }
  } catch {
    clickPosition = { x: mapWidth / 2, y: mapHeight / 2 };
  }

  await mapContainer.click({
    position: {
      x: Math.round(clickPosition.x),
      y: Math.round(clickPosition.y)
    }
  });

  await expect(infoPanel.getByText(/UV-Index Station/i)).toBeVisible();
  await expect(infoPanel.getByText(/EUCOS Ground Station/i)).toBeVisible();
});
