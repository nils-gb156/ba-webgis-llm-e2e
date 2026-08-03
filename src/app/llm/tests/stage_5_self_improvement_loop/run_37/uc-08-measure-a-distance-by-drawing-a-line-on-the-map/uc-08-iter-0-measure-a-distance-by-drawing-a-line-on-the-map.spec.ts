// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const getVisibleLengthTexts = async (): Promise<string[]> => {
        return page.evaluate(() => {
            const footer = document.querySelector('[data-testid="footer"]');
            const regex = /\b\d[\d.,]*\s?(?:m|km)\b/i;
            const results: string[] = [];
            const seen = new Set<string>();

            const isVisible = (element: HTMLElement): boolean => {
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    rect.width > 0 &&
                    rect.height > 0
                );
            };

            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let currentNode = walker.nextNode();

            while (currentNode) {
                const parent = currentNode.parentElement;
                const text = currentNode.textContent?.replace(/\s+/g, ' ').trim();

                if (
                    parent &&
                    text &&
                    regex.test(text) &&
                    (!footer || !footer.contains(parent)) &&
                    isVisible(parent)
                ) {
                    if (!seen.has(text)) {
                        seen.add(text);
                        results.push(text);
                    }
                }

                currentNode = walker.nextNode();
            }

            return results;
        });
    };

    const hasVisibleMeasurementPanel = async (): Promise<boolean> => {
        if (await page.getByRole('heading', { name: 'Measurement', exact: true }).isVisible()) {
            return true;
        }

        if (await page.getByRole('dialog', { name: /measurement/i }).isVisible()) {
            return true;
        }

        if (await page.getByRole('region', { name: /measurement/i }).isVisible()) {
            return true;
        }

        return page.evaluate(() => {
            const toolbar = document.querySelector('[data-testid="map-toolbar"]');
            const footer = document.querySelector('[data-testid="footer"]');
            const candidateTexts = new Set(['Measurement', 'Length', 'Distance']);

            const isVisible = (element: HTMLElement): boolean => {
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    rect.width > 0 &&
                    rect.height > 0
                );
            };

            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let currentNode = walker.nextNode();

            while (currentNode) {
                const parent = currentNode.parentElement;
                const text = currentNode.textContent?.replace(/\s+/g, ' ').trim();

                if (
                    parent &&
                    text &&
                    candidateTexts.has(text) &&
                    (!toolbar || !toolbar.contains(parent)) &&
                    (!footer || !footer.contains(parent)) &&
                    isVisible(parent)
                ) {
                    return true;
                }

                currentNode = walker.nextNode();
            }

            return false;
        });
    };

    const initialLengthTexts = await getVisibleLengthTexts();

    if ((await measurementToggle.getAttribute('aria-pressed')) !== 'true') {
        await measurementToggle.click();
    }

    await expect.poll(() => hasVisibleMeasurementPanel()).toBe(true);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const positions = [
        { x: mapBox.width * 0.45, y: mapBox.height * 0.62 },
        { x: mapBox.width * 0.52, y: mapBox.height * 0.56 },
        { x: mapBox.width * 0.60, y: mapBox.height * 0.50 },
        { x: mapBox.width * 0.68, y: mapBox.height * 0.44 }
    ];

    await mapContainer.click({ position: positions[0] });
    await mapContainer.click({ position: positions[1] });
    await mapContainer.click({ position: positions[2] });
    await mapContainer.dblclick({ position: positions[3] });

    await expect
        .poll(async () => (await getVisibleLengthTexts()).length)
        .toBeGreaterThan(initialLengthTexts.length);

    await expect.poll(async () => {
        const currentTexts = await getVisibleLengthTexts();
        return currentTexts.find((text) => !initialLengthTexts.includes(text)) ?? '';
    }).toMatch(/\b\d[\d.,]*\s?(?:m|km)\b/i);
});
