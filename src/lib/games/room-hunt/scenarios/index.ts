/** Every scenario, in the order the Scenarios page lists them, with its staging. */
import type { Scenario } from './scenario';
import type { Stage } from './stage';
import { restaurant, restaurantStage } from './restaurant';
import { taxi, taxiStage } from './taxi';
import { market, marketStage } from './market';
import { pharmacy, pharmacyStage } from './pharmacy';
import { hotel, hotelStage } from './hotel';
import { cafe, cafeStage } from './cafe';
import { doctor, doctorStage } from './doctor';
import { airport, airportStage } from './airport';
import { directions, directionsStage } from './directions';

export interface ScenarioEntry {
	scenario: Scenario;
	stage: Stage;
}

export const SCENARIOS: ScenarioEntry[] = [
	{ scenario: restaurant, stage: restaurantStage },
	{ scenario: taxi, stage: taxiStage },
	{ scenario: market, stage: marketStage },
	{ scenario: pharmacy, stage: pharmacyStage },
	{ scenario: hotel, stage: hotelStage },
	{ scenario: cafe, stage: cafeStage },
	{ scenario: doctor, stage: doctorStage },
	{ scenario: airport, stage: airportStage },
	{ scenario: directions, stage: directionsStage }
];

export function getScenario(id: string): ScenarioEntry {
	return SCENARIOS.find((s) => s.scenario.id === id) ?? SCENARIOS[0];
}
