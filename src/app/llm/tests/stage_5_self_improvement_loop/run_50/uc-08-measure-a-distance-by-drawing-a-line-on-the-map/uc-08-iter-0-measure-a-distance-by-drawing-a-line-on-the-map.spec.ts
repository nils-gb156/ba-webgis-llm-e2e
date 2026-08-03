// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const app = page.getByRole('application', { name: 'webgis map' });
  const mapContainer = page.getByTestId('map-container');
  const measurementButton = page.getByTestId('measurement-toggle');

  await expect(app).toBeVisible();
  await expect(mapContainer).toBeVisible();
  await expect(measurementButton).toBeVisible();

  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  const measurementPanelVisible = async () => {
    const appText = (await app.textContent()) ?? '';
    return /(Length|Distance)/i.test(appText);
  };

  if (!(await measurementPanelVisible())) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  await expect.poll(measurementPanelVisible).toBe(true);

  await mapContainer.click({ position: { x: 520, y: 220 } });
  await mapContainer.click({ position: { x: 680, y: 300 } });
  await mapContainer.dblclick({ position: { x: 860, y: 380 } });

  await expect.poll(async () => {
    const appText = (await app.textContent()) ?? '';
    const match = appText.match(/\b(\d+(?:[.,]\d+)?)\s?(km|m)\b/i);
    if (!match) {
      return undefined;
    }

    const numericValue = Number(match[1].replace(',', '.'));
    const unit = match[2].toLowerCase();
    return unit === 'km' ? numericValue * 1000 : numericValue;
  }).toBeGreaterThan(0);
});
