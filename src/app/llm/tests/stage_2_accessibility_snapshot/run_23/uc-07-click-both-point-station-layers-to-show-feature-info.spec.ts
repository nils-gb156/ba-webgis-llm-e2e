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

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  await expect(layerSwitcher).toBeVisible();

  const eucosCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  const uviCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });

  await expect(eucosCheckbox).toBeVisible();
  await expect(uviCheckbox).toBeVisible();

  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const parseCoordinateText = (text: string): { x: number; y: number } | null => {
    const matches = text.replace(/\u00a0/g, ' ').match(/-?\d+(?:[.,]\d+)?/g);
    if (!matches || matches.length < 2) {
      return null;
    }

    const toNumber = (value: string): number => Number.parseFloat(value.replace(',', '.'));
    const x = toNumber(matches[matches.length - 2]);
    const y = toNumber(matches[matches.length - 1]);

    if (Number.isNaN(x) || Number.isNaN(y)) {
      return null;
    }

    return { x, y };
  };

  const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

  const readCoordinateAt = async (relativeX: number, relativeY: number): Promise<{ x: number; y: number }> => {
    const box = await mapContainer.boundingBox();
    if (!box) {
      throw new Error('Map container has no bounding box.');
    }

    await page.mouse.move(box.x + relativeX, box.y + relativeY);

    await expect
      .poll(async () => {
        const parsed = parseCoordinateText(await coordinateViewer.innerText());
        return parsed ? `${parsed.x},${parsed.y}` : '';
      })
      .toMatch(/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/);

    const parsed = parseCoordinateText(await coordinateViewer.innerText());
    if (!parsed) {
      throw new Error('Could not parse coordinates from coordinate viewer.');
    }

    return parsed;
  };

  const targetMapCoordinate = { x: 1188692.84, y: 6767643.28 };

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const leftX = Math.round(mapBox.width * 0.15);
  const rightX = Math.round(mapBox.width * 0.85);
  const centerX = Math.round(mapBox.width * 0.5);
  const topY = Math.round(mapBox.height * 0.15);
  const bottomY = Math.round(mapBox.height * 0.85);
  const centerY = Math.round(mapBox.height * 0.5);

  const leftSample = await readCoordinateAt(leftX, centerY);
  const rightSample = await readCoordinateAt(rightX, centerY);
  const topSample = await readCoordinateAt(centerX, topY);
  const bottomSample = await readCoordinateAt(centerX, bottomY);

  const unitsPerPixelX = (rightSample.x - leftSample.x) / (rightX - leftX);
  const unitsPerPixelY = (bottomSample.y - topSample.y) / (bottomY - topY);

  expect(Math.abs(unitsPerPixelX)).toBeGreaterThan(0);
  expect(Math.abs(unitsPerPixelY)).toBeGreaterThan(0);

  let clickX = leftX + (targetMapCoordinate.x - leftSample.x) / unitsPerPixelX;
  let clickY = topY + (targetMapCoordinate.y - topSample.y) / unitsPerPixelY;

  clickX = clamp(clickX, 1, mapBox.width - 1);
  clickY = clamp(clickY, 1, mapBox.height - 1);

  for (let i = 0; i < 2; i += 1) {
    const current = await readCoordinateAt(clickX, clickY);
    clickX += (targetMapCoordinate.x - current.x) / unitsPerPixelX;
    clickY += (targetMapCoordinate.y - current.y) / unitsPerPixelY;
    clickX = clamp(clickX, 1, mapBox.width - 1);
    clickY = clamp(clickY, 1, mapBox.height - 1);
  }

  await mapContainer.click({
    position: {
      x: Math.round(clickX),
      y: Math.round(clickY)
    }
  });

  await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
