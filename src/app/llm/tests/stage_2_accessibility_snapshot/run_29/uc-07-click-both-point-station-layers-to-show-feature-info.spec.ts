// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const map = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(map).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(coordinateViewer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('initial-extent-button').click();

  const bbox = await map.boundingBox();
  expect(bbox).not.toBeNull();

  const parseCoordinateViewer = async () => {
    const text = (await coordinateViewer.textContent()) ?? '';
    const numbers = text.match(/-?\d+(?:\.\d+)?/g);
    if (!numbers || numbers.length < 2) {
      return undefined;
    }
    return {
      x: Number(numbers[0]),
      y: Number(numbers[1]),
    };
  };

  const readCoordinateAt = async (position: { x: number; y: number }) => {
    await map.hover({ position });
    let value: { x: number; y: number } | undefined;
    await expect
      .poll(async () => {
        value = await parseCoordinateViewer();
        return value ? `${value.x},${value.y}` : '';
      })
      .toMatch(/-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?/);
    return value!;
  };

  const width = bbox!.width;
  const height = bbox!.height;

  const leftSamplePos = { x: Math.round(width * 0.3), y: Math.round(height * 0.5) };
  const rightSamplePos = { x: Math.round(width * 0.7), y: Math.round(height * 0.5) };
  const topSamplePos = { x: Math.round(width * 0.5), y: Math.round(height * 0.3) };
  const bottomSamplePos = { x: Math.round(width * 0.5), y: Math.round(height * 0.7) };

  const leftCoord = await readCoordinateAt(leftSamplePos);
  const rightCoord = await readCoordinateAt(rightSamplePos);
  const topCoord = await readCoordinateAt(topSamplePos);
  const bottomCoord = await readCoordinateAt(bottomSamplePos);

  const targetMapCoordinate = { x: 1188692.84, y: 6767643.28 };

  const xScale = (rightSamplePos.x - leftSamplePos.x) / (rightCoord.x - leftCoord.x);
  const yScale = (bottomSamplePos.y - topSamplePos.y) / (bottomCoord.y - topCoord.y);

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  let targetPixel = {
    x: clamp(
      leftSamplePos.x + (targetMapCoordinate.x - leftCoord.x) * xScale,
      1,
      width - 1
    ),
    y: clamp(
      topSamplePos.y + (targetMapCoordinate.y - topCoord.y) * yScale,
      1,
      height - 1
    ),
  };

  for (let i = 0; i < 2; i++) {
    const actualCoord = await readCoordinateAt(targetPixel);
    targetPixel = {
      x: clamp(targetPixel.x + (targetMapCoordinate.x - actualCoord.x) * xScale, 1, width - 1),
      y: clamp(targetPixel.y + (targetMapCoordinate.y - actualCoord.y) * yScale, 1, height - 1),
    };
  }

  const finalHoveredCoord = await readCoordinateAt(targetPixel);
  expect(Math.abs(finalHoveredCoord.x - targetMapCoordinate.x)).toBeLessThan(10000);
  expect(Math.abs(finalHoveredCoord.y - targetMapCoordinate.y)).toBeLessThan(10000);

  let getFeatureInfoRequestUrl: string | undefined;
  page.on('request', request => {
    if (request.url().toLowerCase().includes('getfeatureinfo')) {
      getFeatureInfoRequestUrl = request.url();
    }
  });

  const getFeatureInfoResponse = page.waitForResponse(
    response =>
      response.url().toLowerCase().includes('getfeatureinfo') && response.status() === 200
  );

  await map.click({
    position: {
      x: Math.round(targetPixel.x),
      y: Math.round(targetPixel.y),
    },
  });

  await expect.poll(() => getFeatureInfoRequestUrl).toBeTruthy();
  await getFeatureInfoResponse;

  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
});
