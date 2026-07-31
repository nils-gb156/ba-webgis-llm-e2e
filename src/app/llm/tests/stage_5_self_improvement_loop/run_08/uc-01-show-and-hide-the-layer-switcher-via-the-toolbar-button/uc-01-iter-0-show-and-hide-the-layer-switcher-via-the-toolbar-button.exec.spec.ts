// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: the layer switcher is initially visible
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Step 1: click the 'Layer Switcher' button to hide the panel
    // The button is initially pressed (aria-pressed="true"), so clicking it will close the panel.
    await page.getByTestId('layer-switcher-toggle').click();

    // Expected result: the layer switcher panel is no longer visible
    await expect(page.getByTestId('layer-switcher')).toBeHidden();

    // Step 2: click the 'Layer Switcher' button again to show the panel
    // The button is now unpressed, so clicking it will open the panel.
    await page.getByTestId('layer-switcher-toggle').click();

    // Expected result: the layer switcher panel is visible again
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
});
