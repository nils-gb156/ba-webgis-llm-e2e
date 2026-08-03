// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const application = page.getByRole('application', { name: 'webgis map', exact: true });
    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(application).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    await measurementToggle.click();

    const measurementDialog = page.getByRole('dialog', { name: /Measurement/i });
    const measurementRegion = page.getByRole('region', { name: /Measurement/i });
    const measurementHeading = page.getByRole('heading', { name: /^Measurement$/ });
    const measurementPanelIndicator = measurementDialog.or(measurementRegion).or(measurementHeading).first();

    await expect(measurementPanelIndicator).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const points = [
        { x: Math.round(mapBox.width * 0.38), y: Math.round(mapBox.height * 0.34) },
        { x: Math.round(mapBox.width * 0.50), y: Math.round(mapBox.height * 0.46) },
        { x: Math.round(mapBox.width * 0.62), y: Math.round(mapBox.height * 0.36) },
        { x: Math.round(mapBox.width * 0.72), y: Math.round(mapBox.height * 0.48) }
    ];

    await mapContainer.click({ position: points[0] });
    await mapContainer.click({ position: points[1] });
    await mapContainer.click({ position: points[2] });
    await mapContainer.dblclick({ position: points[3] });

    const measurementPanelRoot = measurementDialog.or(measurementRegion).first();
    const hasScopedMeasurementPanel = await measurementPanelRoot.isVisible().catch(() => false);

    if (hasScopedMeasurementPanel) {
        await expect(measurementPanelRoot.getByText(/length|distance/i)).toBeVisible();
        await expect(
            measurementPanelRoot.getByText(/\b(?!0(?:[.,]0+)?\b)\d+(?:[.,]\d+)?\s?(?:m|km)\b/i)
        ).toBeVisible();
    } else {
        await expect.poll(async () => {
            return ((await application.textContent()) ?? '').replace(/\s+/g, ' ').trim();
        }).toMatch(/\b(?:length|distance)\b.*\b(?!0(?:[.,]0+)?\b)\d+(?:[.,]\d+)?\s?(?:m|km)\b/i);
    }
});
