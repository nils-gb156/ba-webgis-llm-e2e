// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter } from '../../../../map-model-helpers';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanelHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const app = page.getByRole('application', { name: 'webgis map' });

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  await expect
    .poll(async () => {
      const center = await getMapCenter(page);
      return Array.isArray(center) && center.length === 2;
    })
    .toBe(true);

  const getVisibleLengthMatches = async (): Promise<string[]> => {
    const text = await app.innerText();
    return text.match(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/gi) ?? [];
  };

  const initialLengthMatches = await getVisibleLengthMatches();

  if (!(await measurementPanelHeading.isVisible())) {
    await measurementToggle.click();
  }

  await expect(measurementPanelHeading).toBeVisible();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  const firstPoint = {
    x: Math.round(mapBox!.width * 0.40),
    y: Math.round(mapBox!.height * 0.38)
  };
  const secondPoint = {
    x: Math.round(mapBox!.width * 0.52),
    y: Math.round(mapBox!.height * 0.45)
  };
  const thirdPoint = {
    x: Math.round(mapBox!.width * 0.64),
    y: Math.round(mapBox!.height * 0.54)
  };

  await mapContainer.click({ position: firstPoint });
  await mapContainer.click({ position: secondPoint });
  await mapContainer.dblclick({ position: thirdPoint });

  await expect
    .poll(async () => (await getVisibleLengthMatches()).length)
    .toBeGreaterThan(initialLengthMatches.length);

  await expect
    .poll(async () => {
      const matches = await getVisibleLengthMatches();
      return matches.find((match) => !initialLengthMatches.includes(match)) ?? '';
    })
    .toMatch(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i);
});
