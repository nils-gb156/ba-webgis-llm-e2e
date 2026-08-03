// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const map = page.getByTestId('map-container');
    const toolbar = page.getByTestId('map-toolbar');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });

    await expect(map).toBeVisible();
    await expect(toolbar).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await measurementDialog.isVisible())) {
        const pressed = await measurementToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await measurementToggle.click();
        }
    }

    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(measurementPanel).toBeVisible();
    await expect(measurementDialog).toBeVisible();
    await expect(measurementDialog.getByRole('heading', { name: 'Measurement', exact: true })).toBeVisible();

    await map.click({ position: { x: 520, y: 220 } });
    await map.click({ position: { x: 660, y: 310 } });
    await map.click({ position: { x: 800, y: 250 } });
    await map.dblclick({ position: { x: 940, y: 360 } });

    const lengthTooltip = page.getByRole('tooltip', {
        name: /\d[\d.,]*\s*(?:mm|cm|m|km)\b/i
    });

    await expect(lengthTooltip).toBeVisible();
    await expect(lengthTooltip).toContainText(/\d[\d.,]*\s*(?:mm|cm|m|km)\b/i);
    await expect(measurementDialog).toBeVisible();
});
