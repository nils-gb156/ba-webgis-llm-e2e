// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(async () => (await getMapZoomLevel(page)) ?? -1).toBeGreaterThan(-1);

    const isPressed = await measurementToggle.getAttribute('aria-pressed');
    const isExpanded = await measurementToggle.getAttribute('aria-expanded');
    if (isPressed !== 'true' && isExpanded !== 'true') {
        await measurementToggle.click();
    }

    const measurementPanelIndicator = page
        .getByRole('dialog', { name: 'Measurement', exact: true })
        .or(page.getByRole('heading', { name: 'Measurement', exact: true }))
        .first();

    await expect(measurementPanelIndicator).toBeVisible();

    await mapContainer.click({ position: { x: 640, y: 320 } });
    await mapContainer.click({ position: { x: 760, y: 360 } });
    await mapContainer.click({ position: { x: 900, y: 430 } });
    await mapContainer.dblclick({ position: { x: 1030, y: 520 } });

    const measurementResult = page
        .getByRole('dialog')
        .getByText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i)
        .or(page.getByTestId('map-controls-panel').getByText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i))
        .first();

    await expect(measurementPanelIndicator).toBeVisible();
    await expect(measurementResult).toBeVisible();
});
