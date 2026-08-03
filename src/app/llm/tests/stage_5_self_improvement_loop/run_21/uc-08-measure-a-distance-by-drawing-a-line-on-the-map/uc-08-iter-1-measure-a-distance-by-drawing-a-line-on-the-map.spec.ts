// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const modeSelect = measurementPanel.getByRole('combobox', { name: 'Mode', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const panelVisible = await measurementPanel.isVisible();
    const togglePressed = await measurementToggle.getAttribute('aria-pressed');

    if (!panelVisible && togglePressed !== 'true') {
        await measurementToggle.click();
    }

    await expect(measurementPanel).toBeVisible();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');

    await expect(modeSelect).toBeVisible();
    await modeSelect.selectOption({ label: 'Distance' });

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: { x: box.width * 0.42, y: box.height * 0.60 }
    });
    await mapContainer.click({
        position: { x: box.width * 0.50, y: box.height * 0.54 }
    });
    await mapContainer.click({
        position: { x: box.width * 0.58, y: box.height * 0.48 }
    });
    await mapContainer.dblclick({
        position: { x: box.width * 0.66, y: box.height * 0.42 }
    });

    const measurementResultTooltip = page
        .getByRole('tooltip')
        .filter({ hasText: /\b\d+(?:[.,]\d+)?\s*(m|km)\b/i })
        .first();

    await expect(measurementResultTooltip).toBeVisible();
    await expect(measurementResultTooltip).toHaveText(/\b\d+(?:[.,]\d+)?\s*(m|km)\b/i);
});
