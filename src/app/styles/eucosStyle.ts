// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import type { FeatureLike } from "ol/Feature";

// Outline color shared by all EUCOS ground station markers.
export const EUCOS_STATION_STROKE = "#ffffff";

// Fill color per EUCOS station "TYPE" attribute (0, 1, 2, 3). Exported so the
// legend can render matching swatches (single source of truth for the styling).
export const EUCOS_TYPE_COLORS: Record<number, string> = {
    0: "#2b6cb0", // type 0 - blue
    1: "#1a7f4b", // type 1 - green
    2: "#c05621", // type 2 - orange
    3: "#805ad5" // type 3 - purple
};
// Fallback color for stations with an unknown/missing TYPE value.
export const EUCOS_TYPE_FALLBACK_COLOR = "#718096";

// Human-readable labels for the EUCOS station types (used by the legend).
export const EUCOS_TYPE_LABELS: Record<number, string> = {
    0: "Type 0",
    1: "Type 1",
    2: "Type 2",
    3: "Type 3"
};

function eucosFillColor(type: unknown): string {
    if (typeof type === "number") {
        const color = EUCOS_TYPE_COLORS[type];
        if (color) {
            return color;
        }
    }
    return EUCOS_TYPE_FALLBACK_COLOR;
}

// Cache one style instance per fill color so the style function does not
// allocate a new Style object on every render.
const eucosStyleCache = new Map<string, Style>();

/** OpenLayers style function that colors EUCOS stations by their "TYPE" attribute. */
export function eucosStationStyle(feature: FeatureLike): Style {
    const color = eucosFillColor(feature.get("TYPE"));
    let style = eucosStyleCache.get(color);
    if (!style) {
        style = new Style({
            image: new CircleStyle({
                radius: 5,
                fill: new Fill({ color }),
                stroke: new Stroke({ color: EUCOS_STATION_STROKE, width: 1 })
            })
        });
        eucosStyleCache.set(color, style);
    }
    return style;
}

// WFS endpoint for the EUCOS ground stations. In dev mode the request is routed
// through the local Vite proxy to avoid CORS (see vite.config.ts); in production
// the DWD server sends the appropriate CORS headers so the URL is used directly.
const EUCOS_WFS_BASE = import.meta.env.DEV ? "/dwd-ows" : "https://maps.dwd.de/geoserver/dwd/ows";
export const EUCOS_WFS_URL =
    `${EUCOS_WFS_BASE}?service=WFS&version=2.0.0&request=GetFeature` +
    `&typeName=dwd:EUCOS_surface_stations&outputFormat=application/json&srsName=EPSG:3857`;
