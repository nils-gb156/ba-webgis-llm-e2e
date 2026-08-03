// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const measurementButton = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    await expect(measurementButton).toBeVisible();
    await expect(mapContainer).toBeVisible();

    const isMeasurementPanelOpen = async (): Promise<boolean> => {
        const ariaExpanded = await measurementButton.getAttribute('aria-expanded');
        const ariaPressed = await measurementButton.getAttribute('aria-pressed');
        if (ariaExpanded === 'true' || ariaPressed === 'true') {
            return true;
        }

        const dialogs = page.getByRole('dialog');
        if ((await dialogs.count()) > 0 && (await dialogs.first().isVisible())) {
            return true;
        }

        const combinedText = [
            ...(await page.getByRole('dialog').allTextContents()),
            ...(await page.getByTestId('map-controls-panel').allTextContents())
        ].join(' ');

        return /\b(measure(?:ment|ments)?|length|distance)\b/i.test(combinedText);
    };

    if (!(await isMeasurementPanelOpen())) {
        await measurementButton.click();
    }

    await expect.poll(isMeasurementPanelOpen).toBe(true);

    await mapContainer.click({ position: { x: 640, y: 260 } });
    await mapContainer.click({ position: { x: 760, y: 330 } });
    await mapContainer.click({ position: { x: 880, y: 400 } });
    await mapContainer.dblclick({ position: { x: 980, y: 470 } });

    const getMeasurementText = async (): Promise<string> => {
        return [
            ...(await page.getByRole('dialog').allTextContents()),
            ...(await page.getByTestId('map-controls-panel').allTextContents())
        ].join(' ');
    };

    await expect.poll(getMeasurementText).toMatch(/\d+(?:[.,]\d+)?\s*(?:m|km)\b/i);
});
