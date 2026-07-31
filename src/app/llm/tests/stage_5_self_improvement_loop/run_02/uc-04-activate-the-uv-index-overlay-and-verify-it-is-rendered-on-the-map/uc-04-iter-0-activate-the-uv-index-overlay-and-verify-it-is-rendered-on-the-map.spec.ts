// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the layer switcher to be visible
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Click the UV-Index checkbox to enable the layer
    // Chakra UI checkbox: click({ force: true }) on the role locator
    await page.getByRole('checkbox', { name: 'UV-Index' }).click({ force: true });

    // Verify the checkbox is now checked
    await expect(page.getByRole('checkbox', { name: 'UV-Index' })).toBeChecked();

    // Wait for the UV-Index layer to be rendered on the map
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
