// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";

test("UC-1: show and hide the layer switcher via the toolbar button", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    const map = page.getByTestId("map-container");
    const layerSwitcher = page.getByTestId("layer-switcher");
    const layerSwitcherToggle = page.getByTestId("layer-switcher-toggle");

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: wait until the OpenLayers map model is available on globalThis
    // (exposed by MapComponent for E2E inspection) so the app is fully initialized.
    await page.waitForFunction(
        () => (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap != null
    );

    // Precondition: the layer switcher (TOC) is initially visible.
    await expect(layerSwitcher).toBeVisible();

    // Step 1: click the 'Layer Switcher' button to hide the panel.
    await layerSwitcherToggle.click();

    // Expected result: the layer switcher panel is no longer visible.
    await expect(layerSwitcher).toBeHidden();

    // Step 2: click the 'Layer Switcher' button again to show the panel.
    await layerSwitcherToggle.click();

    // Expected result: the layer switcher panel is visible again.
    await expect(layerSwitcher).toBeVisible();
});
