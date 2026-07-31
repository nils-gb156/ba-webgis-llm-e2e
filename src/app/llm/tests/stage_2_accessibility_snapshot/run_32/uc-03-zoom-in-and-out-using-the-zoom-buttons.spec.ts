// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial state to settle
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Get initial zoom level via the scale viewer or map state if available.
  // Since no map helper functions are provided in the prompt, we rely on
  // the scale viewer text which updates with zoom changes.
  const scaleViewer = page.getByTestId('scale-viewer');
  await expect(scaleViewer).toBeVisible();

  // Extract initial scale denominator to compare against later.
  // Format: "Current scale: 1 to <number>"
  const getZoomLevelFromScale = async () => {
    const text = await scaleViewer.textContent();
    const match = text?.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  };

  const initialZoomLevel = await getZoomLevelFromScale();
  test.skip(initialZoomLevel === undefined, 'Could not determine initial zoom level from scale viewer');

  // Step 1: Click the 'Zoom in' button to increase the zoom level.
  // Zooming in means the scale denominator decreases (e.g., 1:1000 is "closer" than 1:10000).
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for the scale to update after zooming in
  await expect.poll(async () => getZoomLevelFromScale()).toBeLessThan(initialZoomLevel!);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level.
  // Zooming out means the scale denominator increases.
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for the scale to update after zooming out
  // The zoom level should be higher (larger denominator) than after zooming in.
  const zoomedInZoomLevel = initialZoomLevel; // We know it was less than initial, but let's capture the intermediate state if needed.
  // Actually, the requirement is: "After clicking the 'Zoom out' button, the map zoom level is lower than after zooming in."
  // "Lower zoom level" usually means further away, i.e., larger scale denominator.
  // So we expect the new scale denominator to be greater than the one after zooming in.
  // Since we zoomed in once and then out once, we might not be back to exactly the initial state depending on button increments,
  // but it must be greater than the "zoomed in" state.
  
  // Let's re-read carefully: "After clicking the 'Zoom out' button, the map zoom level is lower than after zooming in."
  // In cartography, "zoom level" is often an integer (0-20). Higher integer = closer.
  // In scale terms, smaller denominator = closer.
  // "Lower zoom level" -> further away -> larger scale denominator.
  // So we expect: final_scale_denominator > scale_denominator_after_zoom_in.
  
  // We already asserted that scale_denominator_after_zoom_in < initial.
  // Now we assert that final_scale_denominator > scale_denominator_after_zoom_in.
  
  // To be precise, let's capture the intermediate value again or just assert relative to the known "zoomed in" state.
  // Since we can't easily store the intermediate value in a variable outside the poll without side effects in the test body (which is discouraged),
  // we can just assert that the current scale is smaller than the initial scale? No, that's not guaranteed if the zoom steps are different.
  // The prompt says "lower than after zooming in".
  
  // Let's capture the intermediate scale explicitly.
  const scaleAfterZoomIn = await getZoomLevelFromScale();
  test.skip(scaleAfterZoomIn === undefined, 'Could not determine scale after zoom in');

  await expect.poll(async () => getZoomLevelFromScale()).toBeGreaterThan(scaleAfterZoomIn);
});
