// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial state to settle
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Get initial zoom level using the scale viewer as a proxy for map state
  // Since no map helper is provided, we rely on the scale viewer text which updates with zoom
  const initialScaleText = await page.getByRole('region', { name: /Current scale/ }).textContent();
  expect(initialScaleText).toBeTruthy();

  // Extract the denominator from the scale text (e.g., "1 to 2739072" -> 2739072)
  // Lower denominator means higher zoom (closer in)
  const initialDenominator = parseInt(initialScaleText?.match(/\d+/g)?.pop() || '0', 10);

  // Step 1: Click the 'Zoom in' button to increase the zoom level
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom action to complete by polling the scale viewer
  await expect.poll(async () => {
    const text = await page.getByRole('region', { name: /Current scale/ }).textContent();
    const denom = parseInt(text?.match(/\d+/g)?.pop() || '0', 10);
    return denom;
  }).toBeLessThan(initialDenominator, 'Zoom in should result in a smaller scale denominator (higher zoom)');

  const zoomedInDenominator = parseInt((await page.getByRole('region', { name: /Current scale/ }).textContent())?.match(/\d+/g)?.pop() || '0', 10);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom action to complete
  await expect.poll(async () => {
    const text = await page.getByRole('region', { name: /Current scale/ }).textContent();
    const denom = parseInt(text?.match(/\d+/g)?.pop() || '0', 10);
    return denom;
  }).toBeGreaterThan(zoomedInDenominator, 'Zoom out should result in a larger scale denominator (lower zoom) than after zooming in');
});
