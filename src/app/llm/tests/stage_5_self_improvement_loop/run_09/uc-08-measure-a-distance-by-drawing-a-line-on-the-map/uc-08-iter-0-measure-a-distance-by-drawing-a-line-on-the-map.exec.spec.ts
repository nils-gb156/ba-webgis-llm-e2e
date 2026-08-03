// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const app = page.getByRole('application', { name: 'webgis map' });
    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementDialog = page.getByRole('dialog');
    const measurementRegion = page.getByRole('region', { name: /measurement/i });
    const measurementHeading = page.getByRole('heading', { name: /^measurement$/i });
    const lengthText = page.getByText(/length/i);

    await expect(app).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    const panelAlreadyVisible =
        (await measurementDialog.isVisible()) ||
        (await measurementRegion.isVisible()) ||
        (await measurementHeading.isVisible()) ||
        (await lengthText.isVisible());

    if (!panelAlreadyVisible) {
        await measurementToggle.click();
    }

    await expect.poll(async () => {
        return (
            (await measurementDialog.isVisible()) ||
            (await measurementRegion.isVisible()) ||
            (await measurementHeading.isVisible()) ||
            (await lengthText.isVisible()) ||
            (await measurementToggle.getAttribute('aria-pressed')) === 'true'
        );
    }).toBe(true);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.38),
            y: Math.round(mapBox.height * 0.48)
        }
    });
    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.52),
            y: Math.round(mapBox.height * 0.58)
        }
    });
    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.66),
            y: Math.round(mapBox.height * 0.44)
        }
    });
    await mapContainer.dblclick({
        position: {
            x: Math.round(mapBox.width * 0.76),
            y: Math.round(mapBox.height * 0.52)
        }
    });

    if (await measurementDialog.isVisible()) {
        await expect(measurementDialog).toBeVisible();
        await expect(measurementDialog.getByText(/length/i)).toBeVisible();
        await expect(measurementDialog.getByText(/\b\d+(?:[.,]\d+)?\s?(m|km)\b/i)).toBeVisible();
    } else if (await measurementRegion.isVisible()) {
        await expect(measurementRegion).toBeVisible();
        await expect(measurementRegion.getByText(/length/i)).toBeVisible();
        await expect(measurementRegion.getByText(/\b\d+(?:[.,]\d+)?\s?(m|km)\b/i)).toBeVisible();
    } else {
        await expect(lengthText).toBeVisible();
        await expect(app.getByText(/(length|distance)[\s\S]*\b\d+(?:[.,]\d+)?\s?(m|km)\b/i)).toBeVisible();
    }
});
