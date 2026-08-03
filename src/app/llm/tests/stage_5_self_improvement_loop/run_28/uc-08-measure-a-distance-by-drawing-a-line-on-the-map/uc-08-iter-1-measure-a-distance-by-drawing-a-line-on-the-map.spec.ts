// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    const isMeasurementOpen = (await measurementToggle.getAttribute('aria-pressed')) === 'true';
    if (!isMeasurementOpen) {
        await measurementToggle.click();
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();
    await expect(
        measurementDialog.getByRole('heading', { name: 'Measurement', exact: true })
    ).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container bounding box is not available.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.58),
            y: Math.round(box.height * 0.42)
        }
    });
    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.68),
            y: Math.round(box.height * 0.53)
        }
    });
    await mapContainer.dblclick({
        position: {
            x: Math.round(box.width * 0.79),
            y: Math.round(box.height * 0.45)
        }
    });

    const lengthTooltip = page
        .getByRole('tooltip', { name: /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/ })
        .first();

    await expect(lengthTooltip).toBeVisible();
});
