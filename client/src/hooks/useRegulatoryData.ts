import { useQuery } from "@tanstack/react-query";
import type {
  MaxUncertaintySystem,
  MaxUncertaintyComponent,
  InspectionPeriodicity,
  CalibrationPeriodicityGas,
  CalibrationPeriodicityPetroleum,
} from "@shared/schema";

async function fetchRegulatoryData<T>(endpoint: string): Promise<T> {
  const response = await fetch(`/api/regulatory/${endpoint}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  return response.json();
}

async function searchMaxUncertainty(
  system: string,
  category: "petroleum" | "natural_gas"
): Promise<{ maxUncertainty: string | null }> {
  const response = await fetch(
    `/api/regulatory/search-max-uncertainty?system=${encodeURIComponent(system)}&category=${category}`
  );
  if (!response.ok) {
    throw new Error("Failed to search max uncertainty");
  }
  return response.json();
}

async function searchCalibrationPeriodicity(
  instrument: string,
  category: "petroleum" | "natural_gas",
  applicationType?: string
): Promise<{ periodicity: string | null }> {
  let url = `/api/regulatory/search-calibration-periodicity?instrument=${encodeURIComponent(instrument)}&category=${category}`;
  if (applicationType) {
    url += `&applicationType=${encodeURIComponent(applicationType)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to search calibration periodicity");
  }
  return response.json();
}

// Hook para obter incertezas máximas dos sistemas de medição
export function useMaxUncertaintySystems(
  category?: "petroleum" | "natural_gas"
) {
  const endpoint = category
    ? `max-uncertainty-systems?category=${category}`
    : "max-uncertainty-systems";

  return useQuery<MaxUncertaintySystem[]>({
    queryKey: ["regulatory", "max-uncertainty-systems", category],
    queryFn: () => fetchRegulatoryData(endpoint),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Hook para obter incertezas máximas dos componentes
export function useMaxUncertaintyComponents() {
  return useQuery<MaxUncertaintyComponent[]>({
    queryKey: ["regulatory", "max-uncertainty-components"],
    queryFn: () => fetchRegulatoryData("max-uncertainty-components"),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Hook para obter periodicidades de inspeção
export function useInspectionPeriodicities(
  category?: "petroleum" | "natural_gas"
) {
  const endpoint = category
    ? `inspection-periodicities?category=${category}`
    : "inspection-periodicities";

  return useQuery<InspectionPeriodicity[]>({
    queryKey: ["regulatory", "inspection-periodicities", category],
    queryFn: () => fetchRegulatoryData(endpoint),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Hook para obter periodicidades de calibração - gás
export function useCalibrationPeriodicitiesGas() {
  return useQuery<CalibrationPeriodicityGas[]>({
    queryKey: ["regulatory", "calibration-periodicities-gas"],
    queryFn: () => fetchRegulatoryData("calibration-periodicities-gas"),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Hook para obter periodicidades de calibração - petróleo
export function useCalibrationPeriodicitiesPetroleum() {
  return useQuery<CalibrationPeriodicityPetroleum[]>({
    queryKey: ["regulatory", "calibration-periodicities-petroleum"],
    queryFn: () => fetchRegulatoryData("calibration-periodicities-petroleum"),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Hook para buscar incerteza máxima por sistema
export function useSearchMaxUncertainty(
  system: string,
  category: "petroleum" | "natural_gas",
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["regulatory", "search-max-uncertainty", system, category],
    queryFn: () => searchMaxUncertainty(system, category),
    enabled: enabled && !!system && !!category,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Hook para buscar periodicidade de calibração
export function useSearchCalibrationPeriodicity(
  instrument: string,
  category: "petroleum" | "natural_gas",
  applicationType?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [
      "regulatory",
      "search-calibration-periodicity",
      instrument,
      category,
      applicationType,
    ],
    queryFn: () =>
      searchCalibrationPeriodicity(instrument, category, applicationType),
    enabled: enabled && !!instrument && !!category,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Hook combinado para dados regulatórios completos
export function useRegulatoryData(category?: "petroleum" | "natural_gas") {
  const maxUncertaintySystems = useMaxUncertaintySystems(category);
  const maxUncertaintyComponents = useMaxUncertaintyComponents();
  const inspectionPeriodicities = useInspectionPeriodicities(category);
  const calibrationPeriodicitiesGas = useCalibrationPeriodicitiesGas();
  const calibrationPeriodicitiesPetroleum =
    useCalibrationPeriodicitiesPetroleum();

  return {
    maxUncertaintySystems,
    maxUncertaintyComponents,
    inspectionPeriodicities,
    calibrationPeriodicitiesGas,
    calibrationPeriodicitiesPetroleum,
    isLoading:
      maxUncertaintySystems.isLoading ||
      maxUncertaintyComponents.isLoading ||
      inspectionPeriodicities.isLoading ||
      calibrationPeriodicitiesGas.isLoading ||
      calibrationPeriodicitiesPetroleum.isLoading,
    isError:
      maxUncertaintySystems.isError ||
      maxUncertaintyComponents.isError ||
      inspectionPeriodicities.isError ||
      calibrationPeriodicitiesGas.isError ||
      calibrationPeriodicitiesPetroleum.isError,
  };
}
