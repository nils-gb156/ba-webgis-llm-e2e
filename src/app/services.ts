// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    MapConfig,
    MapConfigProvider,
    MapConfigProviderOptions,
    SimpleLayer
} from "@open-pioneer/map";
import { TemperatureLegend } from "./styles/TemperatureLegend";
import { PrecipitationLegend } from "./styles/PrecipitationLegend";
import { CloudsLegend } from "./styles/CloudsLegend";
import { UviStationsLegend } from "./styles/UviStationsLegend";
import { UvIndexLegend } from "./styles/UvIndexLegend";
import { EucosStationsLegend } from "./styles/EucosStationsLegend";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import XYZ from "ol/source/XYZ";

export const MAP_ID = "main";
// API key for the OpenWeatherMap tile layers, injected at build time via Vite.
const OPEN_WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

/**
 * Builds the WMS time dimension extent for the DWD UV-Index layer dynamically.
 *
 * The extent spans from the start of the current day (UTC) to two days ahead
 * with a daily interval (P1D), so the demo always requests an up-to-date,
 * valid time range instead of a fixed (and eventually stale) date.
 */
function buildUvIndexTimeExtent(daysAhead = 2): string {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + daysAhead);

    return `${start.toISOString()}/${end.toISOString()}/P1D`;
}

export class MainMapProvider implements MapConfigProvider {
    mapId = MAP_ID;

    // Defines the map's initial view and all layers: base maps (Carto/OSM),
    // OpenWeather weather overlays and DWD WMS layers (UV-Index + stations).
    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 1163010, y: 6650236 },
                zoom: 7
            },
            projection: "EPSG:3857",
            layers: [
                layerFactory.create({
                    type: SimpleLayer,
                    title: "Carto Light",
                    olLayer: new TileLayer({
                        source: new XYZ({
                            url: "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                            crossOrigin: "anonymous"
                        }),
                        properties: { title: "Carto Light" }
                    }),
                    isBaseLayer: true
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    title: "Carto Dark",
                    olLayer: new TileLayer({
                        source: new XYZ({
                            url: "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
                            crossOrigin: "anonymous"
                        }),
                        properties: { title: "Carto Dark" }
                    }),
                    isBaseLayer: true
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    title: "OpenStreetMap",
                    olLayer: new TileLayer({
                        source: new OSM(),
                        properties: { title: "OpenStreetMap" }
                    }),
                    isBaseLayer: true
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    title: "UV-Index",
                    visible: false,
                    olLayer: new TileLayer({
                        source: new TileWMS({
                            url: "https://maps.dwd.de/geoserver/dwd/wms",
                            params: {
                                CRS: "EPSG:4326",
                                dpiMode: "7",
                                featureCount: "10",
                                FORMAT: "image/png",
                                LAYERS: "UVIndex",
                                STYLES: "",
                                temporalSource: "provider",
                                timeDimensionExtent: buildUvIndexTimeExtent(),
                                tilePixelRatio: "0"
                            },
                            serverType: "geoserver"
                        }),
                        properties: { title: "UV-Index" }
                    }),
                    attributes: {
                        legend: {
                            Component: UvIndexLegend
                        }
                    }
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    title: "Temperature",
                    visible: true,
                    olLayer: new TileLayer({
                        source: new XYZ({
                            url:
                                "https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=" +
                                OPEN_WEATHER_API_KEY,
                            crossOrigin: "anonymous"
                        }),
                        properties: { title: "Temperature" }
                    }),
                    attributes: {
                        legend: {
                            Component: TemperatureLegend
                        }
                    }
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    title: "Precipitation",
                    visible: false,
                    olLayer: new TileLayer({
                        source: new XYZ({
                            url:
                                "https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=" +
                                OPEN_WEATHER_API_KEY,
                            crossOrigin: "anonymous"
                        }),
                        properties: { title: "Precipitation" }
                    }),
                    attributes: {
                        legend: {
                            Component: PrecipitationLegend
                        }
                    }
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    title: "Clouds",
                    visible: false,
                    olLayer: new TileLayer({
                        source: new XYZ({
                            url:
                                "https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=" +
                                OPEN_WEATHER_API_KEY,
                            crossOrigin: "anonymous"
                        }),
                        properties: { title: "Clouds" }
                    }),
                    attributes: {
                        legend: {
                            Component: CloudsLegend
                        }
                    }
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    title: "UV-Index Stations",
                    visible: true,
                    olLayer: new TileLayer({
                        source: new TileWMS({
                            url: "https://maps.dwd.de/geoserver/dwd/wms",
                            params: {
                                CRS: "EPSG:3857",
                                dpiMode: "7",
                                featureCount: "10",
                                FORMAT: "image/png",
                                LAYERS: "Uv_Stationen",
                                STYLES: "",
                                tilePixelRatio: "0"
                            },
                            serverType: "geoserver"
                        }),
                        properties: { title: "UV-Index Stations" }
                    }),
                    attributes: {
                        legend: {
                            Component: UviStationsLegend
                        }
                    }
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    title: "EUCOS Ground Stations",
                    visible: true,
                    olLayer: new TileLayer({
                        source: new TileWMS({
                            url: "https://maps.dwd.de/geoserver/dwd/wms",
                            params: {
                                CRS: "EPSG:3857",
                                dpiMode: "7",
                                featureCount: "10",
                                FORMAT: "image/png",
                                LAYERS: "EUCOS_surface_stations",
                                STYLES: "",
                                tilePixelRatio: "0"
                            },
                            serverType: "geoserver"
                        }),
                        properties: { title: "EUCOS Ground Stations" }
                    }),
                    attributes: {
                        legend: {
                            Component: EucosStationsLegend
                        }
                    }
                })
            ]
        };
    }
}
