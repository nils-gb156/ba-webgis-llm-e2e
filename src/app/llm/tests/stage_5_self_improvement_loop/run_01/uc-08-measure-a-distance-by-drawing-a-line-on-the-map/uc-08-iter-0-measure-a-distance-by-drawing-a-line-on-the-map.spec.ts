// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => typeof (await getMapZoomLevel(page)) === 'number').toBe(true);

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanelHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
    const lengthValuePattern = /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i;

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    const initialLengthValueCount = await page.getByText(lengthValuePattern).count();

    if (!(await measurementPanelHeading.isVisible())) {
        const pressed = await measurementToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await measurementToggle.click();
        }
    }

    await expect(measurementPanelHeading).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(box.width * 0.42), y: Math.round(box.height * 0.34) },
        { x: Math.round(box.width * 0.54), y: Math.round(box.height * 0.43) },
        { x: Math.round(box.width * 0.67), y: Math.round(box.height * 0.38) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[2] });

    await expect.poll(async () => await page.getByText(lengthValuePattern).count()).toBeGreaterThan(initialLengthValueCount);
});
