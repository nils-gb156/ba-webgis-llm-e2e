// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC8 - Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
    const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const measurementPanelIsVisible = async () => {
        if (await measurementDialog.isVisible()) {
            return true;
        }
        if (await measurementHeading.isVisible()) {
            return true;
        }
        return (await measurementToggle.getAttribute('aria-pressed')) === 'true';
    };

    if (!(await measurementPanelIsVisible())) {
        await measurementToggle.click();
    }

    await expect.poll(measurementPanelIsVisible).toBe(true);

    const box = await mapContainer.boundingBox();
    if (!box) {
        throw new Error('Map container has no bounding box.');
    }

    const firstPoint = {
        x: Math.round(box.width * 0.42),
        y: Math.round(box.height * 0.45)
    };
    const secondPoint = {
        x: Math.round(box.width * 0.55),
        y: Math.round(box.height * 0.52)
    };
    const thirdPoint = {
        x: Math.round(box.width * 0.68),
        y: Math.round(box.height * 0.6)
    };

    await mapContainer.click({ position: firstPoint });
    await mapContainer.click({ position: secondPoint });
    await mapContainer.dblclick({ position: thirdPoint });

    const getVisibleMeasurementValues = async () => {
        return await page.evaluate(() => {
            const footer = document.querySelector('[data-testid="footer"]');
            const pattern = /\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/g;
            const values = new Set<string>();

            const isVisible = (element: HTMLElement) => {
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    rect.width > 0 &&
                    rect.height > 0
                );
            };

            for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
                if (footer instanceof HTMLElement && footer.contains(element)) {
                    continue;
                }
                if (!isVisible(element)) {
                    continue;
                }

                const text = element.innerText?.trim();
                if (!text) {
                    continue;
                }

                const matches = text.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        values.add(match);
                    }
                }
            }

            return Array.from(values);
        });
    };

    await expect.poll(getVisibleMeasurementValues).not.toEqual([]);

    const measurementValues = await getVisibleMeasurementValues();
    expect(measurementValues.some((value) => /\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/.test(value))).toBeTruthy();
});
