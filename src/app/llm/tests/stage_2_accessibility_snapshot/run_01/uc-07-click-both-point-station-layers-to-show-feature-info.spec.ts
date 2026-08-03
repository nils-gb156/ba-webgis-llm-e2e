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
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const initialExtentButton = page.getByTestId('initial-extent-button');

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const normalizeSingleSeparator = (input: string, separator: ',' | '.') => {
    const parts = input.split(separator);
    if (parts.length === 1) {
      return input;
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart.length <= 2) {
      return `${parts.slice(0, -1).join('')}.${lastPart}`;
    }

    return parts.join('');
  };

  const parseLocalizedNumber = (value: string): number | undefined => {
    let normalized = value.replace(/\u00a0/g, ' ').replace(/\s+/g, '').trim();
    if (!normalized) {
      return undefined;
    }

    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');

    if (lastComma !== -1 && lastDot !== -1) {
      const decimalSeparator = lastComma > lastDot ? ',' : '.';
      const groupSeparator = decimalSeparator === ',' ? '.' : ',';
      normalized = normalized.split(groupSeparator).join('');
      if (decimalSeparator === ',') {
        normalized = normalized.replace(',', '.');
      }
    } else if (lastComma !== -1) {
      normalized = normalizeSingleSeparator(normalized, ',');
    } else if (lastDot !== -1) {
      normalized = normalizeSingleSeparator(normalized, '.');
    }

    normalized = normalized.replace(/[^\d.+-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const extractCoordinates = (text: string | null): [number, number] | undefined => {
    if (!text) {
      return undefined;
    }

    const matches = text.match(/[-+]?\d[\d\s.,]*/g);
    if (!matches) {
      return undefined;
    }

    const numbers = matches
      .map((chunk) => parseLocalizedNumber(chunk))
      .filter((value): value is number => value !== undefined)
      .filter((value) => Math.abs(value) >= 100000);

    if (numbers.length < 2) {
      return undefined;
    }

    return [numbers[0], numbers[1]];
  };

  const hoverAndReadCoordinate = async (position: { x: number; y: number }): Promise<[number, number]> => {
    const previousText = await coordinateViewer.textContent();
    await mapContainer.hover({ position });

    await expect
      .poll(async () => {
        const currentText = await coordinateViewer.textContent();
        const coordinates = extractCoordinates(currentText);
        if (!coordinates) {
          return undefined;
        }

        if (previousText !== null && currentText === previousText) {
          return undefined;
        }

        return coordinates;
      })
      .not.toBeUndefined();

    const coordinates = extractCoordinates(await coordinateViewer.textContent());
    expect(coordinates).toBeDefined();
    return coordinates!;
  };

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

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const uviStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  if (!(await uviStationsCheckbox.isChecked())) {
    await uviStationsCheckbox.click({ force: true });
  }
  await expect(uviStationsCheckbox).toBeChecked();

  const eucosStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  if (!(await eucosStationsCheckbox.isChecked())) {
    await eucosStationsCheckbox.click({ force: true });
  }
  await expect(eucosStationsCheckbox).toBeChecked();

  await initialExtentButton.click();

  const infoPanelTextBeforeClick = (await infoPanel.textContent()) ?? '';

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  const width = mapBox!.width;
  const height = mapBox!.height;

  const sample1 = { x: Math.round(width * 0.3), y: Math.round(height * 0.35) };
  const sample2 = { x: Math.round(width * 0.7), y: Math.round(height * 0.35) };
  const sample3 = { x: Math.round(width * 0.3), y: Math.round(height * 0.65) };

  const [coord1x, coord1y] = await hoverAndReadCoordinate(sample1);
  const [coord2x, coord2y] = await hoverAndReadCoordinate(sample2);
  const [coord3x, coord3y] = await hoverAndReadCoordinate(sample3);

  const xScale = (coord2x - coord1x) / (sample2.x - sample1.x);
  const yScale = (coord3y - coord1y) / (sample3.y - sample1.y);

  expect(Number.isFinite(xScale)).toBeTruthy();
  expect(Number.isFinite(yScale)).toBeTruthy();
  expect(Math.abs(xScale)).toBeGreaterThan(0);
  expect(Math.abs(yScale)).toBeGreaterThan(0);

  const xOffset = coord1x - xScale * sample1.x;
  const yOffset = coord1y - yScale * sample1.y;

  const targetCoordinate = { x: 1188692.84, y: 6767643.28 };

  let targetPosition = {
    x: (targetCoordinate.x - xOffset) / xScale,
    y: (targetCoordinate.y - yOffset) / yScale
  };

  targetPosition = {
    x: clamp(targetPosition.x, 4, width - 4),
    y: clamp(targetPosition.y, 4, height - 4)
  };

  for (let i = 0; i < 2; i++) {
    const [hoveredX, hoveredY] = await hoverAndReadCoordinate(targetPosition);
    targetPosition = {
      x: clamp(targetPosition.x + (targetCoordinate.x - hoveredX) / xScale, 4, width - 4),
      y: clamp(targetPosition.y + (targetCoordinate.y - hoveredY) / yScale, 4, height - 4)
    };
  }

  await mapContainer.click({
    position: {
      x: Math.round(targetPosition.x),
      y: Math.round(targetPosition.y)
    }
  });

  await expect
    .poll(async () => ((await infoPanel.textContent()) ?? '').length)
    .toBeGreaterThan(infoPanelTextBeforeClick.length);

  await expect(infoPanel).toContainText(/UV-Index Station/i);
  await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
