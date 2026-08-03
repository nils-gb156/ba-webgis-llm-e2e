// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const app = page.getByRole('application', { name: 'webgis map' });
    const mapContainer = page.getByTestId('map-container');
    const mapToolbar = page.getByTestId('map-toolbar');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(app).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(mapToolbar).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    await measurementToggle.click();

    const measurementPanelIndicator = page
        .getByRole('dialog', { name: /measurement/i })
        .or(page.getByRole('heading', { name: /^Measurement$/i }))
        .first();

    await expect(measurementPanelIndicator).toBeVisible();

    const getPositiveLengthValueCount = async () => {
        const text = await app.innerText();
        const matches = text.match(/\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km)\b/g) ?? [];
        return matches.filter((match) => {
            const numericPart = match.match(/\d+(?:[.,]\d+)?/)?.[0];
            const value = Number((numericPart ?? '').replace(',', '.'));
            return Number.isFinite(value) && value > 0;
        }).length;
    };

    await mapContainer.click({ position: { x: 420, y: 220 } });
    await mapContainer.click({ position: { x: 640, y: 340 } });
    await mapContainer.dblclick({ position: { x: 860, y: 280 } });

    await expect(measurementPanelIndicator).toBeVisible();
    await expect.poll(getPositiveLengthValueCount).toBeGreaterThan(0);
});
