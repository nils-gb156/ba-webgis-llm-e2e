// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementContent = page.getByTestId('measurement');

    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementContent).toBeVisible();

    const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();
    const initialMeasurementText = normalizeText(await measurementContent.innerText());

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(box.width * 0.62), y: Math.round(box.height * 0.32) },
        { x: Math.round(box.width * 0.72), y: Math.round(box.height * 0.42) },
        { x: Math.round(box.width * 0.80), y: Math.round(box.height * 0.52) },
        { x: Math.round(box.width * 0.88), y: Math.round(box.height * 0.62) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    await expect.poll(async () => {
        return normalizeText(await measurementContent.innerText());
    }).not.toBe(initialMeasurementText);

    await expect.poll(async () => {
        return normalizeText(await measurementContent.innerText());
    }).toMatch(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km|ft|mi|nm)\b/i);
});
