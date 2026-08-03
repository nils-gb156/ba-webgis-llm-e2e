// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
    const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
    const mapCanvas = page.locator('canvas').first();

    await expect(measurementButton).toBeVisible();
    await expect(mapCanvas).toBeVisible();

    const isMeasurementPanelVisible =
        (await measurementDialog.isVisible().catch(() => false)) ||
        (await measurementHeading.isVisible().catch(() => false));

    if (!isMeasurementPanelVisible) {
        await measurementButton.click();
    }

    await expect(measurementDialog.or(measurementHeading)).toBeVisible();

    await mapCanvas.click({ position: { x: 120, y: 120 } });
    await mapCanvas.click({ position: { x: 220, y: 160 } });
    await mapCanvas.click({ position: { x: 320, y: 210 } });
    await mapCanvas.dblclick({ position: { x: 420, y: 250 } });

    if ((await measurementDialog.count()) > 0) {
        await expect(
            measurementDialog.getByText(/\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km|ft|mi)\b/i).first()
        ).toBeVisible();
    } else {
        await expect(
            page.getByText(
                /(?:Length|Distance)[\s\S]*\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km|ft|mi)\b/i
            ).first()
        ).toBeVisible();
    }
});
