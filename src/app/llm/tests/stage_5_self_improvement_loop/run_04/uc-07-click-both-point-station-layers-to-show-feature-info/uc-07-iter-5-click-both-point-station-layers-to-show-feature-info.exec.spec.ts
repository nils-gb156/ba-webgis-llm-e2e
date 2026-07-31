// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and layers to be fully loaded.
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Verify measurement tool is not active.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  // Click on the map canvas at the specified coordinates.
  // The map is rendered on a <canvas> inside the container, so we click on the container.
  // Since the canvas intercepts pointer events, we need to force the click.
  await page.getByTestId('map-container').click({
    position: { x: 1188692.84, y: 6767643.28 },
    force: true,
  });

  // Wait for the info panel to display feature information for both layers.
  // The info panel content is rendered inside the element with test id 'info-panel'.
  const infoPanel = page.getByTestId('info-panel');

  // Use toContainText with a regex to match headings like "UV-Index Station" and "EUCOS Ground Station"
  await expect.poll(() =>
    infoPanel.getByRole('heading').allTextContents()
  ).toContain('UV-Index Station');

  await expect.poll(() =>
    infoPanel.getByRole('heading').allTextContents()
  ).toContain('EUCOS Ground Station');

  // Assert that a highlight marker was placed on the map at the clicked location.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
});
