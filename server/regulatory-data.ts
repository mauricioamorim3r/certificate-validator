import {
  MaxUncertaintySystem,
  MaxUncertaintyComponent,
  InspectionPeriodicity,
  CalibrationPeriodicityGas,
  CalibrationPeriodicityPetroleum,
} from "@shared/schema";

// 1. Incertezas máximas admissíveis dos sistemas de medição
export const maxUncertaintySystemsData: MaxUncertaintySystem[] = [
  {
    id: 1,
    measurementSystem:
      "Medição fiscal e de transferência de custódia de petróleo com viscosidade dinâmica de até 1000 mPa.s",
    maxUncertainty: "0,3%",
    category: "petroleum",
  },
  {
    id: 2,
    measurementSystem:
      "Medição fiscal e de transferência de custódia de petróleo com viscosidade dinâmica acima de 1000 mPa.s",
    maxUncertainty: "1,0%",
    category: "petroleum",
  },
  {
    id: 3,
    measurementSystem: "Medição de apropriação de petróleo",
    maxUncertainty: "1,0%",
    category: "petroleum",
  },
  {
    id: 4,
    measurementSystem:
      "Medição fiscal e de transferência de custódia de gás natural - medidor linear",
    maxUncertainty: "1,0%",
    category: "natural_gas",
  },
  {
    id: 5,
    measurementSystem: "Medição de apropriação de gás natural - medidor linear",
    maxUncertainty: "2,0%",
    category: "natural_gas",
  },
  {
    id: 6,
    measurementSystem:
      "Medição fiscal e de transferência de custódia de gás natural - medidor por diferença de pressão",
    maxUncertainty: "1,5%",
    category: "natural_gas",
  },
  {
    id: 7,
    measurementSystem:
      "Medição de apropriação de gás - medidor por diferença de pressão",
    maxUncertainty: "2,0%",
    category: "natural_gas",
  },
  {
    id: 8,
    measurementSystem: "Medidor de gás natural ventilado ou queimado em tocha",
    maxUncertainty: "5,0%",
    category: "natural_gas",
  },
  {
    id: 9,
    measurementSystem: "Medição operacional de petróleo",
    maxUncertainty: "1,0%",
    category: "petroleum",
  },
  {
    id: 10,
    measurementSystem: "Medição operacional de gás natural",
    maxUncertainty: "3,0%",
    category: "natural_gas",
  },
  {
    id: 11,
    measurementSystem: "Volume total de produção de petróleo",
    maxUncertainty: "0,6%",
    category: "petroleum",
  },
  {
    id: 12,
    measurementSystem: "Volume total de produção de gás",
    maxUncertainty: "3,0%",
    category: "natural_gas",
    notes:
      "Incerteza expandida do volume líquido médio pelo sistema de medição na condição padrão de medição, com probabilidade de abrangência de aproximadamente 95%, considerando o disposto no item 9.3.1.",
  },
];

// 2. Incertezas máximas admitidas dos componentes dos sistemas de medição
export const maxUncertaintyComponentsData: MaxUncertaintyComponent[] = [
  {
    id: 1,
    component:
      "Medidor em operação de petróleo fiscal ou transferência de custódia – ultrassônico ou coriolis",
    meshUncertainty:
      "1 pulso a cada 100.000 ou 0,001% durante a fase de transmissão de pulsos",
    maxAdmittedUncertainty: "0,20%",
    repeatability: "0,05% em 3 corridas – incerteza equivalente de 0,075%",
  },
  {
    id: 2,
    component: "Medidor em operação de petróleo apropriação",
    meshUncertainty:
      "1 pulso a cada 100.000 ou 0,001% durante a fase de transmissão de pulsos",
    maxAdmittedUncertainty: "0,70%",
    repeatability: "0,09% em 3 corridas – incerteza equivalente de 0,133%",
  },
  {
    id: 3,
    component: "Medidor padrão de trabalho de gás natural – medidor linear",
    meshUncertainty:
      "1 pulso a cada 100.000 ou 0,001% durante a fase de transmissão de pulsos",
    maxAdmittedUncertainty: "0,50%",
    repeatability:
      "0,17% em 3 corridas sucessivas – incerteza equivalente de 0,27%",
  },
  {
    id: 4,
    component:
      "Medidor em operação de gás natural fiscal ou transferência de custódia – turbina ou deslocamento positivo",
    meshUncertainty:
      "1 pulso a cada 100.000 ou 0,001% durante a fase de transmissão de pulsos",
    maxAdmittedUncertainty: "0,70%",
    repeatability: "0,28% em 3 corridas sucessivas",
  },
  {
    id: 5,
    component:
      "Medidor em operação de gás natural fiscal ou transferência de custódia – ultrassônico ou coriolis",
    meshUncertainty:
      "1 pulso a cada 100.000 ou 0,001% durante a fase de transmissão de pulsos",
    maxAdmittedUncertainty: "0,70%",
    repeatability: "0,40% em 3 corridas sucessivas",
  },
  {
    id: 6,
    component:
      "Medidor em operação de gás natural apropriação – medidor linear",
    meshUncertainty:
      "1 pulso a cada 100.000 ou 0,001% durante a fase de transmissão de pulsos",
    maxAdmittedUncertainty: "1,20%",
    repeatability:
      "0,50% em 3 corridas sucessivas – incerteza equivalente de 0,73%",
  },
  {
    id: 7,
    component: "Medição de pressão estática",
    meshUncertainty: "0,30%",
    maxAdmittedUncertainty: "0,10%",
  },
  {
    id: 8,
    component: "Medição de temperatura",
    meshUncertainty: "0,30°C",
    maxAdmittedUncertainty: "0,20°C",
  },
  {
    id: 9,
    component: "Medição de pressão diferencial",
    meshUncertainty: "0,30%",
    maxAdmittedUncertainty: "0,10%",
  },
  {
    id: 10,
    component:
      "Analisador em linha – massa específica de petróleo ou gás natural",
    meshUncertainty: "0,50 kg/m³",
    maxAdmittedUncertainty: "0,30 kg/m³",
  },
  {
    id: 11,
    component: "Analisador em linha – BSW",
    meshUncertainty: "-",
    maxAdmittedUncertainty:
      "0,05% em valor absoluto para BSW de 0% a 1%; 5% do valor medido para BSW superior a 1%",
    repeatability: "0,5% do valor medido para BSW acima de 0,01%",
  },
  {
    id: 12,
    component: "Analisador em linha – cromatógrafo",
    meshUncertainty: "-",
    maxAdmittedUncertainty: "0,50% do fator de compressibilidade",
    repeatability: "De 0% a 25%: 0,02%; de 25% a 100%: 0,05% em mol",
  },
];

// 3. Periodicidade de inspeções dos componentes específicos (gás natural)
export const inspectionPeriodicitiesGasData: InspectionPeriodicity[] = [
  {
    id: 1,
    instrument: "Inspeção de placa de orifício",
    fiscal: "12 meses",
    appropriation: "12 meses",
    custodyTransferProduced: "12 meses",
    custodyTransferProcessed: "12 meses",
    category: "natural_gas",
  },
  {
    id: 2,
    instrument: "Inspeção de trecho reto",
    fiscal: "24 meses",
    appropriation: "24 meses",
    custodyTransferProduced: "24 meses",
    custodyTransferProcessed: "24 meses",
    category: "natural_gas",
  },
  {
    id: 3,
    instrument: "Inspeção de porta placa",
    fiscal: "12 meses",
    appropriation: "12 meses",
    custodyTransferProduced: "12 meses",
    custodyTransferProcessed: "12 meses",
    category: "natural_gas",
  },
  {
    id: 4,
    instrument: "Inspeção de retificador/condicionador de fluxo",
    fiscal: "24 meses",
    appropriation: "24 meses",
    custodyTransferProduced: "24 meses",
    custodyTransferProcessed: "24 meses",
    category: "natural_gas",
  },
];

// 4. Periodicidade de calibração dos sistemas de medição de gás natural
export const calibrationPeriodicitiesGasData: CalibrationPeriodicityGas[] = [
  {
    id: 1,
    instrument:
      "Medidor Padrão de trabalho deslocamento positivo, rotativo e turbina",
    fiscal: "24 meses",
    appropriation: "24 meses",
    custodyTransferProduced: "24 meses",
    custodyTransferProcessed: "24 meses",
  },
  {
    id: 2,
    instrument: "Medidor Padrão de trabalho Coriolis",
    fiscal: "30 meses",
    appropriation: "30 meses",
    custodyTransferProduced: "30 meses",
    custodyTransferProcessed: "24 meses",
  },
  {
    id: 3,
    instrument: "Medidor Padrão de trabalho Ultrassônico",
    fiscal: "30 meses",
    appropriation: "30 meses",
    custodyTransferProduced: "30 meses",
    custodyTransferProcessed: "60 meses",
  },
  {
    id: 4,
    instrument: "Medidor Padrão de trabalho outras tecnologias",
    fiscal: "12 meses",
    appropriation: "12 meses",
    custodyTransferProduced: "12 meses",
    custodyTransferProcessed: "12 meses",
  },
  {
    id: 5,
    instrument:
      "Medidor em operação deslocamento positivo, rotativo e turbina com calibração externa",
    fiscal: "18 meses",
    appropriation: "18 meses",
    custodyTransferProduced: "18 meses",
    custodyTransferProcessed: "24 meses",
  },
  {
    id: 6,
    instrument: "Medidor em operação Coriolis com calibração externa",
    fiscal: "24 meses",
    appropriation: "24 meses",
    custodyTransferProduced: "24 meses",
    custodyTransferProcessed: "24 meses",
  },
  {
    id: 7,
    instrument: "Medidor em operação Ultrassônico com calibração externa",
    fiscal: "24 meses",
    appropriation: "24 meses",
    custodyTransferProduced: "24 meses",
    custodyTransferProcessed: "60 meses",
  },
  {
    id: 8,
    instrument: "Medidor em operação outras tecnologias com calibração externa",
    fiscal: "6 meses",
    appropriation: "12 meses",
    custodyTransferProduced: "12 meses",
    custodyTransferProcessed: "12 meses",
  },
  {
    id: 9,
    instrument:
      "Medidor em operação outras tecnologias com calibração na instalação",
    fiscal: "12 meses",
    appropriation: "12 meses",
    custodyTransferProduced: "12 meses",
    custodyTransferProcessed: "12 meses",
  },
  {
    id: 10,
    instrument:
      "Medidor em operação deslocamento positivo, rotativo e turbina com calibração na instalação",
    fiscal: "2 meses",
    appropriation: "4 meses",
    custodyTransferProduced: "4 meses",
    custodyTransferProcessed: "4 meses",
  },
];

// 5. Periodicidade de calibração dos sistemas de medição de petróleo
export const calibrationPeriodicitiesPetroleumData: CalibrationPeriodicityPetroleum[] =
  [
    {
      id: 1,
      instrumentAndMeasures: "Tanques de Calibração",
      applicationType: "Todos",
      fiscal: "36 meses",
      appropriation: "36 meses",
      custodyTransfer: "36 meses",
    },
    {
      id: 2,
      instrumentAndMeasures: "Provador convencional",
      applicationType: "Todos",
      fiscal: "60 meses",
      appropriation: "60 meses",
      custodyTransfer: "60 meses",
    },
    {
      id: 3,
      instrumentAndMeasures: "Provador compacto",
      applicationType: "Todos",
      fiscal: "36 meses",
      appropriation: "36 meses",
      custodyTransfer: "36 meses",
    },
    {
      id: 4,
      instrumentAndMeasures: "Provador móvel",
      applicationType: "Todos",
      fiscal: "12 meses",
      appropriation: "12 meses",
      custodyTransfer: "12 meses",
    },
    {
      id: 5,
      instrumentAndMeasures:
        "Medidor padrão de trabalho deslocamento positivo, rotativo, turbina ou outras tecnologias",
      applicationType: "Todos",
      fiscal: "9 meses",
      appropriation: "12 meses",
      custodyTransfer: "12 meses",
    },
    {
      id: 6,
      instrumentAndMeasures:
        "Medidor padrão de trabalho coriolis ou ultrassônico",
      applicationType: "Todos",
      fiscal: "18 meses",
      appropriation: "18 meses",
      custodyTransfer: "18 meses",
    },
    {
      id: 7,
      instrumentAndMeasures:
        "Medidor em operação deslocamento positivo, rotativo, turbina ou outras tecnologias com calibração externa",
      applicationType: "Todos",
      fiscal: "3 meses",
      appropriation: "6 meses",
      custodyTransfer: "6 meses",
    },
    {
      id: 8,
      instrumentAndMeasures:
        "Medidor em operação coriolis ou ultrassônico com calibração externa",
      applicationType: "Todos",
      fiscal: "6 meses",
      appropriation: "12 meses",
      custodyTransfer: "12 meses",
    },
  ];

// Funções auxiliares para buscar dados
export class RegulatoryDataService {
  static getMaxUncertaintySystemsByCategory(
    category: "petroleum" | "natural_gas"
  ): MaxUncertaintySystem[] {
    return maxUncertaintySystemsData.filter(
      (item) => item.category === category
    );
  }

  static getAllMaxUncertaintySystems(): MaxUncertaintySystem[] {
    return maxUncertaintySystemsData;
  }

  static getAllMaxUncertaintyComponents(): MaxUncertaintyComponent[] {
    return maxUncertaintyComponentsData;
  }

  static getInspectionPeriodicitiesByCategory(
    category: "petroleum" | "natural_gas"
  ): InspectionPeriodicity[] {
    return inspectionPeriodicitiesGasData.filter(
      (item) => item.category === category
    );
  }

  static getAllCalibrationPeriodicitiesGas(): CalibrationPeriodicityGas[] {
    return calibrationPeriodicitiesGasData;
  }

  static getAllCalibrationPeriodicitiesPetroleum(): CalibrationPeriodicityPetroleum[] {
    return calibrationPeriodicitiesPetroleumData;
  }

  // Função para buscar incerteza máxima admissível por sistema de medição
  static findMaxUncertaintyForSystem(
    systemDescription: string,
    category: "petroleum" | "natural_gas"
  ): string | null {
    const systems = this.getMaxUncertaintySystemsByCategory(category);
    const found = systems.find((system) =>
      system.measurementSystem
        .toLowerCase()
        .includes(systemDescription.toLowerCase())
    );
    return found ? found.maxUncertainty : null;
  }

  // Função para buscar periodicidade de calibração
  static findCalibrationPeriodicity(
    instrument: string,
    applicationType: string,
    category: "petroleum" | "natural_gas"
  ): string | null {
    if (category === "petroleum") {
      const found = this.getAllCalibrationPeriodicitiesPetroleum().find(
        (item) =>
          item.instrumentAndMeasures
            .toLowerCase()
            .includes(instrument.toLowerCase())
      );
      return found ? found.fiscal : null;
    } else {
      const found = this.getAllCalibrationPeriodicitiesGas().find((item) =>
        item.instrument.toLowerCase().includes(instrument.toLowerCase())
      );
      return found ? found.fiscal : null;
    }
  }
}
