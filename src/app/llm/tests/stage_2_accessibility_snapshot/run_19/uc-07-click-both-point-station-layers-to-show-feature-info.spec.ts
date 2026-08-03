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
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(coordinateViewer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();

  if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect.poll(async () => await measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

  const eucosCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  const uviCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });

  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }

  await expect(eucosCheckbox).toBeChecked();
  await expect(uviCheckbox).toBeChecked();

  const bbox = await mapContainer.boundingBox();
  if (!bbox) {
    throw new Error('Map container bounding box is not available.');
  }

  const normalizeNumericToken = (token: string): number => {
    const trimmed = token.trim();

    if (trimmed.includes(',') && trimmed.includes('.')) {
      if (trimmed.lastIndexOf('.') > trimmed.lastIndexOf(',')) {
        return Number(trimmed.replace(/,/g, ''));
      }
      return Number(trimmed.replace(/\./g, '').replace(',', '.'));
    }

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        return Number(trimmed.replace(/,/g, ''));
      }
      return Number(trimmed.replace(',', '.'));
    }

    return Number(trimmed);
  };

  const parseCoordinateText = (text: string): [number, number] => {
    const matches = text.match(/-?\d[\d.,]*/g) ?? [];
    const values = matches
      .map(normalizeNumericToken)
      .filter((value) => Number.isFinite(value) && Math.abs(value) > 10000);

    if (values.length < 2) {
      throw new Error(`Could not parse map coordinates from coordinate viewer text: "${text}"`);
    }

    return [values[0], values[1]];
  };

  const clampPixel = (value: number, max: number): number => {
    return Math.max(5, Math.min(Math.round(value), Math.round(max) - 5));
  };

  const readCoordinatesAt = async (
    pixelX: number,
    pixelY: number,
    previous?: { x: number; y: number }
  ): Promise<{ x: number; y: number }> => {
    const x = clampPixel(pixelX, bbox.width);
    const y = clampPixel(pixelY, bbox.height);

    await mapContainer.hover({ position: { x, y } });

    let parsed: [number, number] | undefined;

    await expect
      .poll(async () => {
        try {
          const next = parseCoordinateText(await coordinateViewer.innerText());

          if (!previous) {
            parsed = next;
            return true;
          }

          const changed = next[0] !== previous.x || next[1] !== previous.y;
          if (changed) {
            parsed = next;
          }
          return changed;
        } catch {
          return false;
        }
      })
      .toBe(true);

    return { x: parsed![0], y: parsed![1] };
  };

  const leftPixel = { x: Math.round(bbox.width * 0.2), y: Math.round(bbox.height * 0.5) };
  const rightPixel = { x: Math.round(bbox.width * 0.8), y: Math.round(bbox.height * 0.5) };
  const topPixel = { x: Math.round(bbox.width * 0.5), y: Math.round(bbox.height * 0.2) };
  const bottomPixel = { x: Math.round(bbox.width * 0.5), y: Math.round(bbox.height * 0.8) };

  const leftSample = await readCoordinatesAt(leftPixel.x, leftPixel.y);
  const rightSample = await readCoordinatesAt(rightPixel.x, rightPixel.y, leftSample);
  const topSample = await readCoordinatesAt(topPixel.x, topPixel.y, rightSample);
  const bottomSample = await readCoordinatesAt(bottomPixel.x, bottomPixel.y, topSample);

  const scaleX = (rightSample.x - leftSample.x) / (rightPixel.x - leftPixel.x);
  const scaleY = (bottomSample.y - topSample.y) / (bottomPixel.y - topPixel.y);

  expect(scaleX).not.toBe(0);
  expect(scaleY).not.toBe(0);

  const targetMapCoordinate = { x: 1188692.84, y: 6767643.28 };

  let estimatedPixelX = leftPixel.x + (targetMapCoordinate.x - leftSample.x) / scaleX;
  let estimatedPixelY = topPixel.y + (targetMapCoordinate.y - topSample.y) / scaleY;

  let previousSample: { x: number; y: number } | undefined;

  for (let i = 0; i < 3; i++) {
    const sample = await readCoordinatesAt(estimatedPixelX, estimatedPixelY, previousSample);
    estimatedPixelX += (targetMapCoordinate.x - sample.x) / scaleX;
    estimatedPixelY += (targetMapCoordinate.y - sample.y) / scaleY;
    previousSample = sample;
  }

  const finalPixelX = clampPixel(estimatedPixelX, bbox.width);
  const finalPixelY = clampPixel(estimatedPixelY, bbox.height);

  const finalCoordinates = await readCoordinatesAt(finalPixelX, finalPixelY);
  expect(Math.abs(finalCoordinates.x - targetMapCoordinate.x)).toBeLessThanOrEqual(Math.abs(scaleX) * 2);
  expect(Math.abs(finalCoordinates.y - targetMapCoordinate.y)).toBeLessThanOrEqual(Math.abs(scaleY) * 2);

  const featureInfoResponsePromise = page.waitForResponse((response) =>
    /getfeatureinfo/i.test(response.url())
  );

  await mapContainer.click({
    position: { x: finalPixelX, y: finalPixelY }
  });

  const featureInfoResponse = await featureInfoResponsePromise;
  expect(featureInfoResponse.ok()).toBeTruthy();

  await expect(infoPanel).toContainText(/UV-Index Station/i);
  await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
