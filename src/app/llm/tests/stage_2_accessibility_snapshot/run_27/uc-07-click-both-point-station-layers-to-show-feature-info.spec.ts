// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapApplication = page.getByRole('application', { name: 'webgis map', exact: true });
  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const initialExtentButton = page.getByTestId('initial-extent-button');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapApplication).toBeVisible();
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

  const uviStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  const eucosStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });

  if (!(await uviStationsCheckbox.isChecked())) {
    await uviStationsCheckbox.click({ force: true });
  }
  await expect(uviStationsCheckbox).toBeChecked();

  if (!(await eucosStationsCheckbox.isChecked())) {
    await eucosStationsCheckbox.click({ force: true });
  }
  await expect(eucosStationsCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  if ((await measurementToggle.getAttribute('aria-pressed')) !== null) {
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  }

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container bounding box is not available.');
  }

  const parseLocalizedNumber = (token: string): number => {
    const lastComma = token.lastIndexOf(',');
    const lastDot = token.lastIndexOf('.');
    const decimalSeparator =
      lastComma > lastDot ? ',' : lastDot > lastComma ? '.' : undefined;

    if (!decimalSeparator) {
      return Number(token.replace(/[^\d-]/g, ''));
    }

    const decimalIndex = Math.max(lastComma, lastDot);
    const integerPart = token.slice(0, decimalIndex).replace(/[.,]/g, '');
    const fractionPart = token.slice(decimalIndex + 1).replace(/[^\d]/g, '');
    return Number(`${integerPart}.${fractionPart}`);
  };

  const parseCoordinateViewer = (text: string | null): { x: number; y: number } | undefined => {
    if (!text) {
      return undefined;
    }

    const tokens = text.match(/-?[\d.,]+/g);
    if (!tokens || tokens.length < 2) {
      return undefined;
    }

    const numbers = tokens
      .map((token) => parseLocalizedNumber(token))
      .filter((value) => !Number.isNaN(value));

    if (numbers.length < 2) {
      return undefined;
    }

    const [x, y] = numbers.slice(-2);
    return { x, y };
  };

  let previousCoordinateText: string | null | undefined;

  const hoverAt = async (x: number, y: number) => {
    await mapContainer.hover({
      position: {
        x: Math.round(x),
        y: Math.round(y)
      }
    });
  };

  const waitForStableCoordinateAt = async (x: number, y: number) => {
    let lastText: string | null | undefined;
    await hoverAt(x, y);

    await expect.poll(async () => {
      const text = await coordinateViewer.textContent();
      const parsed = parseCoordinateViewer(text);
      const isStable = Boolean(parsed) && lastText !== undefined && text === lastText;
      lastText = text;
      return isStable;
    }).toBe(true);

    previousCoordinateText = await coordinateViewer.textContent();
  };

  const readCoordinateAt = async (x: number, y: number) => {
    await hoverAt(x, y);

    await expect.poll(async () => {
      const text = await coordinateViewer.textContent();
      const parsed = parseCoordinateViewer(text);
      return Boolean(parsed) && (previousCoordinateText === undefined || text !== previousCoordinateText);
    }).toBe(true);

    const currentText = await coordinateViewer.textContent();
    previousCoordinateText = currentText;

    const parsed = parseCoordinateViewer(currentText);
    if (!parsed) {
      throw new Error(`Could not parse coordinates from coordinate viewer text: ${currentText ?? '<empty>'}`);
    }

    return parsed;
  };

  await initialExtentButton.click();
  await waitForStableCoordinateAt(box.width * 0.5, box.height * 0.5);
  previousCoordinateText = undefined;

  const sampleLeftX = box.width * 0.25;
  const sampleRightX = box.width * 0.75;
  const sampleCenterX = box.width * 0.5;
  const sampleTopY = box.height * 0.25;
  const sampleBottomY = box.height * 0.75;
  const sampleCenterY = box.height * 0.5;

  const leftCoord = await readCoordinateAt(sampleLeftX, sampleCenterY);
  const rightCoord = await readCoordinateAt(sampleRightX, sampleCenterY);
  const topCoord = await readCoordinateAt(sampleCenterX, sampleTopY);
  const bottomCoord = await readCoordinateAt(sampleCenterX, sampleBottomY);

  const worldUnitsPerPixelX = (rightCoord.x - leftCoord.x) / (sampleRightX - sampleLeftX);
  const worldUnitsPerPixelY = (bottomCoord.y - topCoord.y) / (sampleBottomY - sampleTopY);

  const targetWorldX = 1188692.84;
  const targetWorldY = 6767643.28;

  let targetPixelX = sampleLeftX + (targetWorldX - leftCoord.x) / worldUnitsPerPixelX;
  let targetPixelY = sampleTopY + (targetWorldY - topCoord.y) / worldUnitsPerPixelY;

  const estimatedTargetCoord = await readCoordinateAt(targetPixelX, targetPixelY);

  targetPixelX += (targetWorldX - estimatedTargetCoord.x) / worldUnitsPerPixelX;
  targetPixelY += (targetWorldY - estimatedTargetCoord.y) / worldUnitsPerPixelY;

  targetPixelX = Math.max(1, Math.min(box.width - 1, targetPixelX));
  targetPixelY = Math.max(1, Math.min(box.height - 1, targetPixelY));

  await mapContainer.click({
    position: {
      x: Math.round(targetPixelX),
      y: Math.round(targetPixelY)
    }
  });

  await expect(infoPanel).toContainText(/UV-Index Station/i);
  await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
