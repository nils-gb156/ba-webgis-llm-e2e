// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const app = page.getByRole('application', { name: 'webgis map', exact: true });
    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanelHeading = page.getByRole('heading', { name: /Measurement/i });

    await expect(app).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    const countMeasurementValues = async () => {
        const text = (await app.textContent()) ?? '';
        return text.match(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/g)?.length ?? 0;
    };

    const initialMeasurementValueCount = await countMeasurementValues();

    if (!(await measurementPanelHeading.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanelHeading).toBeVisible();

    await mapContainer.click({ position: { x: 520, y: 260 } });
    await mapContainer.click({ position: { x: 680, y: 340 } });
    await mapContainer.click({ position: { x: 820, y: 250 } });
    await mapContainer.dblclick({ position: { x: 940, y: 320 } });

    await expect(measurementPanelHeading).toBeVisible();
    await expect.poll(countMeasurementValues).toBeGreaterThan(initialMeasurementValueCount);
});
