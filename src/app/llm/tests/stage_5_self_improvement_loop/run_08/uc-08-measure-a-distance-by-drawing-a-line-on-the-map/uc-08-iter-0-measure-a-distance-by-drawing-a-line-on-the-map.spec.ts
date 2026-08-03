// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(async () => typeof (await getMapZoomLevel(page)) === 'number').toBe(true);

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    const measurementDialog = page.getByRole('dialog', { name: /measur/i });
    const measurementRegion = page.getByRole('region', { name: /measur/i });
    const measurementHeading = page.getByRole('heading', { name: /measur/i });

    const isMeasurementPanelVisible = async (): Promise<boolean> => {
        if (await measurementDialog.first().isVisible().catch(() => false)) {
            return true;
        }
        if (await measurementRegion.first().isVisible().catch(() => false)) {
            return true;
        }
        if (await measurementHeading.first().isVisible().catch(() => false)) {
            return true;
        }
        return false;
    };

    if (!(await isMeasurementPanelVisible())) {
        const pressedBefore = await measurementToggle.getAttribute('aria-pressed');
        if (pressedBefore !== 'true') {
            await measurementToggle.click();
        }
    }

    await expect.poll(async () => await isMeasurementPanelVisible()).toBe(true);

    const pressedAfter = await measurementToggle.getAttribute('aria-pressed');
    if (pressedAfter !== null) {
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    }

    const unitValueRegex = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i;

    const getVisibleUnitTexts = async (root: Page | Locator): Promise<string[]> => {
        const matches = root.getByText(unitValueRegex);
        const count = await matches.count();
        const texts: string[] = [];

        for (let index = 0; index < count; index += 1) {
            const candidate = matches.nth(index);
            const visible = await candidate.isVisible().catch(() => false);
            if (!visible) {
                continue;
            }

            const text = (await candidate.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
            if (text && unitValueRegex.test(text)) {
                texts.push(text);
            }
        }

        return texts;
    };

    let measurementPanelRoot: Locator | null = null;
    if (await measurementDialog.first().isVisible().catch(() => false)) {
        measurementPanelRoot = measurementDialog.first();
    } else if (await measurementRegion.first().isVisible().catch(() => false)) {
        measurementPanelRoot = measurementRegion.first();
    }

    const initialUnitTexts = measurementPanelRoot
        ? await getVisibleUnitTexts(measurementPanelRoot)
        : await getVisibleUnitTexts(page);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const drawPositions = [
        { x: Math.round(mapBox.width * 0.46), y: Math.round(mapBox.height * 0.42) },
        { x: Math.round(mapBox.width * 0.56), y: Math.round(mapBox.height * 0.48) },
        { x: Math.round(mapBox.width * 0.66), y: Math.round(mapBox.height * 0.54) },
        { x: Math.round(mapBox.width * 0.76), y: Math.round(mapBox.height * 0.6) }
    ];

    await mapContainer.click({ position: drawPositions[0] });
    await mapContainer.click({ position: drawPositions[1] });
    await mapContainer.click({ position: drawPositions[2] });
    await mapContainer.dblclick({ position: drawPositions[3] });

    await expect.poll(async () => {
        const currentUnitTexts = measurementPanelRoot
            ? await getVisibleUnitTexts(measurementPanelRoot)
            : await getVisibleUnitTexts(page);

        return (
            currentUnitTexts.length > initialUnitTexts.length ||
            currentUnitTexts.some((text) => !initialUnitTexts.includes(text))
        );
    }).toBe(true);
});
