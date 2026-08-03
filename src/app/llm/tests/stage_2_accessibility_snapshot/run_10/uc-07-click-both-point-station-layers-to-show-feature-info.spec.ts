// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const initialExtentButton = page.getByTestId('initial-extent-button');
  const mapContainer = page.getByTestId('map-container');
  const coordinateViewer = page.getByTestId('coordinate-viewer');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible()) && (await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  if (!(await layerSwitcher.isVisible()) && (await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  const ensureCheckboxChecked = async (name: string) => {
    const checkbox = page.getByRole('checkbox', { name, exact: true });
    if (!(await checkbox.isChecked())) {
      await checkbox.click({ force: true });
    }
    await expect(checkbox).toBeChecked();
  };

  await ensureCheckboxChecked('UV-Index Stations');
  await ensureCheckboxChecked('EUCOS Ground Stations');

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect.poll(async () => await measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

  await expect(coordinateViewer).toBeVisible();

  await initialExtentButton.click();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();

  const mapBox = box!;

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const parseProjectedCoordinates = (text: string | null): [number, number] | undefined => {
    if (!text) {
      return undefined;
    }

    const normalized = text.replace(/(\d),(?=\d{3}\b)/g, '$1');
    const matches = normalized.match(/-?\d+(?:\.\d+)?/g);

    if (!matches) {
      return undefined;
    }

    const numbers = matches.map((value) => Number(value)).filter((value) => !Number.isNaN(value));
    const projectedCandidates = numbers.filter((value) => Math.abs(value) > 10000);

    if (projectedCandidates.length >= 2) {
      return [projectedCandidates[0], projectedCandidates[1]];
    }

    if (numbers.length >= 2) {
      return [numbers[numbers.length - 2], numbers[numbers.length - 1]];
    }

    return undefined;
  };

  const sampleCoordinateAt = async (position: { x: number; y: number }): Promise<[number, number]> => {
    const absoluteX = mapBox.x + position.x;
    const absoluteY = mapBox.y + position.y;

    let sampled: [number, number] | undefined;

    await page.mouse.move(absoluteX + 1, absoluteY + 1);
    await page.mouse.move(absoluteX, absoluteY);

    await expect.poll(async () => {
      const parsed = parseProjectedCoordinates(await coordinateViewer.textContent());
      if (parsed) {
        sampled = parsed;
        return 'sampled';
      }
      return '';
    }).toBe('sampled');

    return sampled!;
  };

  const leftPosition = { x: mapBox.width * 0.25, y: mapBox.height * 0.5 };
  const rightPosition = { x: mapBox.width * 0.75, y: mapBox.height * 0.5 };
  const topPosition = { x: mapBox.width * 0.5, y: mapBox.height * 0.25 };
  const bottomPosition = { x: mapBox.width * 0.5, y: mapBox.height * 0.75 };

  const leftCoordinate = await sampleCoordinateAt(leftPosition);
  const rightCoordinate = await sampleCoordinateAt(rightPosition);
  const topCoordinate = await sampleCoordinateAt(topPosition);
  const bottomCoordinate = await sampleCoordinateAt(bottomPosition);

  const xUnitsPerPixel = (rightCoordinate[0] - leftCoordinate[0]) / (rightPosition.x - leftPosition.x);
  const yUnitsPerPixel = (bottomCoordinate[1] - topCoordinate[1]) / (bottomPosition.y - topPosition.y);

  expect(xUnitsPerPixel).not.toBe(0);
  expect(yUnitsPerPixel).not.toBe(0);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  let clickPosition = {
    x: clamp(
      leftPosition.x + (targetCoordinate[0] - leftCoordinate[0]) / xUnitsPerPixel,
      5,
      mapBox.width - 5
    ),
    y: clamp(
      topPosition.y + (targetCoordinate[1] - topCoordinate[1]) / yUnitsPerPixel,
      5,
      mapBox.height - 5
    )
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const sampledCoordinate = await sampleCoordinateAt(clickPosition);
    const deltaX = targetCoordinate[0] - sampledCoordinate[0];
    const deltaY = targetCoordinate[1] - sampledCoordinate[1];

    if (
      Math.abs(deltaX) <= Math.abs(xUnitsPerPixel) * 2 &&
      Math.abs(deltaY) <= Math.abs(yUnitsPerPixel) * 2
    ) {
      break;
    }

    clickPosition = {
      x: clamp(clickPosition.x + deltaX / xUnitsPerPixel, 5, mapBox.width - 5),
      y: clamp(clickPosition.y + deltaY / yUnitsPerPixel, 5, mapBox.height - 5)
    };
  }

  const finalSampledCoordinate = await sampleCoordinateAt(clickPosition);
  expect(Math.abs(finalSampledCoordinate[0] - targetCoordinate[0])).toBeLessThanOrEqual(Math.abs(xUnitsPerPixel) * 3);
  expect(Math.abs(finalSampledCoordinate[1] - targetCoordinate[1])).toBeLessThanOrEqual(Math.abs(yUnitsPerPixel) * 3);

  await mapContainer.click({ position: clickPosition });

  await expect(infoPanel.getByText(/UV-Index Station/i)).toBeVisible();
  await expect(infoPanel.getByText(/EUCOS Ground Station/i)).toBeVisible();
});
