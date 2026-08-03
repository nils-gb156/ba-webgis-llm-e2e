// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

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

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();

    const points = [
        { x: Math.round(box!.width * 0.38), y: Math.round(box!.height * 0.35) },
        { x: Math.round(box!.width * 0.5), y: Math.round(box!.height * 0.43) },
        { x: Math.round(box!.width * 0.62), y: Math.round(box!.height * 0.48) },
        { x: Math.round(box!.width * 0.72), y: Math.round(box!.height * 0.56) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    const measurementValueTooltip = page.getByRole('tooltip', {
        name: /\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km)\b/i
    });

    await expect(measurementValueTooltip).toBeVisible();
    await expect(measurementValueTooltip).toHaveText(
        /\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km)\b/i
    );
});
