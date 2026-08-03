// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementResult = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementResult).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(mapBox.width * 0.25),
        y: Math.round(mapBox.height * 0.35)
    };
    const secondPoint = {
        x: Math.round(mapBox.width * 0.45),
        y: Math.round(mapBox.height * 0.45)
    };
    const thirdPoint = {
        x: Math.round(mapBox.width * 0.65),
        y: Math.round(mapBox.height * 0.55)
    };
    const finalPoint = {
        x: Math.round(mapBox.width * 0.78),
        y: Math.round(mapBox.height * 0.62)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.click({ position: thirdPoint });
    await mapContainer.dblclick({ position: finalPoint });

    await expect(measurementPanel).toBeVisible();
    await expect(measurementResult).toContainText(
        /(?:\d{1,3}(?:[ .]\d{3})*|\d+)(?:[.,]\d+)?\s?(?:mm|cm|m|km|ft|mi|nm)\b/i
    );
});
