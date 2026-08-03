// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const legend = page.getByTestId('legend');
  const legendToggle = page.getByTestId('legend-toggle');
  const mapContainer = page.getByTestId('map-container');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const initialExtentButton = page.getByTestId('initial-extent-button');

  await expect(mapContainer).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();
  } else {
    await expect(infoPanel).toBeVisible();
  }

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();
  } else {
    await expect(layerSwitcher).toBeVisible();
  }

  const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  const uviCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  }

  await initialExtentButton.click();

  if (await legend.isVisible()) {
    if ((await legendToggle.getAttribute('aria-pressed')) === 'true') {
      await legendToggle.click();
      await expect(legend).not.toBeVisible();
    }
  }

  if (await layerSwitcher.isVisible()) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) === 'true') {
      await layerSwitcherToggle.click();
      await expect(layerSwitcher).not.toBeVisible();
    }
  }

  await expect(infoPanel).toBeVisible();

  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  const parseLocalizedNumber = (value: string): number => {
    const trimmed = value.trim();
    const lastDot = trimmed.lastIndexOf('.');
    const lastComma = trimmed.lastIndexOf(',');

    if (lastDot !== -1 && lastComma !== -1) {
      if (lastDot > lastComma) {
        return Number(trimmed.replace(/,/g, ''));
      }
      return Number(trimmed.replace(/\./g, '').replace(',', '.'));
    }

    if (lastComma !== -1) {
      const commaCount = (trimmed.match(/,/g) ?? []).length;
      if (commaCount > 1) {
        return Number(trimmed.replace(/,/g, ''));
      }
      const digitsAfter = trimmed.length - lastComma - 1;
      return Number(digitsAfter === 3 ? trimmed.replace(/,/g, '') : trimmed.replace(',', '.'));
    }

    if (lastDot !== -1) {
      const dotCount = (trimmed.match(/\./g) ?? []).length;
      if (dotCount > 1) {
        return Number(trimmed.replace(/\./g, ''));
      }
    }

    return Number(trimmed);
  };

  const parseCoordinatePair = (text: string): { x: number; y: number } | undefined => {
    const matches = text.match(/-?\d[\d.,]*/g);
    if (!matches || matches.length < 2) {
      return undefined;
    }

    const numbers = matches
      .map((match) => parseLocalizedNumber(match))
      .filter((value) => Number.isFinite(value));

    if (numbers.length < 2) {
      return undefined;
    }

    return { x: numbers[0], y: numbers[1] };
  };

  const readCoordinateAt = async (
    relativeX: number,
    relativeY: number,
    requireChange: boolean
  ): Promise<{ relativeX: number; relativeY: number; x: number; y: number }> => {
    const box = await mapContainer.boundingBox();
    if (!box) {
      throw new Error('Map container has no bounding box.');
    }

    const x = clamp(Math.round(relativeX), 1, Math.round(box.width) - 1);
    const y = clamp(Math.round(relativeY), 1, Math.round(box.height) - 1);
    const previousText = await coordinateViewer.innerText();

    await page.mouse.move(box.x + x, box.y + y);

    await expect
      .poll(async () => {
        const text = await coordinateViewer.innerText();
        const pair = parseCoordinatePair(text);
        if (!pair) {
          return undefined;
        }
        if (requireChange && text === previousText) {
          return undefined;
        }
        return `${pair.x},${pair.y}`;
      })
      .toMatch(/^-?\d/);

    const text = await coordinateViewer.innerText();
    const pair = parseCoordinatePair(text);
    if (!pair) {
      throw new Error(`Could not parse map coordinates from coordinate viewer text: "${text}"`);
    }

    return { relativeX: x, relativeY: y, x: pair.x, y: pair.y };
  };

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const leftX = clamp(Math.round(box.width * 0.12), 40, Math.round(box.width * 0.45));
  const rightX = clamp(Math.round(box.width * 0.55), leftX + 40, Math.round(box.width) - 40);
  const topY = clamp(Math.round(box.height * 0.18), 40, Math.round(box.height * 0.4));
  const bottomY = clamp(Math.round(box.height * 0.82), topY + 40, Math.round(box.height) - 40);

  const topLeft = await readCoordinateAt(leftX, topY, true);
  const topRight = await readCoordinateAt(rightX, topY, true);
  const bottomLeft = await readCoordinateAt(leftX, bottomY, true);

  const xPerPixel = (topRight.x - topLeft.x) / (topRight.relativeX - topLeft.relativeX);
  const yPerPixel = (bottomLeft.y - topLeft.y) / (bottomLeft.relativeY - topLeft.relativeY);

  expect(Math.abs(xPerPixel)).toBeGreaterThan(0);
  expect(Math.abs(yPerPixel)).toBeGreaterThan(0);

  const target = { x: 1188692.84, y: 6767643.28 };

  let clickX =
    topLeft.relativeX + (target.x - topLeft.x) / xPerPixel;
  let clickY =
    topLeft.relativeY + (target.y - topLeft.y) / yPerPixel;

  let refined = await readCoordinateAt(clickX, clickY, false);

  for (let i = 0; i < 5; i++) {
    const deltaX = target.x - refined.x;
    const deltaY = target.y - refined.y;

    if (
      Math.abs(deltaX) <= Math.abs(xPerPixel) * 1.5 &&
      Math.abs(deltaY) <= Math.abs(yPerPixel) * 1.5
    ) {
      break;
    }

    clickX = refined.relativeX + deltaX / xPerPixel;
    clickY = refined.relativeY + deltaY / yPerPixel;
    refined = await readCoordinateAt(clickX, clickY, false);
  }

  expect(Math.abs(target.x - refined.x)).toBeLessThanOrEqual(Math.abs(xPerPixel) * 2);
  expect(Math.abs(target.y - refined.y)).toBeLessThanOrEqual(Math.abs(yPerPixel) * 2);

  await mapContainer.click({
    position: {
      x: refined.relativeX,
      y: refined.relativeY
    }
  });

  await expect(infoPanel).toContainText(/UV-Index Station/i);
  await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
