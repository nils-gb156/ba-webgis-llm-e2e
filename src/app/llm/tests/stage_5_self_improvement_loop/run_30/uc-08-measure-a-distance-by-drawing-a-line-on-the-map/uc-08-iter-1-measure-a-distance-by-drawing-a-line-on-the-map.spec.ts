// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC-08: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const mapContainer = page.getByTestId('map-container');

    await expect(measurementToggle).toBeVisible();
    await expect(mapContainer).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) !== 'true') {
        await measurementToggle.click();
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementPanel).toBeVisible();

    await mapContainer.click({ position: { x: 650, y: 250 } });
    await mapContainer.click({ position: { x: 820, y: 330 } });
    await mapContainer.dblclick({ position: { x: 980, y: 430 } });

    const measurementResultTooltip = page.getByRole('tooltip', {
        name: /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i
    });

    await expect(measurementResultTooltip).toBeVisible();
});
