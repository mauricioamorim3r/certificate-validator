// Utilidades para análise automática de resultados de calibração
// Baseado na regra |Erro| + U ≤ EMA conforme ISO/IEC 17025

export interface CalibrationPoint {
  point: string;
  referenceValue: number;
  measuredValue: number;
  error: number;
  uncertainty: number;
  errorLimit: number; // EMA - Erro Máximo Admissível
  ok: boolean;
  autoCalculated?: boolean;
}

export interface CalibrationRange {
  min: number;
  max: number;
  unit: string;
}

export interface ConformityAssessment {
  declaracaoPresente: boolean;
  limiteEspecificacaoDefinido: boolean;
  regraDecisaoAplicada: {
    descricao: string;
    utilizaIncerteza: boolean;
  };
  nivelRiscoConsiderado: {
    descricao: string;
    nivelConfianca: string;
  };
  justificativas: {
    comentarioConformidade: string;
    comentarioLimite: string;
    comentarioRegraDecisao: string;
    comentarioNivelRisco: string;
  };
}

export interface CalibrationAnalysis {
  faixaCalibracao: CalibrationRange;
  faixaOperacional: CalibrationRange;
  pontosCalibrados: CalibrationPoint[];
  comentariosResultados: string;
  conformidade: ConformityAssessment;
}

/**
 * Calcula automaticamente o erro entre valor medido e valor de referência
 */
export function calculateError(
  measuredValue: number,
  referenceValue: number
): number {
  return Number((measuredValue - referenceValue).toFixed(4));
}

/**
 * Avalia se um ponto está conforme usando a regra |Erro| + U ≤ EMA
 */
export function evaluatePointConformity(
  error: number,
  uncertainty: number,
  errorLimit: number
): boolean {
  return Math.abs(error) + uncertainty <= errorLimit;
}

/**
 * Processa um ponto de calibração calculando erro e conformidade automaticamente
 */
export function processCalibrationPoint(
  point: string,
  referenceValue: number,
  measuredValue: number,
  uncertainty: number,
  errorLimit: number
): CalibrationPoint {
  const error = calculateError(measuredValue, referenceValue);
  const ok = evaluatePointConformity(error, uncertainty, errorLimit);

  return {
    point,
    referenceValue,
    measuredValue,
    error,
    uncertainty,
    errorLimit,
    ok,
    autoCalculated: true,
  };
}

/**
 * Processa múltiplos pontos de calibração
 */
export function processCalibrationPoints(
  points: Array<{
    point: string;
    referenceValue: number;
    measuredValue: number;
    uncertainty: number;
    errorLimit: number;
  }>
): CalibrationPoint[] {
  return points.map((p) =>
    processCalibrationPoint(
      p.point,
      p.referenceValue,
      p.measuredValue,
      p.uncertainty,
      p.errorLimit
    )
  );
}

/**
 * Gera relatório de conformidade automático
 */
export function generateConformityAssessment(
  points: CalibrationPoint[]
): ConformityAssessment {
  const nonConformPoints = points.filter((p) => !p.ok);
  const totalPoints = points.length;
  const conformPoints = totalPoints - nonConformPoints.length;

  let comentarioConformidade = `Avaliação realizada em ${totalPoints} pontos de calibração. `;
  if (nonConformPoints.length === 0) {
    comentarioConformidade +=
      "Todos os pontos apresentaram conformidade com os limites especificados.";
  } else {
    comentarioConformidade += `${conformPoints} pontos conformes, ${nonConformPoints.length} pontos não conformes. Pontos não conformes: ${nonConformPoints.map((p) => p.point).join(", ")}.`;
  }

  return {
    declaracaoPresente: true,
    limiteEspecificacaoDefinido: true,
    regraDecisaoAplicada: {
      descricao: "|Erro| + U ≤ EMA",
      utilizaIncerteza: true,
    },
    nivelRiscoConsiderado: {
      descricao: "Critério conservador com 95% de confiança",
      nivelConfianca: "95%",
    },
    justificativas: {
      comentarioConformidade,
      comentarioLimite:
        "Limite baseado na classe de exatidão do instrumento conforme especificação técnica.",
      comentarioRegraDecisao:
        "Aplicada a regra de decisão com soma do erro absoluto mais incerteza expandida comparada ao erro máximo admissível (EMA).",
      comentarioNivelRisco:
        "Utilizado intervalo expandido com fator de abrangência k=2 correspondente a aproximadamente 95% de confiança.",
    },
  };
}

/**
 * Gera análise completa de calibração
 */
export function generateCalibrationAnalysis(
  points: CalibrationPoint[],
  calibrationRange: CalibrationRange,
  operationalRange?: CalibrationRange
): CalibrationAnalysis {
  const conformidade = generateConformityAssessment(points);
  const nonConformPoints = points.filter((p) => !p.ok);

  let comentariosResultados =
    "Resultados processados automaticamente com base na regra |Erro| + U ≤ EMA. ";

  if (nonConformPoints.length > 0) {
    const maxNonConformValue = Math.max(
      ...nonConformPoints.map((p) => p.referenceValue)
    );
    const minConformValue = Math.min(
      ...points.filter((p) => p.ok).map((p) => p.referenceValue)
    );

    if (maxNonConformValue > minConformValue) {
      comentariosResultados += `Recomenda-se considerar redução da faixa operacional até ${minConformValue} ${calibrationRange.unit} devido às não conformidades identificadas.`;
    }
  } else {
    comentariosResultados +=
      "Todos os pontos apresentaram conformidade dentro dos limites especificados.";
  }

  return {
    faixaCalibracao: calibrationRange,
    faixaOperacional: operationalRange || calibrationRange,
    pontosCalibrados: points,
    comentariosResultados,
    conformidade,
  };
}

/**
 * Exporta análise para JSON estruturado
 */
export function exportCalibrationAnalysisToJSON(
  analysis: CalibrationAnalysis
): string {
  const exportData = {
    calibracao: {
      faixa_calibracao_reportada: {
        valor_min: analysis.faixaCalibracao.min,
        valor_max: analysis.faixaCalibracao.max,
        unidade: analysis.faixaCalibracao.unit,
      },
      faixa_operacional: {
        valor_min: analysis.faixaOperacional.min,
        valor_max: analysis.faixaOperacional.max,
        unidade: analysis.faixaOperacional.unit,
      },
      pontos_calibrados: analysis.pontosCalibrados.map((p) => ({
        ponto: p.point,
        valor_referencia: p.referenceValue,
        valor_medido: p.measuredValue,
        erro: p.error,
        incerteza: p.uncertainty,
        ema: p.errorLimit,
        conforme: p.ok,
      })),
      comentarios_resultados: analysis.comentariosResultados,
    },
    conformidade: {
      declaracao_presente: analysis.conformidade.declaracaoPresente,
      limite_especificacao_definido:
        analysis.conformidade.limiteEspecificacaoDefinido,
      regra_decisao_aplicada: {
        descricao: analysis.conformidade.regraDecisaoAplicada.descricao,
        utiliza_incerteza:
          analysis.conformidade.regraDecisaoAplicada.utilizaIncerteza,
      },
      nivel_risco_considerado: {
        descricao: analysis.conformidade.nivelRiscoConsiderado.descricao,
        nivel_confianca:
          analysis.conformidade.nivelRiscoConsiderado.nivelConfianca,
      },
      justificativas: analysis.conformidade.justificativas,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Valida se os dados de entrada são válidos para cálculo
 */
export function validateCalibrationData(
  referenceValue: string,
  measuredValue: string,
  uncertainty: string,
  errorLimit: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!referenceValue || isNaN(Number(referenceValue))) {
    errors.push("Valor de referência deve ser um número válido");
  }

  if (!measuredValue || isNaN(Number(measuredValue))) {
    errors.push("Valor medido deve ser um número válido");
  }

  if (!uncertainty || isNaN(Number(uncertainty)) || Number(uncertainty) < 0) {
    errors.push("Incerteza deve ser um número positivo");
  }

  if (!errorLimit || isNaN(Number(errorLimit)) || Number(errorLimit) <= 0) {
    errors.push("Limite de erro (EMA) deve ser um número positivo");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
