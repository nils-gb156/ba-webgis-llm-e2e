// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  // The map container is typically identified by a test id or role.
  // Assuming standard Open Pioneer Trails map container test id if not specified.
  // If no specific test id is known for the map, we wait for a general load state
  // and assume the map canvas is present.
  await page.waitForLoadState('networkidle');

  // Ensure the info panel is visible.
  // The info panel usually has a specific test id or role.
  // Let's assume the info panel is visible by default or becomes visible after interaction.
  // We will locate the info panel container to assert its content later.
  // Common test id for info panel might be 'info-panel' or similar.
  // Without specific test ids provided in the prompt, we rely on accessible roles or text.
  // However, the prompt mentions "info panel is visible" as a precondition.
  // We will assume the info panel is rendered. Let's look for a container that likely holds the info.
  // Often, the info panel is a sidebar or a modal. Let's assume it's a div with a specific role or test id.
  // Since no test ids are provided for the UI elements, we will use getByRole or getByText cautiously.
  // But the prompt says "info panel is visible" as a precondition.
  // Let's assume the info panel has a test id 'info-panel' for robustness, or we find it by text.
  // Given the complexity, let's assume the info panel is the main content area for features.
  // We will click the map and then check for the presence of the feature info sections.

  // Click on the map at the specified coordinates [1188692.84, 6767643.28]
  // The map is rendered on a canvas. We need to click on the map container.
  // Assuming the map container has a test id 'map' or similar.
  // If not, we might need to find the canvas or the div containing it.
  // Let's assume the map container has a test id 'ba-webgis-map' or 'map'.
  // Without specific test ids, we might use getByRole('application') or similar if available.
  // Let's try to find the map by a common test id or role.
  // If no test id is available, we might use a scoped locator if the structure is known.
  // For this test, we will assume the map container has a test id 'map'.
  const mapLocator = page.getByTestId('map');
  await mapLocator.click({
    position: {
      x: 1188692.84,
      y: 6767643.28
    }
  });

  // Wait for the info panel to load the station info for both layers.
  // The info panel should display sections for 'UV-Index Station' and 'EUCOS Ground Station'.
  // We will wait for these sections to be visible.
  // Assuming the info panel has a test id 'info-panel'.
  const infoPanel = page.getByTestId('info-panel');
  
  // Wait for the UV-Index Station section to appear
  await expect(infoPanel.getByText('UV-Index Station')).toBeVisible({ timeout: 10000 });
  
  // Wait for the EUCOS Ground Station section to appear
  await expect(infoPanel.getByText('EUCOS Ground Station')).toBeVisible({ timeout: 10000 });
});
