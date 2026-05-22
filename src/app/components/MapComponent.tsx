// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Notifier } from "@open-pioneer/notifier";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";

const MAP_ID = "main";

export function MapComponent() {
    const { map } = useMapModel(MAP_ID);

    if (!map) {
        return null;
    }

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <Notifier />
            <DefaultMapProvider map={map}>
                <MapContainer aria-label="webgis map">
                    <MapAnchor />
                </MapContainer>
            </DefaultMapProvider>
        </div>
    );
}
