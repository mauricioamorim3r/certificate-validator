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
  Info
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

const formSchema = z.object({
  documentCode: z.string().default("RAC-001"),
  version: z.string().default("2.1"),
  analysisDate: z.string(),
  analyzedBy: z.string(),
  approvedBy: z.string(),
  
  // Certificate/Laboratory identification
  certificateNumber: z.string(),
  issuingLaboratory: z.string(),
  issueDate: z.string(),
  calibrationDate: z.string(),
  calibrationValidity: z.string(),
  validityStatus: z.enum(["conforme", "nao_conforme", "nao_aplicavel"]).optional(),
  validityObservations: z.string().optional(),
  technicalResponsible: z.string(),
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
  equipmentType: z.string(),
  manufacturerModel: z.string(),
  serialNumber: z.string(),
  tagIdInternal: z.string(),
  application: z.string(),
  location: z.string(),
  
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

export default function CertificateAnalysisForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentRecordId, setCurrentRecordId] = useState<number | null>(null);

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
      tempObs: "",
      humidityValue: "",
      humidityLimit: "",
      humidityObs: "",
      pressureValue: "",
      pressureLimit: "",
      pressureObs: "",
      fluidValue: "",
      fluidLimit: "",
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
  const { data: allRecords } = useQuery({
    queryKey: ["/api/analysis-records"],
  });

  const saveRecordMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const environmentalConditions = {
        temperature: {
          value: data.tempValue,
          limit: data.tempLimit,
          ok: data.tempOk,
          observations: data.tempObs,
        },
        humidity: {
          value: data.humidityValue,
          limit: data.humidityLimit,
          ok: data.humidityOk,
          observations: data.humidityObs,
        },
        pressure: {
          value: data.pressureValue,
          limit: data.pressureLimit,
          ok: data.pressureOk,
          observations: data.pressureObs,
        },
        fluid: {
          value: data.fluidValue,
          limit: data.fluidLimit,
          ok: data.fluidOk,
          observations: data.fluidObs,
        },
      };

      const recordData = {
        ...data,
        environmentalConditions,
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

  const loadLatestRecord = () => {
    if (allRecords && allRecords.length > 0) {
      const latestRecord = allRecords[0];
      setCurrentRecordId(latestRecord.id);
      
      // Fill form with loaded data
      form.reset({
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
        validityStatus: latestRecord.validityStatus as any,
        validityObservations: latestRecord.validityObservations || "",
        technicalResponsible: latestRecord.technicalResponsible || "",
        responsibleStatus: latestRecord.responsibleStatus as any,
        responsibleObservations: latestRecord.responsibleObservations || "",
        accreditedLabStatus: latestRecord.accreditedLabStatus as any,
        accreditedLabObservations: latestRecord.accreditedLabObservations || "",
        adequateScopeStatus: latestRecord.adequateScopeStatus as any,
        adequateScopeObservations: latestRecord.adequateScopeObservations || "",
        accreditationSymbolStatus: latestRecord.accreditationSymbolStatus as any,
        accreditationSymbolObservations: latestRecord.accreditationSymbolObservations || "",
        equipmentType: latestRecord.equipmentType || "",
        manufacturerModel: latestRecord.manufacturerModel || "",
        serialNumber: latestRecord.serialNumber || "",
        tagIdInternal: latestRecord.tagIdInternal || "",
        application: latestRecord.application || "",
        location: latestRecord.location || "",
        tempValue: (latestRecord.environmentalConditions as any)?.temperature?.value || "",
        tempLimit: (latestRecord.environmentalConditions as any)?.temperature?.limit || "",
        tempOk: (latestRecord.environmentalConditions as any)?.temperature?.ok || false,
        tempObs: (latestRecord.environmentalConditions as any)?.temperature?.observations || "",
        humidityValue: (latestRecord.environmentalConditions as any)?.humidity?.value || "",
        humidityLimit: (latestRecord.environmentalConditions as any)?.humidity?.limit || "",
        humidityOk: (latestRecord.environmentalConditions as any)?.humidity?.ok || false,
        humidityObs: (latestRecord.environmentalConditions as any)?.humidity?.observations || "",
        pressureValue: (latestRecord.environmentalConditions as any)?.pressure?.value || "",
        pressureLimit: (latestRecord.environmentalConditions as any)?.pressure?.limit || "",
        pressureOk: (latestRecord.environmentalConditions as any)?.pressure?.ok || false,
        pressureObs: (latestRecord.environmentalConditions as any)?.pressure?.observations || "",
        fluidValue: (latestRecord.environmentalConditions as any)?.fluid?.value || "",
        fluidLimit: (latestRecord.environmentalConditions as any)?.fluid?.limit || "",
        fluidOk: (latestRecord.environmentalConditions as any)?.fluid?.ok || false,
        fluidObs: (latestRecord.environmentalConditions as any)?.fluid?.observations || "",
        calibrationLocation: latestRecord.calibrationLocation as any,
        locationAdequate: latestRecord.locationAdequate || "",
        locationObservations: latestRecord.locationObservations || "",
        measurementResultsStatus: latestRecord.measurementResultsStatus as any,
        measurementResultsObservations: latestRecord.measurementResultsObservations || "",
        uncertaintiesStatus: latestRecord.uncertaintiesStatus as any,
        uncertaintiesObservations: latestRecord.uncertaintiesObservations || "",
        conformityStatus: latestRecord.conformityStatus as any,
        conformityObservations: latestRecord.conformityObservations || "",
        traceabilityStatus: latestRecord.traceabilityStatus as any,
        traceabilityObservations: latestRecord.traceabilityObservations || "",
        standardsStatus: latestRecord.standardsStatus as any,
        standardsObservations: latestRecord.standardsObservations || "",
        certificatesStatus: latestRecord.certificatesStatus as any,
        certificatesObservations: latestRecord.certificatesObservations || "",
        overallStatus: latestRecord.overallStatus as any,
        finalComments: latestRecord.finalComments || "",
      });

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
      toast({
        title: "Sucesso",
        description: "Formulário limpo com sucesso!",
      });
    }
  };

  const handleGeneratePDF = () => {
    const formData = form.getValues();
    generatePDF(formData);
  };

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
              <Label htmlFor="analysisDate" className="text-gray-700 font-medium">Data da Análise:</Label>
              <Input
                id="analysisDate"
                type="date"
                className="form-input mt-1"
                {...form.register("analysisDate")}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          <div className="purpose-box p-4 mt-6 rounded-r-lg">
            <p className="text-blue-800 text-sm italic flex items-start">
              <Info className="mr-2 mt-0.5 flex-shrink-0" size={16} />
              <span>
                <strong>Propósito:</strong> Este registro tem como objetivo padronizar a avaliação crítica 
                de certificados de calibração e relatórios de inspeção, assegurando a conformidade com a 
                Portaria INMETRO 291/2021, a norma ISO/IEC 17025, o Guia para a Expressão da Incerteza 
                de Medição (GUM) e outros padrões metrológicos aplicáveis.
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

              {/* Section 1: Certificate/Laboratory Identification */}
              <TabsContent value="section1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <IdCard className="text-blue-600 mr-3" size={24} />
                      Identificação do Certificado/Laboratório
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="certificateNumber">Número do Certificado</Label>
                        <Input
                          id="certificateNumber"
                          className="form-input mt-1"
                          {...form.register("certificateNumber")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="issuingLaboratory">Laboratório Emissor</Label>
                        <Input
                          id="issuingLaboratory"
                          className="form-input mt-1"
                          {...form.register("issuingLaboratory")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="issueDate">Data de Emissão</Label>
                        <Input
                          id="issueDate"
                          type="date"
                          className="form-input mt-1"
                          {...form.register("issueDate")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="calibrationDate">Data de Calibração</Label>
                        <Input
                          id="calibrationDate"
                          type="date"
                          className="form-input mt-1"
                          {...form.register("calibrationDate")}
                        />
                      </div>
                    </div>

                    {/* Validity Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-4">Validade da Calibração</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="calibrationValidity">Validade</Label>
                          <Input
                            id="calibrationValidity"
                            type="date"
                            className="form-input mt-1"
                            {...form.register("calibrationValidity")}
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <StatusSelector
                            name="validityStatus"
                            value={form.watch("validityStatus")}
                            onChange={(value) => form.setValue("validityStatus", value as any)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="validityObservations">Observações</Label>
                          <Textarea
                            id="validityObservations"
                            rows={2}
                            className="form-input mt-1"
                            placeholder="Justificativas ou observações..."
                            {...form.register("validityObservations")}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Technical Responsible Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-4">Responsável Técnico</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="technicalResponsible">Nome</Label>
                          <Input
                            id="technicalResponsible"
                            className="form-input mt-1"
                            {...form.register("technicalResponsible")}
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <StatusSelector
                            name="responsibleStatus"
                            value={form.watch("responsibleStatus")}
                            onChange={(value) => form.setValue("responsibleStatus", value as any)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="responsibleObservations">Observações</Label>
                          <Textarea
                            id="responsibleObservations"
                            rows={2}
                            className="form-input mt-1"
                            placeholder="Justificativas ou observações..."
                            {...form.register("responsibleObservations")}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section 2: Accreditation */}
              <TabsContent value="section2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="text-blue-600 mr-3" size={24} />
                      Acreditação e Escopo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Critical Filter Alert */}
                    <div className="critical-box p-4 mb-6 rounded-r-lg">
                      <div className="flex">
                        <Info className="text-yellow-600 mr-3 mt-1 flex-shrink-0" size={16} />
                        <div>
                          <p className="text-sm text-yellow-800">
                            <strong>Filtro Crítico:</strong> Itens obrigatórios para conformidade segundo Portaria INMETRO 291/2021.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Laboratory Accreditation */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Laboratório Acreditado CGCRE/INMETRO</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <StatusSelector
                              name="accreditedLabStatus"
                              value={form.watch("accreditedLabStatus")}
                              onChange={(value) => form.setValue("accreditedLabStatus", value as any)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="accreditedLabObservations">Observações</Label>
                            <Textarea
                              id="accreditedLabObservations"
                              rows={2}
                              className="form-input mt-1"
                              placeholder="Justificativas ou observações..."
                              {...form.register("accreditedLabObservations")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Accreditation Scope */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Escopo de Acreditação Adequado</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <StatusSelector
                              name="adequateScopeStatus"
                              value={form.watch("adequateScopeStatus")}
                              onChange={(value) => form.setValue("adequateScopeStatus", value as any)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="adequateScopeObservations">Observações</Label>
                            <Textarea
                              id="adequateScopeObservations"
                              rows={2}
                              className="form-input mt-1"
                              placeholder="Justificativas ou observações..."
                              {...form.register("adequateScopeObservations")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Accreditation Symbol */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Símbolo de Acreditação Presente</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <StatusSelector
                              name="accreditationSymbolStatus"
                              value={form.watch("accreditationSymbolStatus")}
                              onChange={(value) => form.setValue("accreditationSymbolStatus", value as any)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="accreditationSymbolObservations">Observações</Label>
                            <Textarea
                              id="accreditationSymbolObservations"
                              rows={2}
                              className="form-input mt-1"
                              placeholder="Justificativas ou observações..."
                              {...form.register("accreditationSymbolObservations")}
                            />
                          </div>
                        </div>
                      </div>
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
                      Identificação do Instrumento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="equipmentType">Tipo de Equipamento</Label>
                        <Input
                          id="equipmentType"
                          className="form-input mt-1"
                          {...form.register("equipmentType")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="manufacturerModel">Fabricante/Modelo</Label>
                        <Input
                          id="manufacturerModel"
                          className="form-input mt-1"
                          {...form.register("manufacturerModel")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="serialNumber">Número de Série</Label>
                        <Input
                          id="serialNumber"
                          className="form-input mt-1"
                          {...form.register("serialNumber")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tagIdInternal">TAG/ID Interno</Label>
                        <Input
                          id="tagIdInternal"
                          className="form-input mt-1"
                          {...form.register("tagIdInternal")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="application">Aplicação</Label>
                        <Input
                          id="application"
                          className="form-input mt-1"
                          {...form.register("application")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Localização</Label>
                        <Input
                          id="location"
                          className="form-input mt-1"
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
                      Condições Ambientais e Método de Calibração
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Environmental Conditions Table */}
                    <div className="overflow-x-auto">
                      <table className="data-table min-w-full bg-gray-50 border border-gray-200 rounded-lg">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Parâmetro</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Valor Reportado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Limite Aceitável</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">OK</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Observações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Temperatura (°C)</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Input
                                className="form-input"
                                {...form.register("tempValue")}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Input
                                className="form-input"
                                {...form.register("tempLimit")}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Checkbox
                                checked={form.watch("tempOk")}
                                onCheckedChange={(checked) => form.setValue("tempOk", !!checked)}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Textarea
                                rows={1}
                                className="form-input"
                                {...form.register("tempObs")}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Umidade Relativa (%)</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Input
                                className="form-input"
                                {...form.register("humidityValue")}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Input
                                className="form-input"
                                {...form.register("humidityLimit")}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Checkbox
                                checked={form.watch("humidityOk")}
                                onCheckedChange={(checked) => form.setValue("humidityOk", !!checked)}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Textarea
                                rows={1}
                                className="form-input"
                                {...form.register("humidityObs")}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Pressão Atmosférica (kPa)</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Input
                                className="form-input"
                                {...form.register("pressureValue")}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Input
                                className="form-input"
                                {...form.register("pressureLimit")}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Checkbox
                                checked={form.watch("pressureOk")}
                                onCheckedChange={(checked) => form.setValue("pressureOk", !!checked)}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Textarea
                                rows={1}
                                className="form-input"
                                {...form.register("pressureObs")}
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Fluido de Calibração</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Input
                                className="form-input"
                                {...form.register("fluidValue")}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Input
                                className="form-input"
                                {...form.register("fluidLimit")}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Checkbox
                                checked={form.watch("fluidOk")}
                                onCheckedChange={(checked) => form.setValue("fluidOk", !!checked)}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <Textarea
                                rows={1}
                                className="form-input"
                                {...form.register("fluidObs")}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Calibration Location */}
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-4">Local de Calibração</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <Label>Tipo</Label>
                          <div className="space-y-2 mt-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="laboratorio"
                                className="text-blue-600 focus:ring-blue-500"
                                {...form.register("calibrationLocation")}
                              />
                              <span className="ml-2 text-sm">Laboratório</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="campo"
                                className="text-blue-600 focus:ring-blue-500"
                                {...form.register("calibrationLocation")}
                              />
                              <span className="ml-2 text-sm">Campo</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="locationAdequate">Adequado</Label>
                          <Input
                            id="locationAdequate"
                            className="form-input mt-1"
                            {...form.register("locationAdequate")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="locationObservations">Observações</Label>
                          <Textarea
                            id="locationObservations"
                            rows={2}
                            className="form-input mt-1"
                            {...form.register("locationObservations")}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section 5: Measurement Results */}
              <TabsContent value="section5">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="text-blue-600 mr-3" size={24} />
                      Resultados de Medição e Incertezas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Measurement Results */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Resultados da Calibração</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <StatusSelector
                              name="measurementResultsStatus"
                              value={form.watch("measurementResultsStatus")}
                              onChange={(value) => form.setValue("measurementResultsStatus", value as any)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="measurementResultsObservations">Observações</Label>
                            <Textarea
                              id="measurementResultsObservations"
                              rows={2}
                              className="form-input mt-1"
                              placeholder="Análise dos resultados..."
                              {...form.register("measurementResultsObservations")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Uncertainty Analysis */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Análise de Incertezas</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <StatusSelector
                              name="uncertaintiesStatus"
                              value={form.watch("uncertaintiesStatus")}
                              onChange={(value) => form.setValue("uncertaintiesStatus", value as any)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="uncertaintiesObservations">Observações</Label>
                            <Textarea
                              id="uncertaintiesObservations"
                              rows={2}
                              className="form-input mt-1"
                              placeholder="Análise das incertezas conforme GUM..."
                              {...form.register("uncertaintiesObservations")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Conformity Evaluation */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Avaliação de Conformidade</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <StatusSelector
                              name="conformityStatus"
                              value={form.watch("conformityStatus")}
                              onChange={(value) => form.setValue("conformityStatus", value as any)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="conformityObservations">Observações</Label>
                            <Textarea
                              id="conformityObservations"
                              rows={2}
                              className="form-input mt-1"
                              placeholder="Avaliação de conformidade com especificações..."
                              {...form.register("conformityObservations")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section 6: Traceability */}
              <TabsContent value="section6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Link className="text-blue-600 mr-3" size={24} />
                      Rastreabilidade Metrológica
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Traceability Chain */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Cadeia de Rastreabilidade</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <StatusSelector
                              name="traceabilityStatus"
                              value={form.watch("traceabilityStatus")}
                              onChange={(value) => form.setValue("traceabilityStatus", value as any)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="traceabilityObservations">Observações</Label>
                            <Textarea
                              id="traceabilityObservations"
                              rows={2}
                              className="form-input mt-1"
                              placeholder="Análise da cadeia de rastreabilidade..."
                              {...form.register("traceabilityObservations")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reference Standards */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Padrões de Referência</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <StatusSelector
                              name="standardsStatus"
                              value={form.watch("standardsStatus")}
                              onChange={(value) => form.setValue("standardsStatus", value as any)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="standardsObservations">Observações</Label>
                            <Textarea
                              id="standardsObservations"
                              rows={2}
                              className="form-input mt-1"
                              placeholder="Análise dos padrões utilizados..."
                              {...form.register("standardsObservations")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Calibration Certificates */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-4">Certificados dos Padrões</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label>Status</Label>
                            <StatusSelector
                              name="certificatesStatus"
                              value={form.watch("certificatesStatus")}
                              onChange={(value) => form.setValue("certificatesStatus", value as any)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="certificatesObservations">Observações</Label>
                            <Textarea
                              id="certificatesObservations"
                              rows={2}
                              className="form-input mt-1"
                              placeholder="Verificação dos certificados dos padrões..."
                              {...form.register("certificatesObservations")}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Final Analysis Section */}
          <div className="border-t bg-gray-50 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <ClipboardCheck className="text-blue-600 mr-3" size={24} />
              Conclusão da Análise Crítica
            </h3>
            
            <div className="space-y-6">
              {/* Overall Status */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-4">Status Geral do Certificado</h4>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="aprovado"
                      className="text-green-600 focus:ring-green-500"
                      {...form.register("overallStatus")}
                    />
                    <span className="ml-2 text-green-700 font-medium">Aprovado</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="reprovado"
                      className="text-red-600 focus:ring-red-500"
                      {...form.register("overallStatus")}
                    />
                    <span className="ml-2 text-red-700 font-medium">Reprovado</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="condicional"
                      className="text-yellow-600 focus:ring-yellow-500"
                      {...form.register("overallStatus")}
                    />
                    <span className="ml-2 text-yellow-700 font-medium">Aprovado com Restrições</span>
                  </label>
                </div>
              </div>

              {/* Final Comments */}
              <div className="bg-white p-4 rounded-lg border">
                <Label htmlFor="finalComments">Comentários Finais</Label>
                <Textarea
                  id="finalComments"
                  rows={4}
                  className="form-input mt-1"
                  placeholder="Resumo da análise, justificativas e recomendações..."
                  {...form.register("finalComments")}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white p-6 border-t flex justify-center space-x-4 flex-wrap gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={loadLatestRecord}
              className="btn-secondary"
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
