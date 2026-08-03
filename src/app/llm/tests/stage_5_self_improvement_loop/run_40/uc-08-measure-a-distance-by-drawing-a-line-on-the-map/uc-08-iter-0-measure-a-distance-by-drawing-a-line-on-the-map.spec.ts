// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('measurement-toggle')).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

    if (!(await measurementHeading.isVisible())) {
        await measurementToggle.click();
    }

    if (await measurementHeading.isVisible()) {
        await expect(measurementHeading).toBeVisible();
    } else {
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    }

    const measurementValuePattern = /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i;
    const readVisibleMeasurementTexts = async (): Promise<string[]> => {
        return await page.getByText(measurementValuePattern).evaluateAll(
            (elements, patternSource) => {
                const regex = new RegExp(patternSource, 'i');
                const texts = elements
                    .filter((element) => {
                        const htmlElement = element as HTMLElement;
                        const style = window.getComputedStyle(htmlElement);
                        const rect = htmlElement.getBoundingClientRect();
                        return (
                            style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            rect.width > 0 &&
                            rect.height > 0
                        );
                    })
                    .map((element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim())
                    .filter((text) => regex.test(text));
                return [...new Set(texts)];
            },
            measurementValuePattern.source
        );
    };

    const initialMeasurementTexts = await readVisibleMeasurementTexts();

    const map = page.getByTestId('map-container');
    await map.click({ position: { x: 500, y: 300 } });
    await map.click({ position: { x: 650, y: 380 } });
    await map.dblclick({ position: { x: 820, y: 450 } });

    await expect
        .poll(async () => {
            const currentTexts = await readVisibleMeasurementTexts();
            return currentTexts.filter((text) => !initialMeasurementTexts.includes(text)).join(' | ');
        })
        .toMatch(measurementValuePattern);
});
