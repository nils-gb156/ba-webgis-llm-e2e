// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter } from "../../../../map-model-helpers";

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
    const dialogs = page.getByRole('dialog');

    const countLengthValues = async (): Promise<number> => {
        const bodyText = await page.locator('body').textContent();
        return (bodyText?.match(/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/gi) ?? []).length;
    };

    const isMeasurementPanelVisibleOrActive = async (): Promise<boolean> => {
        if ((await measurementHeading.count()) > 0 && (await measurementHeading.first().isVisible())) {
            return true;
        }

        if ((await dialogs.count()) > 0 && (await dialogs.first().isVisible())) {
            return true;
        }

        return (await measurementToggle.getAttribute('aria-pressed')) === 'true';
    };

    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    if (!(await isMeasurementPanelVisibleOrActive())) {
        await measurementToggle.click();
    }

    await expect.poll(isMeasurementPanelVisibleOrActive).toBe(true);

    const pressedState = await measurementToggle.getAttribute('aria-pressed');
    if (pressedState !== null) {
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    }

    const lengthValueCountBeforeDrawing = await countLengthValues();

    await mapContainer.click({ position: { x: 520, y: 260 } });
    await mapContainer.click({ position: { x: 700, y: 310 } });
    await mapContainer.click({ position: { x: 820, y: 360 } });
    await mapContainer.dblclick({ position: { x: 940, y: 420 } });

    await expect.poll(countLengthValues).toBeGreaterThan(lengthValueCountBeforeDrawing);
});
