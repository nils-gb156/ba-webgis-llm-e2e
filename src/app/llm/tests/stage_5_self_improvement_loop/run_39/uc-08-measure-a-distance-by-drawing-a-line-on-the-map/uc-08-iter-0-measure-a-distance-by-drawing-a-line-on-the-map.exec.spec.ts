// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementButton = page.getByTestId('measurement-toggle');
    const measurementDialog = page.getByRole('dialog', { name: /measurement/i });
    const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(measurementButton).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const getVisibleLengthTextsOutsideFooter = async (): Promise<string[]> => {
        return await page.evaluate((footerTestId) => {
            const footer = document.querySelector(`[data-testid="${footerTestId}"]`);
            const regex = /\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/i;
            const texts = new Set<string>();

            for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
                if (footer instanceof HTMLElement && footer.contains(element)) {
                    continue;
                }

                const style = window.getComputedStyle(element);
                if (style.display === 'none' || style.visibility === 'hidden') {
                    continue;
                }

                const rect = element.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                    continue;
                }

                const text = element.innerText?.trim();
                if (text && regex.test(text)) {
                    texts.add(text);
                }
            }

            return Array.from(texts);
        }, 'footer');
    };

    const measurementPanelVisible = async (): Promise<boolean> => {
        const dialogVisible = await measurementDialog.isVisible().catch(() => false);
        const headingVisible = await measurementHeading.isVisible().catch(() => false);
        const buttonPressed = (await measurementButton.getAttribute('aria-pressed')) === 'true';
        return dialogVisible || headingVisible || buttonPressed;
    };

    const baselineLengthTexts = await getVisibleLengthTextsOutsideFooter();

    if (!(await measurementPanelVisible())) {
        await measurementButton.click();
    }

    await expect.poll(measurementPanelVisible).toBe(true);

    if (await measurementDialog.count()) {
        await expect(measurementDialog).toBeVisible();
    } else if (await measurementHeading.count()) {
        await expect(measurementHeading).toBeVisible();
    } else {
        await expect(measurementButton).toHaveAttribute('aria-pressed', 'true');
    }

    await mapContainer.click({ position: { x: 360, y: 240 } });
    await mapContainer.click({ position: { x: 560, y: 300 } });
    await mapContainer.click({ position: { x: 760, y: 360 } });
    await mapContainer.dblclick({ position: { x: 960, y: 420 } });

    await expect
        .poll(async () => {
            const currentTexts = await getVisibleLengthTextsOutsideFooter();
            return currentTexts.some((text) => !baselineLengthTexts.includes(text));
        })
        .toBe(true);
});
