// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  type MapCoordinate = { x: number; y: number };
  type PixelPosition = { x: number; y: number };

  const targetMapCoordinate: MapCoordinate = { x: 1188692.84, y: 6767643.28 };

  const parseLocalizedNumber = (raw: string): number => {
    const cleaned = raw.replace(/[^\d,.-]/g, '');
    if (!cleaned) {
      return Number.NaN;
    }

    if (cleaned.includes('.') && cleaned.includes(',')) {
      if (cleaned.lastIndexOf('.') > cleaned.lastIndexOf(',')) {
        return Number(cleaned.replace(/,/g, ''));
      }
      return Number(cleaned.replace(/\./g, '').replace(',', '.'));
    }

    if (cleaned.includes(',')) {
      const fraction = cleaned.split(',').pop() ?? '';
      if (fraction.length > 0 && fraction.length <= 3) {
        return Number(cleaned.replace(',', '.'));
      }
      return Number(cleaned.replace(/,/g, ''));
    }

    return Number(cleaned);
  };

  const parseCoordinateText = (text: string): MapCoordinate | undefined => {
    const matches = text.match(/-?\d[\d.,-]*/g);
    if (!matches || matches.length < 2) {
      return undefined;
    }

    const x = parseLocalizedNumber(matches[0]);
    const y = parseLocalizedNumber(matches[1]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return undefined;
    }

    return { x, y };
  };

  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(max, Math.max(min, value));
  };

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const initialExtentButton = page.getByTestId('initial-extent-button');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

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

  await initialExtentButton.click();

  await expect(coordinateViewer).toBeVisible();

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container bounding box is not available.');
  }

  const hoverMapAndReadCoordinates = async (
    position: PixelPosition,
    previous?: MapCoordinate
  ): Promise<MapCoordinate> => {
    const hoverPosition = {
      x: Math.round(clamp(position.x, 2, box.width - 2)),
      y: Math.round(clamp(position.y, 2, box.height - 2))
    };

    await mapContainer.hover({ position: hoverPosition });

    let parsed: MapCoordinate | undefined;
    await expect.poll(async () => {
      parsed = parseCoordinateText(await coordinateViewer.innerText());
      if (!parsed) {
        return 'missing';
      }
      if (!previous) {
        return 'ready';
      }

      const changed =
        Math.abs(parsed.x - previous.x) > 0.01 || Math.abs(parsed.y - previous.y) > 0.01;

      return changed ? 'ready' : 'unchanged';
    }).toBe('ready');

    return parsed!;
  };

  const sampleLeft: PixelPosition = {
    x: Math.round(box.width * 0.2),
    y: Math.round(box.height * 0.5)
  };
  const sampleRight: PixelPosition = {
    x: Math.round(box.width * 0.8),
    y: Math.round(box.height * 0.5)
  };
  const sampleTop: PixelPosition = {
    x: Math.round(box.width * 0.5),
    y: Math.round(box.height * 0.2)
  };
  const sampleBottom: PixelPosition = {
    x: Math.round(box.width * 0.5),
    y: Math.round(box.height * 0.8)
  };

  const leftCoordinates = await hoverMapAndReadCoordinates(sampleLeft);
  const rightCoordinates = await hoverMapAndReadCoordinates(sampleRight, leftCoordinates);
  const topCoordinates = await hoverMapAndReadCoordinates(sampleTop, rightCoordinates);
  const bottomCoordinates = await hoverMapAndReadCoordinates(sampleBottom, topCoordinates);

  const xUnitsPerPixel =
    (rightCoordinates.x - leftCoordinates.x) / (sampleRight.x - sampleLeft.x);
  const yUnitsPerPixel =
    (bottomCoordinates.y - topCoordinates.y) / (sampleBottom.y - sampleTop.y);

  expect(Math.abs(xUnitsPerPixel)).toBeGreaterThan(0);
  expect(Math.abs(yUnitsPerPixel)).toBeGreaterThan(0);

  let targetPixel: PixelPosition = {
    x: sampleLeft.x + (targetMapCoordinate.x - leftCoordinates.x) / xUnitsPerPixel,
    y: sampleTop.y + (targetMapCoordinate.y - topCoordinates.y) / yUnitsPerPixel
  };

  let previousHoverCoordinates = bottomCoordinates;

  for (let attempt = 0; attempt < 3; attempt++) {
    targetPixel = {
      x: clamp(targetPixel.x, 2, box.width - 2),
      y: clamp(targetPixel.y, 2, box.height - 2)
    };

    const hoveredCoordinates = await hoverMapAndReadCoordinates(
      {
        x: Math.round(targetPixel.x),
        y: Math.round(targetPixel.y)
      },
      previousHoverCoordinates
    );

    previousHoverCoordinates = hoveredCoordinates;

    const deltaX = targetMapCoordinate.x - hoveredCoordinates.x;
    const deltaY = targetMapCoordinate.y - hoveredCoordinates.y;

    if (
      Math.abs(deltaX) <= Math.abs(xUnitsPerPixel) * 1.5 &&
      Math.abs(deltaY) <= Math.abs(yUnitsPerPixel) * 1.5
    ) {
      break;
    }

    targetPixel = {
      x: targetPixel.x + deltaX / xUnitsPerPixel,
      y: targetPixel.y + deltaY / yUnitsPerPixel
    };
  }

  const finalClickPosition: PixelPosition = {
    x: Math.round(clamp(targetPixel.x, 2, box.width - 2)),
    y: Math.round(clamp(targetPixel.y, 2, box.height - 2))
  };

  const getFeatureInfoResponse = page.waitForResponse((response) => {
    return response.ok() && response.url().toLowerCase().includes('getfeatureinfo');
  });

  await mapContainer.click({ position: finalClickPosition });
  await getFeatureInfoResponse;

  await expect(infoPanel.getByText(/UV-Index Station/i)).toBeVisible();
  await expect(infoPanel.getByText(/EUCOS Ground Station/i)).toBeVisible();
});
