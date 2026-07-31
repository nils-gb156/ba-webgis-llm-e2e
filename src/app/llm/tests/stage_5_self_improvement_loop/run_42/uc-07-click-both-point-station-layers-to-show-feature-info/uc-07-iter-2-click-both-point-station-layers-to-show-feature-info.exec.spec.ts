// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Ensure measurement tool is off
    const measurementToggle = page.getByRole('button', { name: 'Measurement' });
    const measurementState = await measurementToggle.getAttribute('aria-pressed');
    if (measurementState === 'true') {
        await measurementToggle.click({ force: true });
    }

    // Click on the map at the specified coordinates
    // The coordinates are in EPSG:3857 (map projection), but the click position
    // requires CSS pixel coordinates relative to the map container.
    // We can use page.evaluate to convert the coordinates.
    const clickPosition = await page.evaluate(({ x, y }) => {
        const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: number[]) => number[] } } }).__openPioneerMap;
        if (!map) {
            return null;
        }
        return map.olMap.getPixelFromCoordinate([x, y]);
    }, { x: 1188692.84, y: 6767643.28 });

    if (clickPosition) {
        await page.getByTestId('map-container').click({
            position: { x: clickPosition[0], y: clickPosition[1] },
        });
    } else {
        // Fallback: try clicking at the approximate pixel position if coordinate conversion fails
        // This is a last resort and may not be accurate
        await page.getByTestId('map-container').click({
            position: { x: 1188692.84, y: 6767643.28 },
        });
    }

    // Wait for the info panel to load feature info for both layers
    await expect.poll(() =>
        page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station' }).isVisible()
    ).toBe(true);

    await expect.poll(() =>
        page.getByTestId('info-panel').getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible()
    ).toBe(true);
});
