// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Info panel is visible
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Precondition: UV-Index Stations layer is active
    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();

    // Precondition: EUCOS Ground Stations layer is active
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

    // Precondition: No measurement tool is active.
    const measurementToggle = page.getByTestId('measurement-toggle');
    const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementPressed === 'true') {
        await measurementToggle.click({ force: true });
    }
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

    // Precondition: Layers are actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    // Step 1: The user clicks at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
    // The map container has a canvas child that intercepts pointer events.
    // Use force: true to click through the overlay.
    // Note: OpenLayers canvas click coordinates are relative to the canvas element's top-left corner.
    // The provided coordinates are in EPSG:3857 projection units. We must convert them to pixel
    // coordinates relative to the map container. However, Playwright's click with `position`
    // expects pixel offsets from the element's top-left.
    // Since we don't have a helper to convert EPSG:3857 to pixel coords directly in this context,
    // and the prompt says "Click on the map container element... with a position option",
    // we assume the provided coordinates are pixel offsets or we need to find the correct pixel location.
    // Looking at the screenshot, the stations are visible. The coordinates [1188692.84, 6767643.28] are EPSG:3857.
    // The map container is the element with data-testid 'map-container'.
    // We need to click on the canvas. The `position` option in Playwright's click is in pixels.
    // We must convert the EPSG:3857 coordinates to pixel coordinates on the canvas.
    // Since we have the map model helpers, we can use `page.evaluate` to convert or we can use the highlight helper.
    // Actually, the simplest way is to use the map model to get the pixel coordinates from the EPSG:3857 coordinates.
    // But we don't have a helper for that.
    // Alternatively, we can click on the map and then check if the highlight appears.
    // The prompt says: "To interact with the map, click the map container element (identified via the context provided in the prompt) with a position option."
    // This implies the position should be in pixels.
    // Let's assume the provided coordinates are pixel coordinates relative to the map container for the sake of the test,
    // OR we need to convert them.
    // Given the complexity, let's try to click using the pixel coordinates derived from the EPSG:3857 coordinates.
    // We can use `page.evaluate` to convert EPSG:3857 to pixel coordinates using the map model.
    // However, the helpers provided don't include a conversion function.
    // Let's look at the error: the click didn't seem to trigger the feature info.
    // The screenshot shows the info panel still says "Click on the map to load a forecast."
    // This means the click didn't register or didn't hit a station.
    // The coordinates [1188692.84, 6767643.28] are in EPSG:3857.
    // We need to convert these to pixel coordinates.
    // We can use the map model's `olMap` to convert.
    // Let's add a step to convert the coordinates.

    const pixelCoords = await page.evaluate(([x, y]: [number, number]) => {
        const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: [number, number]) => [number, number] } } }).__openPioneerMap;
        if (!map || !map.olMap) {
            return null;
        }
        return map.olMap.getPixelFromCoordinate([x, y]);
    }, [1188692.84, 6767643.28]);

    if (!pixelCoords) {
        throw new Error('Map model not available or coordinate conversion failed');
    }

    await page.getByTestId('map-container').click({
        force: true,
        position: { x: pixelCoords[0], y: pixelCoords[1] },
    });

    // Step 2: The user waits for the info panel to load the station info for both layers.
    // Expected result: The info panel displays a 'UV-Index Station' section with feature information.
    // Expected result: The info panel displays an 'EUCOS Ground Station' section with feature information.

    // Wait for the highlight to appear, which indicates a feature was clicked
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Wait for the info panel to contain the expected text
    const infoPanel = page.getByTestId('info-panel');
    await expect.poll(() => infoPanel.textContent()).toContain('UV-Index Station');
    await expect.poll(() => infoPanel.textContent()).toContain('EUCOS Ground Station');
});
