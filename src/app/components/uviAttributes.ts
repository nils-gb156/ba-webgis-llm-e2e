// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
export const UVI_ATTRIBUTE_ORDER = [
    "STATIONSKENNUNG",
    "STATIONSNAME",
    "ALIASNAME",
    "STATIONSHOEHE",
    "GEOGR_GEOGR_BREITELAENGE",
    "ALPHA3_COD",
    "STAAT_ENGL",
    "THE_GEOM"
];

export const UVI_ATTRIBUTE_LABELS: Record<string, string> = {
    STATIONSKENNUNG: "Identifier",
    STATIONSNAME: "Name",
    ALIASNAME: "Alias",
    STATIONSHOEHE: "Station Height",
    GEOGR_GEOGR_BREITELAENGE: "Geogr. Latitude/Longitude",
    ALPHA3_COD: "Alpha-3 Code",
    STAAT_ENGL: "Country",
    THE_GEOM: "Geometrie"
};
