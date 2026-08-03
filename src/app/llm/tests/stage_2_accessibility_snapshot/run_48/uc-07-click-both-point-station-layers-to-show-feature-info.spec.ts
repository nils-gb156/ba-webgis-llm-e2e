// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const legend = page.getByTestId('legend');
  const legendToggle = page.getByTestId('legend-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

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
  }
  await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) ?? 'false').toBe('false');

  if (await layerSwitcher.isVisible()) {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeHidden();

  if (await legend.isVisible()) {
    await legendToggle.click();
  }
  await expect(legend).toBeHidden();

  await expect(infoPanel).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

  const targetMapX = 1188692.84;
  const targetMapY = 6767643.28;

  const parseLocaleNumber = (token: string): number => {
    const value = token.trim();
    const lastComma = value.lastIndexOf(',');
    const lastDot = value.lastIndexOf('.');

    if (lastComma !== -1 && lastDot !== -1) {
      const decimalSeparator = lastComma > lastDot ? ',' : '.';
      const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
      return Number(value.split(thousandsSeparator).join('').replace(decimalSeparator, '.'));
    }

    if (lastComma !== -1) {
      const parts = value.split(',');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        return Number(value.split(',').join(''));
      }
      return Number(value.replace(',', '.'));
    }

    if (lastDot !== -1) {
      const parts = value.split('.');
      if (parts.length > 2) {
        return Number(value.split('.').join(''));
      }
    }

    return Number(value);
  };

  const parseCoordinateText = (text: string | null | undefined): { x: number; y: number; raw: string } | undefined => {
    const raw = text?.trim() ?? '';
    const tokens = raw.match(/-?[\d.,]+/g) ?? [];
    if (tokens.length < 2) {
      return undefined;
    }

    const values = tokens.map(parseLocaleNumber).filter((value) => Number.isFinite(value));
    if (values.length < 2) {
      return undefined;
    }

    return {
      x: values[values.length - 2],
      y: values[values.length - 1],
      raw
    };
  };

  const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

  const readCoordinateAt = async (x: number, y: number, previousRaw?: string) => {
    await mapContainer.hover({ position: { x, y } });

    await expect
      .poll(
        async () => {
          const parsed = parseCoordinateText(await coordinateViewer.textContent());
          if (!parsed) {
            return null;
          }
          if (previousRaw && parsed.raw === previousRaw) {
            return null;
          }
          return parsed.raw;
        },
        { timeout: 1500 }
      )
      .not.toBeNull();

    const parsed = parseCoordinateText(await coordinateViewer.textContent());
    if (!parsed) {
      throw new Error('Could not parse map coordinates from coordinate viewer.');
    }

    return {
      pageX: x,
      pageY: y,
      mapX: parsed.x,
      mapY: parsed.y,
      raw: parsed.raw
    };
  };

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const candidateOrigins = [
    { x: mapBox.width * 0.5, y: mapBox.height * 0.5 },
    { x: mapBox.width * 0.4, y: mapBox.height * 0.5 },
    { x: mapBox.width * 0.6, y: mapBox.height * 0.5 },
    { x: mapBox.width * 0.5, y: mapBox.height * 0.4 },
    { x: mapBox.width * 0.5, y: mapBox.height * 0.6 }
  ];

  let originSample:
    | {
        pageX: number;
        pageY: number;
        mapX: number;
        mapY: number;
        raw: string;
      }
    | undefined;

  for (const candidate of candidateOrigins) {
    try {
      originSample = await readCoordinateAt(candidate.x, candidate.y);
      break;
    } catch {
      // try next candidate
    }
  }

  if (!originSample) {
    throw new Error('Could not read map coordinates from any candidate map position.');
  }

  const horizontalOffset = Math.min(80, mapBox.width * 0.15);
  const verticalOffset = Math.min(80, mapBox.height * 0.15);

  const rightSample = await readCoordinateAt(
    clamp(originSample.pageX + horizontalOffset, 5, mapBox.width - 5),
    originSample.pageY,
    originSample.raw
  );
  const downSample = await readCoordinateAt(
    originSample.pageX,
    clamp(originSample.pageY + verticalOffset, 5, mapBox.height - 5),
    rightSample.raw
  );

  const xScale = (rightSample.mapX - originSample.mapX) / (rightSample.pageX - originSample.pageX);
  const yScale = (downSample.mapY - originSample.mapY) / (downSample.pageY - originSample.pageY);

  if (!Number.isFinite(xScale) || xScale === 0 || !Number.isFinite(yScale) || yScale === 0) {
    throw new Error('Could not determine map coordinate scale from coordinate viewer samples.');
  }

  let currentPoint = { x: originSample.pageX, y: originSample.pageY };
  let currentSample = originSample;

  for (let iteration = 0; iteration < 3; iteration++) {
    const nextPoint = {
      x: clamp(currentPoint.x + (targetMapX - currentSample.mapX) / xScale, 5, mapBox.width - 5),
      y: clamp(currentPoint.y + (targetMapY - currentSample.mapY) / yScale, 5, mapBox.height - 5)
    };

    currentSample = await readCoordinateAt(nextPoint.x, nextPoint.y, currentSample.raw);
    currentPoint = nextPoint;
  }

  await mapContainer.click({
    position: {
      x: currentPoint.x,
      y: currentPoint.y
    }
  });

  await expect(infoPanel.getByRole('heading', { name: /UV-Index Station/i })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: /EUCOS Ground Station/i })).toBeVisible();
});
