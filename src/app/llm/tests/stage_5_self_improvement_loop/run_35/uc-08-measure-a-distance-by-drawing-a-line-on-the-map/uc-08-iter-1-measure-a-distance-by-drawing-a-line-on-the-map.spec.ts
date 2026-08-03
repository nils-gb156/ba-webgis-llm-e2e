// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter } from "../../../../map-model-helpers";

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
    const resultPattern = /\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i;

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    if (!(await measurementPanel.isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();
    await expect(
        measurementDialog.getByText('Click in the map to start a measurement.', { exact: true })
    ).toBeVisible();

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();

    const positions = [
        { x: Math.round(box!.width * 0.35), y: Math.round(box!.height * 0.26) },
        { x: Math.round(box!.width * 0.47), y: Math.round(box!.height * 0.33) },
        { x: Math.round(box!.width * 0.59), y: Math.round(box!.height * 0.40) },
        { x: Math.round(box!.width * 0.71), y: Math.round(box!.height * 0.47) }
    ];

    await mapContainer.click({ position: positions[0] });
    await mapContainer.click({ position: positions[1] });
    await mapContainer.click({ position: positions[2] });
    await mapContainer.dblclick({ position: positions[3] });

    await expect(measurementPanel).toBeVisible();
    await expect.poll(async () => {
        const tooltipTexts = await page.getByRole('tooltip').allTextContents();
        return tooltipTexts.map((text) => text.trim()).find((text) => resultPattern.test(text)) ?? '';
    }).toMatch(resultPattern);
});
