// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page
        .getByRole('dialog')
        .or(page.getByRole('region', { name: 'Measurement', exact: true }))
        .or(page.getByRole('heading', { name: 'Measurement', exact: true }));

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    if (!(await measurementPanel.first().isVisible())) {
        await measurementToggle.click();
    }

    await expect(measurementPanel.first()).toBeVisible();

    const lengthValuePattern = /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/g;
    const initialLengthValueCount = ((await page.locator('body').innerText()).match(lengthValuePattern) ?? []).length;

    await mapContainer.click({ position: { x: 520, y: 240 } });
    await mapContainer.click({ position: { x: 680, y: 320 } });
    await mapContainer.click({ position: { x: 840, y: 260 } });
    await mapContainer.dblclick({ position: { x: 980, y: 360 } });

    await expect(measurementPanel.first()).toBeVisible();
    await expect
        .poll(async () => {
            const bodyText = await page.locator('body').innerText();
            return (bodyText.match(lengthValuePattern) ?? []).length;
        })
        .toBeGreaterThan(initialLengthValueCount);
});
