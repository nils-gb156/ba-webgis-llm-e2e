// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
    const measurementResultTooltip = page.getByRole('tooltip', {
        name: /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/
    });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    if (!(await measurementPanel.isVisible())) {
        const isPressed = await measurementToggle.getAttribute('aria-pressed');
        if (isPressed !== 'true') {
            await measurementToggle.click();
        }
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();

    await mapContainer.click({ position: { x: 420, y: 180 } });
    await mapContainer.click({ position: { x: 560, y: 235 } });
    await mapContainer.click({ position: { x: 700, y: 180 } });
    await mapContainer.dblclick({ position: { x: 840, y: 230 } });

    await expect(measurementPanel).toBeVisible();
    await expect(measurementResultTooltip).toBeVisible();
    await expect(measurementResultTooltip).toHaveText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/);
});
