// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Stack, Text } from "@chakra-ui/react";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import { WeatherForecast } from "./WeatherForecast";
import { UviStationInfo, type UviFeatureInfo } from "./UviStationInfo";
import { EucosStationInfo, type EucosFeatureInfo } from "./EucosStationInfo";

export interface InfoPanelProps {
    coordinate?: [number, number];
    uviFeatureInfo?: UviFeatureInfo;
    eucosFeatureInfo?: EucosFeatureInfo;
}

// Side panel that combines the weather forecast with the UV-Index and EUCOS
// station details for the currently selected location.
export function InfoPanel({ coordinate, uviFeatureInfo, eucosFeatureInfo }: InfoPanelProps) {
    // Only show the station sections when there is actual feature data to display.
    const showUviInfo = uviFeatureInfo?.status === "json" || uviFeatureInfo?.status === "text";
    const showEucosInfo =
        eucosFeatureInfo?.status === "json" || eucosFeatureInfo?.status === "text";

    return (
        <TitledSection title={<SectionHeading size="md">Information</SectionHeading>}>
            <Stack gap={5}>
                <Box data-testid="weather-forecast-section">
                    <SectionHeading size="sm">Weather Forecast</SectionHeading>
                    <Box mt={2}>
                        {coordinate ? (
                            <WeatherForecast coordinate={coordinate} />
                        ) : (
                            <Text fontSize="sm" color="gray.600">
                                Click on the map to load a forecast.
                            </Text>
                        )}
                    </Box>
                </Box>

                {showUviInfo && (
                    <Box data-testid="uvi-station-section">
                        <SectionHeading size="sm">UV-Index Station</SectionHeading>
                        <Box mt={2}>
                            <UviStationInfo uviFeatureInfo={uviFeatureInfo} />
                        </Box>
                    </Box>
                )}

                {showEucosInfo && (
                    <Box data-testid="eucos-station-section">
                        <SectionHeading size="sm">EUCOS Ground Station</SectionHeading>
                        <Box mt={2}>
                            <EucosStationInfo eucosFeatureInfo={eucosFeatureInfo} />
                        </Box>
                    </Box>
                )}
            </Stack>
        </TitledSection>
    );
}
