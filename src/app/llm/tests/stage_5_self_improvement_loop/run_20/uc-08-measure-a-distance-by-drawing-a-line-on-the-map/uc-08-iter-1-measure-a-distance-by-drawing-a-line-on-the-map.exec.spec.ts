// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
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
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementDialog.getByRole('heading', { name: 'Measurement', exact: true })).toBeVisible();
    await expect(measurementDialog.getByRole('combobox', { name: 'Mode', exact: true })).toBeVisible();

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(box.width * 0.56),
        y: Math.round(box.height * 0.38)
    };
    const secondPoint = {
        x: Math.round(box.width * 0.64),
        y: Math.round(box.height * 0.48)
    };
    const thirdPoint = {
        x: Math.round(box.width * 0.74),
        y: Math.round(box.height * 0.54)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.dblclick({ position: thirdPoint });

    const lengthTooltip = page.getByRole('tooltip', {
        name: /\b\d[\d.,\s]*\s*(?:m|km)\b/i
    });

    await expect(lengthTooltip).toBeVisible();
    await expect(lengthTooltip).toHaveText(/\b\d[\d.,\s]*\s*(?:m|km)\b/i);
    await expect(measurementPanel).toBeVisible();
});
