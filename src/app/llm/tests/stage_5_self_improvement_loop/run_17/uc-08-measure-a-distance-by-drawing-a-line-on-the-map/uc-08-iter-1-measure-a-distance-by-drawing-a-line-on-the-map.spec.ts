// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await measurementPanel.isVisible())) {
        if ((await measurementToggle.getAttribute('aria-pressed')) !== 'true') {
            await measurementToggle.click();
        }
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.40),
            y: Math.round(box.height * 0.42)
        }
    });
    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.50),
            y: Math.round(box.height * 0.50)
        }
    });
    await mapContainer.dblclick({
        position: {
            x: Math.round(box.width * 0.62),
            y: Math.round(box.height * 0.40)
        }
    });

    const measurementResultTooltip = page.getByRole('tooltip', {
        name: /\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i
    });

    await expect(measurementResultTooltip).toBeVisible();
    await expect(measurementResultTooltip).toHaveText(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i);
});
