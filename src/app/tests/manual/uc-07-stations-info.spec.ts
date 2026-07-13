// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect, type Request } from "@playwright/test";

// The UV-Index Stations layer (WMS) is queried via GetFeatureInfo; in dev mode
// these requests are proxied through "/dwd-wms" (see vite.config.ts). The EUCOS
// Ground Stations layer (WFS) is a vector layer whose feature info is read
// directly from the rendered features (no per-click request).
// Known coordinate (EPSG:3857) of a location where both stations are available,
// read from the app's coordinate viewer.
const STATION_COORD_3857: [number, number] = [1188692.84, 6767643.28];

test("UC-7: click both point station layers to show feature info", async ({ page }) => {
    let uviFeatureInfoRequest: Request | undefined;
    let eucosWfsRequest: Request | undefined;

    // Observe the DWD WMS requests (proxied via /dwd-wms) to verify a
    // GetFeatureInfo request for the UV-Index Stations layer is sent. The real
    // service response is used (no mocking).
    page.on("request", (request) => {
        const url = request.url();
        if (/request=getfeatureinfo/i.test(url) && /query_layers=Uv_Stationen/i.test(url)) {
            uviFeatureInfoRequest = request;
        }
        // Observe the DWD WFS GetFeature request (proxied via /dwd-ows) that loads
        // the EUCOS Ground Stations vector layer. Unlike the WMS layer, this is a
        // one-off request when the map loads (not triggered per click). The
        // "(?!info)" guard excludes WMS GetFeatureInfo requests.
        if (/request=getfeature(?!info)/i.test(url) && /eucos_surface_stations/i.test(url)) {
            eucosWfsRequest = request;
        }
    });

    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    const map = page.getByTestId("map-container");
    const infoPanel = page.getByTestId("info-panel");
    const uviStationSection = page.getByTestId("uvi-station-section");
    const uviStationInfo = page.getByTestId("uvi-station-info");
    const eucosStationSection = page.getByTestId("eucos-station-section");
    const eucosStationInfo = page.getByTestId("eucos-station-info");

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: wait until the OpenLayers map model is available on globalThis
    // (exposed by MapComponent for E2E inspection) so the app is fully initialized.
    await page.waitForFunction(
        () => (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap != null
    );

    // Precondition: the info panel is visible and no station info is shown yet.
    await expect(infoPanel).toBeVisible();
    await expect(uviStationSection).toHaveCount(0);
    await expect(eucosStationSection).toHaveCount(0);

    // Step 1: convert the known EPSG:3857 station coordinate to a canvas pixel
    // position using the OpenLayers map API, then click at that page position.
    const pixel = await page.evaluate((coord) => {
        const m = (
            globalThis as {
                __openPioneerMap?: {
                    olMap: {
                        getPixelFromCoordinate: (c: number[]) => [number, number] | null;
                    };
                };
            }
        ).__openPioneerMap;
        return m?.olMap.getPixelFromCoordinate(coord) ?? null;
    }, STATION_COORD_3857);

    if (!pixel) {
        throw new Error("Station coordinate is outside the current map viewport.");
    }

    const mapBounds = await map.boundingBox();
    const clickX = (mapBounds?.x ?? 0) + pixel[0];
    const clickY = (mapBounds?.y ?? 0) + pixel[1];
    await page.mouse.click(clickX, clickY);

    // Step 2: wait for the info panel to load the station info.

    // Expected result: a WMS GetFeatureInfo request for the UV-Index Stations
    // layer is sent to the DWD geoserver.
    await expect.poll(() => uviFeatureInfoRequest !== undefined).toBe(true);

    // Expected result: the info panel displays a 'UV-Index Station' section with
    // at least one feature entry.
    await expect(uviStationSection).toBeVisible({ timeout: 15000 });
    await expect(uviStationSection).toContainText("UV-Index Station");
    await expect(uviStationInfo).toBeVisible();
    await expect(uviStationInfo).not.toBeEmpty();

    // Expected result: the info panel displays an 'EUCOS Ground Station' section
    // with at least one feature entry resolved from the WFS vector features.
    await expect(eucosStationSection).toBeVisible({ timeout: 15000 });
    await expect(eucosStationSection).toContainText("EUCOS Ground Station");
    await expect(eucosStationInfo).toBeVisible();
    await expect(eucosStationInfo).not.toBeEmpty();

    // Expected result: the EUCOS Ground Stations layer was loaded via a WFS
    // GetFeature request to the DWD geoserver (sent once when the map loaded).
    await expect.poll(() => eucosWfsRequest !== undefined).toBe(true);
});
