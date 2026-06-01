// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { StationInfo, type StationFeatureInfo } from "./StationInfo";
import { EUCOS_ATTRIBUTE_LABELS, EUCOS_ATTRIBUTE_ORDER } from "./eucosAttributes";

export type EucosFeatureInfo = StationFeatureInfo;

export interface EucosStationInfoProps {
    eucosFeatureInfo?: EucosFeatureInfo;
}

export function EucosStationInfo({ eucosFeatureInfo }: EucosStationInfoProps) {
    return (
        <StationInfo
            featureInfo={eucosFeatureInfo}
            attributeOrder={EUCOS_ATTRIBUTE_ORDER}
            attributeLabels={EUCOS_ATTRIBUTE_LABELS}
            idleMessage="Click on a EUCOS station to load station info."
        />
    );
}
