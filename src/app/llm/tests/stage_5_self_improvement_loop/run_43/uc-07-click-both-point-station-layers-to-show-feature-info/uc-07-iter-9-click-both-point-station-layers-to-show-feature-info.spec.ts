// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure measurement tool is NOT active.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const measurementState = await measurementToggle.getAttribute('aria-pressed');
  if (measurementState === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Precondition: Info panel is visible.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Precondition: UV-Index Stations and EUCOS Ground Stations layers are active.
  await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Step 1: The user clicks at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  const mapContainer = page.getByTestId('map-container');
  // Use force: true because the map canvas may intercept pointer events
  await mapContainer.click({ position: { x: 1188692.84, y: 6767643.28 }, force: true });

  // Step 2: The user waits for the info panel to load the station info for both layers.
  // Expected results: The info panel displays a 'UV-Index Station' section and an 'EUCOS Ground Station' section.
  // The panel headings use the layer titles as accessible names.
  // Use expect.poll to wait for the info panel content to appear, as it loads asynchronously.
  await expect.poll(async () => {
    const uviHeading = infoPanel.getByRole('heading', { name: 'UV-Index Station', level: 2 });
    const ecusHeading = infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', level: 2 });
    const uviVisible = await uviHeading.isVisible();
    const ecusVisible = await ecusHeading.isVisible();
    return { uviVisible, ecusVisible };
  }).toEqual({ uviVisible: true, ecusVisible: true });
});
