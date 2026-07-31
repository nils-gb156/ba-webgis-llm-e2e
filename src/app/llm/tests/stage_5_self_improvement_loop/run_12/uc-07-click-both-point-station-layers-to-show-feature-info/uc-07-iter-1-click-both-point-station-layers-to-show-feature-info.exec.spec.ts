// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The initial state shows it is already visible, but we verify and ensure it stays open.
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

  // Ensure no measurement tool is active.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Verify preconditions: both station layers are rendered.
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Click on the map at the specified coordinates.
  const mapContainer = page.getByTestId('map-container');
  const clickX = 1188692.84;
  const clickY = 6767643.28;

  // Wait for the GetFeatureInfo responses before clicking to ensure a clean state.
  const [uvResponse, eucosResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('GetFeatureInfo') &&
        response.request().postData()?.includes('UV-Index Stations') === true,
    ),
    page.waitForResponse(
      (response) =>
        response.url().includes('GetFeatureInfo') &&
        response.request().postData()?.includes('EUCOS Ground Stations') === true,
    ),
  ]);

  await mapContainer.click({ position: { x: clickX, y: clickY } });

  // Wait for the responses to complete.
  await Promise.all([uvResponse, eucosResponse]);

  // Verify the info panel displays sections for both station types.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();

  // Verify the map highlight appeared at the clicked location.
  await expect.poll(() => getHighlightedCoordinate(page)).toEqual([clickX, clickY]);
});
