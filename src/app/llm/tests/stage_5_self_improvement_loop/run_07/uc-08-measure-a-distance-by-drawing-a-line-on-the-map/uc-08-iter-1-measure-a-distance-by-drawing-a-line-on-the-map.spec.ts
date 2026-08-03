// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementValueTooltip = page
        .getByRole('tooltip')
        .filter({ hasText: /^\d+(?:[.,]\d+)?\s?(?:m|km)$/ });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(
        measurementPanel.getByRole('heading', { name: 'Measurement', exact: true })
    ).toBeVisible();
    await expect(
        measurementPanel.getByRole('combobox', { name: 'Mode', exact: true })
    ).toBeVisible();

    await mapContainer.click({ position: { x: 520, y: 240 } });
    await mapContainer.click({ position: { x: 680, y: 320 } });
    await mapContainer.click({ position: { x: 840, y: 260 } });
    await mapContainer.dblclick({ position: { x: 980, y: 360 } });

    await expect(measurementPanel).toBeVisible();
    await expect(measurementValueTooltip).toBeVisible();
    await expect(measurementValueTooltip).toHaveText(/^\d+(?:[.,]\d+)?\s?(?:m|km)$/);
});
