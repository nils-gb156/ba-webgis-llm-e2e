// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The accessibility tree shows the Info Panel Switcher is already pressed (active),
  // so the panel should be visible. We wait for it to be visible to ensure readiness.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Ensure no measurement tool is active.
  // The accessibility tree does not show the Measurement button as pressed.
  // We assert it is not pressed to be safe, but do not click it.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementToggle).not.toBeChecked();

  // Ensure UV-Index Stations layer is active.
  // The accessibility tree shows "UV-Index Stations" checkbox is checked.
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  await expect(uviCheckbox).toBeChecked();

  // Ensure EUCOS Ground Stations layer is active.
  // The accessibility tree shows "EUCOS Ground Stations" checkbox is checked.
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  await expect(eucosCheckbox).toBeChecked();

  // Click on the map at the specified coordinates.
  // The map container is the canvas area.
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 1188692.84, y: 6767643.28 },
  });

  // Wait for the info panel to load the station info for both layers.
  // We look for the headings or sections corresponding to the feature info.
  // Based on the expected results, we expect 'UV-Index Station' and 'EUCOS Ground Station' sections.

  // Wait for UV-Index Station info to appear
  await expect(page.getByText('UV-Index Station', { exact: false })).toBeVisible({
    timeout: 10000,
  });

  // Wait for EUCOS Ground Station info to appear
  await expect(page.getByText('EUCOS Ground Station', { exact: false })).toBeVisible({
    timeout: 10000,
  });

  // Verify that the info panel contains information for both layers.
  // We check that the info panel contains text indicating the presence of both stations.
  // Since the exact structure of the feature info is not fully detailed in the prompt,
  // we assert on the presence of the section headers/names which are the most stable identifiers.

  // Assert UV-Index Station section is present
  const uviSection = page.getByRole('region', { name: 'UV-Index Station', exact: false }).first();
  await expect(uviSection).toBeVisible();

  // Assert EUCOS Ground Station section is present
  const eucosSection = page.getByRole('region', { name: 'EUCOS Ground Station', exact: false }).first();
  await expect(eucosSection).toBeVisible();
});
