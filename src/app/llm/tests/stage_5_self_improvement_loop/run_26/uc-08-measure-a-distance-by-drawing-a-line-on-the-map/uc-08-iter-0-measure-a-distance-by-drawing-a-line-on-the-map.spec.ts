// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const mapControlsPanel = page.getByTestId('map-controls-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const measurementDialog = page.getByRole('dialog', { name: /measurement/i }).first();
    const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true }).first();
    const measurementText = mapControlsPanel.getByText('Measurement', { exact: true }).first();

    const isMeasurementPanelVisible = async (): Promise<boolean> => {
        return (
            (await measurementDialog.isVisible()) ||
            (await measurementHeading.isVisible()) ||
            (await measurementText.isVisible())
        );
    };

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(async () => (await getMapZoomLevel(page)) !== undefined).toBe(true);

    if (!(await isMeasurementPanelVisible())) {
        await measurementToggle.click();
    }

    await expect.poll(isMeasurementPanelVisible).toBe(true);

    await mapContainer.click({ position: { x: 420, y: 250 } });
    await mapContainer.click({ position: { x: 620, y: 320 } });
    await mapContainer.click({ position: { x: 820, y: 280 } });
    await mapContainer.dblclick({ position: { x: 980, y: 360 } });

    await expect.poll(async () => {
        const dialogContent =
            (await measurementDialog.isVisible()) ? (await measurementDialog.textContent()) ?? '' : '';
        const controlsContent = (await mapControlsPanel.textContent()) ?? '';
        return `${dialogContent}\n${controlsContent}`;
    }).toMatch(/\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/);
});
