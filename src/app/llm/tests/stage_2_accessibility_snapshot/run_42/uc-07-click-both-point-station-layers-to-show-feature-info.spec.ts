// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

type MapPoint = {
  x: number;
  y: number;
};

function parseNumberToken(token: string): number | undefined {
  const compact = token.trim().replace(/\s+/g, "");
  if (!compact) {
    return undefined;
  }

  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  let normalized = compact;

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      normalized = compact.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = compact.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    const parts = compact.split(",");
    if (parts.length === 2 && parts[1].length !== 3) {
      normalized = compact.replace(",", ".");
    } else {
      normalized = compact.replace(/,/g, "");
    }
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

function extractCoordinates(text: string | null): MapPoint | undefined {
  if (!text) {
    return undefined;
  }

  const rawTokens = text.match(/-?\d[\d.,\s]*/g) ?? [];
  const values = rawTokens
    .map((token) => parseNumberToken(token))
    .filter((value): value is number => value !== undefined);

  if (values.length < 2) {
    return undefined;
  }

  const projectedCandidates = values.filter((value) => Math.abs(value) > 100000);
  const selected = projectedCandidates.length >= 2 ? projectedCandidates.slice(-2) : values.slice(-2);

  return { x: selected[0], y: selected[1] };
}

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();
  }

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();
  }

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  }

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

  await expect(coordinateViewer).toBeVisible();

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const padding = 24;
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const clampPosition = (position: MapPoint): MapPoint => ({
    x: clamp(position.x, padding, box.width - padding),
    y: clamp(position.y, padding, box.height - padding)
  });

  const readMapCoordinates = async (): Promise<MapPoint | undefined> => {
    return extractCoordinates(await coordinateViewer.textContent());
  };

  const moveAndRead = async (position: MapPoint): Promise<MapPoint> => {
    const clamped = clampPosition(position);
    await page.mouse.move(box.x + clamped.x, box.y + clamped.y);

    await expect
      .poll(async () => {
        const coords = await readMapCoordinates();
        return coords ? `${Math.round(coords.x)},${Math.round(coords.y)}` : undefined;
      })
      .toMatch(/^-?\d+,-?\d+$/);

    const coords = await readMapCoordinates();
    if (!coords) {
      throw new Error('Coordinate viewer did not provide map coordinates.');
    }

    return coords;
  };

  const center = { x: box.width / 2, y: box.height / 2 };
  const sampleOffset = Math.min(120, (box.width - 2 * padding) / 4, (box.height - 2 * padding) / 4);

  const centerCoords = await moveAndRead(center);
  const rightCoords = await moveAndRead({ x: center.x + sampleOffset, y: center.y });
  const downCoords = await moveAndRead({ x: center.x, y: center.y + sampleOffset });

  const xPerPixel = (rightCoords.x - centerCoords.x) / sampleOffset;
  const yPerPixel = (downCoords.y - centerCoords.y) / sampleOffset;

  expect(Math.abs(xPerPixel)).toBeGreaterThan(0);
  expect(Math.abs(yPerPixel)).toBeGreaterThan(0);

  const targetCoordinates = { x: 1188692.84, y: 6767643.28 };
  let clickPosition = center;
  let currentCoordinates = centerCoords;

  for (let i = 0; i < 4; i++) {
    const deltaX = targetCoordinates.x - currentCoordinates.x;
    const deltaY = targetCoordinates.y - currentCoordinates.y;

    clickPosition = clampPosition({
      x: clickPosition.x + deltaX / xPerPixel,
      y: clickPosition.y + deltaY / yPerPixel
    });

    currentCoordinates = await moveAndRead(clickPosition);
  }

  expect(Math.abs(currentCoordinates.x - targetCoordinates.x)).toBeLessThanOrEqual(Math.abs(xPerPixel) * 5);
  expect(Math.abs(currentCoordinates.y - targetCoordinates.y)).toBeLessThanOrEqual(Math.abs(yPerPixel) * 5);

  await mapContainer.click({
    position: {
      x: Math.round(clickPosition.x),
      y: Math.round(clickPosition.y)
    }
  });

  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
});
