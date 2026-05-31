// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Separator } from "@chakra-ui/react";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import { WeatherForecast } from "./WeatherForecast";
import { UviStationInfo, type UviFeatureInfo } from "./UviStationInfo";
import { EucosStationInfo, type EucosFeatureInfo } from "./EucosStationInfo";

export interface InfoPanelProps {
    coordinate?: [number, number];
    uviFeatureInfo?: UviFeatureInfo;
    eucosFeatureInfo?: EucosFeatureInfo;
}

export function InfoPanel({ coordinate, uviFeatureInfo, eucosFeatureInfo }: InfoPanelProps) {
    const showUviInfo = uviFeatureInfo?.status === "json" || uviFeatureInfo?.status === "text";
    const showEucosInfo =
        eucosFeatureInfo?.status === "json" || eucosFeatureInfo?.status === "text";

    return (
        <TitledSection title={<SectionHeading size="md">Information</SectionHeading>}>
            <SectionHeading size="sm">Weather Forecast</SectionHeading>
            <Box mt={2}>
                {coordinate ? (
                    <WeatherForecast coordinate={coordinate} />
                ) : (
                    <p>Click on the map to load a forecast.</p>
                )}
            </Box>

            {showUviInfo && (
                <>
                    <Separator my={3} />
                    <SectionHeading size="sm" mt={4}>
                        UV-Index Station
                    </SectionHeading>
                    <Box mt={2}>
                        <UviStationInfo uviFeatureInfo={uviFeatureInfo} />
                    </Box>
                </>
            )}

            {showEucosInfo && (
                <>
                    <Separator my={3} />
                    <SectionHeading size="sm" mt={4}>
                        EUCOS Ground Station
                    </SectionHeading>
                    <Box mt={2}>
                        <EucosStationInfo eucosFeatureInfo={eucosFeatureInfo} />
                    </Box>
                </>
            )}
        </TitledSection>
    );
}
