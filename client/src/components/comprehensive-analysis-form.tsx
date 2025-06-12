import { useState } from "react";
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

const formSchema = z.object({
  documentCode: z.string().default("RAC-001"),
  version: z.string().default("2.1"),
  analysisDate: z.string(),
  analyzedBy: z.string(),
  approvedBy: z.string(),
  
  // Section 1: Certificate/Laboratory identification
  certificateNumber: z.string(),
  certificateNumberStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  certificateNumberObs: z.string().optional(),
  issuingLaboratory: z.string(),
  issuingLaboratoryStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  issuingLaboratoryObs: z.string().optional(),
  issueDate: z.string(),
  issueDateStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  issueDateObs: z.string().optional(),
  calibrationDate: z.string(),
  calibrationDateStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  calibrationDateObs: z.string().optional(),
  calibrationValidity: z.string(),
  validityStatus: z.enum(["Conforme", "Nao Conforme"]).optional(),
  validityObservations: z.string().optional(),
  technicalResponsible: z.string(),
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
  equipmentType: z.string(),
  manufacturerModel: z.string(),
  serialNumber: z.string(),
  tagIdInternal: z.string(),
  application: z.string(),
  location: z.string(),
  
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

export default function ComprehensiveAnalysisForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentRecordId, setCurrentRecordId] = useState<number | null>(null);
  const [isoRequirements, setIsoRequirements] = useState<boolean[]>(new Array(10).fill(false));
  const [standards, setStandards] = useState<any[]>([{
    name: '', certificate: '', laboratory: '', accreditation: '', uncertainty: '', validity: '', status: 'OK', observations: ''
  }]);
  const [calibrationResults, setCalibrationResults] = useState<any[]>([{
    point: '', referenceValue: '', measuredValue: '', error: '', uncertainty: '', errorLimit: '', ok: false
  }]);
  const [nonConformities, setNonConformities] = useState<any[]>([{
    item: 1, description: '', criticality: 'Media', action: ''
  }]);
  const [pressureCriteria, setPressureCriteria] = useState<any[]>([{
    name: '', status: 'Sim', observations: ''
  }]);
  const [flowCriteria, setFlowCriteria] = useState<any[]>([{
    name: '', status: 'Sim', observations: ''
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
    },
  });

  const { data: allRecords } = useQuery({
    queryKey: ["/api/analysis-records"],
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

      if (currentRecordId) {
        const response = await apiRequest("PUT", `/api/analysis-records/${currentRecordId}`, recordData);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/analysis-records", recordData);
        return response.json();
      }
    },
    onSuccess: (data) => {
      setCurrentRecordId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/analysis-records"] });
      toast({
        title: "Sucesso",
        description: currentRecordId ? "Registro atualizado com sucesso!" : "Registro salvo com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar o registro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    saveRecordMutation.mutate(data);
  };

  const addStandard = () => {
    setStandards([...standards, {
      name: '', certificate: '', laboratory: '', accreditation: '', uncertainty: '', validity: '', status: 'OK', observations: ''
    }]);
  };

  const removeStandard = (index: number) => {
    setStandards(standards.filter((_, i) => i !== index));
  };

  const addCalibrationResult = () => {
    setCalibrationResults([...calibrationResults, {
      point: '', referenceValue: '', measuredValue: '', error: '', uncertainty: '', errorLimit: '', ok: false
    }]);
  };

  const removeCalibrationResult = (index: number) => {
    setCalibrationResults(calibrationResults.filter((_, i) => i !== index));
  };

  const addNonConformity = () => {
    setNonConformities([...nonConformities, {
      item: nonConformities.length + 1, description: '', criticality: 'Media', action: ''
    }]);
  };

  const removeNonConformity = (index: number) => {
    setNonConformities(nonConformities.filter((_, i) => i !== index));
  };

  const loadLatestRecord = () => {
    if (allRecords && Array.isArray(allRecords) && allRecords.length > 0) {
      const latestRecord = allRecords[0];
      setCurrentRecordId(latestRecord.id);
      
      // Set complex state
      if (latestRecord.isoRequirements) {
        setIsoRequirements(latestRecord.isoRequirements as boolean[]);
      }
      if (latestRecord.standards) {
        setStandards(latestRecord.standards as any[]);
      }
      if (latestRecord.calibrationResults) {
        setCalibrationResults(latestRecord.calibrationResults as any[]);
      }
      if (latestRecord.nonConformities) {
        setNonConformities(latestRecord.nonConformities as any[]);
      }
      if (latestRecord.pressureCriteria) {
        setPressureCriteria(latestRecord.pressureCriteria as any[]);
      }
      if (latestRecord.flowCriteria) {
        setFlowCriteria(latestRecord.flowCriteria as any[]);
      }
      
      // Reset form with loaded data
      form.reset(latestRecord as any);

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
    if (confirm("Tem certeza que deseja limpar todos os dados do formulário?")) {
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
            </div>
            <div>
              <Label htmlFor="approvedBy" className="text-gray-700 font-medium">Aprovado por:</Label>
              <Input
                id="approvedBy"
                placeholder="Nome do aprovador"
                className="form-input mt-1"
                {...form.register("approvedBy")}
              />
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
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="certificateNumberStatus"
                              value={form.watch("certificateNumberStatus")}
                              onChange={(value) => form.setValue("certificateNumberStatus", value as any)}
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
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="issuingLaboratoryStatus"
                              value={form.watch("issuingLaboratoryStatus")}
                              onChange={(value) => form.setValue("issuingLaboratoryStatus", value as any)}
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
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="issueDateStatus"
                              value={form.watch("issueDateStatus")}
                              onChange={(value) => form.setValue("issueDateStatus", value as any)}
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
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="calibrationDateStatus"
                              value={form.watch("calibrationDateStatus")}
                              onChange={(value) => form.setValue("calibrationDateStatus", value as any)}
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
                              onChange={(value) => form.setValue("validityStatus", value as any)}
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
                          </td>
                          <td className="border border-gray-300 p-3">
                            <StatusSelector
                              name="responsibleStatus"
                              value={form.watch("responsibleStatus")}
                              onChange={(value) => form.setValue("responsibleStatus", value as any)}
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
                                  onChange={(e) => form.setValue("accreditedLabStatus", e.target.value as any)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("accreditedLabStatus") === "Nao"}
                                  onChange={(e) => form.setValue("accreditedLabStatus", e.target.value as any)}
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
                                  onChange={(e) => form.setValue("adequateScopeStatus", e.target.value as any)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("adequateScopeStatus") === "Nao"}
                                  onChange={(e) => form.setValue("adequateScopeStatus", e.target.value as any)}
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
                                  onChange={(e) => form.setValue("accreditationSymbolStatus", e.target.value as any)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("accreditationSymbolStatus") === "Nao"}
                                  onChange={(e) => form.setValue("accreditationSymbolStatus", e.target.value as any)}
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
                    </div>
                    <div>
                      <Label htmlFor="manufacturerModel">Fabricante / Modelo</Label>
                      <Input 
                        id="manufacturerModel"
                        placeholder="Ex: Siemens / SITRANS F US"
                        {...form.register("manufacturerModel")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="serialNumber">Número de Série</Label>
                      <Input 
                        id="serialNumber"
                        placeholder="Ex: 123456789"
                        {...form.register("serialNumber")}
                      />
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
                              checked={form.watch("tempOk")}
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
                              checked={form.watch("humidityOk")}
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
                              checked={form.watch("pressureOk")}
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
                              checked={form.watch("fluidOk")}
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
                                  onChange={(e) => form.setValue("calibrationLocation", e.target.value as any)}
                                  className="mr-2"
                                />
                                Laboratório
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Campo"
                                  checked={form.watch("calibrationLocation") === "Campo"}
                                  onChange={(e) => form.setValue("calibrationLocation", e.target.value as any)}
                                  className="mr-2"
                                />
                                Campo
                              </label>
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Checkbox 
                              checked={form.watch("calibrationLocationOk")}
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
                              checked={form.watch("methodUsedOk")}
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
                          checked={isoRequirements[index]}
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
                                onChange={(e) => {
                                  const newStandards = [...standards];
                                  newStandards[index].name = e.target.value;
                                  setStandards(newStandards);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.certificate}
                                onChange={(e) => {
                                  const newStandards = [...standards];
                                  newStandards[index].certificate = e.target.value;
                                  setStandards(newStandards);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.laboratory}
                                onChange={(e) => {
                                  const newStandards = [...standards];
                                  newStandards[index].laboratory = e.target.value;
                                  setStandards(newStandards);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.accreditation}
                                onChange={(e) => {
                                  const newStandards = [...standards];
                                  newStandards[index].accreditation = e.target.value;
                                  setStandards(newStandards);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.uncertainty}
                                onChange={(e) => {
                                  const newStandards = [...standards];
                                  newStandards[index].uncertainty = e.target.value;
                                  setStandards(newStandards);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                type="date"
                                value={standard.validity}
                                onChange={(e) => {
                                  const newStandards = [...standards];
                                  newStandards[index].validity = e.target.value;
                                  setStandards(newStandards);
                                }}
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
                                    onChange={(e) => {
                                      const newStandards = [...standards];
                                      newStandards[index].status = e.target.value;
                                      setStandards(newStandards);
                                    }}
                                    className="mr-1"
                                  />
                                  OK
                                </label>
                                <label className="flex items-center text-xs">
                                  <input
                                    type="radio"
                                    value="NOK"
                                    checked={standard.status === "NOK"}
                                    onChange={(e) => {
                                      const newStandards = [...standards];
                                      newStandards[index].status = e.target.value;
                                      setStandards(newStandards);
                                    }}
                                    className="mr-1"
                                  />
                                  NOK
                                </label>
                              </div>
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={standard.observations}
                                onChange={(e) => {
                                  const newStandards = [...standards];
                                  newStandards[index].observations = e.target.value;
                                  setStandards(newStandards);
                                }}
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
                              checked={form.watch("uncertaintyDeclaredOk")}
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
                              checked={form.watch("calculationMethodOk")}
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
                              checked={form.watch("contributionsOk")}
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
                              checked={form.watch("confidenceLevelOk")}
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
                              checked={form.watch("compatibilityOk")}
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
                                onChange={(e) => {
                                  const newResults = [...calibrationResults];
                                  newResults[index].point = e.target.value;
                                  setCalibrationResults(newResults);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.referenceValue}
                                onChange={(e) => {
                                  const newResults = [...calibrationResults];
                                  newResults[index].referenceValue = e.target.value;
                                  setCalibrationResults(newResults);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.measuredValue}
                                onChange={(e) => {
                                  const newResults = [...calibrationResults];
                                  newResults[index].measuredValue = e.target.value;
                                  setCalibrationResults(newResults);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.error}
                                onChange={(e) => {
                                  const newResults = [...calibrationResults];
                                  newResults[index].error = e.target.value;
                                  setCalibrationResults(newResults);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.uncertainty}
                                onChange={(e) => {
                                  const newResults = [...calibrationResults];
                                  newResults[index].uncertainty = e.target.value;
                                  setCalibrationResults(newResults);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Input
                                value={result.errorLimit}
                                onChange={(e) => {
                                  const newResults = [...calibrationResults];
                                  newResults[index].errorLimit = e.target.value;
                                  setCalibrationResults(newResults);
                                }}
                                className="text-xs"
                              />
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Checkbox
                                checked={result.ok}
                                onCheckedChange={(checked) => {
                                  const newResults = [...calibrationResults];
                                  newResults[index].ok = checked as boolean;
                                  setCalibrationResults(newResults);
                                }}
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
                                  onChange={(e) => form.setValue("errorLimits", e.target.value as any)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("errorLimits") === "Nao"}
                                  onChange={(e) => form.setValue("errorLimits", e.target.value as any)}
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
                                  onChange={(e) => form.setValue("adequateUncertainty", e.target.value as any)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("adequateUncertainty") === "Nao"}
                                  onChange={(e) => form.setValue("adequateUncertainty", e.target.value as any)}
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
                                  onChange={(e) => form.setValue("rtmRequirements", e.target.value as any)}
                                  className="mr-2"
                                />
                                Sim
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  value="Nao"
                                  checked={form.watch("rtmRequirements") === "Nao"}
                                  onChange={(e) => form.setValue("rtmRequirements", e.target.value as any)}
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
                          onChange={(e) => form.setValue("finalStatus", e.target.value as any)}
                          className="mr-2"
                        />
                        <span className="text-green-700 font-medium">APROVADO</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="APROVADO COM RESSALVAS"
                          checked={form.watch("finalStatus") === "APROVADO COM RESSALVAS"}
                          onChange={(e) => form.setValue("finalStatus", e.target.value as any)}
                          className="mr-2"
                        />
                        <span className="text-yellow-700 font-medium">APROVADO COM RESSALVAS</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="REJEITADO"
                          checked={form.watch("finalStatus") === "REJEITADO"}
                          onChange={(e) => form.setValue("finalStatus", e.target.value as any)}
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

            {/* Add placeholder sections for the remaining tabs */}
            <TabsContent value="section9">
              <Card>
                <CardHeader>
                  <CardTitle>9. ANÁLISE DE AJUSTE / REPARO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Seção em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="section10">
              <Card>
                <CardHeader>
                  <CardTitle>10. DECLARAÇÃO DE CONFORMIDADE E REGRAS DE DECISÃO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Seção em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="section11">
              <Card>
                <CardHeader>
                  <CardTitle>11. CONDIÇÕES AMBIENTAIS DA CALIBRAÇÃO PÓS-CALIBRAÇÃO / USO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Seção em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="section12">
              <Card>
                <CardHeader>
                  <CardTitle>12. PERIODICIDADE DA CALIBRAÇÃO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Seção em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="section13">
              <Card>
                <CardHeader>
                  <CardTitle>13. AVALIAÇÕES ESPECÍFICAS POR TIPO DE INSTRUMENTO</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Seção em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="section14">
              <Card>
                <CardHeader>
                  <CardTitle>14. NÃO CONFORMIDADES E AÇÕES PROPOSTAS</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Seção em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>
            
          </Tabs>
        </form>
      </div>
    </div>
  );
}