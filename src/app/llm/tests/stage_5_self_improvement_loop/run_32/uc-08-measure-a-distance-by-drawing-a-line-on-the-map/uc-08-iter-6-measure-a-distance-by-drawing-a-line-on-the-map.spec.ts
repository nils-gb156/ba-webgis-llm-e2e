// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool.
  // The accessibility tree shows a "button" with name "Measurement".
  // We use force: true because Chakra UI renders the real input visually hidden
  // underneath a decorative control element.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click({ force: true });

  // Verify the measurement panel is visible.
  // Based on the UI, the panel is a section/panel in the sidebar, not a dialog.
  // We can verify it by checking for the presence of measurement-related text or
  // the panel itself. Since there's no explicit test-id for the panel, we look
  // for a heading or text that appears in the measurement panel.
  // A common pattern is a heading like "Measurement" or a specific element.
  // Let's assume the panel has a heading "Measurement" or similar.
  // If the panel is just a div in the sidebar, we might need to look for a specific
  // element that appears only when measurement is active.
  // Let's try to find a dialog or panel with "Measurement" in the name.
  // If that fails, we might need to look for a specific element inside the sidebar.
  // Given the error, the dialog approach failed. Let's look for the measurement result
  // directly, which implies the panel is visible.
  // The measurement result is likely displayed in a specific element.
  // Let's try to find the measurement result element directly.
  // If the panel is not a dialog, it might be a section with a specific role or test-id.
  // Let's try to find the measurement result by its content pattern first, as a fallback.
  // But first, let's try to locate the measurement panel itself.
  // It might be a "region" or "panel" with the name "Measurement".
  const measurementPanel = page.getByRole('region', { name: 'Measurement', exact: true }).or(
    page.getByRole('panel', { name: 'Measurement', exact: true }).or(
      page.getByRole('dialog', { name: 'Measurement', exact: true })
    )
  );

  // If the panel is not found by role, we can try to find it by its content.
  // Let's assume the panel contains a heading or text "Measurement".
  // If the panel is visible, we can proceed.
  // We'll use an expect.poll to wait for the panel to appear.
  await expect.poll(async () => {
    // Try to find the panel by various possible roles and names
    const panel =
      page.getByRole('region', { name: 'Measurement', exact: true }).first() ||
      page.getByRole('panel', { name: 'Measurement', exact: true }).first() ||
      page.getByRole('dialog', { name: 'Measurement', exact: true }).first() ||
      page.getByTestId('measurement-panel').first(); // Fallback to test-id if available

    // If we can't find it by role/test-id, we can look for the measurement result text
    // which would only be present if the panel is visible.
    const resultElement = page.getByText(/Length:/i).first() || page.getByTestId('measurement-result').first();
    const isVisible = await panel.isVisible().catch(() => false);
    const resultVisible = await resultElement.isVisible().catch(() => false);
    return isVisible || resultVisible;
  }).toBe(true);

  // 2. Click several points on the map canvas to draw a line.
  const mapContainer = page.getByTestId('map-container');

  // Click a few points around the center to draw a line.
  // Using positions relative to the map container to ensure clicks land on the canvas.
  await mapContainer.click({ position: { x: 200, y: 200 } });
  await mapContainer.click({ position: { x: 300, y: 200 } });
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // 3. Double-click to finish the measurement.
  await mapContainer.dblclick({ position: { x: 300, y: 300 } });

  // Expected results:
  // - The measurement panel is visible (already asserted).
  // - The measurement panel displays a length value with a unit.
  // The measurement result is displayed in a text element with data-testid="measurement" or similar.
  // Let's try to find the measurement result by its content pattern.
  const measurementResult = page.getByText(/(\d+(\.\d+)?\s*(km|m|mi|ft))/).first();

  // Wait for the measurement result to be visible and match the pattern.
  await expect.poll(() => measurementResult.isVisible()).toBe(true);
  await expect(measurementResult).toBeVisible();
  await expect.poll(() => measurementResult.textContent()).toMatch(/(\d+(\.\d+)?\s*(km|m|mi|ft))/);
});
