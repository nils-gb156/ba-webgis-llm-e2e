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
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

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

  const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  if (!(await uviStationsCheckbox.isChecked())) {
    await uviStationsCheckbox.click({ force: true });
  }
  await expect(uviStationsCheckbox).toBeChecked();

  const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  if (!(await eucosStationsCheckbox.isChecked())) {
    await eucosStationsCheckbox.click({ force: true });
  }
  await expect(eucosStationsCheckbox).toBeChecked();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const targetCoordinate = { x: 1188692.84, y: 6767643.28 };
  const marginX = Math.min(60, mapBox.width / 6);
  const marginY = Math.min(60, mapBox.height / 6);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const readViewerCoords = async (): Promise<{ x: number; y: number } | undefined> => {
    const text = await coordinateViewer.innerText();
    const tokens = text.match(/-?[\d.,]+/g) ?? [];
    const numbers = tokens
      .map((token) => token.replace(/^[^\d-]+|[^\d.,-]+$/g, '').replace(/,/g, ''))
      .map((token) => Number.parseFloat(token))
      .filter((value) => !Number.isNaN(value));

    if (numbers.length < 2) {
      return undefined;
    }

    return { x: numbers[0], y: numbers[1] };
  };

  const hoverAndRead = async (position: { x: number; y: number }) => {
    const safePosition = {
      x: Math.round(clamp(position.x, 1, mapBox.width - 1)),
      y: Math.round(clamp(position.y, 1, mapBox.height - 1))
    };

    await mapContainer.hover({ position: safePosition });
    await expect
      .poll(async () => {
        const coords = await readViewerCoords();
        return coords ? `${coords.x},${coords.y}` : '';
      })
      .toMatch(/^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/);

    const coords = await readViewerCoords();
    expect(coords).toBeDefined();
    return { position: safePosition, coords: coords! };
  };

  const leftSample = await hoverAndRead({ x: marginX, y: mapBox.height / 2 });
  const rightSample = await hoverAndRead({ x: mapBox.width - marginX, y: mapBox.height / 2 });
  const topSample = await hoverAndRead({ x: mapBox.width / 2, y: marginY });
  const bottomSample = await hoverAndRead({ x: mapBox.width / 2, y: mapBox.height - marginY });

  const xPerPixel =
    (rightSample.coords.x - leftSample.coords.x) /
    (rightSample.position.x - leftSample.position.x);
  const yPerPixel =
    (bottomSample.coords.y - topSample.coords.y) /
    (bottomSample.position.y - topSample.position.y);

  expect(xPerPixel).not.toBe(0);
  expect(yPerPixel).not.toBe(0);

  const estimatedPosition = {
    x: leftSample.position.x + (targetCoordinate.x - leftSample.coords.x) / xPerPixel,
    y: topSample.position.y + (targetCoordinate.y - topSample.coords.y) / yPerPixel
  };

  const firstRefinement = await hoverAndRead(estimatedPosition);
  const correctedPosition = {
    x: firstRefinement.position.x + (targetCoordinate.x - firstRefinement.coords.x) / xPerPixel,
    y: firstRefinement.position.y + (targetCoordinate.y - firstRefinement.coords.y) / yPerPixel
  };

  const finalTarget = await hoverAndRead(correctedPosition);

  expect(Math.abs(finalTarget.coords.x - targetCoordinate.x)).toBeLessThan(Math.abs(xPerPixel) * 5);
  expect(Math.abs(finalTarget.coords.y - targetCoordinate.y)).toBeLessThan(Math.abs(yPerPixel) * 5);

  await mapContainer.click({ position: finalTarget.position });

  await expect(infoPanel.getByText(/UV-?Index Station/i).first()).toBeVisible();
  await expect(infoPanel.getByText(/EUCOS Ground Station/i).first()).toBeVisible();
});
