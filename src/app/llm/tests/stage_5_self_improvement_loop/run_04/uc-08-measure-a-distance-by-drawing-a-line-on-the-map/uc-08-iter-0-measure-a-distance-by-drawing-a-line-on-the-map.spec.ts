// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(async () => (await getMapZoomLevel(page)) ?? -1).toBeGreaterThan(0);

    const isMeasurementPanelVisible = async (): Promise<boolean> => {
        const dialogVisible = await page.getByRole('dialog', { name: /Measurement/i }).isVisible();
        const headingVisible = await page.getByRole('heading', { name: /Measurement/i }).isVisible();
        const lengthOrDistanceVisible = await page.getByText(/^(Length|Distance)$/i).first().isVisible();
        const pressedState = await measurementToggle.getAttribute('aria-pressed');

        return dialogVisible || headingVisible || lengthOrDistanceVisible || pressedState === 'true';
    };

    if (!(await isMeasurementPanelVisible())) {
        await measurementToggle.click();
    }

    await expect.poll(isMeasurementPanelVisible).toBe(true);

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(box.width * 0.36), y: Math.round(box.height * 0.32) },
        { x: Math.round(box.width * 0.52), y: Math.round(box.height * 0.44) },
        { x: Math.round(box.width * 0.68), y: Math.round(box.height * 0.58) },
        { x: Math.round(box.width * 0.82), y: Math.round(box.height * 0.36) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    await expect(page.getByText(/\b[1-9]\d{2,}(?:[.,]\d+)?\s?km\b/).first()).toBeVisible();
});
