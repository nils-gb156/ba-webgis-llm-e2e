// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementWidget = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(async () => Array.isArray(await getMapCenter(page))).toBe(true);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementWidget).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(mapBox.width * 0.3),
        y: Math.round(mapBox.height * 0.7)
    };
    const secondPoint = {
        x: Math.round(mapBox.width * 0.5),
        y: Math.round(mapBox.height * 0.58)
    };
    const thirdPoint = {
        x: Math.round(mapBox.width * 0.7),
        y: Math.round(mapBox.height * 0.68)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.dblclick({ position: thirdPoint });

    await expect(measurementPanel).toContainText(/\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km|ft|mi|nm)\b/i);
});
