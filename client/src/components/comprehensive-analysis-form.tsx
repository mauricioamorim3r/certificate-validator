import React from "react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  FileText,
  Award,
  Settings,
  Thermometer,
  CheckSquare,
  Link,
  BarChart3,
  Wrench,
  Shield,
  Globe,
  Calendar,
  Search,
  AlertTriangle,
  Target,
  PenTool,
  Save,
  FolderOpen,
  Trash2,
  Plus,
  BookOpen,
  Upload,
  Type,
  Edit3,
  Minus,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StatusSelector from "@/components/status-selector";
import { AutoSaveIndicator } from "@/components/auto-save-indicator";
import { RegulatoryReference } from "@/components/regulatory-reference";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  calculateError,
  evaluatePointConformity,
  validateCalibrationData,
  processCalibrationPoint,
  generateCalibrationAnalysis,
  exportCalibrationAnalysisToJSON,
  type CalibrationPoint as AutoCalibrationPoint,
  type CalibrationRange,
} from "@/lib/calibration-utils";
import { generatePDF } from "@/lib/pdf-utils";

// Definindo tipos específicos para melhor type safety
type ConformityStatus = "Conforme" | "Nao Conforme";
type BinaryStatus = "Sim" | "Nao";
type AsFoundLeftStatus = "Presentes" | "Ausentes";
type LocationStatus = "Laboratorio" | "Campo";
type FinalStatus = "APROVADO" | "APROVADO COM RESSALVAS" | "REJEITADO";
type CriticalityLevel = "Alta" | "Media" | "Baixa";

// Interfaces para objetos complexos
interface Standard {
  name: string;
  certificate: string;
  laboratory: string;
  accreditation: string;
  uncertainty: string;
  validity: string;
  status: "OK" | "NOK";
  observations: string;
}

interface CalibrationResult {
  point: string;
  referenceValue: string;
  measuredValue: string;
  error: string;
  uncertainty: string;
  errorLimit: string;
  ok: boolean;
  autoCalculated?: boolean;
}

interface NonConformity {
  item: number;
  description: string;
  criticality: CriticalityLevel;
  action: string;
}

interface Criteria {
  name: string;
  status: "Sim" | "Nao" | "N/A";
  observations: string;
}

interface AnalysisRecord extends FormData {
  id: number;
  isoRequirements?: boolean[];
  standards?: Standard[];
  calibrationResults?: CalibrationResult[];
  nonConformities?: NonConformity[];
  pressureCriteria?: Criteria[];
  flowCriteria?: Criteria[];
}

const formSchema = z.object({
  documentCode: z.string().default("RAC-001"),
  version: z.string().default("2.1"),
  analysisDate: z.string().min(1, "Data de análise é obrigatória"),
  analyzedBy: z.string().min(1, "Analista é obrigatório"),
  approvedBy: z.string().optional(),

  // Section 1: Certificate/Laboratory identification
  certificateNumber: z.string().min(1, "Número do certificado é obrigatório"),
  certificateNumberStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  certificateNumberObs: z.string().optional(),
  issuingLaboratory: z.string().min(1, "Laboratório emissor é obrigatório"),
  issuingLaboratoryStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  issuingLaboratoryObs: z.string().optional(),
  issueDate: z.string().min(1, "Data de emissão é obrigatória"),
  issueDateStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  issueDateObs: z.string().optional(),
  calibrationDate: z.string().min(1, "Data de calibração é obrigatória"),
  calibrationDateStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  calibrationDateObs: z.string().optional(),
  installationDate: z.string().optional(),
  validityStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  validityObservations: z.string().optional(),
  technicalResponsible: z.string().min(1, "Responsável técnico é obrigatório"),
  responsibleStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  responsibleObservations: z.string().optional(),

  // Section 2: Accreditation and scope
  accreditedLabStatus: z.enum(["Sim", "Nao"]).optional(),
  accreditedLabObservations: z.string().optional(),
  adequateScopeStatus: z.enum(["Sim", "Nao"]).optional(),
  adequateScopeObservations: z.string().optional(),
  accreditationSymbolStatus: z.enum(["Sim", "Nao"]).optional(),
  accreditationSymbolObservations: z.string().optional(),

  // Section 3: Instrument identification
  equipmentType: z.string().min(1, "Tipo de equipamento é obrigatório"),
  manufacturerModel: z.string().min(1, "Fabricante/Modelo é obrigatório"),
  serialNumber: z.string().min(1, "Número de série é obrigatório"),
  tagIdInternal: z.string().optional(),
  application: z.string().optional(),
  location: z.string().optional(),

  // Section 4: Environmental conditions
  tempReported: z.string().optional(),
  tempLimit: z.string().optional(),
  tempOk: z.boolean().optional(),
  tempObs: z.string().optional(),
  humidityReported: z.string().optional(),
  humidityLimit: z.string().optional(),
  humidityOk: z.boolean().optional(),
  humidityObs: z.string().optional(),
  pressureReported: z.string().optional(),
  pressureLimit: z.string().optional(),
  pressureOk: z.boolean().optional(),
  pressureObs: z.string().optional(),
  fluidReported: z.string().optional(),
  fluidLimit: z.string().optional(),
  fluidOk: z.boolean().optional(),
  fluidObs: z.string().optional(),
  calibrationLocation: z.enum(["Laboratorio", "Campo"]).optional(),
  calibrationLocationOk: z.boolean().optional(),
  calibrationLocationObs: z.string().optional(),
  methodUsed: z.string().optional(),
  methodUsedOk: z.boolean().optional(),
  methodUsedObs: z.string().optional(),

  // Section 7: Uncertainty evaluation
  uncertaintyDeclared: z.string().optional(),
  uncertaintyDeclaredOk: z.boolean().optional(),
  uncertaintyDeclaredObs: z.string().optional(),
  calculationMethod: z.string().optional(),
  calculationMethodOk: z.boolean().optional(),
  calculationMethodObs: z.string().optional(),
  contributions: z.string().optional(),
  contributionsOk: z.boolean().optional(),
  contributionsObs: z.string().optional(),
  confidenceLevel: z.string().optional(),
  confidenceLevelOk: z.boolean().optional(),
  confidenceLevelObs: z.string().optional(),
  compatibility: z.string().optional(),
  compatibilityOk: z.boolean().optional(),
  compatibilityObs: z.string().optional(),

  // Section 8: Calibration results
  calibrationRange: z.string().optional(),
  operationalRange: z.string().optional(),
  resultsComments: z.string().optional(),

  // Section 9: Adjustment/repair analysis
  asFoundStatus: z.enum(["Presentes", "Ausentes"]).optional(),
  asFoundObs: z.string().optional(),
  asLeftStatus: z.enum(["Presentes", "Ausentes"]).optional(),
  asLeftObs: z.string().optional(),
  adjustmentsStatus: z.enum(["Sim", "Nao"]).optional(),
  adjustmentsObs: z.string().optional(),
  retroactiveActions: z.string().optional(),

  // Section 10: Conformity declaration
  conformityDeclarationPresent: z.enum(["Sim", "Nao"]).optional(),
  conformityDeclarationObs: z.string().optional(),
  specificationLimit: z.enum(["Sim", "Nao"]).optional(),
  specificationLimitObs: z.string().optional(),
  decisionRule: z.enum(["Sim", "Nao"]).optional(),
  decisionRuleObs: z.string().optional(),
  riskLevel: z.enum(["Sim", "Nao"]).optional(),
  riskLevelObs: z.string().optional(),

  // Section 11: Environmental conditions in use
  tempUseValue: z.string().optional(),
  tempUseLimit: z.string().optional(),
  tempUseOk: z.boolean().optional(),
  tempUseObs: z.string().optional(),
  humidityUseValue: z.string().optional(),
  humidityUseLimit: z.string().optional(),
  humidityUseOk: z.boolean().optional(),
  humidityUseObs: z.string().optional(),
  pressureUseValue: z.string().optional(),
  pressureUseLimit: z.string().optional(),
  pressureUseOk: z.boolean().optional(),
  pressureUseObs: z.string().optional(),
  fluidUseValue: z.string().optional(),
  fluidUseLimit: z.string().optional(),
  fluidUseOk: z.boolean().optional(),
  fluidUseObs: z.string().optional(),

  // Section 12: Calibration periodicity
  lastCalibrationDate: z.string().optional(),
  lastCalibrationObs: z.string().optional(),
  intervalPerformed: z.string().optional(),
  intervalPerformedObs: z.string().optional(),
  definedPeriodicity: z.string().optional(),
  periodicityCompliance: z.enum(["Sim", "Nao"]).optional(),
  periodicityComments: z.string().optional(),

  // Section 14: Additional recommendations
  additionalRecommendations: z.string().optional(),

  // Section 15: Final conclusion
  errorLimits: z.enum(["Sim", "Nao"]).optional(),
  errorLimitsObs: z.string().optional(),
  adequateUncertainty: z.enum(["Sim", "Nao"]).optional(),
  adequateUncertaintyObs: z.string().optional(),
  rtmRequirements: z.enum(["Sim", "Nao"]).optional(),
  rtmRequirementsObs: z.string().optional(),
  finalStatus: z
    .enum(["APROVADO", "APROVADO COM RESSALVAS", "REJEITADO"])
    .optional(),
  conclusionJustification: z.string().optional(),

  // Section 16: Signatures
  analystName: z.string().optional(),
  analystDate: z.string().optional(),
  approverName: z.string().optional(),
  approverDate: z.string().optional(),

  // Section 17: Annexes and references
  annexOriginalCertificate: z.boolean().optional(),
  annexStandardsCertificates: z.boolean().optional(),
  annexCalibrationHistory: z.boolean().optional(),
  annexInternalRequirements: z.boolean().optional(),
  annexOthers: z.string().optional(),
  flowMeterRegulatedAgentPresent: z.boolean().optional(),
  flowMeterRegulatedAgentValue: z.string().optional(),
  flowMeterRegulatedAgentObs: z.string().optional(),
  flowMeterInstallationPresent: z.boolean().optional(),
  flowMeterInstallationValue: z.string().optional(),
  flowMeterInstallationObs: z.string().optional(),
  flowMeterMeasurementPointPresent: z.boolean().optional(),
  flowMeterMeasurementPointValue: z.string().optional(),
  flowMeterMeasurementPointObs: z.string().optional(),
  flowMeterIdPresent: z.boolean().optional(),
  flowMeterIdValue: z.string().optional(),
  flowMeterIdObs: z.string().optional(),
  flowMeterStandardPresent: z.boolean().optional(),
  flowMeterStandardValue: z.string().optional(),
  flowMeterStandardObs: z.string().optional(),
  flowMeterAlignmentPresent: z.boolean().optional(),
  flowMeterAlignmentValue: z.string().optional(),
  flowMeterAlignmentObs: z.string().optional(),
  flowMeterStartPresent: z.boolean().optional(),
  flowMeterStartValue: z.string().optional(),
  flowMeterStartObs: z.string().optional(),
  flowMeterEndPresent: z.boolean().optional(),
  flowMeterEndValue: z.string().optional(),
  flowMeterEndObs: z.string().optional(),
  flowMeterReportDatePresent: z.boolean().optional(),
  flowMeterReportDateValue: z.string().optional(),
  flowMeterReportDateObs: z.string().optional(),
  flowMeterMeasuredValuesPresent: z.boolean().optional(),
  flowMeterMeasuredValuesValue: z.string().optional(),
  flowMeterMeasuredValuesObs: z.string().optional(),
  flowMeterKFactorPresent: z.boolean().optional(),
  flowMeterKFactorValue: z.string().optional(),
  flowMeterKFactorObs: z.string().optional(),
  flowMeterCalibrationFactorsPresent: z.boolean().optional(),
  flowMeterCalibrationFactorsValue: z.string().optional(),
  flowMeterCalibrationFactorsObs: z.string().optional(),
  flowMeterRepeatabilityPresent: z.boolean().optional(),
  flowMeterRepeatabilityValue: z.string().optional(),
  flowMeterRepeatabilityObs: z.string().optional(),
  flowMeterUncertaintyPresent: z.boolean().optional(),
  flowMeterUncertaintyValue: z.string().optional(),
  flowMeterUncertaintyObs: z.string().optional(),
  flowMeterDriftPresent: z.boolean().optional(),
  flowMeterDriftValue: z.string().optional(),
  flowMeterDriftObs: z.string().optional(),
  flowMeterSignaturesPresent: z.boolean().optional(),
  flowMeterSignaturesValue: z.string().optional(),
  flowMeterSignaturesObs: z.string().optional(),
  flowMeterGeneralEvaluation: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Tipos para arrays (removendo duplicações)

export default function ComprehensiveAnalysisForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentRecordId, setCurrentRecordId] = useState<number | null>(null);
  const [isoRequirements, setIsoRequirements] = useState<boolean[]>(
    new Array(10).fill(false)
  );
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("Carregando...");
  const [lastSaved, setLastSaved] = useState<Date | undefined>();
  const [showRegulatoryReference, setShowRegulatoryReference] = useState(false);

  // Estados para personalização da interface
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [headerTitle, setHeaderTitle] = useState<string>(
    "REGISTRO DE ANÁLISE CRÍTICA – CERTIFICADOS DE CALIBRAÇÃO / RELATÓRIOS DE INSPEÇÃO"
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Salvamento automático no localStorage
  const saveToLocalStorage = (data: any) => {
    try {
      const formData = form.getValues();
      const saveData = {
        ...formData,
        isoRequirements,
        standards,
        calibrationResults,
        nonConformities,
        pressureCriteria,
        flowCriteria,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("analysis-form-backup", JSON.stringify(saveData));
      const now = new Date();
      setLastSaved(now);
      setAutoSaveStatus(`Salvo automaticamente às ${now.toLocaleTimeString()}`);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Erro ao salvar backup:", error);
      }
      setAutoSaveStatus("Erro ao salvar automaticamente");
    }
  };

  // Carregar dados do localStorage
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem("analysis-form-backup");
      if (saved) {
        const data = JSON.parse(saved);

        if (data.isoRequirements) setIsoRequirements(data.isoRequirements);
        if (data.standards) setStandards(data.standards);
        if (data.calibrationResults)
          setCalibrationResults(data.calibrationResults);
        if (data.nonConformities) setNonConformities(data.nonConformities);
        if (data.pressureCriteria) setPressureCriteria(data.pressureCriteria);
        if (data.flowCriteria) setFlowCriteria(data.flowCriteria);

        form.reset(data);

        toast({
          title: "Dados Restaurados",
          description: `Backup de ${new Date(data.timestamp).toLocaleString()} foi carregado.`,
        });

        return true;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Erro ao carregar backup:", error);
      }
    }
    return false;
  };

  // Estados para arrays com valores padrão seguros
  const [standards, setStandards] = useState<Standard[]>([
    {
      name: "Padrão de Referência",
      certificate: "",
      laboratory: "",
      accreditation: "",
      uncertainty: "",
      validity: "",
      status: "OK",
      observations: "",
    },
  ]);

  const [calibrationResults, setCalibrationResults] = useState<
    CalibrationResult[]
  >([
    {
      point: "0%",
      referenceValue: "",
      measuredValue: "",
      error: "",
      uncertainty: "",
      errorLimit: "",
      ok: false,
    },
    {
      point: "50%",
      referenceValue: "",
      measuredValue: "",
      error: "",
      uncertainty: "",
      errorLimit: "",
      ok: false,
    },
    {
      point: "100%",
      referenceValue: "",
      measuredValue: "",
      error: "",
      uncertainty: "",
      errorLimit: "",
      ok: false,
    },
  ]);

  const [nonConformities, setNonConformities] = useState<NonConformity[]>([
    {
      item: 1,
      description: "Nenhuma não conformidade identificada",
      criticality: "Baixa",
      action: "N/A - Certificado em conformidade",
    },
  ]);

  const [pressureCriteria, setPressureCriteria] = useState<Criteria[]>([
    {
      name: "Faixa de medição adequada",
      status: "Sim",
      observations: "",
    },
    {
      name: "Classe de exatidão especificada",
      status: "Sim",
      observations: "",
    },
    {
      name: "Condições de instalação adequadas",
      status: "Sim",
      observations: "",
    },
  ]);

  const [flowCriteria, setFlowCriteria] = useState<Criteria[]>([
    {
      name: "Faixa de vazão operacional",
      status: "Sim",
      observations: "",
    },
    {
      name: "Tipo de fluido compatível",
      status: "Sim",
      observations: "",
    },
    {
      name: "Condições de Reynolds adequadas",
      status: "Sim",
      observations: "",
    },
  ]);

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
      installationDate: "",
      technicalResponsible: "",
      equipmentType: "",
      manufacturerModel: "",
      serialNumber: "",
      tagIdInternal: "",
      application: "",
      location: "",
      // Seção 4 - Condições Ambientais
      tempReported: "",
      tempLimit: "20 ± 2 °C",
      tempOk: true,
      tempObs: "",
      humidityReported: "",
      humidityLimit: "50 ± 10 %",
      humidityOk: true,
      humidityObs: "",
      pressureReported: "",
      pressureLimit: "101,3 ± 5 kPa",
      pressureOk: true,
      pressureObs: "",
      fluidReported: "",
      fluidLimit: "",
      fluidOk: true,
      fluidObs: "",
      calibrationLocation: "Laboratorio",
      calibrationLocationOk: true,
      calibrationLocationObs: "",
      methodUsed: "",
      methodUsedOk: true,
      methodUsedObs: "",
      // Seção 7 - Incerteza
      uncertaintyDeclared: "",
      uncertaintyDeclaredOk: false,
      uncertaintyDeclaredObs: "",
      calculationMethod: "",
      calculationMethodOk: false,
      calculationMethodObs: "",
      contributions: "",
      contributionsOk: false,
      contributionsObs: "",
      confidenceLevel: "95%",
      confidenceLevelOk: false,
      confidenceLevelObs: "",
      compatibility: "",
      compatibilityOk: false,
      compatibilityObs: "",
      // Seção 8 - Resultados
      calibrationRange: "",
      operationalRange: "",
      resultsComments: "",
      // Seção 11 - Condições de Uso
      tempUseValue: "",
      tempUseLimit: "",
      tempUseOk: false,
      tempUseObs: "",
      humidityUseValue: "",
      humidityUseLimit: "",
      humidityUseOk: false,
      humidityUseObs: "",
      pressureUseValue: "",
      pressureUseLimit: "",
      pressureUseOk: false,
      pressureUseObs: "",
      fluidUseValue: "",
      fluidUseLimit: "",
      fluidUseOk: false,
      fluidUseObs: "",
      // Seção 15 - Status defaults
      finalStatus: "APROVADO",
      conclusionJustification: "",
    },
  });

  // Carregar dados salvos na inicialização
  useEffect(() => {
    const hasBackup = loadFromLocalStorage();
    if (hasBackup) {
      if (process.env.NODE_ENV === "development") {
        console.log("Backup carregado automaticamente");
      }
    }
  }, []);

  // Salvamento automático a cada mudança no formulário
  useEffect(() => {
    const subscription = form.watch(() => {
      saveToLocalStorage(form.getValues());
    });
    return () => subscription.unsubscribe();
  }, [
    form,
    isoRequirements,
    standards,
    calibrationResults,
    nonConformities,
    pressureCriteria,
    flowCriteria,
  ]);

  // Salvar antes de fechar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveToLocalStorage(form.getValues());
      e.preventDefault();
      return "Tem certeza que deseja sair? Os dados foram salvos automaticamente.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    form,
    isoRequirements,
    standards,
    calibrationResults,
    nonConformities,
    pressureCriteria,
    flowCriteria,
  ]);

  // Intervalo de salvamento a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      saveToLocalStorage(form.getValues());
    }, 30000);

    return () => clearInterval(interval);
  }, [
    form,
    isoRequirements,
    standards,
    calibrationResults,
    nonConformities,
    pressureCriteria,
    flowCriteria,
  ]);

  const { data: allRecords, error: recordsError } = useQuery({
    queryKey: ["/api/analysis-records"],
    retry: 3,
    retryDelay: 1000,
  });

  const saveRecordMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const recordData = {
        ...data,
        isoRequirements: isoRequirements,
        standards: standards,
        calibrationResults: calibrationResults,
        nonConformities: nonConformities,
        pressureCriteria: pressureCriteria,
        flowCriteria: flowCriteria,
      };

      let response;
      if (currentRecordId) {
        response = await apiRequest(
          "PUT",
          `/api/analysis-records/${currentRecordId}`,
          recordData
        );
      } else {
        response = await apiRequest(
          "POST",
          "/api/analysis-records",
          recordData
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
      queryClient.invalidateQueries({
        queryKey: ["comprehensive-analysis-records"],
      });
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
        description:
          error instanceof Error
            ? error.message
            : "Falha ao salvar o registro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    saveRecordMutation.mutate(data);
  };

  // Funções helper para manipular arrays com validação
  const addStandard = () => {
    setStandards((prev) => [
      ...prev,
      {
        name: "",
        certificate: "",
        laboratory: "",
        accreditation: "",
        uncertainty: "",
        validity: "",
        status: "OK",
        observations: "",
      },
    ]);
  };

  const removeStandard = (index: number) => {
    if (standards.length > 1) {
      setStandards((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateStandard = (
    index: number,
    field: keyof Standard,
    value: string | "OK" | "NOK"
  ) => {
    setStandards((prev) => {
      const newStandards = [...prev];
      if (newStandards[index]) {
        (newStandards[index] as any)[field] = value;
      }
      return newStandards;
    });
  };

  const addCalibrationResult = () => {
    setCalibrationResults((prev) => [
      ...prev,
      {
        point: "",
        referenceValue: "",
        measuredValue: "",
        error: "",
        uncertainty: "",
        errorLimit: "",
        ok: false,
      },
    ]);
  };

  const removeCalibrationResult = (index: number) => {
    if (calibrationResults.length > 1) {
      setCalibrationResults((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateCalibrationResult = (
    index: number,
    field: keyof CalibrationResult,
    value: string | boolean
  ) => {
    setCalibrationResults((prev) => {
      const newResults = [...prev];
      if (newResults[index]) {
        (newResults[index] as any)[field] = value;

        // Se os valores de referência, medido, incerteza e EMA estão preenchidos, calcular automaticamente
        if (
          field === "referenceValue" ||
          field === "measuredValue" ||
          field === "uncertainty" ||
          field === "errorLimit"
        ) {
          const result = newResults[index];
          const validation = validateCalibrationData(
            result.referenceValue,
            result.measuredValue,
            result.uncertainty,
            result.errorLimit
          );

          if (validation.isValid) {
            const refValue = Number(result.referenceValue);
            const measValue = Number(result.measuredValue);
            const uncertainty = Number(result.uncertainty);
            const errorLimit = Number(result.errorLimit);

            // Calcular erro automaticamente
            const error = calculateError(measValue, refValue);
            newResults[index].error = error.toString();

            // Calcular conformidade automaticamente
            const isConform = evaluatePointConformity(
              error,
              uncertainty,
              errorLimit
            );
            newResults[index].ok = isConform;
            newResults[index].autoCalculated = true;
          }
        }
      }
      return newResults;
    });
  };

  const addNonConformity = () => {
    setNonConformities((prev) => [
      ...prev,
      {
        item: prev.length + 1,
        description: "",
        criticality: "Media",
        action: "",
      },
    ]);
  };

  const removeNonConformity = (index: number) => {
    if (nonConformities.length > 1) {
      setNonConformities((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateNonConformity = (
    index: number,
    field: keyof NonConformity,
    value: string | number | CriticalityLevel
  ) => {
    setNonConformities((prev) => {
      const newNCs = [...prev];
      if (newNCs[index]) {
        (newNCs[index] as any)[field] = value;
      }
      return newNCs;
    });
  };

  const loadLatestRecord = () => {
    if (allRecords && Array.isArray(allRecords) && allRecords.length > 0) {
      const latestRecord = allRecords[0] as any;
      setCurrentRecordId(latestRecord.id);

      // Set complex state with fallbacks
      setIsoRequirements(
        latestRecord.isoRequirements || new Array(10).fill(false)
      );
      setStandards(
        latestRecord.standards || [
          {
            name: "",
            certificate: "",
            laboratory: "",
            accreditation: "",
            uncertainty: "",
            validity: "",
            status: "OK",
            observations: "",
          },
        ]
      );
      setCalibrationResults(
        latestRecord.calibrationResults || [
          {
            point: "",
            referenceValue: "",
            measuredValue: "",
            error: "",
            uncertainty: "",
            errorLimit: "",
            ok: false,
          },
        ]
      );
      setNonConformities(
        latestRecord.nonConformities || [
          {
            item: 1,
            description: "",
            criticality: "Media",
            action: "",
          },
        ]
      );
      setPressureCriteria(
        latestRecord.pressureCriteria || [
          {
            name: "",
            status: "Sim",
            observations: "",
          },
        ]
      );
      setFlowCriteria(
        latestRecord.flowCriteria || [
          {
            name: "",
            status: "Sim",
            observations: "",
          },
        ]
      );

      // Reset form with loaded data
      form.reset(latestRecord);

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
    const confirmed = window.confirm(
      "Tem certeza que deseja limpar todos os dados do formulário?"
    );
    if (confirmed) {
      form.reset();
      setCurrentRecordId(null);
      setIsoRequirements(new Array(10).fill(false));
      setStandards([
        {
          name: "",
          certificate: "",
          laboratory: "",
          accreditation: "",
          uncertainty: "",
          validity: "",
          status: "OK",
          observations: "",
        },
      ]);
      setCalibrationResults([
        {
          point: "",
          referenceValue: "",
          measuredValue: "",
          error: "",
          uncertainty: "",
          errorLimit: "",
          ok: false,
        },
      ]);
      setNonConformities([
        {
          item: 1,
          description: "",
          criticality: "Media",
          action: "",
        },
      ]);
      setPressureCriteria([
        {
          name: "",
          status: "Sim",
          observations: "",
        },
      ]);
      setFlowCriteria([
        {
          name: "",
          status: "Sim",
          observations: "",
        },
      ]);
      toast({
        title: "Sucesso",
        description: "Formulário limpo com sucesso!",
      });
    }
  };

  // Funções para personalização da interface
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoUrl(result);
        localStorage.setItem("app-logo", result);
        toast({
          title: "Logo Carregado",
          description: "O logotipo foi atualizado com sucesso.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    localStorage.setItem("app-title", headerTitle);
    toast({
      title: "Título Atualizado",
      description: "O título do cabeçalho foi salvo.",
    });
  };

  const adjustFontSize = (increment: number) => {
    const newSize = Math.max(12, Math.min(24, fontSize + increment));
    setFontSize(newSize);
    localStorage.setItem("app-font-size", newSize.toString());
    document.documentElement.style.fontSize = `${newSize}px`;
  };

  // Função para calcular todos os erros automaticamente
  const calculateAllErrors = () => {
    const updatedResults = calibrationResults.map((result) => {
      const validation = validateCalibrationData(
        result.referenceValue,
        result.measuredValue,
        result.uncertainty,
        result.errorLimit
      );

      if (validation.isValid) {
        const refValue = Number(result.referenceValue);
        const measValue = Number(result.measuredValue);
        const uncertainty = Number(result.uncertainty);
        const errorLimit = Number(result.errorLimit);

        const error = calculateError(measValue, refValue);
        const isConform = evaluatePointConformity(
          error,
          uncertainty,
          errorLimit
        );

        return {
          ...result,
          error: error.toString(),
          ok: isConform,
          autoCalculated: true,
        };
      }
      return result;
    });

    setCalibrationResults(updatedResults);
    toast({
      title: "Cálculo Automático",
      description: "Erros e conformidades calculados automaticamente!",
    });
  };

  // Função para gerar análise completa em JSON
  const generateAnalysisJSON = () => {
    try {
      // Converter dados para o formato da análise
      const points: AutoCalibrationPoint[] = calibrationResults.map(
        (result) => ({
          point: result.point,
          referenceValue: Number(result.referenceValue) || 0,
          measuredValue: Number(result.measuredValue) || 0,
          error: Number(result.error) || 0,
          uncertainty: Number(result.uncertainty) || 0,
          errorLimit: Number(result.errorLimit) || 0,
          ok: result.ok,
          autoCalculated: result.autoCalculated,
        })
      );

      // Extrair faixa de calibração dos comentários ou usar padrão
      const calibrationRange: CalibrationRange = {
        min: 0,
        max: 100,
        unit: "Un.", // Unidade padrão, pode ser customizada
      };

      const analysis = generateCalibrationAnalysis(points, calibrationRange);
      const jsonOutput = exportCalibrationAnalysisToJSON(analysis);

      // Criar arquivo para download
      const blob = new Blob([jsonOutput], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analise_calibracao_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Análise Gerada",
        description: "Arquivo JSON com análise completa foi baixado!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar análise JSON. Verifique os dados.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = () => {
    try {
      // Preparar dados do formulário para o PDF
      const formData = form.getValues();
      
      // Adicionar dados complexos ao objeto
      const completeData = {
        ...formData,
        standards,
        calibrationResults,
        nonConformities,
        isoRequirements,
        pressureCriteria,
        flowCriteria,
      };

      generatePDF(completeData);
      
      toast({
        title: "PDF Gerado",
        description: "Relatório PDF foi gerado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Carregar configurações salvas
  useEffect(() => {
    const savedLogo = localStorage.getItem("app-logo");
    const savedTitle = localStorage.getItem("app-title");
    const savedFontSize = localStorage.getItem("app-font-size");

    if (savedLogo) setLogoUrl(savedLogo);
    if (savedTitle) setHeaderTitle(savedTitle);
    if (savedFontSize) {
      const size = parseInt(savedFontSize);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}px`;
    }
  }, []);

  // Handle loading error - suppress for now to prevent crashes
  useEffect(() => {
    if (recordsError) {
      console.warn("Aviso: Erro ao carregar registros:", recordsError);
    }
  }, [recordsError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="app-container bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Enhanced Header with Custom Background */}
          <div className="relative bg-gradient-to-r from-[#033985] via-[#0056b3] to-[#033985] shadow-2xl">
            {/* Theme Switcher - Posição isolada no canto superior esquerdo */}
            <div className="absolute top-4 left-4 z-10">
              <ThemeSwitcher />
            </div>
            
            <div className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {/* Logo Section */}
                  <div className="flex items-center space-x-3">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-16 w-16 object-contain rounded-lg bg-white p-1"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg flex items-center justify-center border-2 border-dashed border-white/30">
                        <Upload className="h-6 w-6 text-white/60" />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {/* Hover Area for Logo Button */}
                    <div className="group relative">
                      <div className="w-8 h-8 bg-transparent hover:bg-white/10 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Upload className="h-4 w-4 text-white/40 group-hover:text-white/80" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Logo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Font Size Controls - Hover Area */}
                <div className="group relative">
                  {/* Invisible trigger area */}
                  <div className="w-12 h-8 bg-transparent hover:bg-white/10 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-xs text-white/40 group-hover:text-white/80">
                      {fontSize}px
                    </span>
                  </div>

                  {/* Hidden controls that appear on hover */}
                  <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 flex items-center space-x-2 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustFontSize(-1)}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2 py-1 bg-white/10 rounded border border-white/30">
                      {fontSize}px
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustFontSize(1)}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingTitle(!isEditingTitle)}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-4">
                {isEditingTitle ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      className="bg-white/10 border-white/30 text-white placeholder-white/60"
                      placeholder="Digite o título do cabeçalho"
                    />
                    <Button
                      type="button"
                      onClick={handleTitleSave}
                      size="sm"
                      className="bg-[#d4fc04] text-[#033985] hover:bg-[#c4ec00] font-semibold"
                    >
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-white flex items-center">
                    <ClipboardCheck className="text-[#d4fc04] mr-3" size={28} />
                    {headerTitle}
                  </h1>
                )}
              </div>
            </div>

            {/* Decorative accent */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: "#d4fc04" }}
            ></div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
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
                  <Label
                    htmlFor="analysisDate"
                    className="text-gray-700 font-medium"
                  >
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label
                    htmlFor="analyzedBy"
                    className="text-gray-700 font-medium"
                  >
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
                  <Label
                    htmlFor="approvedBy"
                    className="text-gray-700 font-medium"
                  >
                    Cargo:
                  </Label>
                  <Input
                    id="approvedBy"
                    placeholder="Cargo da pessoa que está analisando"
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
              <div className="purpose-box p-4 rounded-r-lg mb-6">
                <p className="text-blue-800 text-sm italic">
                  <strong>Propósito:</strong> Este registro tem como objetivo
                  padronizar a avaliação crítica de certificados de calibração e
                  relatórios de inspeção, assegurando a conformidade com a
                  Portaria INMETRO 291/2021, a norma ISO/IEC 17025, o Guia para a
                  Expressão da Incerteza de Medição (GUM) e outros padrões
                  metrológicos pertinentes. O foco é validar a adequação
                  metrológica e a aptidão para uso do instrumento em sua aplicação
                  específica.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  type="submit"
                  disabled={saveRecordMutation.isPending}
                  className="btn-primary"
                >
                  <Save className="mr-2" size={16} />
                  {saveRecordMutation.isPending
                    ? "Salvando..."
                    : "Salvar Registro"}
                </Button>
                <Button
                  type="button"
                  onClick={loadLatestRecord}
                  variant="outline"
                  disabled={
                    !allRecords ||
                    !Array.isArray(allRecords) ||
                    allRecords.length === 0
                  }
                >
                  <FolderOpen className="mr-2" size={16} />
                  Carregar Último
                </Button>
                <Button type="button" onClick={clearForm} variant="outline">
                  <Trash2 className="mr-2" size={16} />
                  Limpar Formulário
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    setShowRegulatoryReference(!showRegulatoryReference)
                  }
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                >
                  <BookOpen className="mr-2" size={16} />
                  {showRegulatoryReference ? "Ocultar" : "Consultar"} Base
                  Regulatória
                </Button>
                <Button
                  type="button"
                  onClick={handleGeneratePDF}
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 text-red-700"
                >
                  <Download className="mr-2" size={16} />
                  Gerar PDF
                </Button>
              </div>

              {/* Regulatory Reference Panel */}
              {showRegulatoryReference && (
                <div className="mb-6">
                  <RegulatoryReference className="mb-4" />
                </div>
              )}

              {/* Enhanced Tabs */}
              <Tabs defaultValue="section1" className="w-full fade-in">
                <TabsList className="grid h-auto grid-cols-3 gap-2 p-2 custom-tabs-list md:grid-cols-6 lg:grid-cols-9 mb-6">
                  <TabsTrigger
                    value="section1"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">1. Cert.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section2"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">2. Acred.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section3"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">3. Instr.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section4"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">4. Amb.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section5"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">5. ISO</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section6"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">6. Rastr.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section7"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">7. Incert.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section8"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">8. Result.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section9"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">9. Ajust.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section10"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">10. Conf.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section11"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">11. Uso</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section12"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">12. Period.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section13"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">13. Espec.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section14"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">14. N.C.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section15"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">15. Final</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section16"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">16. Assin.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="section17"
                    className="flex flex-col items-center h-auto py-3 space-y-1 custom-tab-trigger"
                  >
                    <span className="text-xs font-semibold">17. Anexos</span>
                  </TabsTrigger>
                </TabsList>

                {/* Section 1: Certificate and Laboratory Identification */}
                <TabsContent value="section1">
                  <Card className="custom-card slide-in">
                    <CardHeader className="bg-gradient-to-r from-[#033985] to-[#0056b3] text-white rounded-t-2xl">
                      <CardTitle className="flex items-center text-xl">
                        <FileText className="text-[#d4fc04] mr-3" size={28} />
                        1. IDENTIFICAÇÃO DO CERTIFICADO E LABORATÓRIO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 custom-table">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-3 text-left">
                                Campo
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Valor
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Verificação / Status
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Observações / Evidências
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Número do Certificado
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("certificateNumber")} />
                                {form.formState.errors.certificateNumber && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {
                                      form.formState.errors.certificateNumber
                                        .message
                                    }
                                  </p>
                                )}
                              </td>
                              <td className="border border-gray-300 p-3">
                                <StatusSelector
                                  name="certificateNumberStatus"
                                  value={form.watch("certificateNumberStatus")}
                                  onChange={(value) =>
                                    form.setValue(
                                      "certificateNumberStatus",
                                      value as ConformityStatus
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("certificateNumberObs")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Laboratório Emissor
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("issuingLaboratory")} />
                                {form.formState.errors.issuingLaboratory && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {
                                      form.formState.errors.issuingLaboratory
                                        .message
                                    }
                                  </p>
                                )}
                              </td>
                              <td className="border border-gray-300 p-3">
                                <StatusSelector
                                  name="issuingLaboratoryStatus"
                                  value={form.watch("issuingLaboratoryStatus")}
                                  onChange={(value) =>
                                    form.setValue(
                                      "issuingLaboratoryStatus",
                                      value as ConformityStatus
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("issuingLaboratoryObs")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Data de Emissão
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  type="date"
                                  {...form.register("issueDate")}
                                />
                                {form.formState.errors.issueDate && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {form.formState.errors.issueDate.message}
                                  </p>
                                )}
                              </td>
                              <td className="border border-gray-300 p-3">
                                <StatusSelector
                                  name="issueDateStatus"
                                  value={form.watch("issueDateStatus")}
                                  onChange={(value) =>
                                    form.setValue(
                                      "issueDateStatus",
                                      value as ConformityStatus
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("issueDateObs")} />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Data da Calibração
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  type="date"
                                  {...form.register("calibrationDate")}
                                />
                                {form.formState.errors.calibrationDate && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {
                                      form.formState.errors.calibrationDate
                                        .message
                                    }
                                  </p>
                                )}
                              </td>
                              <td className="border border-gray-300 p-3">
                                <StatusSelector
                                  name="calibrationDateStatus"
                                  value={form.watch("calibrationDateStatus")}
                                  onChange={(value) =>
                                    form.setValue(
                                      "calibrationDateStatus",
                                      value as ConformityStatus
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("calibrationDateObs")} />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Data de Instalação
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  type="date"
                                  {...form.register("installationDate")}
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <StatusSelector
                                  name="validityStatus"
                                  value={form.watch("validityStatus")}
                                  onChange={(value) =>
                                    form.setValue(
                                      "validityStatus",
                                      value as ConformityStatus
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Ex: Calculado conforme [Referência da Norma/Procedimento Interno]"
                                  {...form.register("validityObservations")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Responsável Técnico
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("technicalResponsible")}
                                />
                                {form.formState.errors.technicalResponsible && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {
                                      form.formState.errors.technicalResponsible
                                        .message
                                    }
                                  </p>
                                )}
                              </td>
                              <td className="border border-gray-300 p-3">
                                <StatusSelector
                                  name="responsibleStatus"
                                  value={form.watch("responsibleStatus")}
                                  onChange={(value) =>
                                    form.setValue(
                                      "responsibleStatus",
                                      value as ConformityStatus
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Ex: Verificar registro de acreditação."
                                  {...form.register("responsibleObservations")}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 2: Accreditation */}
                <TabsContent value="section2">
                  <Card className="custom-card slide-in">
                    <CardHeader className="bg-gradient-to-r from-[#033985] to-[#0056b3] text-white rounded-t-2xl">
                      <CardTitle className="flex items-center text-xl">
                        <Award className="text-[#d4fc04] mr-3" size={28} />
                        2. ACREDITAÇÃO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 custom-table">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-3 text-left">
                                Campo
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Valor
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Verificação / Status
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Observações / Evidências
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Laboratório Acreditado (Cgcre/Inmetro)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch("accreditedLabStatus") ===
                                        "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "accreditedLabStatus",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch("accreditedLabStatus") ===
                                        "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "accreditedLabStatus",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Nº Acreditação: [Preencher se Sim]. Evidência: Site Inmetro/Cgcre - Imagem/Link"
                                  {...form.register("accreditedLabObservations")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Escopo de Acreditação Adequado
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch("adequateScopeStatus") ===
                                        "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "adequateScopeStatus",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch("adequateScopeStatus") ===
                                        "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "adequateScopeStatus",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="A faixa de calibração ([Faixa Calibrada]) e o tipo de serviço ([Tipo de Serviço]) estão abrangidos pelo escopo ([Nº do Escopo]) do laboratório."
                                  {...form.register("adequateScopeObservations")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Símbolo de Acreditação Presente
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch(
                                          "accreditationSymbolStatus"
                                        ) === "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "accreditationSymbolStatus",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch(
                                          "accreditationSymbolStatus"
                                        ) === "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "accreditationSymbolStatus",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Verificar presença do selo do Inmetro/Cgcre no certificado."
                                  {...form.register(
                                    "accreditationSymbolObservations"
                                  )}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 3: Instrument Identification */}
                <TabsContent value="section3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Settings className="text-blue-600 mr-3" size={24} />
                        3. IDENTIFICAÇÃO DO INSTRUMENTO
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="equipmentType">
                            Tipo de Equipamento
                          </Label>
                          <Input
                            id="equipmentType"
                            placeholder="Ex: Medidor Ultrassônico de Vazão"
                            {...form.register("equipmentType")}
                          />
                          {form.formState.errors.equipmentType && (
                            <p className="text-red-500 text-xs mt-1">
                              {form.formState.errors.equipmentType.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="manufacturerModel">
                            Fabricante / Modelo
                          </Label>
                          <Input
                            id="manufacturerModel"
                            placeholder="Ex: Siemens / SITRANS F US"
                            {...form.register("manufacturerModel")}
                          />
                          {form.formState.errors.manufacturerModel && (
                            <p className="text-red-500 text-xs mt-1">
                              {form.formState.errors.manufacturerModel.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="serialNumber">Número de Série</Label>
                          <Input
                            id="serialNumber"
                            placeholder="Ex: 123456789"
                            {...form.register("serialNumber")}
                          />
                          {form.formState.errors.serialNumber && (
                            <p className="text-red-500 text-xs mt-1">
                              {form.formState.errors.serialNumber.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="tagIdInternal">TAG / ID Interno</Label>
                          <Input
                            id="tagIdInternal"
                            placeholder="Ex: VAZ-001 / ID-123"
                            {...form.register("tagIdInternal")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="application">Aplicação</Label>
                          <Input
                            id="application"
                            placeholder="Ex: Fiscal - Medição de Gás Natural"
                            {...form.register("application")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="location">Localização</Label>
                          <Input
                            id="location"
                            placeholder="Ex: Ponto de Medição X - Unidade Y"
                            {...form.register("location")}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 4: Environmental Conditions */}
                <TabsContent value="section4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Thermometer className="text-blue-600 mr-3" size={24} />
                        4. CONDIÇÕES AMBIENTAIS E MÉTODO DA CALIBRAÇÃO
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Verificação da adequação das condições durante a
                        calibração.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-3 text-left">
                                Parâmetro
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Valor Reportado
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Limite Aceitável
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                OK?
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Observações / Impacto
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Temperatura (°C)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("tempReported")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Ex: 20 ± 2 °C"
                                  {...form.register("tempLimit")}
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("tempOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue("tempOk", checked as boolean)
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("tempObs")} />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Umidade Relativa (%)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("humidityReported")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Ex: 50 ± 10 %"
                                  {...form.register("humidityLimit")}
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("humidityOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "humidityOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("humidityObs")} />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Pressão Atmosférica (kPa)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("pressureReported")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Ex: 101.3 ± 5 kPa"
                                  {...form.register("pressureLimit")}
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("pressureOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "pressureOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("pressureObs")} />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Fluido de Calibração
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("fluidReported")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Ex: Água / Ar Seco"
                                  {...form.register("fluidLimit")}
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("fluidOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue("fluidOk", checked as boolean)
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Adequado para a aplicação do instrumento?"
                                  {...form.register("fluidObs")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Local da Calibração
                              </td>
                              <td
                                className="border border-gray-300 p-3"
                                colSpan={2}
                              >
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Laboratorio"
                                      checked={
                                        form.watch("calibrationLocation") ===
                                        "Laboratorio"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "calibrationLocation",
                                          e.target.value as LocationStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Laboratório
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Campo"
                                      checked={
                                        form.watch("calibrationLocation") ===
                                        "Campo"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "calibrationLocation",
                                          e.target.value as LocationStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Campo
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={
                                    form.watch("calibrationLocationOk") || false
                                  }
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "calibrationLocationOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("calibrationLocationObs")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Método Utilizado
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("methodUsed")} />
                              </td>
                              <td className="border border-gray-300 p-3"></td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("methodUsedOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "methodUsedOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  placeholder="Verificar se o método é padrão e aplicável."
                                  {...form.register("methodUsedObs")}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 5: ISO/IEC 17025 Essential Elements */}
                <TabsContent value="section5">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckSquare className="text-blue-600 mr-3" size={24} />
                        5. ELEMENTOS ESSENCIAIS ISO/IEC 17025 (Checklist)
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Confirmação da aderência formal aos requisitos da norma.
                        Marque ✓ quando o requisito estiver atendido.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          "Identificação inequívoca do item calibrado",
                          "Identificação do laboratório que executou a calibração",
                          "Data(s) da execução da calibração",
                          "Referência ao(s) método(s) utilizado(s)",
                          "Resultados com unidades de medição apropriadas",
                          "Incerteza de medição declarada",
                          "Evidência de rastreabilidade metrológica ao SI",
                          "Condições ambientais informadas no local da calibração",
                          "Declaração de que o relatório não deve ser reproduzido parcialmente",
                          "Assinatura e identificação do responsável autorizado pela emissão",
                        ].map((requirement, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <Checkbox
                              checked={isoRequirements[index] || false}
                              onCheckedChange={(checked) => {
                                const newRequirements = [...isoRequirements];
                                newRequirements[index] = checked as boolean;
                                setIsoRequirements(newRequirements);
                              }}
                            />
                            <label className="text-sm">{requirement}</label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 6: Metrological Traceability */}
                <TabsContent value="section6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Link className="text-blue-600 mr-3" size={24} />
                        6. RASTREABILIDADE METROLÓGICA E INCERTEZA DOS PADRÕES
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Detalhar os padrões utilizados no laboratório, seus
                        certificados de calibração, incertezas e validades,
                        provando a cadeia metrológica.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 mb-4">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Padrão Utilizado
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Certificado
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Lab. Calibrador
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Nº Acreditação
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Incerteza (k=2)
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Validade
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Status
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Observações
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {standards.map((standard, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={standard.name}
                                    onChange={(e) =>
                                      updateStandard(
                                        index,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={standard.certificate}
                                    onChange={(e) =>
                                      updateStandard(
                                        index,
                                        "certificate",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={standard.laboratory}
                                    onChange={(e) =>
                                      updateStandard(
                                        index,
                                        "laboratory",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={standard.accreditation}
                                    onChange={(e) =>
                                      updateStandard(
                                        index,
                                        "accreditation",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={standard.uncertainty}
                                    onChange={(e) =>
                                      updateStandard(
                                        index,
                                        "uncertainty",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    type="date"
                                    value={standard.validity}
                                    onChange={(e) =>
                                      updateStandard(
                                        index,
                                        "validity",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <div className="flex space-x-2">
                                    <label className="flex items-center text-xs">
                                      <input
                                        type="radio"
                                        value="OK"
                                        checked={standard.status === "OK"}
                                        onChange={(e) =>
                                          updateStandard(
                                            index,
                                            "status",
                                            e.target.value as "OK" | "NOK"
                                          )
                                        }
                                        className="mr-1"
                                      />
                                      OK
                                    </label>
                                    <label className="flex items-center text-xs">
                                      <input
                                        type="radio"
                                        value="NOK"
                                        checked={standard.status === "NOK"}
                                        onChange={(e) =>
                                          updateStandard(
                                            index,
                                            "status",
                                            e.target.value as "OK" | "NOK"
                                          )
                                        }
                                        className="mr-1"
                                      />
                                      NOK
                                    </label>
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={standard.observations}
                                    onChange={(e) =>
                                      updateStandard(
                                        index,
                                        "observations",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Button
                                    type="button"
                                    onClick={() => removeStandard(index)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Button
                        type="button"
                        onClick={addStandard}
                        variant="outline"
                      >
                        <Plus className="mr-2" size={16} />
                        Adicionar Padrão
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 7: Uncertainty Evaluation */}
                <TabsContent value="section7">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="text-blue-600 mr-3" size={24} />
                        7. AVALIAÇÃO DA INCERTEZA DE MEDIÇÃO DO CERTIFICADO
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Análise crítica da incerteza reportada.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-3 text-left">
                                Aspecto Avaliado
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Valor / Evidência
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                OK?
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Comentários / Justificativa Técnica
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Incerteza Expandida (U) declarada
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("uncertaintyDeclared")}
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={
                                    form.watch("uncertaintyDeclaredOk") || false
                                  }
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "uncertaintyDeclaredOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("uncertaintyDeclaredObs")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Método de cálculo conforme GUM / NIT Dicla-021
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("calculationMethod")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={
                                    form.watch("calculationMethodOk") || false
                                  }
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "calculationMethodOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("calculationMethodObs")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Todas as contribuições relevantes consideradas
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("contributions")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("contributionsOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "contributionsOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("contributionsObs")} />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Nível de confiança (geralmente 95%)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("confidenceLevel")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={
                                    form.watch("confidenceLevelOk") || false
                                  }
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "confidenceLevelOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("confidenceLevelObs")} />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Compatibilidade com Limite da Aplicação
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("compatibility")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("compatibilityOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "compatibilityOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("compatibilityObs")} />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 8: Calibration Results */}
                <TabsContent value="section8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="text-blue-600 mr-3" size={24} />
                        8. RESULTADOS DA CALIBRAÇÃO E FAIXA OPERACIONAL
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Ponto
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Valor Ref.
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Valor Medido
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Erro
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Incerteza
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Limite de Erro
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                OK?
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {calibrationResults.map((result, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={result.point}
                                    onChange={(e) =>
                                      updateCalibrationResult(
                                        index,
                                        "point",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={result.referenceValue}
                                    onChange={(e) =>
                                      updateCalibrationResult(
                                        index,
                                        "referenceValue",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={result.measuredValue}
                                    onChange={(e) =>
                                      updateCalibrationResult(
                                        index,
                                        "measuredValue",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <div className="flex items-center space-x-1">
                                    <Input
                                      value={result.error}
                                      onChange={(e) =>
                                        updateCalibrationResult(
                                          index,
                                          "error",
                                          e.target.value
                                        )
                                      }
                                      className={`text-xs ${result.autoCalculated ? "bg-green-50 border-green-300" : ""}`}
                                    />
                                    {result.autoCalculated && (
                                      <CheckSquare
                                        className="text-green-600"
                                        size={12}
                                      />
                                    )}
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={result.uncertainty}
                                    onChange={(e) =>
                                      updateCalibrationResult(
                                        index,
                                        "uncertainty",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={result.errorLimit}
                                    onChange={(e) =>
                                      updateCalibrationResult(
                                        index,
                                        "errorLimit",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <div className="flex items-center space-x-1">
                                    <Checkbox
                                      checked={result.ok}
                                      onCheckedChange={(checked) =>
                                        updateCalibrationResult(
                                          index,
                                          "ok",
                                          checked as boolean
                                        )
                                      }
                                    />
                                    {result.autoCalculated && (
                                      <span
                                        className={`text-xs px-1 py-0.5 rounded ${result.ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                      >
                                        Auto
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Button
                                    type="button"
                                    onClick={() => removeCalibrationResult(index)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <Button
                          type="button"
                          onClick={addCalibrationResult}
                          variant="outline"
                        >
                          <Plus className="mr-2" size={16} />
                          Adicionar Ponto
                        </Button>
                        <Button
                          type="button"
                          onClick={calculateAllErrors}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <BarChart3 className="mr-2" size={16} />
                          Calcular Erros Automaticamente
                        </Button>
                        <Button
                          type="button"
                          onClick={generateAnalysisJSON}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <FileText className="mr-2" size={16} />
                          Gerar Análise JSON
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="calibrationRange">
                            Faixa de Calibração Reportada
                          </Label>
                          <Input
                            id="calibrationRange"
                            placeholder="[Valor] a [Valor] [Unidade]"
                            {...form.register("calibrationRange")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="operationalRange">
                            Faixa Operacional do Instrumento
                          </Label>
                          <Input
                            id="operationalRange"
                            placeholder="[Valor] a [Valor] [Unidade] ou [Não especificada]"
                            {...form.register("operationalRange")}
                          />
                        </div>
                      </div>
                      {/* Área informativa sobre a regra de decisão */}
                      <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                          <Target className="mr-2" size={16} />
                          Regra de Decisão Aplicada
                        </h4>
                        <p className="text-sm text-blue-700 mb-2">
                          <strong>Critério:</strong> |Erro| + U ≤ EMA
                        </p>
                        <p className="text-xs text-blue-600">
                          Onde: |Erro| = valor absoluto do erro, U = incerteza
                          expandida, EMA = erro máximo admissível
                        </p>
                        {calibrationResults.some((r) => r.autoCalculated) && (
                          <div className="mt-2 text-xs text-green-700">
                            ✓ Cálculos automáticos aplicados conforme ISO/IEC
                            17025
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <Label htmlFor="resultsComments">
                          Comentários sobre os Resultados
                        </Label>
                        <Textarea
                          id="resultsComments"
                          placeholder="Adicione comentários sobre os resultados de calibração, incluindo observações sobre pontos não conformes e recomendações..."
                          {...form.register("resultsComments")}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 9: Adjustment/Repair Analysis */}
                <TabsContent value="section9">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Wrench className="text-blue-600 mr-3" size={24} />
                        9. ANÁLISE DE AJUSTES/REPAROS
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Avaliação de ajustes e reparos realizados no instrumento.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-3 text-left">
                                Aspecto
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Status
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Observações / Evidências
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Dados "Como Encontrado" (As Found)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Presentes"
                                      checked={
                                        form.watch("asFoundStatus") ===
                                        "Presentes"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "asFoundStatus",
                                          e.target.value as AsFoundLeftStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Presentes
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Ausentes"
                                      checked={
                                        form.watch("asFoundStatus") === "Ausentes"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "asFoundStatus",
                                          e.target.value as AsFoundLeftStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Ausentes
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Textarea
                                  {...form.register("asFoundObs")}
                                  placeholder="Descrever os dados encontrados ou justificar ausência"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Dados "Como Deixado" (As Left)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Presentes"
                                      checked={
                                        form.watch("asLeftStatus") === "Presentes"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "asLeftStatus",
                                          e.target.value as AsFoundLeftStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Presentes
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Ausentes"
                                      checked={
                                        form.watch("asLeftStatus") === "Ausentes"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "asLeftStatus",
                                          e.target.value as AsFoundLeftStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Ausentes
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Textarea
                                  {...form.register("asLeftObs")}
                                  placeholder="Descrever os dados finais ou justificar ausência"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Ajustes/Reparos Realizados
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch("adjustmentsStatus") === "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "adjustmentsStatus",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch("adjustmentsStatus") === "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "adjustmentsStatus",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Textarea
                                  {...form.register("adjustmentsObs")}
                                  placeholder="Descrever ajustes realizados ou confirmar ausência"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-6">
                        <Label
                          htmlFor="retroactiveActions"
                          className="text-lg font-semibold"
                        >
                          Ações Retroativas Necessárias
                        </Label>
                        <Textarea
                          id="retroactiveActions"
                          {...form.register("retroactiveActions")}
                          placeholder="Descrever ações necessárias caso tenham sido identificados problemas nos dados 'Como Encontrado'"
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 10: Conformity Declaration and Decision Rules */}
                <TabsContent value="section10">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="text-blue-600 mr-3" size={24} />
                        10. DECLARAÇÃO DE CONFORMIDADE E REGRAS DE DECISÃO
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Análise da declaração de conformidade e regras de decisão
                        aplicadas.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-3 text-left">
                                Aspecto Avaliado
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Status
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Observações / Justificativa
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Declaração de Conformidade Presente
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch(
                                          "conformityDeclarationPresent"
                                        ) === "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "conformityDeclarationPresent",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch(
                                          "conformityDeclarationPresent"
                                        ) === "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "conformityDeclarationPresent",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Textarea
                                  {...form.register("conformityDeclarationObs")}
                                  placeholder="Comentários sobre a declaração de conformidade"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Limite de Especificação Definido
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch("specificationLimit") === "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "specificationLimit",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch("specificationLimit") === "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "specificationLimit",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Textarea
                                  {...form.register("specificationLimitObs")}
                                  placeholder="Informações sobre os limites de especificação"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Regra de Decisão Aplicada
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch("decisionRule") === "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "decisionRule",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch("decisionRule") === "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "decisionRule",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Textarea
                                  {...form.register("decisionRuleObs")}
                                  placeholder="Descrever a regra de decisão aplicada"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Nível de Risco Considerado
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={form.watch("riskLevel") === "Sim"}
                                      onChange={(e) =>
                                        form.setValue(
                                          "riskLevel",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={form.watch("riskLevel") === "Nao"}
                                      onChange={(e) =>
                                        form.setValue(
                                          "riskLevel",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Textarea
                                  {...form.register("riskLevelObs")}
                                  placeholder="Comentários sobre o nível de risco considerado"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 11: Environmental Conditions Post-Calibration/Use */}
                <TabsContent value="section11">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Globe className="text-blue-600 mr-3" size={24} />
                        11. CONDIÇÕES AMBIENTAIS PÓS-CALIBRAÇÃO/USO
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Verificação das condições ambientais no local de uso do
                        instrumento.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-3 text-left">
                                Parâmetro
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Condição de Uso
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Limite Especificado
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                OK?
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Observações
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Temperatura de Uso (°C)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("tempUseValue")}
                                  placeholder="Ex: 20 ± 2"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("tempUseLimit")}
                                  placeholder="Limite do fabricante"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("tempUseOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue("tempUseOk", checked as boolean)
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("tempUseObs")}
                                  placeholder="Compatibilidade com calibração"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Umidade de Uso (%UR)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("humidityUseValue")}
                                  placeholder="Ex: 50 ± 10"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("humidityUseLimit")}
                                  placeholder="Limite do fabricante"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("humidityUseOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "humidityUseOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("humidityUseObs")}
                                  placeholder="Impacto na medição"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Pressão de Uso (kPa)
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("pressureUseValue")}
                                  placeholder="Ex: 101,3 ± 5"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("pressureUseLimit")}
                                  placeholder="Limite do fabricante"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("pressureUseOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "pressureUseOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("pressureUseObs")}
                                  placeholder="Relevância para o instrumento"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Fluido de Uso
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("fluidUseValue")}
                                  placeholder="Ex: Água potável"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("fluidUseLimit")}
                                  placeholder="Especificação do fabricante"
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Checkbox
                                  checked={form.watch("fluidUseOk") || false}
                                  onCheckedChange={(checked) =>
                                    form.setValue(
                                      "fluidUseOk",
                                      checked as boolean
                                    )
                                  }
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("fluidUseObs")}
                                  placeholder="Compatibilidade com calibração"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 12: Calibration Periodicity */}
                <TabsContent value="section12">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="text-blue-600 mr-3" size={24} />
                        12. PERIODICIDADE DE CALIBRAÇÃO
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Análise da periodicidade de calibração e histórico do
                        instrumento.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-blue-50">
                                <th className="border border-gray-300 p-3 text-left">
                                  Histórico
                                </th>
                                <th className="border border-gray-300 p-3 text-left">
                                  Data/Valor
                                </th>
                                <th className="border border-gray-300 p-3 text-left">
                                  Atende Periodicidade?
                                </th>
                                <th className="border border-gray-300 p-3 text-left">
                                  Justificativa / Comentário
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-gray-300 p-3 font-medium">
                                  Data Última Calibração
                                </td>
                                <td className="border border-gray-300 p-3">
                                  <Input
                                    type="date"
                                    {...form.register("lastCalibrationDate")}
                                  />
                                </td>
                                <td className="border border-gray-300 p-3"></td>
                                <td className="border border-gray-300 p-3">
                                  <Input
                                    {...form.register("lastCalibrationObs")}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 p-3 font-medium">
                                  Intervalo Realizado
                                </td>
                                <td className="border border-gray-300 p-3">
                                  <Input
                                    {...form.register("intervalPerformed")}
                                    placeholder="_____ meses"
                                  />
                                </td>
                                <td className="border border-gray-300 p-3"></td>
                                <td className="border border-gray-300 p-3">
                                  <Input
                                    {...form.register("intervalPerformedObs")}
                                  />
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 p-3 font-medium">
                                  Periodicidade Definida
                                </td>
                                <td className="border border-gray-300 p-3">
                                  <Input
                                    {...form.register("definedPeriodicity")}
                                    placeholder="_____ meses"
                                  />
                                </td>
                                <td className="border border-gray-300 p-3">
                                  <div className="flex space-x-4">
                                    <label className="flex items-center">
                                      <input
                                        type="radio"
                                        value="Sim"
                                        checked={
                                          form.watch("periodicityCompliance") ===
                                          "Sim"
                                        }
                                        onChange={(e) =>
                                          form.setValue(
                                            "periodicityCompliance",
                                            e.target.value as BinaryStatus
                                          )
                                        }
                                        className="mr-2"
                                      />
                                      Sim
                                    </label>
                                    <label className="flex items-center">
                                      <input
                                        type="radio"
                                        value="Nao"
                                        checked={
                                          form.watch("periodicityCompliance") ===
                                          "Nao"
                                        }
                                        onChange={(e) =>
                                          form.setValue(
                                            "periodicityCompliance",
                                            e.target.value as BinaryStatus
                                          )
                                        }
                                        className="mr-2"
                                      />
                                      Não
                                    </label>
                                  </div>
                                </td>
                                <td className="border border-gray-300 p-3">
                                  <Input
                                    {...form.register("periodicityComments")}
                                    placeholder="Análise de tendência ou impacto na periodicidade."
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 13: Specific Evaluations by Instrument Type */}
                <TabsContent value="section13">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Search className="text-blue-600 mr-3" size={24} />
                        13. AVALIAÇÕES ESPECÍFICAS POR TIPO DE INSTRUMENTO
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Critérios específicos conforme o tipo de instrumento
                        analisado.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {/* Pressure Instruments Criteria */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-blue-800">
                            Instrumentos de Pressão
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-blue-50">
                                  <th className="border border-gray-300 p-3 text-left">
                                    Critério
                                  </th>
                                  <th className="border border-gray-300 p-3 text-left">
                                    Status
                                  </th>
                                  <th className="border border-gray-300 p-3 text-left">
                                    Observações
                                  </th>
                                  <th className="border border-gray-300 p-3 text-left">
                                    Ações
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {pressureCriteria.map((criteria, index) => (
                                  <tr key={index}>
                                    <td className="border border-gray-300 p-3">
                                      <Input
                                        value={criteria.name}
                                        onChange={(e) => {
                                          const updated = [...pressureCriteria];
                                          updated[index].name = e.target.value;
                                          setPressureCriteria(updated);
                                        }}
                                        placeholder="Ex: Faixa de medição adequada"
                                      />
                                    </td>
                                    <td className="border border-gray-300 p-3">
                                      <Select
                                        value={criteria.status}
                                        onValueChange={(
                                          value: "Sim" | "Nao" | "N/A"
                                        ) => {
                                          const updated = [...pressureCriteria];
                                          updated[index].status = value;
                                          setPressureCriteria(updated);
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Sim">Sim</SelectItem>
                                          <SelectItem value="Nao">Não</SelectItem>
                                          <SelectItem value="N/A">N/A</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="border border-gray-300 p-3">
                                      <Input
                                        value={criteria.observations}
                                        onChange={(e) => {
                                          const updated = [...pressureCriteria];
                                          updated[index].observations =
                                            e.target.value;
                                          setPressureCriteria(updated);
                                        }}
                                        placeholder="Observações técnicas"
                                      />
                                    </td>
                                    <td className="border border-gray-300 p-3">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const updated = pressureCriteria.filter(
                                            (_, i) => i !== index
                                          );
                                          setPressureCriteria(updated);
                                        }}
                                      >
                                        Remover
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setPressureCriteria([
                                ...pressureCriteria,
                                { name: "", status: "Sim", observations: "" },
                              ])
                            }
                            className="mt-3"
                          >
                            <Plus className="mr-2" size={16} />
                            Adicionar Critério de Pressão
                          </Button>
                        </div>

                        {/* Flow Instruments Criteria */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 text-blue-800">
                            Instrumentos de Vazão
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                              <thead>
                                <tr className="bg-blue-50">
                                  <th className="border border-gray-300 p-3 text-left">
                                    Critério
                                  </th>
                                  <th className="border border-gray-300 p-3 text-left">
                                    Status
                                  </th>
                                  <th className="border border-gray-300 p-3 text-left">
                                    Observações
                                  </th>
                                  <th className="border border-gray-300 p-3 text-left">
                                    Ações
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {flowCriteria.map((criteria, index) => (
                                  <tr key={index}>
                                    <td className="border border-gray-300 p-3">
                                      <Input
                                        value={criteria.name}
                                        onChange={(e) => {
                                          const updated = [...flowCriteria];
                                          updated[index].name = e.target.value;
                                          setFlowCriteria(updated);
                                        }}
                                        placeholder="Ex: Condições de instalação adequadas"
                                      />
                                    </td>
                                    <td className="border border-gray-300 p-3">
                                      <Select
                                        value={criteria.status}
                                        onValueChange={(
                                          value: "Sim" | "Nao" | "N/A"
                                        ) => {
                                          const updated = [...flowCriteria];
                                          updated[index].status = value;
                                          setFlowCriteria(updated);
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Sim">Sim</SelectItem>
                                          <SelectItem value="Nao">Não</SelectItem>
                                          <SelectItem value="N/A">N/A</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="border border-gray-300 p-3">
                                      <Input
                                        value={criteria.observations}
                                        onChange={(e) => {
                                          const updated = [...flowCriteria];
                                          updated[index].observations =
                                            e.target.value;
                                          setFlowCriteria(updated);
                                        }}
                                        placeholder="Observações técnicas"
                                      />
                                    </td>
                                    <td className="border border-gray-300 p-3">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const updated = flowCriteria.filter(
                                            (_, i) => i !== index
                                          );
                                          setFlowCriteria(updated);
                                        }}
                                      >
                                        Remover
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setFlowCriteria([
                                ...flowCriteria,
                                { name: "", status: "Sim", observations: "" },
                              ])
                            }
                            className="mt-3"
                          >
                            <Plus className="mr-2" size={16} />
                            Adicionar Critério de Vazão
                          </Button>
                        </div>

                        {/* Specific Flow Meters Calibration Report Evaluation */}
                        <div className="mt-12 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <h3 className="text-xl font-bold mb-6 text-blue-900 flex items-center">
                            <BarChart3 className="mr-3" size={24} />
                            AVALIAÇÃO ESPECÍFICA PARA MEDIDORES DE VAZÃO
                          </h3>
                          <p className="text-sm text-blue-800 mb-6 bg-blue-100 p-3 rounded">
                            <strong>Importante:</strong> Para medidores de vazão,
                            devem ser verificados todos os itens abaixo nos
                            relatórios de calibração conforme requisitos
                            regulatórios.
                          </p>

                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-blue-300 bg-white">
                              <thead>
                                <tr className="bg-blue-100">
                                  <th className="border border-blue-300 p-3 text-left font-semibold">
                                    Item
                                  </th>
                                  <th className="border border-blue-300 p-3 text-left font-semibold">
                                    Descrição do Requisito
                                  </th>
                                  <th className="border border-blue-300 p-3 text-left font-semibold">
                                    Presente
                                  </th>
                                  <th className="border border-blue-300 p-3 text-left font-semibold">
                                    Valor/Informação Encontrada
                                  </th>
                                  <th className="border border-blue-300 p-3 text-left font-semibold">
                                    Observações/Conformidade
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    a)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Nome do agente regulado
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch(
                                          "flowMeterRegulatedAgentPresent"
                                        ) || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterRegulatedAgentPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterRegulatedAgentValue"
                                      )}
                                      placeholder="Nome identificado no relatório"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterRegulatedAgentObs"
                                      )}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    b)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Identificação da instalação
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch(
                                          "flowMeterInstallationPresent"
                                        ) || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterInstallationPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterInstallationValue"
                                      )}
                                      placeholder="Identificação da instalação"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterInstallationObs"
                                      )}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    c)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Identificação do ponto de medição
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch(
                                          "flowMeterMeasurementPointPresent"
                                        ) || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterMeasurementPointPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterMeasurementPointValue"
                                      )}
                                      placeholder="Identificação do ponto"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterMeasurementPointObs"
                                      )}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    d)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Identificação do medidor
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch("flowMeterIdPresent") || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterIdPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterIdValue")}
                                      placeholder="Série, modelo, fabricante"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterIdObs")}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    e)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Identificação do padrão utilizado
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch("flowMeterStandardPresent") ||
                                        false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterStandardPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterStandardValue")}
                                      placeholder="Padrão de referência utilizado"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterStandardObs")}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    f)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Data e hora de alinhamento do medidor para
                                    calibração
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch("flowMeterAlignmentPresent") ||
                                        false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterAlignmentPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterAlignmentValue"
                                      )}
                                      placeholder="Data/hora do alinhamento"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterAlignmentObs")}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    g)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Data e hora de início das corridas
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch("flowMeterStartPresent") ||
                                        false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterStartPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterStartValue")}
                                      placeholder="Data/hora de início"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterStartObs")}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    h)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Data e hora de finalização das corridas
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch("flowMeterEndPresent") || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterEndPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterEndValue")}
                                      placeholder="Data/hora de finalização"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterEndObs")}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    i)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Data de elaboração do relatório
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch(
                                          "flowMeterReportDatePresent"
                                        ) || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterReportDatePresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterReportDateValue"
                                      )}
                                      placeholder="Data de elaboração"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterReportDateObs")}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    j)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Valores medidos por corrida (vazão, pulsos,
                                    volumes, pressões, temperaturas, níveis)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch(
                                          "flowMeterMeasuredValuesPresent"
                                        ) || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterMeasuredValuesPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Textarea
                                      {...form.register(
                                        "flowMeterMeasuredValuesValue"
                                      )}
                                      placeholder="Descrição dos valores medidos"
                                      className="min-h-[60px]"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Textarea
                                      {...form.register(
                                        "flowMeterMeasuredValuesObs"
                                      )}
                                      placeholder="Conformidade e observações"
                                      className="min-h-[60px]"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    k)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Fatores utilizados na calibração por vazão
                                    (k-factor)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch("flowMeterKFactorPresent") ||
                                        false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterKFactorPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterKFactorValue")}
                                      placeholder="K-factors utilizados"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterKFactorObs")}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    l)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Fatores de calibração encontrados após
                                    calibração por corrida e por vazão
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch(
                                          "flowMeterCalibrationFactorsPresent"
                                        ) || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterCalibrationFactorsPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Textarea
                                      {...form.register(
                                        "flowMeterCalibrationFactorsValue"
                                      )}
                                      placeholder="Fatores encontrados"
                                      className="min-h-[60px]"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Textarea
                                      {...form.register(
                                        "flowMeterCalibrationFactorsObs"
                                      )}
                                      placeholder="Conformidade e observações"
                                      className="min-h-[60px]"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    m)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Repetibilidade do medidor por vazão
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch(
                                          "flowMeterRepeatabilityPresent"
                                        ) || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterRepeatabilityPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterRepeatabilityValue"
                                      )}
                                      placeholder="Valores de repetibilidade"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterRepeatabilityObs"
                                      )}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    n)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Incerteza da calibração
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch(
                                          "flowMeterUncertaintyPresent"
                                        ) || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterUncertaintyPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterUncertaintyValue"
                                      )}
                                      placeholder="Incerteza declarada"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterUncertaintyObs"
                                      )}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    o)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Máximo desvio entre fatores de calibração
                                    (deriva do medidor)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch("flowMeterDriftPresent") ||
                                        false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterDriftPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterDriftValue")}
                                      placeholder="Deriva calculada"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterDriftObs")}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="border border-blue-300 p-3 font-medium bg-blue-50">
                                    p)
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    Assinaturas dos responsáveis pela elaboração e
                                    aprovação do relatório
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Checkbox
                                      checked={
                                        form.watch(
                                          "flowMeterSignaturesPresent"
                                        ) || false
                                      }
                                      onCheckedChange={(checked) =>
                                        form.setValue(
                                          "flowMeterSignaturesPresent",
                                          checked as boolean
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register(
                                        "flowMeterSignaturesValue"
                                      )}
                                      placeholder="Assinaturas identificadas"
                                    />
                                  </td>
                                  <td className="border border-blue-300 p-3">
                                    <Input
                                      {...form.register("flowMeterSignaturesObs")}
                                      placeholder="Conformidade e observações"
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <h4 className="font-semibold text-yellow-800 mb-2">
                              Avaliação Geral para Medidores de Vazão
                            </h4>
                            <Textarea
                              {...form.register("flowMeterGeneralEvaluation")}
                              placeholder="Resumo da conformidade geral do relatório de calibração do medidor de vazão. Indicar se atende aos requisitos regulatórios e observações importantes..."
                              className="mt-2 bg-white"
                              rows={4}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 14: Non-Conformities and Proposed Actions */}
                <TabsContent value="section14">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="text-blue-600 mr-3" size={24} />
                        14. NÃO CONFORMIDADES E AÇÕES PROPOSTAS
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Esta seção é crucial para um plano de ação. Ser claro e
                        objetivo.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Item
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Descrição da Não Conformidade / Desvio
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Criticidade
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Ação Proposta / Responsável / Prazo Sugerido
                              </th>
                              <th className="border border-gray-300 p-2 text-left text-xs">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {nonConformities.map((nc, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    type="number"
                                    value={nc.item}
                                    onChange={(e) =>
                                      updateNonConformity(
                                        index,
                                        "item",
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="text-xs w-16"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Input
                                    value={nc.description}
                                    onChange={(e) =>
                                      updateNonConformity(
                                        index,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Select
                                    value={nc.criticality}
                                    onValueChange={(value) =>
                                      updateNonConformity(
                                        index,
                                        "criticality",
                                        value as CriticalityLevel
                                      )
                                    }
                                  >
                                    <SelectTrigger className="text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Alta">Alta</SelectItem>
                                      <SelectItem value="Media">Média</SelectItem>
                                      <SelectItem value="Baixa">Baixa</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Textarea
                                    value={nc.action}
                                    onChange={(e) =>
                                      updateNonConformity(
                                        index,
                                        "action",
                                        e.target.value
                                      )
                                    }
                                    className="text-xs min-h-[40px]"
                                  />
                                </td>
                                <td className="border border-gray-300 p-2">
                                  <Button
                                    type="button"
                                    onClick={() => removeNonConformity(index)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Button
                        type="button"
                        onClick={addNonConformity}
                        variant="outline"
                        className="mb-4"
                      >
                        <Plus className="mr-2" size={16} />
                        Adicionar Não Conformidade
                      </Button>

                      <div>
                        <Label htmlFor="additionalRecommendations">
                          Recomendações Adicionais
                        </Label>
                        <Textarea
                          id="additionalRecommendations"
                          placeholder="1. Recomendação 1&#10;2. Recomendação 2"
                          {...form.register("additionalRecommendations")}
                          className="mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 15: Final Conclusion */}
                <TabsContent value="section15">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="text-blue-600 mr-3" size={24} />
                        15. APTIDÃO PARA USO E CONCLUSÃO FINAL
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Esta seção consolida a avaliação e a decisão.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-3 text-left">
                                Critério
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Avaliação
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Observações / Justificativa Concisa
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Erro dentro dos limites
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch("errorLimits") === "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "errorLimits",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch("errorLimits") === "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "errorLimits",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("errorLimitsObs")} />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Incerteza Adequada
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch("adequateUncertainty") ===
                                        "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "adequateUncertainty",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch("adequateUncertainty") ===
                                        "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "adequateUncertainty",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  {...form.register("adequateUncertaintyObs")}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Requisitos RTM Atendidos
                              </td>
                              <td className="border border-gray-300 p-3">
                                <div className="flex space-x-4">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Sim"
                                      checked={
                                        form.watch("rtmRequirements") === "Sim"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "rtmRequirements",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Sim
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      value="Nao"
                                      checked={
                                        form.watch("rtmRequirements") === "Nao"
                                      }
                                      onChange={(e) =>
                                        form.setValue(
                                          "rtmRequirements",
                                          e.target.value as BinaryStatus
                                        )
                                      }
                                      className="mr-2"
                                    />
                                    Não
                                  </label>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("rtmRequirementsObs")} />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="mb-4">
                        <Label className="text-lg font-semibold">
                          Status Final:
                        </Label>
                        <div className="flex space-x-6 mt-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="APROVADO"
                              checked={form.watch("finalStatus") === "APROVADO"}
                              onChange={(e) =>
                                form.setValue(
                                  "finalStatus",
                                  e.target.value as FinalStatus
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-green-700 font-medium">
                              APROVADO
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="APROVADO COM RESSALVAS"
                              checked={
                                form.watch("finalStatus") ===
                                "APROVADO COM RESSALVAS"
                              }
                              onChange={(e) =>
                                form.setValue(
                                  "finalStatus",
                                  e.target.value as FinalStatus
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-yellow-700 font-medium">
                              APROVADO COM RESSALVAS
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="REJEITADO"
                              checked={form.watch("finalStatus") === "REJEITADO"}
                              onChange={(e) =>
                                form.setValue(
                                  "finalStatus",
                                  e.target.value as FinalStatus
                                )
                              }
                              className="mr-2"
                            />
                            <span className="text-red-700 font-medium">
                              REJEITADO
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="conclusionJustification">
                          Justificativa da Conclusão
                        </Label>
                        <Textarea
                          id="conclusionJustification"
                          {...form.register("conclusionJustification")}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 16: Signatures */}
                <TabsContent value="section16">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <PenTool className="text-blue-600 mr-3" size={24} />
                        16. ASSINATURAS
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="border border-gray-300 p-3 text-left">
                                Função
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Nome
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Data
                              </th>
                              <th className="border border-gray-300 p-3 text-left">
                                Assinatura
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Analista
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("analystName")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  type="date"
                                  {...form.register("analystDate")}
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  disabled
                                  placeholder="Assinatura Digital (se houver)"
                                  className="bg-gray-100"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 p-3 font-medium">
                                Aprovador
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input {...form.register("approverName")} />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  type="date"
                                  {...form.register("approverDate")}
                                />
                              </td>
                              <td className="border border-gray-300 p-3">
                                <Input
                                  disabled
                                  placeholder="Assinatura Digital (se houver)"
                                  className="bg-gray-100"
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Section 17: Annexes and references */}
                <TabsContent value="section17">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FolderOpen className="text-blue-600 mr-3" size={24} />
                        17. ANEXOS E REFERÊNCIAS
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Incluir documentos adicionais que suportam a conclusão
                        final.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="annexOriginalCertificate"
                            checked={
                              form.watch("annexOriginalCertificate") || false
                            }
                            onCheckedChange={(checked) =>
                              form.setValue(
                                "annexOriginalCertificate",
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor="annexOriginalCertificate"
                            className="text-sm font-medium"
                          >
                            Cópia do Certificado de Calibração Original (PDF)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="annexStandardsCertificates"
                            checked={
                              form.watch("annexStandardsCertificates") || false
                            }
                            onCheckedChange={(checked) =>
                              form.setValue(
                                "annexStandardsCertificates",
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor="annexStandardsCertificates"
                            className="text-sm font-medium"
                          >
                            Cópia(s) do(s) Certificado(s) dos Padrões (se não
                            rastreáveis diretamente no certificado principal)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="annexCalibrationHistory"
                            checked={
                              form.watch("annexCalibrationHistory") || false
                            }
                            onCheckedChange={(checked) =>
                              form.setValue(
                                "annexCalibrationHistory",
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor="annexCalibrationHistory"
                            className="text-sm font-medium"
                          >
                            Histórico de Calibrações Anteriores do Instrumento
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="annexInternalRequirements"
                            checked={
                              form.watch("annexInternalRequirements") || false
                            }
                            onCheckedChange={(checked) =>
                              form.setValue(
                                "annexInternalRequirements",
                                checked as boolean
                              )
                            }
                          />
                          <Label
                            htmlFor="annexInternalRequirements"
                            className="text-sm font-medium"
                          >
                            [Documento de Requisitos Internos/Norma Aplicável para
                            Tolerância/Uso]
                          </Label>
                        </div>

                        <div className="mt-4">
                          <Label
                            htmlFor="annexOthers"
                            className="text-sm font-medium"
                          >
                            Outros:
                          </Label>
                          <Textarea
                            id="annexOthers"
                            placeholder="Especificar outros documentos relevantes"
                            {...form.register("annexOthers")}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Auto-save indicator */}
              <AutoSaveIndicator lastSaved={lastSaved} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
