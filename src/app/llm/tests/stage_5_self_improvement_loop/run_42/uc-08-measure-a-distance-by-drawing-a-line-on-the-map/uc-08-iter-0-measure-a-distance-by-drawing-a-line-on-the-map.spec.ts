// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('UC8: Use Case 8 - Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('measurement-toggle')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const measurementToggle = page.getByTestId('measurement-toggle');
    const pressedBefore = await measurementToggle.getAttribute('aria-pressed');
    if (pressedBefore !== 'true') {
        await measurementToggle.click();
    }

    const pressedAfter = await measurementToggle.getAttribute('aria-pressed');
    if (pressedAfter !== null) {
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    }

    const measurementPanel = page
        .getByRole('dialog', { name: /measurement/i })
        .or(page.getByRole('heading', { name: /measurement/i }))
        .first();
    await expect(measurementPanel).toBeVisible();

    const mapContainer = page.getByTestId('map-container');
    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();

    const points = [
        { x: Math.round(box!.width * 0.38), y: Math.round(box!.height * 0.35) },
        { x: Math.round(box!.width * 0.5), y: Math.round(box!.height * 0.43) },
        { x: Math.round(box!.width * 0.62), y: Math.round(box!.height * 0.48) },
        { x: Math.round(box!.width * 0.72), y: Math.round(box!.height * 0.56) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    const measurementResult = page
        .getByText(/(?:Length|Distance|Total length)[\s\S]{0,30}\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km)\b/i)
        .first();

    await expect(measurementResult).toBeVisible();
});
