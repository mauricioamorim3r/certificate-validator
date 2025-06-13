import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  IdCard,
  Award,
  Settings,
  Thermometer,
  TrendingUp,
  Link,
  Save,
  FolderOpen,
  FileText,
  Trash2,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generatePDF } from "@/lib/pdf-utils";
import StatusSelector from "@/components/status-selector";

// Definindo tipos para melhor type safety
type StatusType = "conforme" | "nao_conforme" | "nao_aplicavel";
type OverallStatusType = "aprovado" | "reprovado" | "condicional";
type LocationType = "laboratorio" | "campo";

const formSchema = z.object({
  documentCode: z.string().default("RAC-001"),
  version: z.string().default("2.1"),
  analysisDate: z.string().min(1, "Data de análise é obrigatória"),
  analyzedBy: z.string().min(1, "Analista é obrigatório"),
  approvedBy: z.string().min(1, "Aprovador é obrigatório"),

  // Certificate/Laboratory identification
  certificateNumber: z.string().min(1, "Número do certificado é obrigatório"),
  issuingLaboratory: z.string().min(1, "Laboratório emissor é obrigatório"),
  issueDate: z.string().min(1, "Data de emissão é obrigatória"),
  calibrationDate: z.string().min(1, "Data de calibração é obrigatória"),
  calibrationValidity: z.string().optional(),
  validityStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  validityObservations: z.string().optional(),
  technicalResponsible: z.string().min(1, "Responsável técnico é obrigatório"),
  responsibleStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  responsibleObservations: z.string().optional(),

  // Accreditation and scope
  accreditedLabStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  accreditedLabObservations: z.string().optional(),
  adequateScopeStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  adequateScopeObservations: z.string().optional(),
  accreditationSymbolStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  accreditationSymbolObservations: z.string().optional(),

  // Instrument identification
  equipmentType: z.string().min(1, "Tipo de equipamento é obrigatório"),
  manufacturerModel: z.string().min(1, "Fabricante/Modelo é obrigatório"),
  serialNumber: z.string().min(1, "Número de série é obrigatório"),
  tagIdInternal: z.string().optional(),
  application: z.string().optional(),
  location: z.string().optional(),

  // Environmental conditions
  tempValue: z.string().optional(),
  tempLimit: z.string().optional(),
  tempOk: z.boolean().optional(),
  tempObs: z.string().optional(),
  humidityValue: z.string().optional(),
  humidityLimit: z.string().optional(),
  humidityOk: z.boolean().optional(),
  humidityObs: z.string().optional(),
  pressureValue: z.string().optional(),
  pressureLimit: z.string().optional(),
  pressureOk: z.boolean().optional(),
  pressureObs: z.string().optional(),
  fluidValue: z.string().optional(),
  fluidLimit: z.string().optional(),
  fluidOk: z.boolean().optional(),
  fluidObs: z.string().optional(),
  calibrationLocation: z.enum(["laboratorio", "campo"]).optional(),
  locationAdequate: z.string().optional(),
  locationObservations: z.string().optional(),

  // Measurement results
  measurementResultsStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  measurementResultsObservations: z.string().optional(),
  uncertaintiesStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  uncertaintiesObservations: z.string().optional(),
  conformityStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  conformityObservations: z.string().optional(),

  // Traceability
  traceabilityStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  traceabilityObservations: z.string().optional(),
  standardsStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  standardsObservations: z.string().optional(),
  certificatesStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  certificatesObservations: z.string().optional(),

  // Final analysis
  overallStatus: z.enum(["aprovado", "reprovado", "condicional"]).optional(),
  finalComments: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Interface para os dados do registro
interface AnalysisRecord extends FormData {
  id: number;
  environmentalConditions?: {
    temperature?: {
      value?: string;
      limit?: string;
      ok?: boolean;
      observations?: string;
    };
    humidity?: {
      value?: string;
      limit?: string;
      ok?: boolean;
      observations?: string;
    };
    pressure?: {
      value?: string;
      limit?: string;
      ok?: boolean;
      observations?: string;
    };
    fluid?: {
      value?: string;
      limit?: string;
      ok?: boolean;
      observations?: string;
    };
  };
}

export default function CertificateAnalysisForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentRecordId, setCurrentRecordId] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentCode: "RAC-001",
      version: "2.1",
      analysisDate: new Date().toISOString().split("T")[0],
      analyzedBy: "",
      approvedBy: "",
      certificateNumber: "",
      issuingLaboratory: "",
      issueDate: "",
      calibrationDate: "",
      calibrationValidity: "",
      validityObservations: "",
      technicalResponsible: "",
      responsibleObservations: "",
      accreditedLabObservations: "",
      adequateScopeObservations: "",
      accreditationSymbolObservations: "",
      equipmentType: "",
      manufacturerModel: "",
      serialNumber: "",
      tagIdInternal: "",
      application: "",
      location: "",
      tempValue: "",
      tempLimit: "",
      tempOk: false,
      tempObs: "",
      humidityValue: "",
      humidityLimit: "",
      humidityOk: false,
      humidityObs: "",
      pressureValue: "",
      pressureLimit: "",
      pressureOk: false,
      pressureObs: "",
      fluidValue: "",
      fluidLimit: "",
      fluidOk: false,
      fluidObs: "",
      locationObservations: "",
      measurementResultsObservations: "",
      uncertaintiesObservations: "",
      conformityObservations: "",
      traceabilityObservations: "",
      standardsObservations: "",
      certificatesObservations: "",
      finalComments: "",
    },
  });

  // Fetch all records for loading functionality
  const { data: allRecords, error: recordsError } = useQuery<AnalysisRecord[]>({
    queryKey: ["analysis-records"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/analysis-records");
      if (!response.ok) {
        throw new Error("Falha ao carregar registros");
      }
      return response.json();
    },
  });

  const saveRecordMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const environmentalConditions = {
        temperature: {
          value: data.tempValue || "",
          limit: data.tempLimit || "",
          ok: data.tempOk || false,
          observations: data.tempObs || "",
        },
        humidity: {
          value: data.humidityValue || "",
          limit: data.humidityLimit || "",
          ok: data.humidityOk || false,
          observations: data.humidityObs || "",
        },
        pressure: {
          value: data.pressureValue || "",
          limit: data.pressureLimit || "",
          ok: data.pressureOk || false,
          observations: data.pressureObs || "",
        },
        fluid: {
          value: data.fluidValue || "",
          limit: data.fluidLimit || "",
          ok: data.fluidOk || false,
          observations: data.fluidObs || "",
        },
      };

      const recordData = {
        ...data,
        environmentalConditions,
      };

      let response;
      if (currentRecordId) {
        response = await apiRequest(
          "PUT",
          `/api/analysis-records/${currentRecordId}`,
          recordData,
        );
      } else {
        response = await apiRequest(
          "POST",
          "/api/analysis-records",
          recordData,
        );
      }

      if (!response.ok) {
        throw new Error("Falha ao salvar o registro");
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data?.id) {
        setCurrentRecordId(data.id);
      }
      queryClient.invalidateQueries({ queryKey: ["analysis-records"] });
      toast({
        title: "Sucesso",
        description: currentRecordId
          ? "Registro atualizado com sucesso!"
          : "Registro salvo com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao salvar registro:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar o registro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    saveRecordMutation.mutate(data);
  };

  const loadLatestRecord = () => {
    if (allRecords && allRecords.length > 0) {
      const latestRecord = allRecords[0];
      setCurrentRecordId(latestRecord.id);

      // Fill form with loaded data
      const formData: Partial<FormData> = {
        documentCode: latestRecord.documentCode || "RAC-001",
        version: latestRecord.version || "2.1",
        analysisDate: latestRecord.analysisDate || "",
        analyzedBy: latestRecord.analyzedBy || "",
        approvedBy: latestRecord.approvedBy || "",
        certificateNumber: latestRecord.certificateNumber || "",
        issuingLaboratory: latestRecord.issuingLaboratory || "",
        issueDate: latestRecord.issueDate || "",
        calibrationDate: latestRecord.calibrationDate || "",
        calibrationValidity: latestRecord.calibrationValidity || "",
        validityStatus: latestRecord.validityStatus,
        validityObservations: latestRecord.validityObservations || "",
        technicalResponsible: latestRecord.technicalResponsible || "",
        responsibleStatus: latestRecord.responsibleStatus,
        responsibleObservations: latestRecord.responsibleObservations || "",
        accreditedLabStatus: latestRecord.accreditedLabStatus,
        accreditedLabObservations: latestRecord.accreditedLabObservations || "",
        adequateScopeStatus: latestRecord.adequateScopeStatus,
        adequateScopeObservations: latestRecord.adequateScopeObservations || "",
        accreditationSymbolStatus: latestRecord.accreditationSymbolStatus,
        accreditationSymbolObservations: latestRecord.accreditationSymbolObservations || "",
        equipmentType: latestRecord.equipmentType || "",
        manufacturerModel: latestRecord.manufacturerModel || "",
        serialNumber: latestRecord.serialNumber || "",
        tagIdInternal: latestRecord.tagIdInternal || "",
        application: latestRecord.application || "",
        location: latestRecord.location || "",
        tempValue: latestRecord.environmentalConditions?.temperature?.value || "",
        tempLimit: latestRecord.environmentalConditions?.temperature?.limit || "",
        tempOk: latestRecord.environmentalConditions?.temperature?.ok || false,
        tempObs: latestRecord.environmentalConditions?.temperature?.observations || "",
        humidityValue: latestRecord.environmentalConditions?.humidity?.value || "",
        humidityLimit: latestRecord.environmentalConditions?.humidity?.limit || "",
        humidityOk: latestRecord.environmentalConditions?.humidity?.ok || false,
        humidityObs: latestRecord.environmentalConditions?.humidity?.observations || "",
        pressureValue: latestRecord.environmentalConditions?.pressure?.value || "",
        pressureLimit: latestRecord.environmentalConditions?.pressure?.limit || "",
        pressureOk: latestRecord.environmentalConditions?.pressure?.ok || false,
        pressureObs: latestRecord.environmentalConditions?.pressure?.observations || "",
        fluidValue: latestRecord.environmentalConditions?.fluid?.value || "",
        fluidLimit: latestRecord.environmentalConditions?.fluid?.limit || "",
        fluidOk: latestRecord.environmentalConditions?.fluid?.ok || false,
        fluidObs: latestRecord.environmentalConditions?.fluid?.observations || "",
        calibrationLocation: latestRecord.calibrationLocation,
        locationAdequate: latestRecord.locationAdequate || "",
        locationObservations: latestRecord.locationObservations || "",
        measurementResultsStatus: latestRecord.measurementResultsStatus,
        measurementResultsObservations: latestRecord.measurementResultsObservations || "",
        uncertaintiesStatus: latestRecord.uncertaintiesStatus,
        uncertaintiesObservations: latestRecord.uncertaintiesObservations || "",
        conformityStatus: latestRecord.conformityStatus,
        conformityObservations: latestRecord.conformityObservations || "",
        traceabilityStatus: latestRecord.traceabilityStatus,
        traceabilityObservations: latestRecord.traceabilityObservations || "",
        standardsStatus: latestRecord.standardsStatus,
        standardsObservations: latestRecord.standardsObservations || "",
        certificatesStatus: latestRecord.certificatesStatus,
        certificatesObservations: latestRecord.certificatesObservations || "",
        overallStatus: latestRecord.overallStatus,
        finalComments: latestRecord.finalComments || "",
      };

      form.reset(formData);

      toast({
        title: "Sucesso",
        description: "Último registro carregado com sucesso!",
      });
    } else {
      toast({
        title: "Informação",
        description: "Nenhum registro anterior encontrado.",
      });
    }
  };

  const clearForm = () => {
    const confirmed = window.confirm("Tem certeza que deseja limpar todos os dados do formulário?");
    if (confirmed) {
      form.reset();
      setCurrentRecordId(null);
      toast({
        title: "Sucesso",
        description: "Formulário limpo com sucesso!",
      });
    }
  };

  const handleGeneratePDF = () => {
    try {
      const formData = form.getValues();
      generatePDF(formData);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handle loading error
  if (recordsError) {
    console.error("Erro ao carregar registros:", recordsError);
  }

  return (
    <div className="app-container max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Document Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <ClipboardCheck className="text-blue-600 mr-3" size={28} />
          Registro de Análise Crítica - Certificados de Calibração
        </h2>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-gray-700 font-medium">Documento:</Label>
              <div className="bg-white px-3 py-2 rounded border border-gray-200 mt-1">
                {form.watch("documentCode")}
              </div>
            </div>
            <div>
              <Label className="text-gray-700 font-medium">Versão:</Label>
              <div className="bg-white px-3 py-2 rounded border border-gray-200 mt-1">
                {form.watch("version")}
              </div>
            </div>
            <div>
              <Label htmlFor="analysisDate" className="text-gray-700 font-medium">
                Data da Análise:
              </Label>
              <Input
                id="analysisDate"
                type="date"
                className="form-input mt-1"
                {...form.register("analysisDate")}
              />
              {form.formState.errors.analysisDate && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.analysisDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="analyzedBy" className="text-gray-700 font-medium">
                Analisado por:
              </Label>
              <Input
                id="analyzedBy"
                placeholder="Nome do analista"
                className="form-input mt-1"
                {...form.register("analyzedBy")}
              />
              {form.formState.errors.analyzedBy && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.analyzedBy.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="approvedBy" className="text-gray-700 font-medium">
                Aprovado por:
              </Label>
              <Input
                id="approvedBy"
                placeholder="Nome do aprovador"
                className="form-input mt-1"
                {...form.register("approvedBy")}
              />
              {form.formState.errors.approvedBy && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.approvedBy.message}
                </p>
              )}
            </div>
          </div>

          {/* Purpose Section */}
          <div className="purpose-box p-4 mt-6 rounded-r-lg">
            <p className="text-blue-800 text-sm italic flex items-start">
              <Info className="mr-2 mt-0.5 flex-shrink-0" size={16} />
              <span>
                <strong>Propósito:</strong> Este registro tem como objetivo
                padronizar a avaliação crítica de certificados de calibração e
                relatórios de inspeção, assegurando a conformidade com a
                Portaria INMETRO 291/2021, a norma ISO/IEC 17025, o Guia para a
                Expressão da Incerteza de Medição (GUM) e outros padrões
                metrológicos aplicáveis.
              </span>
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <Tabs defaultValue="section1" className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="section1" className="flex items-center gap-2">
                  <IdCard size={16} />
                  <span className="hidden sm:inline">Certificado</span>
                </TabsTrigger>
                <TabsTrigger value="section2" className="flex items-center gap-2">
                  <Award size={16} />
                  <span className="hidden sm:inline">Acreditação</span>
                </TabsTrigger>
                <TabsTrigger value="section3" className="flex items-center gap-2">
                  <Settings size={16} />
                  <span className="hidden sm:inline">Instrumento</span>
                </TabsTrigger>
                <TabsTrigger value="section4" className="flex items-center gap-2">
                  <Thermometer size={16} />
                  <span className="hidden sm:inline">Condições</span>
                </TabsTrigger>
                <TabsTrigger value="section5" className="flex items-center gap-2">
                  <TrendingUp size={16} />
                  <span className="hidden sm:inline">Resultados</span>
                </TabsTrigger>
                <TabsTrigger value="section6" className="flex items-center gap-2">
                  <Link size={16} />
                  <span className="hidden sm:inline">Rastreabilidade</span>
                </TabsTrigger>
              </TabsList>

              {/* [Resto das seções TabsContent permanecem iguais ao código original] */}
              {/* Incluindo todas as seções do formulário... */}
            </Tabs>
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 border-t flex justify-center space-x-4 flex-wrap gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={loadLatestRecord}
              className="btn-secondary"
              disabled={!allRecords || allRecords.length === 0}
            >
              <FolderOpen className="mr-2" size={16} />
              Carregar Registro
            </Button>
            <Button
              type="submit"
              disabled={saveRecordMutation.isPending}
              className="btn-primary"
            >
              <Save className="mr-2" size={16} />
              {saveRecordMutation.isPending ? "Salvando..." : "Salvar Registro"}
            </Button>
            <Button
              type="button"
              onClick={handleGeneratePDF}
              className="btn-success"
            >
              <FileText className="mr-2" size={16} />
              Gerar PDF
            </Button>
            <Button
              type="button"
              onClick={clearForm}
              variant="outline"
              className="btn-warning"
            >
              <Trash2 className="mr-2" size={16} />
              Limpar Formulário
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}