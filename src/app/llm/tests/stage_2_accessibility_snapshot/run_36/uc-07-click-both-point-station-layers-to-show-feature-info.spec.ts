// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const initialExtentButton = page.getByTestId('initial-extent-button');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');

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

  const uviStationsCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  const eucosStationsCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });

  await expect(uviStationsCheckbox).toBeChecked();
  await expect(eucosStationsCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await expect(coordinateViewer).toBeVisible();

  await initialExtentButton.click();

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const normalizeNumber = (raw: string): number => {
    let token = raw.trim().replace(/\s/g, '');

    if (token.includes('.') && token.includes(',')) {
      token = token.replace(/,/g, '');
    } else {
      const commaCount = (token.match(/,/g) ?? []).length;
      if (commaCount > 1) {
        token = token.replace(/,/g, '');
      } else if (commaCount === 1 && !token.includes('.')) {
        const [integerPart, fractionalPart] = token.split(',');
        if (fractionalPart && fractionalPart.length !== 3) {
          token = `${integerPart}.${fractionalPart}`;
        } else {
          token = token.replace(/,/g, '');
        }
      }
    }

    return Number(token);
  };

  const parseCoordinateViewerText = (text: string): { x: number; y: number } | null => {
    const tokens = text.match(/[-+]?\d[\d\s.,]*/g) ?? [];
    const numbers = tokens.map(normalizeNumber).filter((value) => Number.isFinite(value));

    if (numbers.length < 2) {
      return null;
    }

    return { x: numbers[0], y: numbers[1] };
  };

  let lastCoordinateText = (await coordinateViewer.innerText()).trim();

  const sampleCoordinate = async (
    relativeX: number,
    relativeY: number
  ): Promise<{ x: number; y: number; text: string }> => {
    await page.mouse.move(box.x + relativeX, box.y + relativeY);

    await expect
      .poll(async () => {
        const text = (await coordinateViewer.innerText()).trim();
        const parsed = parseCoordinateViewerText(text);

        if (!parsed) {
          return null;
        }

        if (text === lastCoordinateText) {
          return null;
        }

        return text;
      })
      .not.toBeNull();

    const text = (await coordinateViewer.innerText()).trim();
    const parsed = parseCoordinateViewerText(text);

    if (!parsed) {
      throw new Error(`Could not parse map coordinates from coordinate viewer text: "${text}"`);
    }

    lastCoordinateText = text;
    return { ...parsed, text };
  };

  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

  const leftSampleX = box.width * 0.4;
  const rightSampleX = box.width * 0.6;
  const centerSampleY = box.height * 0.5;
  const centerSampleX = box.width * 0.5;
  const topSampleY = box.height * 0.35;
  const bottomSampleY = box.height * 0.65;

  const left = await sampleCoordinate(leftSampleX, centerSampleY);
  const right = await sampleCoordinate(rightSampleX, centerSampleY);
  const top = await sampleCoordinate(centerSampleX, topSampleY);
  const bottom = await sampleCoordinate(centerSampleX, bottomSampleY);

  const scaleX = (right.x - left.x) / (rightSampleX - leftSampleX);
  const scaleY = (bottom.y - top.y) / (bottomSampleY - topSampleY);

  expect(scaleX).not.toBe(0);
  expect(scaleY).not.toBe(0);

  const targetCoordinate = { x: 1188692.84, y: 6767643.28 };

  let clickX = leftSampleX + (targetCoordinate.x - left.x) / scaleX;
  let clickY = topSampleY + (targetCoordinate.y - top.y) / scaleY;

  clickX = clamp(clickX, 5, box.width - 5);
  clickY = clamp(clickY, 5, box.height - 5);

  const estimated = await sampleCoordinate(clickX, clickY);

  clickX += (targetCoordinate.x - estimated.x) / scaleX;
  clickY += (targetCoordinate.y - estimated.y) / scaleY;

  clickX = clamp(clickX, 5, box.width - 5);
  clickY = clamp(clickY, 5, box.height - 5);

  const refined = await sampleCoordinate(clickX, clickY);

  await expect
    .poll(() => Math.abs(refined.x - targetCoordinate.x))
    .toBeLessThan(Math.abs(scaleX) * 3);
  await expect
    .poll(() => Math.abs(refined.y - targetCoordinate.y))
    .toBeLessThan(Math.abs(scaleY) * 3);

  const featureInfoRequests: string[] = [];
  page.on('request', (request) => {
    if (/getfeatureinfo/i.test(request.url())) {
      featureInfoRequests.push(request.url());
    }
  });

  await mapContainer.click({
    position: { x: clickX, y: clickY }
  });

  await expect.poll(() => featureInfoRequests.length).toBeGreaterThan(0);

  await expect(infoPanel).toContainText(/UV-Index Station/i);
  await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
