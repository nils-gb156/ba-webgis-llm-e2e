// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('measurement-toggle')).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');
  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });

  if (!(await measurementPanel.isVisible())) {
    await measurementToggle.click();
  }

  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(measurementPanel).toBeVisible();
  await expect(measurementDialog).toBeVisible();
  await expect(measurementDialog.getByRole('heading', { name: 'Measurement', exact: true })).toBeVisible();

  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 520, y: 220 } });
  await mapContainer.click({ position: { x: 680, y: 300 } });
  await mapContainer.dblclick({ position: { x: 840, y: 380 } });

  await expect(
    page.getByRole('tooltip', { name: /\b\d[\d.,]*\s*(?:m|km)\b/ })
  ).toBeVisible();
});
