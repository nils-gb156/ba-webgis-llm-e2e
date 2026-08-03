// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const uvIndexStationsCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  const eucosGroundStationsCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });

  if (!(await uvIndexStationsCheckbox.isChecked())) {
    await uvIndexStationsCheckbox.click({ force: true });
  }
  if (!(await eucosGroundStationsCheckbox.isChecked())) {
    await eucosGroundStationsCheckbox.click({ force: true });
  }

  await expect(uvIndexStationsCheckbox).toBeChecked();
  await expect(eucosGroundStationsCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  const getMapClickContext = async (): Promise<
    | {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    | undefined
  > => {
    return await mapContainer.evaluate((element, coordinate) => {
      const map = (globalThis as {
        __openPioneerMap?: {
          olMap?: {
            getPixelFromCoordinate?: (c: [number, number]) => number[] | undefined;
          };
        };
      }).__openPioneerMap;

      const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate as [number, number]);
      if (!Array.isArray(pixel) || pixel.length < 2) {
        return undefined;
      }

      const rect = (element as HTMLElement).getBoundingClientRect();
      const x = Math.round(pixel[0]);
      const y = Math.round(pixel[1]);
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      if (!Number.isFinite(x) || !Number.isFinite(y) || width <= 0 || height <= 0) {
        return undefined;
      }
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return undefined;
      }

      return { x, y, width, height };
    }, targetCoordinate);
  };

  await expect.poll(getMapClickContext).toBeTruthy();

  const clickContext = await getMapClickContext();
  expect(clickContext).toBeDefined();

  const requestedUrls: string[] = [];
  page.on('request', request => {
    requestedUrls.push(request.url());
  });

  const normalizeText = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim();
  const getNormalizedInfoPanelText = async () => normalizeText(await infoPanel.textContent());

  const hasBothStationSections = async () => {
    const text = await getNormalizedInfoPanelText();
    return /UV-Index Station/i.test(text) && /EUCOS Ground Station/i.test(text);
  };

  const candidateOffsets = [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 0, y: 3 },
    { x: 0, y: 4 },
    { x: 1, y: 2 },
    { x: -1, y: 2 },
    { x: 2, y: 2 },
    { x: -2, y: 2 },
    { x: 0, y: 5 },
    { x: 1, y: 4 },
    { x: -1, y: 4 },
    { x: 0, y: -1 },
    { x: 0, y: -2 }
  ];

  let foundBothSections = false;

  for (const offset of candidateOffsets) {
    const clickX = clickContext!.x + offset.x;
    const clickY = clickContext!.y + offset.y;

    if (clickX < 0 || clickY < 0 || clickX >= clickContext!.width || clickY >= clickContext!.height) {
      continue;
    }

    await mapContainer.click({
      position: {
        x: clickX,
        y: clickY
      }
    });

    try {
      await expect.poll(hasBothStationSections, { timeout: 5000 }).toBe(true);
      foundBothSections = true;
      break;
    } catch {
      // Try the next nearby pixel to compensate for sub-pixel rounding / hit tolerance.
    }
  }

  expect(foundBothSections).toBe(true);
  await expect.poll(() => requestedUrls.some(url => /getfeatureinfo/i.test(url))).toBe(true);

  await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();

  await expect(page.getByTestId('uvi-station-section')).toBeVisible();

  await expect
    .poll(async () => {
      const text = await getNormalizedInfoPanelText();

      const uvMatch = /UV-Index Station/i.exec(text);
      const eucosMatch = /EUCOS Ground Station/i.exec(text);

      if (!uvMatch || typeof uvMatch.index !== 'number' || !eucosMatch || typeof eucosMatch.index !== 'number') {
        return false;
      }

      const sections = [
        { heading: uvMatch[0], start: uvMatch.index },
        { heading: eucosMatch[0], start: eucosMatch.index }
      ].sort((a, b) => a.start - b.start);

      return sections.every((section, index) => {
        const nextStart = sections[index + 1]?.start ?? text.length;
        const sectionBody = text.slice(section.start + section.heading.length, nextStart).trim();
        return sectionBody.length > 10;
      });
    }, { timeout: 15000 })
    .toBe(true);
});
