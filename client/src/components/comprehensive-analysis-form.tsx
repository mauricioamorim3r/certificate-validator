import { useState, useEffect } from "react";
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
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StatusSelector from "@/components/status-selector";

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
  approvedBy: z.string().min(1, "Aprovador é obrigatório"),
  
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
  calibrationValidity: z.string().optional(),
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
  tempUse: z.string().optional(),
  tempUseLimit: z.string().optional(),
  tempUseOk: z.boolean().optional(),
  tempUseObs: z.string().optional(),
  humidityUse: z.string().optional(),
  humidityUseLimit: z.string().optional(),
  humidityUseOk: z.boolean().optional(),
  humidityUseObs: z.string().optional(),
  pressureUse: z.string().optional(),
  pressureUseLimit: z.string().optional(),
  pressureUseOk: z.boolean().optional(),
  pressureUseObs: z.string().optional(),
  fluidUse: z.string().optional(),
  fluidUseLimit: z.string().optional(),
  fluidUseOk: z.boolean().optional(),
  fluidUseObs: z.string().optional(),
  
  // Section 12: Calibration periodicity
  lastCalibrationDate: z.string().optional(),
  lastCalibrationObs: z.string().optional(),
  intervalRealized: z.string().optional(),
  intervalRealizedObs: z.string().optional(),
  periodicityDefined: z.string().optional(),
  periodicityAtends: z.enum(["Sim", "Nao"]).optional(),
  periodicityObs: z.string().optional(),
  
  // Section 14: Additional recommendations
  additionalRecommendations: z.string().optional(),
  
  // Section 15: Final conclusion
  errorLimits: z.enum(["Sim", "Nao"]).optional(),
  errorLimitsObs: z.string().optional(),
  adequateUncertainty: z.enum(["Sim", "Nao"]).optional(),
  adequateUncertaintyObs: z.string().optional(),
  rtmRequirements: z.enum(["Sim", "Nao"]).optional(),
  rtmRequirementsObs: z.string().optional(),
  finalStatus: z.enum(["APROVADO", "APROVADO COM RESSALVAS", "REJEITADO"]).optional(),
  conclusionJustification: z.string().optional(),
  
  // Section 16: Signatures
  analystName: z.string().optional(),
  analystDate: z.string().optional(),
  approverName: z.string().optional(),
  approverDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// Tipos para arrays
interface Standard {
  name: string;
  certificate: string;
  laboratory: string;
  accreditation: string;
  uncertainty: string;
  validity: string;
  status: string;
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
}

interface NonConformity {
  item: number;
  description: string;
  criticality: string;
  action: string;
}

interface Criteria {
  name: string;
  status: string;
  observations: string;
}

export default function ComprehensiveAnalysisForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentRecordId, setCurrentRecordId] = useState<number | null>(null);
  const [isoRequirements, setIsoRequirements] = useState<boolean[]>(new Array(10).fill(false));
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("Carregando...");

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
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('analysis-form-backup', JSON.stringify(saveData));
      setAutoSaveStatus(`Salvo automaticamente às ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.warn('Erro ao salvar backup:', error);
      setAutoSaveStatus('Erro ao salvar automaticamente');
    }
  };

  // Carregar dados do localStorage
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('analysis-form-backup');
      if (saved) {
        const data = JSON.parse(saved);
        
        if (data.isoRequirements) setIsoRequirements(data.isoRequirements);
        if (data.standards) setStandards(data.standards);
        if (data.calibrationResults) setCalibrationResults(data.calibrationResults);
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
      console.warn('Erro ao carregar backup:', error);
    }
    return false;
  };
  
  // Estados para arrays com valores padrão seguros
  const [standards, setStandards] = useState<Standard[]>([{
    name: '', 
    certificate: '', 
    laboratory: '', 
    accreditation: '', 
    uncertainty: '', 
    validity: '', 
    status: 'OK', 
    observations: ''
  }]);
  
  const [calibrationResults, setCalibrationResults] = useState<CalibrationResult[]>([{
    point: '', 
    referenceValue: '', 
    measuredValue: '', 
    error: '', 
    uncertainty: '', 
    errorLimit: '', 
    ok: false
  }]);
  
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([{
    item: 1, 
    description: '', 
    criticality: 'Media', 
    action: ''
  }]);
  
  const [pressureCriteria, setPressureCriteria] = useState<Criteria[]>([{
    name: '', 
    status: 'Sim', 
    observations: ''
  }]);
  
  const [flowCriteria, setFlowCriteria] = useState<Criteria[]>([{
    name: '', 
    status: 'Sim', 
    observations: ''
  }]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentCode: "RAC-001",
      version: "2.1",
      analysisDate: new Date().toISOString().split('T')[0],
      analyzedBy: "",
      approvedBy: "",
      certificateNumber: "",
      issuingLaboratory: "",
      issueDate: "",
      calibrationDate: "",
      calibrationValidity: "",
      technicalResponsible: "",
      equipmentType: "",
      manufacturerModel: "",
      serialNumber: "",
      tagIdInternal: "",
      application: "",
      location: "",
      // Valores padrão para campos booleanos
      tempOk: false,
      humidityOk: false,
      pressureOk: false,
      fluidOk: false,
      calibrationLocationOk: false,
      methodUsedOk: false,
      uncertaintyDeclaredOk: false,
      calculationMethodOk: false,
      contributionsOk: false,
      confidenceLevelOk: false,
      compatibilityOk: false,
      tempUseOk: false,
      humidityUseOk: false,
      pressureUseOk: false,
      fluidUseOk: false,
    },
  });

  // Carregar dados salvos na inicialização
  useEffect(() => {
    const hasBackup = loadFromLocalStorage();
    if (hasBackup) {
      console.log('Backup carregado automaticamente');
    }
  }, []);

  // Salvamento automático a cada mudança no formulário
  useEffect(() => {
    const subscription = form.watch(() => {
      saveToLocalStorage(form.getValues());
    });
    return () => subscription.unsubscribe();
  }, [form, isoRequirements, standards, calibrationResults, nonConformities, pressureCriteria, flowCriteria]);

  // Salvar antes de fechar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveToLocalStorage(form.getValues());
      e.preventDefault();
      return "Tem certeza que deseja sair? Os dados foram salvos automaticamente.";
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form, isoRequirements, standards, calibrationResults, nonConformities, pressureCriteria, flowCriteria]);

  // Intervalo de salvamento a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      saveToLocalStorage(form.getValues());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [form, isoRequirements, standards, calibrationResults, nonConformities, pressureCriteria, flowCriteria]);

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
        response = await apiRequest("PUT", `/api/analysis-records/${currentRecordId}`, recordData);
      } else {
        response = await apiRequest("POST", "/api/analysis-records", recordData);
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
      queryClient.invalidateQueries({ queryKey: ["comprehensive-analysis-records"] });
      toast({
        title: "Sucesso",
        description: currentRecordId ? "Registro atualizado com sucesso!" : "Registro salvo com sucesso!",
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

  // Funções helper para manipular arrays com validação
  const addStandard = () => {
    setStandards(prev => [...prev, {
      name: '', 
      certificate: '', 
      laboratory: '', 
      accreditation: '', 
      uncertainty: '', 
      validity: '', 
      status: 'OK', 
      observations: ''
    }]);
  };

  const removeStandard = (index: number) => {
    if (standards.length > 1) {
      setStandards(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateStandard = (index: number, field: keyof Standard, value: string | 'OK' | 'NOK') => {
    setStandards(prev => {
      const newStandards = [...prev];
      if (newStandards[index]) {
        (newStandards[index] as any)[field] = value;
      }
      return newStandards;
    });
  };

  const addCalibrationResult = () => {
    setCalibrationResults(prev => [...prev, {
      point: '', 
      referenceValue: '', 
      measuredValue: '', 
      error: '', 
      uncertainty: '', 
      errorLimit: '', 
      ok: false
    }]);
  };

  const removeCalibrationResult = (index: number) => {
    if (calibrationResults.length > 1) {
      setCalibrationResults(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateCalibrationResult = (index: number, field: keyof CalibrationResult, value: string | boolean) => {
    setCalibrationResults(prev => {
      const newResults = [...prev];
      if (newResults[index]) {
        (newResults[index] as any)[field] = value;
      }
      return newResults;
    });
  };

  const addNonConformity = () => {
    setNonConformities(prev => [...prev, {
      item: prev.length + 1, 
      description: '', 
      criticality: 'Media', 
      action: ''
    }]);
  };

  const removeNonConformity = (index: number) => {
    if (nonConformities.length > 1) {
      setNonConformities(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateNonConformity = (index: number, field: keyof NonConformity, value: string | number | CriticalityLevel) => {
    setNonConformities(prev => {
      const newNCs = [...prev];
      if (newNCs[index]) {
        (newNCs[index] as any)[field] = value;
      }
      return newNCs;
    });
  };

  const loadLatestRecord = () => {
    if (allRecords && Array.isArray(allRecords) && allRecords.length > 0) {
      const latestRecord = allRecords[0];
      setCurrentRecordId(latestRecord.id);
      
      // Set complex state with fallbacks
      setIsoRequirements(latestRecord.isoRequirements || new Array(10).fill(false));
      setStandards(latestRecord.standards || [{
        name: '', certificate: '', laboratory: '', accreditation: '', uncertainty: '', validity: '', status: 'OK', observations: ''
      }]);
      setCalibrationResults(latestRecord.calibrationResults || [{
        point: '', referenceValue: '', measuredValue: '', error: '', uncertainty: '', errorLimit: '', ok: false
      }]);
      setNonConformities(latestRecord.nonConformities || [{
        item: 1, description: '', criticality: 'Media', action: ''
      }]);
      setPressureCriteria(latestRecord.pressureCriteria || [{
        name: '', status: 'Sim', observations: ''
      }]);
      setFlowCriteria(latestRecord.flowCriteria || [{
        name: '', status: 'Sim', observations: ''
      }]);
      
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
    const confirmed = window.confirm("Tem certeza que deseja limpar todos os dados do formulário?");
    if (confirmed) {
      form.reset();
      setCurrentRecordId(null);
      setIsoRequirements(new Array(10).fill(false));
      setStandards([{
        name: '', certificate: '', laboratory: '', accreditation: '', uncertainty: '', validity: '', status: 'OK', observations: ''
      }]);
      setCalibrationResults([{
        point: '', referenceValue: '', measuredValue: '', error: '', uncertainty: '', errorLimit: '', ok: false
      }]);
      setNonConformities([{
        item: 1, description: '', criticality: 'Media', action: ''
      }]);
      setPressureCriteria([{
        name: '', status: 'Sim', observations: ''
      }]);
      setFlowCriteria([{
        name: '', status: 'Sim', observations: ''
      }]);
      toast({
        title: "Sucesso",
        description: "Formulário limpo com sucesso!",
      });
    }
  };

  // Handle loading error
  if (recordsError) {
    console.error("Erro ao carregar registros:", recordsError);
  }

  return (
    <div className="app-container max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Document Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <ClipboardCheck className="text-blue-600 mr-3" size={28} />
          REGISTRO DE ANÁLISE CRÍTICA – CERTIFICADOS DE CALIBRAÇÃO / RELATÓRIOS DE INSPEÇÃO
        </h1>
        
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
              <Label htmlFor="analysisDate" className="text-gray-700 font-medium">Data da Análise:</Label>
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
              <Label htmlFor="analyzedBy" className="text-gray-700 font-medium">Analisado por:</Label>
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
              <Label htmlFor="approvedBy" className="text-gray-700 font-medium">Aprovado por:</Label>
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
          <div className="purpose-box p-4 rounded-r-lg mb-6">
            <p className="text-blue-800 text-sm italic">
              <strong>Propósito:</strong> Este registro tem como objetivo padronizar a avaliação crítica 
              de certificados de calibração e relatórios de inspeção, assegurando a conformidade com a 
              Portaria INMETRO 291/2021, a norma ISO/IEC 17025, o Guia para a Expressão da Incerteza 
              de Medição (GUM) e outros padrões metrológicos pertinentes. O foco é validar a adequação 
              metrológica e a aptidão para uso do instrumento em sua aplicação específica.
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
              {saveRecordMutation.isPending ? "Salvando..." : "Salvar Registro"}
            </Button>
            <Button 
              type="button" 
              onClick={loadLatestRecord}
              variant="outline"
              disabled={!allRecords || allRecords.length === 0}
            >
              <FolderOpen className="mr-2" size={16} />
              Carregar Último
            </Button>
            <Button 
              type="button" 
              onClick={clearForm}
              variant="outline"
            >
              <Trash2 className="mr-2" size={16} />
              Limpar Formulário
            </Button>
          </div>

          {/* Tabs for each section */}
          <Tabs defaultValue="section1" className="w-full">
            <TabsList className="grid w-full grid-cols-8 lg:grid-cols-16 mb-6">
              <TabsTrigger value="section1">1. Cert.</TabsTrigger>
              <TabsTrigger value="section2">2. Acred.</TabsTrigger>
              <TabsTrigger value="section3">3. Instr.</TabsTrigger>
              <TabsTrigger value="section4">4. Amb.</TabsTrigger>
              <TabsTrigger value="section5">5. ISO</TabsTrigger>
              <TabsTrigger value="section6">6. Rastr.</TabsTrigger>
              <TabsTrigger value="section7">7. Incert.</TabsTrigger>
              <TabsTrigger value="section8">8. Result.</TabsTrigger>
              <TabsTrigger value="section9">9. Ajust.</TabsTrigger>
              <TabsTrigger value="section10">10. Conf.</TabsTrigger>
              <TabsTrigger value="section11">11. Uso</TabsTrigger>
              <TabsTrigger value="section12">12. Period.</TabsTrigger>
              <TabsTrigger value="section13">13. Espec.</TabsTrigger>
              <TabsTrigger value="section14">14. N.C.</TabsTrigger>
              <TabsTrigger value="section15">15. Final</TabsTrigger>
              <TabsTrigger value="section16">16. Assin.</TabsTrigger>
            </TabsList>

            {/* Section 1: Certificate and Laboratory Identification */}
            <TabsContent value="section1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="text-blue-600 mr-3" size={24} />
                    1. IDENTIFICAÇÃO DO CERTIFICADO E LABORATÓRIO
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 p-3 text-left">Campo</th>
                          <th className="border border-gray-300 p-3 text-left">Valor</th>
                          <th className="border border-gray-300 p-3 text-left">Verificação / Status</th>
                          <th className="border border-gray-300 p-3 text-left">Observações / Evidências</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Número do Certificado</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("certificateNumber")} />
                            {form.formState.errors.certificateNumber && (
                              <p className="text-red-500 text-xs mt-1">
                                {form.formState.errors.certificateNumber.message}
                              </p>
                            )}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="certificateNumberStatus"
                              value={form.watch("certificateNumberStatus")}
                              onChange={(value) => form.setValue("certificateNumberStatus", value as ConformityStatus)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("certificateNumberObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Laboratório Emissor</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("issuingLaboratory")} />
                            {form.formState.errors.issuingLaboratory && (
                              <p className="text-red-500 text-xs mt-1">
                                {form.formState.errors.issuingLaboratory.message}
                              </p>
                            )}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="issuingLaboratoryStatus"
                              value={form.watch("issuingLaboratoryStatus")}
                              onChange={(value) => form.setValue("issuingLaboratoryStatus", value as ConformityStatus)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("issuingLaboratoryObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Data de Emissão</td>
                          <td className="border border-gray-300 p-3">
                            <Input type="date" {...form.register("issueDate")} />
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
                              onChange={(value) => form.setValue("issueDateStatus", value as ConformityStatus)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("issueDateObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Data da Calibração</td>
                          <td className="border border-gray-300 p-3">
                            <Input type="date" {...form.register("calibrationDate")} />
                            {form.formState.errors.calibrationDate && (
                              <p className="text-red-500 text-xs mt-1">
                                {form.formState.errors.calibrationDate.message}
                              </p>
                            )}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="calibrationDateStatus"
                              value={form.watch("calibrationDateStatus")}
                              onChange={(value) => form.setValue("calibrationDateStatus", value as ConformityStatus)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("calibrationDateObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Validade da Calibração</td>
                          <td className="border border-gray-300 p-3">
                            <Input type="date" {...form.register("calibrationValidity")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="validityStatus"
                              value={form.watch("validityStatus")}
                              onChange={(value) => form.setValue("validityStatus", value as ConformityStatus)}
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
                          <td className="border border-gray-300 p-3 font-medium">Responsável Técnico</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("technicalResponsible")} />
                            {form.formState.errors.technicalResponsible && (
                              <p className="text-red-500 text-xs mt-1">
                                {form.formState.errors.technicalResponsible.message}
                              </p>
                            )}
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="responsibleStatus"
                              value={form.watch("responsibleStatus")}
                              onChange={(value) => form.setValue("responsibleStatus", value as ConformityStatus)}
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

            {/* Section 2: Accreditation and Scope */}
            <TabsContent value="section2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="text-blue-600 mr-3" size={24} />
                    2. ACREDITAÇÃO E ESCOPO DO LABORATÓRIO
                  </CardTitle>
                  <div className="critical-box p-4 rounded bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="text-yellow-800 font-medium">
                      Esta seção é o primeiro filtro crítico. Não conformidades aqui podem inviabilizar o certificado.
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 p-3 text-left">Critério</th>
                          <th className="border border-gray-300 p-3 text-left">Status</th>
                          <th className="border border-gray-300 p-3 text-left">Observações / Justificativa</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Laboratório Acreditado (Cgcre/Inmetro)</td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Sim"
                                  checked={form.watch("accreditedLabStatus") === "Sim"}
                                  onChange={(e) => form.setValue("accreditedLabStatus", e.target.value as BinaryStatus)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("accreditedLabStatus") === "Nao"}
                                  onChange={(e) => form.setValue("accreditedLabStatus", e.target.value as BinaryStatus)}
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
                          <td className="border border-gray-300 p-3 font-medium">Escopo de Acreditação Adequado</td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Sim"
                                  checked={form.watch("adequateScopeStatus") === "Sim"}
                                  onChange={(e) => form.setValue("adequateScopeStatus", e.target.value as BinaryStatus)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("adequateScopeStatus") === "Nao"}
                                  onChange={(e) => form.setValue("adequateScopeStatus", e.target.value as BinaryStatus)}
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
                          <td className="border border-gray-300 p-3 font-medium">Símbolo de Acreditação Presente</td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Sim"
                                  checked={form.watch("accreditationSymbolStatus") === "Sim"}
                                  onChange={(e) => form.setValue("accreditationSymbolStatus", e.target.value as BinaryStatus)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("accreditationSymbolStatus") === "Nao"}
                                  onChange={(e) => form.setValue("accreditationSymbolStatus", e.target.value as BinaryStatus)}
                                  className="mr-2"
                                />
                                Não
                              </label>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input 
                              placeholder="Verificar presença do selo do Inmetro/Cgcre no certificado."
                              {...form.register("accreditationSymbolObservations")} 
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
                      <Label htmlFor="equipmentType">Tipo de Equipamento</Label>
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
                      <Label htmlFor="manufacturerModel">Fabricante / Modelo</Label>
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

            {/* Section 5: ISO/IEC 17025 Essential Elements */}
            <TabsContent value="section5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckSquare className="text-blue-600 mr-3" size={24} />
                    5. ELEMENTOS ESSENCIAIS ISO/IEC 17025 (Checklist)
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Confirmação da aderência formal aos requisitos da norma. Marque ✓ quando o requisito estiver atendido.
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
                      "Assinatura e identificação do responsável autorizado pela emissão"
                    ].map((requirement, index) => (
                      <div key={index} className="flex items-center space-x-3">
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
                    Detalhar os padrões utilizados no laboratório, seus certificados de calibração, 
                    incertezas e validades, provando a cadeia metrológica.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 mb-4">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 p-2 text-left text-xs">Padrão Utilizado</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Certificado</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Lab. Calibrador</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Nº Acreditação</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Incerteza (k=2)</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Validade</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Status</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Observações</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standards.map((standard, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.name}
                                onChange={(e) => updateStandard(index, 'name', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.certificate}
                                onChange={(e) => updateStandard(index, 'certificate', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.laboratory}
                                onChange={(e) => updateStandard(index, 'laboratory', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.accreditation}
                                onChange={(e) => updateStandard(index, 'accreditation', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.uncertainty}
                                onChange={(e) => updateStandard(index, 'uncertainty', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                type="date"
                                value={standard.validity}
                                onChange={(e) => updateStandard(index, 'validity', e.target.value)}
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
                                    onChange={(e) => updateStandard(index, 'status', e.target.value as 'OK' | 'NOK')}
                                    className="mr-1"
                                  />
                                  OK
                                </label>
                                <label className="flex items-center text-xs">
                                  <input
                                    type="radio"
                                    value="NOK"
                                    checked={standard.status === "NOK"}
                                    onChange={(e) => updateStandard(index, 'status', e.target.value as 'OK' | 'NOK')}
                                    className="mr-1"
                                  />
                                  NOK
                                </label>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.observations}
                                onChange={(e) => updateStandard(index, 'observations', e.target.value)}
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
                  <Button type="button" onClick={addStandard} variant="outline">
                    <Plus className="mr-2" size={16} />
                    Adicionar Padrão
                  </Button>
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
                          <th className="border border-gray-300 p-2 text-left text-xs">Ponto</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Valor Ref.</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Valor Medido</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Erro</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Incerteza</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Limite de Erro</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">OK?</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calibrationResults.map((result, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.point}
                                onChange={(e) => updateCalibrationResult(index, 'point', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.referenceValue}
                                onChange={(e) => updateCalibrationResult(index, 'referenceValue', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.measuredValue}
                                onChange={(e) => updateCalibrationResult(index, 'measuredValue', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.error}
                                onChange={(e) => updateCalibrationResult(index, 'error', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.uncertainty}
                                onChange={(e) => updateCalibrationResult(index, 'uncertainty', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.errorLimit}
                                onChange={(e) => updateCalibrationResult(index, 'errorLimit', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Checkbox
                                checked={result.ok}
                                onCheckedChange={(checked) => updateCalibrationResult(index, 'ok', checked as boolean)}
                              />
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
                  <Button type="button" onClick={addCalibrationResult} variant="outline" className="mb-4">
                    <Plus className="mr-2" size={16} />
                    Adicionar Ponto
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="calibrationRange">Faixa de Calibração Reportada</Label>
                      <Input 
                        id="calibrationRange"
                        placeholder="[Valor] a [Valor] [Unidade]"
                        {...form.register("calibrationRange")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="operationalRange">Faixa Operacional do Instrumento</Label>
                      <Input 
                        id="operationalRange"
                        placeholder="[Valor] a [Valor] [Unidade] ou [Não especificada]"
                        {...form.register("operationalRange")}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="resultsComments">Comentários sobre os Resultados</Label>
                    <Textarea 
                      id="resultsComments"
                      {...form.register("resultsComments")}
                    />
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
                    Esta seção é crucial para um plano de ação. Ser claro e objetivo.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 p-2 text-left text-xs">Item</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Descrição da Não Conformidade / Desvio</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Criticidade</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Ação Proposta / Responsável / Prazo Sugerido</th>
                          <th className="border border-gray-300 p-2 text-left text-xs">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nonConformities.map((nc, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 p-2">
                              <Input
                                type="number"
                                value={nc.item}
                                onChange={(e) => updateNonConformity(index, 'item', parseInt(e.target.value) || 1)}
                                className="text-xs w-16"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={nc.description}
                                onChange={(e) => updateNonConformity(index, 'description', e.target.value)}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Select
                                value={nc.criticality}
                                onValueChange={(value) => updateNonConformity(index, 'criticality', value as CriticalityLevel)}
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
                                onChange={(e) => updateNonConformity(index, 'action', e.target.value)}
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
                  <Button type="button" onClick={addNonConformity} variant="outline" className="mb-4">
                    <Plus className="mr-2" size={16} />
                    Adicionar Não Conformidade
                  </Button>

                  <div>
                    <Label htmlFor="additionalRecommendations">Recomendações Adicionais</Label>
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
                  <p className="text-sm text-gray-600">Esta seção consolida a avaliação e a decisão.</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 p-3 text-left">Critério</th>
                          <th className="border border-gray-300 p-3 text-left">Avaliação</th>
                          <th className="border border-gray-300 p-3 text-left">Observações / Justificativa Concisa</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Erro dentro dos limites</td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Sim"
                                  checked={form.watch("errorLimits") === "Sim"}
                                  onChange={(e) => form.setValue("errorLimits", e.target.value as BinaryStatus)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("errorLimits") === "Nao"}
                                  onChange={(e) => form.setValue("errorLimits", e.target.value as BinaryStatus)}
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
                          <td className="border border-gray-300 p-3 font-medium">Incerteza Adequada</td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Sim"
                                  checked={form.watch("adequateUncertainty") === "Sim"}
                                  onChange={(e) => form.setValue("adequateUncertainty", e.target.value as BinaryStatus)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("adequateUncertainty") === "Nao"}
                                  onChange={(e) => form.setValue("adequateUncertainty", e.target.value as BinaryStatus)}
                                  className="mr-2"
                                />
                                Não
                              </label>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("adequateUncertaintyObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Requisitos RTM Atendidos</td>
                          <td className="border border-gray-300 p-3">
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Sim"
                                  checked={form.watch("rtmRequirements") === "Sim"}
                                  onChange={(e) => form.setValue("rtmRequirements", e.target.value as BinaryStatus)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("rtmRequirements") === "Nao"}
                                  onChange={(e) => form.setValue("rtmRequirements", e.target.value as BinaryStatus)}
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
                    <Label className="text-lg font-semibold">Status Final:</Label>
                    <div className="flex space-x-6 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="APROVADO"
                          checked={form.watch("finalStatus") === "APROVADO"}
                          onChange={(e) => form.setValue("finalStatus", e.target.value as FinalStatus)}
                          className="mr-2"
                        />
                        <span className="text-green-700 font-medium">APROVADO</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="APROVADO COM RESSALVAS"
                          checked={form.watch("finalStatus") === "APROVADO COM RESSALVAS"}
                          onChange={(e) => form.setValue("finalStatus", e.target.value as FinalStatus)}
                          className="mr-2"
                        />
                        <span className="text-yellow-700 font-medium">APROVADO COM RESSALVAS</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="REJEITADO"
                          checked={form.watch("finalStatus") === "REJEITADO"}
                          onChange={(e) => form.setValue("finalStatus", e.target.value as FinalStatus)}
                          className="mr-2"
                        />
                        <span className="text-red-700 font-medium">REJEITADO</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="conclusionJustification">Justificativa da Conclusão</Label>
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
                          <th className="border border-gray-300 p-3 text-left">Função</th>
                          <th className="border border-gray-300 p-3 text-left">Nome</th>
                          <th className="border border-gray-300 p-3 text-left">Data</th>
                          <th className="border border-gray-300 p-3 text-left">Assinatura</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Analista</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("analystName")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input type="date" {...form.register("analystDate")} />
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
                          <td className="border border-gray-300 p-3 font-medium">Aprovador</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("approverName")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input type="date" {...form.register("approverDate")} />
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

            {/* Seções restantes serão incluídas aqui */}
            {/* Section 4, 7, 9, 10, 11, 12, 13 - vou adicionar as principais */}

            {/* Section 4: Environmental Conditions */}
            <TabsContent value="section4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Thermometer className="text-blue-600 mr-3" size={24} />
                    4. CONDIÇÕES AMBIENTAIS E MÉTODO DA CALIBRAÇÃO
                  </CardTitle>
                  <p className="text-sm text-gray-600">Verificação da adequação das condições durante a calibração.</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 p-3 text-left">Parâmetro</th>
                          <th className="border border-gray-300 p-3 text-left">Valor Reportado</th>
                          <th className="border border-gray-300 p-3 text-left">Limite Aceitável</th>
                          <th className="border border-gray-300 p-3 text-left">OK?</th>
                          <th className="border border-gray-300 p-3 text-left">Observações / Impacto</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Temperatura (°C)</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("tempReported")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input placeholder="Ex: 20 ± 2 °C" {...form.register("tempLimit")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("tempOk") || false}
                              onCheckedChange={(checked) => form.setValue("tempOk", checked as boolean)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("tempObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Umidade Relativa (%)</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("humidityReported")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input placeholder="Ex: 50 ± 10 %" {...form.register("humidityLimit")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("humidityOk") || false}
                              onCheckedChange={(checked) => form.setValue("humidityOk", checked as boolean)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("humidityObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Pressão Atmosférica (kPa)</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("pressureReported")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input placeholder="Ex: 101.3 ± 5 kPa" {...form.register("pressureLimit")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("pressureOk") || false}
                              onCheckedChange={(checked) => form.setValue("pressureOk", checked as boolean)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("pressureObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Fluido de Calibração</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("fluidReported")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input placeholder="Ex: Água / Ar Seco" {...form.register("fluidLimit")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("fluidOk") || false}
                              onCheckedChange={(checked) => form.setValue("fluidOk", checked as boolean)}
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
                          <td className="border border-gray-300 p-3 font-medium">Local da Calibração</td>
                          <td className="border border-gray-300 p-3" colSpan={2}>
                            <div className="flex space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Laboratorio"
                                  checked={form.watch("calibrationLocation") === "Laboratorio"}
                                  onChange={(e) => form.setValue("calibrationLocation", e.target.value as LocationStatus)}
                                  className="mr-2"
                                />
                                Laboratório
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Campo"
                                  checked={form.watch("calibrationLocation") === "Campo"}
                                  onChange={(e) => form.setValue("calibrationLocation", e.target.value as LocationStatus)}
                                  className="mr-2"
                                />
                                Campo
                              </label>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("calibrationLocationOk") || false}
                              onCheckedChange={(checked) => form.setValue("calibrationLocationOk", checked as boolean)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("calibrationLocationObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Método Utilizado</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("methodUsed")} />
                          </td>
                          <td className="border border-gray-300 p-3"></td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("methodUsedOk") || false}
                              onCheckedChange={(checked) => form.setValue("methodUsedOk", checked as boolean)}
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

            {/* Section 7: Uncertainty Evaluation */}
            <TabsContent value="section7">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="text-blue-600 mr-3" size={24} />
                    7. AVALIAÇÃO DA INCERTEZA DE MEDIÇÃO DO CERTIFICADO
                  </CardTitle>
                  <p className="text-sm text-gray-600">Análise crítica da incerteza reportada.</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-blue-50">
                          <th className="border border-gray-300 p-3 text-left">Aspecto Avaliado</th>
                          <th className="border border-gray-300 p-3 text-left">Valor / Evidência</th>
                          <th className="border border-gray-300 p-3 text-left">OK?</th>
                          <th className="border border-gray-300 p-3 text-left">Comentários / Justificativa Técnica</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Incerteza Expandida (U) declarada</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("uncertaintyDeclared")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("uncertaintyDeclaredOk") || false}
                              onCheckedChange={(checked) => form.setValue("uncertaintyDeclaredOk", checked as boolean)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("uncertaintyDeclaredObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Método de cálculo conforme GUM / NIT Dicla-021</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("calculationMethod")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("calculationMethodOk") || false}
                              onCheckedChange={(checked) => form.setValue("calculationMethodOk", checked as boolean)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("calculationMethodObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Todas as contribuições relevantes consideradas</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("contributions")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("contributionsOk") || false}
                              onCheckedChange={(checked) => form.setValue("contributionsOk", checked as boolean)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("contributionsObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Nível de confiança (geralmente 95%)</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("confidenceLevel")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("confidenceLevelOk") || false}
                              onCheckedChange={(checked) => form.setValue("confidenceLevelOk", checked as boolean)}
                            />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("confidenceLevelObs")} />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-3 font-medium">Compatibilidade com Limite da Aplicação</td>
                          <td className="border border-gray-300 p-3">
                            <Input {...form.register("compatibility")} />
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("compatibilityOk") || false}
                              onCheckedChange={(checked) => form.setValue("compatibilityOk", checked as boolean)}
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

            {/* Implementar seções restantes 9-13 seguindo o mesmo padrão */}
            
          </Tabs>
        </form>
      </div>
    </div>
  );
}