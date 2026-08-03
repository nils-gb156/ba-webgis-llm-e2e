// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC8 - Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(box.width * 0.42),
        y: Math.round(box.height * 0.45)
    };
    const secondPoint = {
        x: Math.round(box.width * 0.55),
        y: Math.round(box.height * 0.52)
    };
    const thirdPoint = {
        x: Math.round(box.width * 0.68),
        y: Math.round(box.height * 0.60)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.dblclick({ position: thirdPoint });

    const measurementResultTooltip = page
        .getByRole('tooltip')
        .filter({ hasText: /\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/ })
        .first();

    await expect(measurementResultTooltip).toBeVisible();
    await expect(measurementResultTooltip).toHaveText(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/);
});
