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

  let clickPosition: { x: number; y: number } | undefined;
  await expect
    .poll(async () => {
      clickPosition = await mapContainer.evaluate((element, coordinate) => {
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

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return undefined;
        }
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
          return undefined;
        }

        return { x, y };
      }, targetCoordinate);

      return clickPosition !== undefined;
    })
    .toBe(true);

  expect(clickPosition).toBeDefined();

  const requestedUrls: string[] = [];
  page.on('request', request => {
    requestedUrls.push(request.url());
  });

  const getFeatureInfoResponsePromise = page.waitForResponse(response => {
    return response.ok() && /getfeatureinfo/i.test(response.url());
  });

  await mapContainer.click({
    position: {
      x: clickPosition!.x,
      y: clickPosition!.y
    }
  });

  const getFeatureInfoResponse = await getFeatureInfoResponsePromise;
  await expect.poll(() => requestedUrls.some(url => /getfeatureinfo/i.test(url))).toBe(true);

  const getFeatureInfoResponseText = await getFeatureInfoResponse.text();
  expect(getFeatureInfoResponseText.trim().length).toBeGreaterThan(0);

  const getNormalizedInfoPanelText = async () => {
    return ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  };

  await expect.poll(getNormalizedInfoPanelText, { timeout: 15000 }).toMatch(/UV-Index Station/i);
  await expect.poll(getNormalizedInfoPanelText, { timeout: 15000 }).toMatch(/EUCOS Ground Station/i);

  await expect
    .poll(async () => {
      const text = await getNormalizedInfoPanelText();

      const uvMatch = /UV-Index Station/i.exec(text);
      const eucosMatch = /EUCOS Ground Station/i.exec(text);

      if (!uvMatch || uvMatch.index === undefined || !eucosMatch || eucosMatch.index === undefined) {
        return false;
      }

      const sections = [
        { heading: uvMatch[0], start: uvMatch.index },
        { heading: eucosMatch[0], start: eucosMatch.index }
      ].sort((a, b) => a.start - b.start);

      return sections.every((section, index) => {
        const nextStart = sections[index + 1]?.start ?? text.length;
        const sectionBody = text.slice(section.start + section.heading.length, nextStart).trim();
        return sectionBody.length >= 20;
      });
    }, { timeout: 15000 })
    .toBe(true);
});
