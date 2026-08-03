// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  const infoToggle = page.getByRole('button', { name: /^Info(?:rmation)?$/i });
  if (await infoToggle.count()) {
    const toggle = infoToggle.first();
    if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
      await toggle.click();
    }
  }

  const measurementToggle = page.getByRole('button', { name: /^Measure(?:ment)?$/i });
  if (await measurementToggle.count()) {
    const toggle = measurementToggle.first();
    if ((await toggle.getAttribute('aria-pressed')) === 'true') {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    }
  }

  const uvCheckbox = page.getByRole('checkbox', { name: /^UV-Index Stations$/ });
  const uvSwitch = page.getByRole('switch', { name: /^UV-Index Stations$/ });
  const eucosCheckbox = page.getByRole('checkbox', { name: /^EUCOS Ground Stations$/ });
  const eucosSwitch = page.getByRole('switch', { name: /^EUCOS Ground Stations$/ });

  if (
    (await uvCheckbox.count()) + (await uvSwitch.count()) === 0 ||
    (await eucosCheckbox.count()) + (await eucosSwitch.count()) === 0
  ) {
    const layersToggle = page.getByRole('button', { name: /layers/i });
    if (await layersToggle.count()) {
      const toggle = layersToggle.first();
      if ((await toggle.getAttribute('aria-pressed')) !== 'true') {
        await toggle.click();
      }
    }
  }

  const uvLayerControl =
    (await uvCheckbox.count()) > 0 ? uvCheckbox.first() : uvSwitch.first();
  const eucosLayerControl =
    (await eucosCheckbox.count()) > 0 ? eucosCheckbox.first() : eucosSwitch.first();

  await expect(uvLayerControl).toBeVisible();
  if (!(await uvLayerControl.isChecked())) {
    await uvLayerControl.click({ force: true });
  }
  await expect(uvLayerControl).toBeChecked();

  await expect(eucosLayerControl).toBeVisible();
  if (!(await eucosLayerControl.isChecked())) {
    await eucosLayerControl.click({ force: true });
  }
  await expect(eucosLayerControl).toBeChecked();

  const targetPixel = await page.evaluate(([x, y]) => {
    const values = Object.values(window as Record<string, unknown>);
    const map = values.find(
      (
        value
      ): value is {
        getPixelFromCoordinate: (coord: [number, number]) => [number, number];
        getViewport: () => HTMLElement;
      } =>
        typeof value === 'object' &&
        value !== null &&
        'getPixelFromCoordinate' in value &&
        typeof (value as { getPixelFromCoordinate?: unknown }).getPixelFromCoordinate === 'function' &&
        'getViewport' in value &&
        typeof (value as { getViewport?: unknown }).getViewport === 'function'
    );

    if (!map) {
      return null;
    }

    const pixel = map.getPixelFromCoordinate([x, y]);
    const viewport = map.getViewport();

    if (!Array.isArray(pixel) || pixel.length < 2 || !viewport) {
      return null;
    }

    return {
      x: Math.round(pixel[0]),
      y: Math.round(pixel[1]),
      width: viewport.clientWidth,
      height: viewport.clientHeight
    };
  }, [1188692.84, 6767643.28] as [number, number]);

  const viewportBox = await mapViewport.boundingBox();
  expect(viewportBox).not.toBeNull();

  const candidatePositions: Array<{ x: number; y: number }> = [];
  const addCandidate = (x: number, y: number) => {
    const candidate = { x: Math.round(x), y: Math.round(y) };
    if (
      candidate.x < 1 ||
      candidate.y < 1 ||
      candidate.x >= Math.round(viewportBox!.width) - 1 ||
      candidate.y >= Math.round(viewportBox!.height) - 1
    ) {
      return;
    }
    if (!candidatePositions.some((position) => position.x === candidate.x && position.y === candidate.y)) {
      candidatePositions.push(candidate);
    }
  };

  if (
    targetPixel &&
    targetPixel.x >= 0 &&
    targetPixel.y >= 0 &&
    targetPixel.x <= targetPixel.width &&
    targetPixel.y <= targetPixel.height
  ) {
    addCandidate(targetPixel.x, targetPixel.y);
  }

  const centerX = Math.round(viewportBox!.width / 2);
  const centerY = Math.round(viewportBox!.height / 2);
  const offsets: Array<[number, number]> = [
    [0, 0],
    [-60, 0],
    [60, 0],
    [0, -60],
    [0, 60],
    [-120, 0],
    [120, 0],
    [0, -120],
    [0, 120],
    [-60, -60],
    [60, -60],
    [-60, 60],
    [60, 60],
    [-160, 0],
    [160, 0],
    [0, -160],
    [0, 160]
  ];

  for (const [dx, dy] of offsets) {
    addCandidate(centerX + dx, centerY + dy);
  }

  const uvSection = page.getByText('UV-Index Station', { exact: true });
  const eucosSection = page.getByText('EUCOS Ground Station', { exact: true });

  let featureInfoLoaded = false;

  for (const position of candidatePositions) {
    await mapViewport.click({ position });

    try {
      await expect
        .poll(
          async () => ({
            uv: await uvSection.isVisible(),
            eucos: await eucosSection.isVisible()
          }),
          { timeout: 3000 }
        )
        .toEqual({ uv: true, eucos: true });

      featureInfoLoaded = true;
      break;
    } catch {
      // try next candidate position
    }
  }

  expect(featureInfoLoaded).toBeTruthy();
  await expect(uvSection).toBeVisible();
  await expect(eucosSection).toBeVisible();
});
