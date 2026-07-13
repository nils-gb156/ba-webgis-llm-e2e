// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { isLayerRendered } from "../../llm/map-model-helpers";

const UVI_LAYER_TITLE = "UV-Index";

test("UC-4: activate the UV-Index overlay and verify it is rendered on the map", async ({
    page
}) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    const map = page.getByTestId("map-container");
    const layerSwitcher = page.getByTestId("layer-switcher");
    // The TOC renders each layer with a checkbox whose accessible name is the
    // layer title. `exact` avoids also matching the "UV-Index Stations" layer.
    const uviToggle = layerSwitcher.getByRole("checkbox", {
        name: UVI_LAYER_TITLE,
        exact: true
    });
    const uviLabel = layerSwitcher.getByText(UVI_LAYER_TITLE, { exact: true });

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: wait until the OpenLayers map model is available on globalThis
    // (exposed by MapComponent for E2E inspection) so the app is fully initialized.
    await page.waitForFunction(
        () => (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap != null
    );

    // Precondition: the layer switcher (TOC) is visible.
    await expect(layerSwitcher).toBeVisible();

    // Precondition: the UV-Index overlay layer is initially hidden. Verified on
    // both the toggle (unchecked) and the map model (layer not rendered).
    await expect(uviToggle).not.toBeChecked();
    expect(await isLayerRendered(page, UVI_LAYER_TITLE)).toBe(false);

    // Step 1: click the visibility toggle of the UV-Index overlay layer to show it.
    await uviLabel.click();

    // Step 2: wait for the map to load the layer tiles (handled by the polling
    // assertion below, which retries until the layer is rendered).

    // Expected result: the UV-Index overlay layer toggle is in the enabled
    // (checked) state.
    await expect(uviToggle).toBeChecked();

    // Expected result: the UV-Index overlay tiles are rendered on the map canvas.
    // The canvas state is not observable through the DOM, so this is read from the
    // exposed map model (`visible === true` means the layer is drawn).
    await expect.poll(() => isLayerRendered(page, UVI_LAYER_TITLE)).toBe(true);
});
