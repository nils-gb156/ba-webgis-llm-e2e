// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure the info panel is visible.
    await expect(page.getByTestId('info-panel')).toBeVisible();

    // Step 1: Click at the specified map coordinates.
    // The coordinates [1188692.84, 6767643.28] are in EPSG:3857.
    // The map-container click position expects pixel offsets from the top-left of the container element.
    // We need to convert EPSG:3857 to pixel coordinates relative to the map container.
    // However, the prompt says "click the map container element ... with a position option".
    // The previous test failed because it used the raw EPSG:3857 values as pixel positions.
    // We must use the map model helper to get the current view center and zoom to calculate the pixel offset,
    // OR we can use the map model helper to click the map directly if such a helper existed.
    // Since no such helper exists, we have to calculate the pixel position.
    //
    // Wait, the prompt says: "To interact with the map, click the map container element (identified via the context provided in the prompt) with a position option."
    // And the previous test used `position: { x: 1188692.84, y: 6767643.28 }` which are EPSG:3857 coordinates, not pixel coordinates.
    // This is the bug.
    //
    // We need to convert EPSG:3857 to pixel coordinates.
    // We can use the map model helpers to get the current view (center, zoom) and then calculate the pixel position.
    // Or, simpler: we can use `page.evaluate` to convert the coordinates using the OpenLayers map object.

    const epsg3857X = 1188692.84;
    const epsg3857Y = 6767643.28;

    // Calculate pixel position from EPSG:3857 coordinates
    const pixelPosition = await page.evaluate(
        ({ x, y }) => {
            const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: [number, number]) => [number, number] } } }).__openPioneerMap;
            if (!map) return null;
            const pixel = map.olMap.getPixelFromCoordinate([x, y]);
            return pixel;
        },
        { x: epsg3857X, y: epsg3857Y }
    );

    if (!pixelPosition) {
        throw new Error('Map model not available to convert coordinates');
    }

    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: pixelPosition[0], y: pixelPosition[1] }, force: true });

    // Step 2: Wait for the info panel to load the station info for both layers.
    // Use expect.poll because the feature info loads asynchronously via network requests.
    // The info panel uses headings for the section titles.
    // We need to find the headings for "UV-Index Station" and "EUCOS Ground Station".
    // The previous test used `getByRole('heading', { name: 'UV-Index Station', exact: true })`.
    // Let's check if the headings are indeed present.
    // The screenshot shows the info panel is visible but empty (just "Click on the map to load a forecast.").
    // This confirms the click didn't trigger the info panel update.
    //
    // Let's try clicking the map directly using the map's internal coordinate conversion.
    // Actually, the issue might be that the click position is wrong.
    // Let's re-calculate the pixel position correctly.
    //
    // Alternative approach: Use the map model helper to click the map.
    // But there is no such helper.
    //
    // Let's try to click the map using the `page.mouse` API with converted coordinates.
    // Or, we can use `page.evaluate` to dispatch a click event on the map canvas.
    //
    // Let's try dispatching a click event on the map canvas using the converted pixel coordinates.
    // The map canvas is inside the map-container.
    // We can find the canvas element and click it.

    // Wait, the prompt says: "To interact with the map, click the map container element ... with a position option."
    // This implies that the `position` option is relative to the map-container element.
    // So we need to convert EPSG:3857 to pixel coordinates relative to the map-container.
    //
    // Let's use `page.evaluate` to get the pixel position from the OpenLayers map.
    // The `getPixelFromCoordinate` method returns the pixel position relative to the map viewport.
    // This should be the same as the position relative to the map-container if the map-container is the map viewport.

    // Let's re-run the click with the correct pixel coordinates.
    await mapContainer.click({ position: { x: pixelPosition[0], y: pixelPosition[1] }, force: true });

    // Wait for the info panel to update.
    // The info panel should now show headings for "UV-Index Station" and "EUCOS Ground Station".
    // We'll poll for these headings.

    await expect.poll(async () => {
        const infoPanel = page.getByTestId('info-panel');
        // Check for the presence of headings for both station types.
        // The headings might be inside a specific section.
        // Let's look for any heading with the text "UV-Index Station" or "EUCOS Ground Station".
        const uviHeadings = await infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true }).all();
        const ecosHeadings = await infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).all();
        return {
            hasUvi: uviHeadings.length > 0,
            hasEcos: ecosHeadings.length > 0
        };
    }).toEqual({ hasUvi: true, hasEcos: true });
});
