// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    await expect(uvIndexToggle).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    await uvIndexToggle.click({ force: true });

    await expect(uvIndexToggle).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
