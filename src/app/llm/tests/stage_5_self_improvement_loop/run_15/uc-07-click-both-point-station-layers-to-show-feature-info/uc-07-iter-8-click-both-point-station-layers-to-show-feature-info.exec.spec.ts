// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition checks
    await expect(page.getByTestId('info-panel')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

    // Ensure no measurement tool is active
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const isMeasurementActive = await measurementToggle.getAttribute('aria-pressed');
    if (isMeasurementActive === 'true') {
        await measurementToggle.click();
    }

    // Click on the map at the specified coordinates.
    // The coordinates are in EPSG:3857. The map canvas is rendered by OpenLayers,
    // so we click directly on the map container at the pixel position.
    // We need to convert the EPSG:3857 coordinates to pixel coordinates on the canvas.
    // However, the map-container is an HTML element that contains the canvas.
    // The click position needs to be relative to the element.
    // A simpler approach for E2E tests with known coordinates is to use the map model helper
    // to verify the click worked, but first we must click.
    // Since we don't have a pixel-to-coordinate converter in the helpers, we'll click the center
    // of the map container, hoping the map is zoomed in enough.
    // Actually, the prompt says "Click on the map at the specified coordinates [1188692.84, 6767643.28]".
    // These are EPSG:3857 coordinates. To click at these coordinates, we need to know the pixel position.
    // The map-container is the element that holds the OpenLayers canvas.
    // We can use page.evaluate to get the pixel position from the EPSG:3857 coordinates.

    const pixelPosition = await page.evaluate(({ x, y }: { x: number; y: number }) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        if (!map) return null;
        const pixel = map.olMap.getPixelFromCoordinate([x, y]);
        return pixel;
    }, { x: 1188692.84, y: 6767643.28 });

    if (!pixelPosition) {
        throw new Error('Map model not available or coordinates out of bounds');
    }

    // Click the map container at the calculated pixel position
    await page.getByTestId('map-container').click({
        position: { x: pixelPosition[0], y: pixelPosition[1] }
    });

    // Wait for the info panel to load the station info for both layers.
    // The info panel displays feature info for the clicked location.
    // We look for headings or text that indicate the presence of station info.
    // The info panel has a test-id 'info-panel'.
    const infoPanel = page.getByTestId('info-panel');

    // Wait for the info panel to contain text related to UV-Index Station and EUCOS Ground Station.
    // Since the exact heading text might vary (e.g., "UV-Index Station" vs "UV-Index Stations"),
    // we can check for the presence of these terms in the info panel.
    await expect.poll(async () => {
        const content = await infoPanel.textContent();
        return content;
    }).toMatch(/UV-Index Station/i);

    await expect.poll(async () => {
        const content = await infoPanel.textContent();
        return content;
    }).toMatch(/EUCOS Ground Station/i);
});
