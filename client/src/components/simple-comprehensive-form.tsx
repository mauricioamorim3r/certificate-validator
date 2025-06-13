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
  BarChart3,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const formSchema = z.object({
  documentCode: z.string().default("RAC-001"),
  version: z.string().default("2.1"),
  analysisDate: z.string(),
  analyzedBy: z.string(),
  approvedBy: z.string(),
  
  // Section 1: Certificate/Laboratory identification
  certificateNumber: z.string(),
  issuingLaboratory: z.string(),
  issueDate: z.string(),
  calibrationDate: z.string(),
  calibrationValidity: z.string(),
  technicalResponsible: z.string(),
  
  // Section 3: Instrument identification
  equipmentType: z.string(),
  manufacturerModel: z.string(),
  serialNumber: z.string(),
  tagIdInternal: z.string(),
  application: z.string(),
  location: z.string(),
  
  // Section 15: Final conclusion
  finalStatus: z.enum(["APROVADO", "APROVADO COM RESSALVAS", "REJEITADO"]).optional(),
  conclusionJustification: z.string().optional(),
  
  // Section 16: Signatures
  analystName: z.string().optional(),
  analystDate: z.string().optional(),
  approverName: z.string().optional(),
  approverDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function SimpleComprehensiveForm() {
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
    if (allRecords && Array.isArray(allRecords) && allRecords.length > 0) {
      const latestRecord = allRecords[0];
      setCurrentRecordId(latestRecord.id);
      
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
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="section1">1. Certificado</TabsTrigger>
              <TabsTrigger value="section3">3. Instrumento</TabsTrigger>
              <TabsTrigger value="section15">15. Conclusão</TabsTrigger>
              <TabsTrigger value="section16">16. Assinaturas</TabsTrigger>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="certificateNumber">Número do Certificado</Label>
                      <Input 
                        id="certificateNumber"
                        {...form.register("certificateNumber")} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="issuingLaboratory">Laboratório Emissor</Label>
                      <Input 
                        id="issuingLaboratory"
                        {...form.register("issuingLaboratory")} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="issueDate">Data de Emissão</Label>
                      <Input 
                        id="issueDate"
                        type="date" 
                        {...form.register("issueDate")} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="calibrationDate">Data da Calibração</Label>
                      <Input 
                        id="calibrationDate"
                        type="date" 
                        {...form.register("calibrationDate")} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="calibrationValidity">Validade da Calibração</Label>
                      <Input 
                        id="calibrationValidity"
                        type="date" 
                        {...form.register("calibrationValidity")} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="technicalResponsible">Responsável Técnico</Label>
                      <Input 
                        id="technicalResponsible"
                        {...form.register("technicalResponsible")} 
                      />
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

            {/* Section 15: Final Conclusion */}
            <TabsContent value="section15">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckSquare className="text-blue-600 mr-3" size={24} />
                    15. APTIDÃO PARA USO E CONCLUSÃO FINAL
                  </CardTitle>
                  <p className="text-sm text-gray-600">Esta seção consolida a avaliação e a decisão.</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label className="text-lg font-semibold">Status Final:</Label>
                    <div className="flex space-x-6 mt-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="APROVADO"
                          {...form.register("finalStatus")}
                          className="mr-2"
                        />
                        <span className="text-green-700 font-medium">APROVADO</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="APROVADO COM RESSALVAS"
                          {...form.register("finalStatus")}
                          className="mr-2"
                        />
                        <span className="text-yellow-700 font-medium">APROVADO COM RESSALVAS</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="REJEITADO"
                          {...form.register("finalStatus")}
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
                    <FileText className="text-blue-600 mr-3" size={24} />
                    16. ASSINATURAS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4">Analista</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="analystName">Nome</Label>
                          <Input 
                            id="analystName"
                            {...form.register("analystName")} 
                          />
                        </div>
                        <div>
                          <Label htmlFor="analystDate">Data</Label>
                          <Input 
                            id="analystDate"
                            type="date" 
                            {...form.register("analystDate")} 
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-4">Aprovador</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="approverName">Nome</Label>
                          <Input 
                            id="approverName"
                            {...form.register("approverName")} 
                          />
                        </div>
                        <div>
                          <Label htmlFor="approverDate">Data</Label>
                          <Input 
                            id="approverDate"
                            type="date" 
                            {...form.register("approverDate")} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
          </Tabs>
        </form>
      </div>
    </div>
  );
}