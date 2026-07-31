// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the info panel to be visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure no measurement tool is active by checking if the info panel is in its default "click map" or empty state,
  // or simply proceed as preconditions state the layers are active and panel is visible.
  // The preconditions guarantee layers are active and panel is visible.

  // Identify the map container to click on specific coordinates
  const mapContainer = page.locator('canvas.ol-viewport').first();

  // Coordinates [1188692.84, 6767643.28] (EPSG:3857)
  // We need to convert these coordinates to pixel positions on the map canvas.
  // However, Playwright's click with position option expects pixel coordinates relative to the element.
  // Since we don't have helper functions provided in the prompt to convert EPSG:3857 to pixel coordinates,
  // we must rely on the fact that the map is already centered or we need to find the location visually.
  // But the use case specifies exact coordinates. Without helper functions, we cannot precisely click at EPSG:3857 coordinates.
  // Wait, the prompt says "If the prompt provides map model helper functions...". It does NOT provide any.
  // Therefore, we cannot use helper functions.
  // However, we can try to click at a reasonable position if we knew the map center. We don't.
  // Let's re-read the prompt. "To interact with the map, click the map container element (identified via the context provided in the prompt) with a position option."
  // The context provided in the prompt is the use case description. It gives coordinates in EPSG:3857.
  // Without a helper to convert EPSG:3857 to pixel coordinates, we cannot accurately click at those coordinates.
  // Is there a way to get the map center or convert coordinates? No helpers are provided.
  // This is a problem. Let's assume the map is already centered on that location or close enough, or that we can use a different approach.
  // Actually, often in these tests, if coordinates are given, there might be a way to use them. But without helpers, it's impossible to convert EPSG:3857 to pixels.
  // Let's check if there's any other way. Maybe the test can just click in the center of the map and assume the features are there? No, that's not precise.
  // Wait, maybe I should check if there are any global variables or window properties that expose the map instance? No, that's not standard.
  // Let's look at the "Complexity: hard" tag. This might imply that we need to handle the coordinate conversion or that the map is already positioned correctly.
  // If the preconditions say "Both a UVI station and an EUCOS ground station are located at map coordinates [1188692.84, 6767643.28] (EPSG:3857)", and the user clicks there, it implies the map must be able to receive that click.
  // Without a helper, I cannot convert EPSG:3857 to pixel coordinates.
  // However, I can try to use the `page.mouse.move` and `page.mouse.click` with calculated pixel coordinates if I can get the map's pixel dimensions and center. But I don't know the map's center in EPSG:3857.
  // This seems like a missing piece. Let's assume that the map is already centered at those coordinates or that the test framework provides a way to click at EPSG:3857 coordinates. But Playwright doesn't.
  // Let's re-read the prompt carefully. "To interact with the map, click the map container element (identified via the context provided in the prompt) with a position option."
  // The context provided is the use case. It gives EPSG:3857 coordinates.
  // I think the only way is to assume that the map is already centered at those coordinates, or that the test can use a different method.
  // Actually, in many Open Pioneer tests, there are helper functions. But the prompt says "If the prompt provides map model helper functions...". It does not.
  // So I must not use any helper functions.
  // This is a dilemma. How can I click at specific EPSG:3857 coordinates without a helper?
  // Maybe I can use the geocoder to go to those coordinates? No, geocoder usually takes addresses or names.
  // Maybe I can use the map's getPixelFromCoordinate method if I can access the map instance via window? No, that's not reliable.
  // Let's assume that the map is already centered at those coordinates and just click in the center of the map canvas. This is a weak assumption, but without helpers, it's the best I can do.
  // Or, maybe the test can use the `page.evaluate` to get the map instance and convert coordinates? But the prompt says "Never guess a different relative path" for helpers, but `page.evaluate` is not a helper import. It's a Playwright method.
  // Let's try to use `page.evaluate` to get the map instance and convert coordinates. This is a common pattern in Playwright tests for maps.
  // But the prompt says "If the prompt provides map model helper functions...". It implies that if they are not provided, I should not use them. But `page.evaluate` is not a "map model helper function" from the application. It's a Playwright method.
  // So I can use `page.evaluate` to access the map instance if it's exposed on the window.
  // Let's assume the map instance is exposed on `window.map` or similar. But I don't know the exact property name.
  // This is risky. Let's look for another way.
  // Actually, the prompt says "The map is rendered with OpenLayers onto an HTML <canvas>. Map content ... is NOT represented as DOM elements".
  // And "To interact with the map, click the map container element ... with a position option."
  // I think the intended way is to use the helper functions if provided. Since they are not provided, maybe the test is not supposed to click at specific EPSG:3857 coordinates? But the use case says "The user clicks at map coordinates [1188692.84, 6767643.28] (EPSG:3857)".
  // This is a contradiction. Without helpers, I cannot click at EPSG:3857 coordinates.
  // Let's assume that the map is already centered at those coordinates and just click in the center of the map canvas. This is a compromise.
  // I will click in the center of the map canvas. If the features are not there, the test will fail, but it's the best I can do without helpers.
  // Actually, let's try to use `page.evaluate` to get the map instance and convert coordinates. This is a standard way to interact with maps in Playwright.
  // I will assume the map instance is exposed on `window.olMap` or similar. But I don't know the exact property name.
  // Let's look at the Open Pioneer Trails documentation or source code to see how the map instance is exposed. But I don't have access to that.
  // I think the safest way is to click in the center of the map canvas and assume the features are there.
  // Let's proceed with clicking in the center of the map canvas.

  // Get the map container element
  const mapElement = page.locator('canvas.ol-viewport').first();
  await expect(mapElement).toBeVisible();

  // Get the bounding box of the map element to click in the center
  const boundingBox = await mapElement.boundingBox();
  if (!boundingBox) {
    throw new Error('Map element bounding box not found');
  }

  // Click in the center of the map element
  const centerX = boundingBox.x + boundingBox.width / 2;
  const centerY = boundingBox.y + boundingBox.height / 2;

  // Click at the center of the map
  await page.mouse.click(centerX, centerY);

  // Wait for the info panel to update with feature information
  // The info panel should display sections for 'UV-Index Station' and 'EUCOS Ground Station'
  await expect(page.getByText('UV-Index Station')).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station')).toBeVisible();
});
