// PDF generation utility using html2canvas and jsPDF
// This would be loaded from CDN as mentioned in the original HTML

export function generatePDF(formData: any) {
  const element = document.querySelector(".app-container");

  if (!element) {
    alert("Elemento não encontrado para geração do PDF.");
    return;
  }

  // Check if libraries are available (they should be loaded via CDN)
  if (
    typeof (window as any).html2canvas === "undefined" ||
    typeof (window as any).jsPDF === "undefined"
  ) {
    // Fallback: create a simple text-based PDF content
    const content = generateTextReport(formData);
    downloadTextFile(
      content,
      `analise_critica_${new Date().toISOString().split("T")[0]}.txt`,
    );
    return;
  }

  const opt = {
    margin: 0.5,
    filename: `analise_critica_${new Date().toISOString().split("T")[0]}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };

  (window as any)
    .html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    })
    .then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new (window as any).jsPDF.jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(opt.filename);
    })
    .catch((error: Error) => {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o PDF. Gerando relatório em texto...");

      // Fallback to text report
      const content = generateTextReport(formData);
      downloadTextFile(
        content,
        `analise_critica_${new Date().toISOString().split("T")[0]}.txt`,
      );
    });
}

function generateTextReport(formData: any): string {
  const date = new Date().toLocaleDateString("pt-BR");

  return `
REGISTRO DE ANÁLISE CRÍTICA – CERTIFICADOS DE CALIBRAÇÃO
========================================================

Documento: ${formData.documentCode || "RAC-001"}
Versão: ${formData.version || "2.1"}
Data da Análise: ${formData.analysisDate || date}
Analisado por: ${formData.analyzedBy || ""}
Aprovado por: ${formData.approvedBy || ""}

IDENTIFICAÇÃO DO CERTIFICADO/LABORATÓRIO
=========================================
Número do Certificado: ${formData.certificateNumber || ""}
Laboratório Emissor: ${formData.issuingLaboratory || ""}
Data de Emissão: ${formData.issueDate || ""}
Data de Calibração: ${formData.calibrationDate || ""}
Validade da Calibração: ${formData.calibrationValidity || ""}
Status da Validade: ${formData.validityStatus || ""}
Observações da Validade: ${formData.validityObservations || ""}
Responsável Técnico: ${formData.technicalResponsible || ""}
Status do Responsável: ${formData.responsibleStatus || ""}
Observações do Responsável: ${formData.responsibleObservations || ""}

ACREDITAÇÃO E ESCOPO
====================
Laboratório Acreditado: ${formData.accreditedLabStatus || ""}
Observações Lab. Acreditado: ${formData.accreditedLabObservations || ""}
Escopo Adequado: ${formData.adequateScopeStatus || ""}
Observações Escopo: ${formData.adequateScopeObservations || ""}
Símbolo de Acreditação: ${formData.accreditationSymbolStatus || ""}
Observações Símbolo: ${formData.accreditationSymbolObservations || ""}

IDENTIFICAÇÃO DO INSTRUMENTO
=============================
Tipo de Equipamento: ${formData.equipmentType || ""}
Fabricante/Modelo: ${formData.manufacturerModel || ""}
Número de Série: ${formData.serialNumber || ""}
TAG/ID Interno: ${formData.tagIdInternal || ""}
Aplicação: ${formData.application || ""}
Localização: ${formData.location || ""}

CONDIÇÕES AMBIENTAIS
====================
Temperatura: ${formData.tempValue || ""} (Limite: ${formData.tempLimit || ""}) - OK: ${formData.tempOk ? "Sim" : "Não"}
Observações Temperatura: ${formData.tempObs || ""}

Umidade: ${formData.humidityValue || ""} (Limite: ${formData.humidityLimit || ""}) - OK: ${formData.humidityOk ? "Sim" : "Não"}
Observações Umidade: ${formData.humidityObs || ""}

Pressão: ${formData.pressureValue || ""} (Limite: ${formData.pressureLimit || ""}) - OK: ${formData.pressureOk ? "Sim" : "Não"}
Observações Pressão: ${formData.pressureObs || ""}

Fluido: ${formData.fluidValue || ""} (Limite: ${formData.fluidLimit || ""}) - OK: ${formData.fluidOk ? "Sim" : "Não"}
Observações Fluido: ${formData.fluidObs || ""}

Local de Calibração: ${formData.calibrationLocation || ""}
Local Adequado: ${formData.locationAdequate || ""}
Observações Local: ${formData.locationObservations || ""}

RESULTADOS DE MEDIÇÃO
=====================
Status dos Resultados: ${formData.measurementResultsStatus || ""}
Observações Resultados: ${formData.measurementResultsObservations || ""}
Status das Incertezas: ${formData.uncertaintiesStatus || ""}
Observações Incertezas: ${formData.uncertaintiesObservations || ""}
Status da Conformidade: ${formData.conformityStatus || ""}
Observações Conformidade: ${formData.conformityObservations || ""}

RASTREABILIDADE METROLÓGICA
============================
Status da Rastreabilidade: ${formData.traceabilityStatus || ""}
Observações Rastreabilidade: ${formData.traceabilityObservations || ""}
Status dos Padrões: ${formData.standardsStatus || ""}
Observações Padrões: ${formData.standardsObservations || ""}
Status dos Certificados: ${formData.certificatesStatus || ""}
Observações Certificados: ${formData.certificatesObservations || ""}

CONCLUSÃO DA ANÁLISE CRÍTICA
=============================
Status Geral: ${formData.overallStatus || ""}
Comentários Finais: ${formData.finalComments || ""}

Relatório gerado em: ${date}
Sistema de Análise Crítica de Certificados v2.1
Conforme Portaria INMETRO 291/2021 e ISO/IEC 17025
`;
}

function downloadTextFile(content: string, filename: string) {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
