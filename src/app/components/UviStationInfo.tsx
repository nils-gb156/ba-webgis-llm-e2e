// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { StationInfo, type StationFeatureInfo } from "./StationInfo";
import { UVI_ATTRIBUTE_LABELS, UVI_ATTRIBUTE_ORDER } from "./uviAttributes";

export type UviFeatureInfo = StationFeatureInfo;

export interface UviStationInfoProps {
    uviFeatureInfo?: UviFeatureInfo;
}

export function UviStationInfo({ uviFeatureInfo }: UviStationInfoProps) {
    return (
        <StationInfo
            featureInfo={uviFeatureInfo}
            attributeOrder={UVI_ATTRIBUTE_ORDER}
            attributeLabels={UVI_ATTRIBUTE_LABELS}
            idleMessage="Click on a UVI station to load station info."
            testId="uvi-station-info"
        />
    );
}
