// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementButton = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(measurementButton).toBeVisible();

    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            return typeof zoom === 'number';
        })
        .toBe(true);

    const measurementDialog = page.getByRole('dialog', {
        name: 'Measurement',
        exact: true
    });
    const measurementRegion = page.getByRole('region', {
        name: 'Measurement',
        exact: true
    });
    const measurementHeading = page.getByRole('heading', {
        name: 'Measurement',
        exact: true
    });

    if (
        !(await measurementDialog.isVisible()) &&
        !(await measurementRegion.isVisible()) &&
        !(await measurementHeading.isVisible())
    ) {
        await measurementButton.click();
    }

    await expect(
        measurementDialog.or(measurementRegion).or(measurementHeading).first()
    ).toBeVisible();

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(box.width * 0.40),
        y: Math.round(box.height * 0.42)
    };
    const secondPoint = {
        x: Math.round(box.width * 0.50),
        y: Math.round(box.height * 0.50)
    };
    const finalPoint = {
        x: Math.round(box.width * 0.62),
        y: Math.round(box.height * 0.40)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.dblclick({ position: finalPoint });

    await expect
        .poll(async () => {
            if (await measurementDialog.isVisible()) {
                return (await measurementDialog.textContent()) ?? '';
            }

            if (await measurementRegion.isVisible()) {
                return (await measurementRegion.textContent()) ?? '';
            }

            if (await measurementHeading.isVisible()) {
                return await measurementHeading.evaluate((node) => {
                    return node.parentElement?.textContent ?? node.textContent ?? '';
                });
            }

            return '';
        })
        .toMatch(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i);
});
