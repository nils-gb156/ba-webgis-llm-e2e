// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel } from '../../../../map-model-helpers';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const mapContainer = page.getByTestId('map-container');
    const measurementButton = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(measurementButton).toBeVisible();

    const controlledPanelId = await measurementButton.getAttribute('aria-controls');
    const controlledPanel = controlledPanelId ? page.locator(`[id="${controlledPanelId}"]`) : null;
    const measurementDialog = page.getByRole('dialog', { name: /measurement/i }).first();
    const measurementRegion = page.getByRole('region', { name: /measurement/i }).first();
    const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true }).first();

    const panelAlreadyOpen =
        (controlledPanel ? await controlledPanel.isVisible() : false) ||
        (await measurementDialog.isVisible().catch(() => false)) ||
        (await measurementRegion.isVisible().catch(() => false)) ||
        (await measurementButton.getAttribute('aria-expanded')) === 'true' ||
        (await measurementButton.getAttribute('aria-pressed')) === 'true';

    if (!panelAlreadyOpen) {
        await measurementButton.click();
    }

    await expect
        .poll(async () => {
            if (controlledPanel && (await controlledPanel.isVisible())) {
                return 'controlled-panel';
            }
            if (await measurementDialog.isVisible().catch(() => false)) {
                return 'dialog';
            }
            if (await measurementRegion.isVisible().catch(() => false)) {
                return 'region';
            }
            if (await measurementHeading.isVisible().catch(() => false)) {
                return 'heading';
            }
            if (
                (await measurementButton.getAttribute('aria-expanded')) === 'true' ||
                (await measurementButton.getAttribute('aria-pressed')) === 'true'
            ) {
                return 'toggle-active';
            }
            return '';
        })
        .not.toBe('');

    if (controlledPanel) {
        await expect(controlledPanel).toBeVisible();
    } else if (await measurementDialog.isVisible().catch(() => false)) {
        await expect(measurementDialog).toBeVisible();
    } else if (await measurementRegion.isVisible().catch(() => false)) {
        await expect(measurementRegion).toBeVisible();
    } else {
        await expect(measurementHeading).toBeVisible();
    }

    const box = await mapContainer.boundingBox();
    expect(box).not.toBeNull();
    if (!box) {
        throw new Error('Map container bounding box is not available.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.58),
            y: Math.round(box.height * 0.42)
        }
    });
    await mapContainer.click({
        position: {
            x: Math.round(box.width * 0.68),
            y: Math.round(box.height * 0.53)
        }
    });
    await mapContainer.dblclick({
        position: {
            x: Math.round(box.width * 0.78),
            y: Math.round(box.height * 0.46)
        }
    });

    const lengthValuePattern = /\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/;
    const lengthLabelAndValuePattern =
        /(?:length|distance)[\s\S]*\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i;

    if (controlledPanel && (await controlledPanel.isVisible())) {
        await expect(controlledPanel.getByText(lengthValuePattern).first()).toBeVisible();
    } else if (await measurementDialog.isVisible().catch(() => false)) {
        await expect(measurementDialog.getByText(lengthValuePattern).first()).toBeVisible();
    } else if (await measurementRegion.isVisible().catch(() => false)) {
        await expect(measurementRegion.getByText(lengthValuePattern).first()).toBeVisible();
    } else {
        await expect(measurementHeading).toBeVisible();
        await expect.poll(async () => await page.locator('body').innerText()).toMatch(lengthLabelAndValuePattern);
    }
});
