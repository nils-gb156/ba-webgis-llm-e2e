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
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import XYZ from "ol/source/XYZ";

export const MAP_ID = "main";
const OPEN_WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

export class MainMapProvider implements MapConfigProvider {
    mapId = MAP_ID;

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
                    title: "OpenStreetMap",
                    olLayer: new TileLayer({
                        source: new OSM(),
                        properties: { title: "OpenStreetMap" }
                    }),
                    isBaseLayer: true
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
                    title: "UVI Stations",
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
                            crossOrigin: "anonymous",
                            serverType: "geoserver"
                        })
                    }),
                    attributes: {
                        legend: {
                            Component: UviStationsLegend
                        }
                    }
                })
            ]
        };
    }
}
