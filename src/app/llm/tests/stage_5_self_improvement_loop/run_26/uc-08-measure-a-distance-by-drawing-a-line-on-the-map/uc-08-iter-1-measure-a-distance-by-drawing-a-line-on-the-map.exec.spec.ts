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
    const measurementHeading = measurementDialog.getByRole('heading', {
        name: 'Measurement',
        exact: true
    });
    const measurementResultTooltip = page.getByRole('tooltip', {
        name: /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/
    });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();
    await expect(measurementHeading).toBeVisible();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(
        measurementDialog.getByText('Click in the map to start a measurement.', { exact: true })
    ).toBeVisible();

    await mapContainer.click({ position: { x: 450, y: 180 } });
    await mapContainer.click({ position: { x: 620, y: 230 } });
    await mapContainer.click({ position: { x: 780, y: 200 } });
    await mapContainer.dblclick({ position: { x: 930, y: 250 } });

    await expect(measurementPanel).toBeVisible();
    await expect(measurementResultTooltip).toBeVisible();
    await expect(measurementResultTooltip).toHaveText(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/);
});
