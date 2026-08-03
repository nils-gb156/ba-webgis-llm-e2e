// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(page.getByTestId('footer')).toBeVisible();
  await expect(page.getByTestId('scale-viewer')).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click();
    await expect(infoPanel).toBeVisible();
  }

  if (!(await layerSwitcher.isVisible())) {
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
    await layerSwitcherToggle.click();
    await expect(layerSwitcher).toBeVisible();
  }

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
    await expect.poll(async () => await measurementToggle.getAttribute('aria-pressed')).not.toBe('true');
  }

  const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
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

  await expect(coordinateViewer).toBeVisible();

  const parseDisplayedCoordinate = async (): Promise<[number, number] | undefined> => {
    const text = await coordinateViewer.textContent();
    if (!text) {
      return undefined;
    }

    const matches = text.match(/-?\d+(?:\.\d+)?/g);
    if (!matches || matches.length < 2) {
      return undefined;
    }

    const x = Number(matches[0]);
    const y = Number(matches[1]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return undefined;
    }

    return [x, y];
  };

  const sampleCoordinateAt = async (position: { x: number; y: number }): Promise<[number, number]> => {
    let sampled: [number, number] | undefined;

    await expect.poll(async () => {
      await mapContainer.hover({ position });
      sampled = await parseDisplayedCoordinate();
      return sampled !== undefined;
    }).toBe(true);

    return sampled!;
  };

  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  const width = mapBox!.width;
  const height = mapBox!.height;

  const leftSamplePosition = {
    x: Math.round(width * 0.35),
    y: Math.round(height * 0.5)
  };
  const rightSamplePosition = {
    x: Math.round(width * 0.65),
    y: Math.round(height * 0.5)
  };
  const topSamplePosition = {
    x: Math.round(width * 0.5),
    y: Math.round(height * 0.35)
  };
  const bottomSamplePosition = {
    x: Math.round(width * 0.5),
    y: Math.round(height * 0.65)
  };

  const leftSampleCoordinate = await sampleCoordinateAt(leftSamplePosition);
  const rightSampleCoordinate = await sampleCoordinateAt(rightSamplePosition);
  const topSampleCoordinate = await sampleCoordinateAt(topSamplePosition);
  const bottomSampleCoordinate = await sampleCoordinateAt(bottomSamplePosition);

  const xUnitsPerPixel =
    (rightSampleCoordinate[0] - leftSampleCoordinate[0]) /
    (rightSamplePosition.x - leftSamplePosition.x);
  const yUnitsPerPixel =
    (bottomSampleCoordinate[1] - topSampleCoordinate[1]) /
    (bottomSamplePosition.y - topSamplePosition.y);

  expect(xUnitsPerPixel).not.toBe(0);
  expect(yUnitsPerPixel).not.toBe(0);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  let estimatedPosition = {
    x: leftSamplePosition.x + (targetCoordinate[0] - leftSampleCoordinate[0]) / xUnitsPerPixel,
    y: topSamplePosition.y + (targetCoordinate[1] - topSampleCoordinate[1]) / yUnitsPerPixel
  };

  for (let i = 0; i < 3; i++) {
    const localPosition = {
      x: Math.round(clamp(estimatedPosition.x, 5, width - 5)),
      y: Math.round(clamp(estimatedPosition.y, 5, height - 5))
    };

    const sampledCoordinate = await sampleCoordinateAt(localPosition);
    const deltaX = targetCoordinate[0] - sampledCoordinate[0];
    const deltaY = targetCoordinate[1] - sampledCoordinate[1];

    if (
      Math.abs(deltaX) <= Math.abs(xUnitsPerPixel) * 1.5 &&
      Math.abs(deltaY) <= Math.abs(yUnitsPerPixel) * 1.5
    ) {
      estimatedPosition = localPosition;
      break;
    }

    estimatedPosition = {
      x: localPosition.x + deltaX / xUnitsPerPixel,
      y: localPosition.y + deltaY / yUnitsPerPixel
    };
  }

  const finalClickPosition = {
    x: Math.round(clamp(estimatedPosition.x, 5, width - 5)),
    y: Math.round(clamp(estimatedPosition.y, 5, height - 5))
  };

  await mapContainer.click({ position: finalClickPosition });

  await expect(infoPanel).toContainText(/UV-Index Station/);
  await expect(infoPanel).toContainText(/EUCOS Ground Station/);
});
