// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { getActiveBaseLayerTitle } from "../../llm/map-model-helpers";

test("UC-2: switch the base map from Carto Light to OpenStreetMap", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    const map = page.getByTestId("map-container");
    const layerSwitcher = page.getByTestId("layer-switcher");
    const basemapTrigger = layerSwitcher.getByRole("combobox", { name: "Basemaps" });

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: wait until the OpenLayers map model is available on globalThis
    // (exposed by MapComponent for E2E inspection) so the app is fully initialized.
    await page.waitForFunction(
        () => (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap != null
    );

    // Precondition: the layer switcher (TOC) is visible.
    await expect(layerSwitcher).toBeVisible();

    // Precondition: the Carto Light base map is active by default.
    expect(await getActiveBaseLayerTitle(page)).toBe("Carto Light");
    await expect(basemapTrigger).toContainText("Carto Light");

    // Step 1: open the base map selector in the layer switcher.
    await basemapTrigger.click();

    // Step 2: select 'OpenStreetMap' as the base map.
    await page.getByRole("option", { name: "OpenStreetMap" }).click();

    // Expected result: the OpenStreetMap base map is selected and the
    // Carto Light base map is no longer selected.
    await expect(basemapTrigger).toContainText("OpenStreetMap");
    expect(await getActiveBaseLayerTitle(page)).toBe("OpenStreetMap");
    expect(await getActiveBaseLayerTitle(page)).not.toBe("Carto Light");
});
