// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement' });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();
    await expect(measurementDialog.getByRole('heading', { name: 'Measurement' })).toBeVisible();
    await expect(measurementDialog.getByRole('combobox', { name: 'Mode', exact: true })).toBeVisible();

    await mapContainer.click({ position: { x: 560, y: 240 } });
    await mapContainer.click({ position: { x: 760, y: 320 } });
    await mapContainer.dblclick({ position: { x: 930, y: 400 } });

    const lengthTooltip = page.getByRole('tooltip', {
        name: /\d+(?:[.,]\d+)?\s?(?:m|km)\b/i
    });

    await expect(lengthTooltip).toBeVisible();
    await expect(lengthTooltip).toHaveText(/\d+(?:[.,]\d+)?\s?(?:m|km)\b/i);
});
