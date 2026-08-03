// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const application = page.getByRole('application', { name: 'webgis map' });
    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanelHeading = page.getByRole('heading', { name: /Measurement/i });
    const measurementDialog = page.getByRole('dialog', { name: /Measurement/i });

    await expect(application).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const isMeasurementPanelVisible = async () =>
        (await measurementPanelHeading.isVisible()) || (await measurementDialog.isVisible());

    if (!(await isMeasurementPanelVisible())) {
        await measurementToggle.click();
    }

    await expect.poll(isMeasurementPanelVisible).toBe(true);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(mapBox.width * 0.45),
        y: Math.round(mapBox.height * 0.32)
    };
    const secondPoint = {
        x: Math.round(mapBox.width * 0.55),
        y: Math.round(mapBox.height * 0.42)
    };
    const thirdPoint = {
        x: Math.round(mapBox.width * 0.63),
        y: Math.round(mapBox.height * 0.35)
    };
    const finishPoint = {
        x: Math.round(mapBox.width * 0.7),
        y: Math.round(mapBox.height * 0.48)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.click({ position: thirdPoint });
    await mapContainer.dblclick({ position: finishPoint });

    await expect.poll(async () => {
        if (await measurementDialog.isVisible()) {
            return (await measurementDialog.textContent()) ?? '';
        }
        return (await application.textContent()) ?? '';
    }).toMatch(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i);
});
