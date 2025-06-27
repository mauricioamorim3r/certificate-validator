import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  useRegulatoryData,
  useSearchMaxUncertainty,
  useSearchCalibrationPeriodicity,
} from "@/hooks/useRegulatoryData";

interface RegulatoryReferenceProps {
  onSelectReference?: (reference: any) => void;
  className?: string;
}

export function RegulatoryReference({
  onSelectReference,
  className,
}: RegulatoryReferenceProps) {
  const [activeTab, setActiveTab] = useState("uncertainties");
  const [searchCategory, setSearchCategory] = useState<
    "petroleum" | "natural_gas"
  >("petroleum");
  const [searchSystem, setSearchSystem] = useState("");
  const [searchInstrument, setSearchInstrument] = useState("");

  const {
    maxUncertaintySystems,
    maxUncertaintyComponents,
    inspectionPeriodicities,
    calibrationPeriodicitiesGas,
    calibrationPeriodicitiesPetroleum,
    isLoading,
  } = useRegulatoryData();

  const maxUncertaintySearch = useSearchMaxUncertainty(
    searchSystem,
    searchCategory,
    searchSystem.length > 3
  );

  const calibrationSearch = useSearchCalibrationPeriodicity(
    searchInstrument,
    searchCategory,
    undefined,
    searchInstrument.length > 3
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Base de Dados Regulatórias
          </CardTitle>
          <CardDescription>Carregando dados regulatórios...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Base de Dados Regulatórias
        </CardTitle>
        <CardDescription>
          Consulte as regras regulatórias para análise de conformidade dos
          certificados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="uncertainties">Incertezas</TabsTrigger>
            <TabsTrigger value="components">Componentes</TabsTrigger>
            <TabsTrigger value="inspection">Inspeção</TabsTrigger>
            <TabsTrigger value="calibration">Calibração</TabsTrigger>
            <TabsTrigger value="search">Busca</TabsTrigger>
          </TabsList>

          <TabsContent value="uncertainties" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Incertezas Máximas dos Sistemas de Medição
              </h3>
              <div className="space-y-2">
                {maxUncertaintySystems.data?.map((system) => (
                  <Card key={system.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {system.measurementSystem}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {system.maxUncertainty}
                          </Badge>
                          <Badge
                            variant={
                              system.category === "petroleum"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {system.category === "petroleum"
                              ? "Petróleo"
                              : "Gás Natural"}
                          </Badge>
                        </div>
                        {system.notes && (
                          <p className="text-xs text-gray-600 mt-2">
                            {system.notes}
                          </p>
                        )}
                      </div>
                      {onSelectReference && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectReference(system)}
                        >
                          Usar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Incertezas Máximas dos Componentes
              </h3>
              <div className="space-y-2">
                {maxUncertaintyComponents.data?.map((component) => (
                  <Card key={component.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {component.component}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                          {component.meshUncertainty && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                Incerteza da Malha
                              </Label>
                              <p className="text-xs">
                                {component.meshUncertainty}
                              </p>
                            </div>
                          )}
                          <div>
                            <Label className="text-xs text-gray-500">
                              Incerteza Máxima
                            </Label>
                            <p className="text-xs font-medium">
                              {component.maxAdmittedUncertainty}
                            </p>
                          </div>
                          {component.repeatability && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                Repetibilidade
                              </Label>
                              <p className="text-xs">
                                {component.repeatability}
                              </p>
                            </div>
                          )}
                        </div>
                        {component.notes && (
                          <p className="text-xs text-gray-600 mt-2">
                            {component.notes}
                          </p>
                        )}
                      </div>
                      {onSelectReference && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectReference(component)}
                        >
                          Usar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inspection" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Periodicidade de Inspeções
              </h3>
              <div className="space-y-2">
                {inspectionPeriodicities.data?.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.instrument}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {item.fiscal && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                Fiscal
                              </Label>
                              <p className="text-xs font-medium">
                                {item.fiscal}
                              </p>
                            </div>
                          )}
                          {item.appropriation && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                Apropriação
                              </Label>
                              <p className="text-xs font-medium">
                                {item.appropriation}
                              </p>
                            </div>
                          )}
                          {item.custodyTransferProduced && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                Trans. Custódia Prod.
                              </Label>
                              <p className="text-xs font-medium">
                                {item.custodyTransferProduced}
                              </p>
                            </div>
                          )}
                          {item.custodyTransferProcessed && (
                            <div>
                              <Label className="text-xs text-gray-500">
                                Trans. Custódia Proc.
                              </Label>
                              <p className="text-xs font-medium">
                                {item.custodyTransferProcessed}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {onSelectReference && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectReference(item)}
                        >
                          Usar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calibration" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Periodicidade de Calibração
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Gás Natural</h4>
                  <div className="space-y-2">
                    {calibrationPeriodicitiesGas.data?.map((item) => (
                      <Card key={item.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {item.instrument}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Fiscal
                                </Label>
                                <p className="text-xs font-medium">
                                  {item.fiscal}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Apropriação
                                </Label>
                                <p className="text-xs font-medium">
                                  {item.appropriation}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Trans. Custódia Prod.
                                </Label>
                                <p className="text-xs font-medium">
                                  {item.custodyTransferProduced}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Trans. Custódia Proc.
                                </Label>
                                <p className="text-xs font-medium">
                                  {item.custodyTransferProcessed}
                                </p>
                              </div>
                            </div>
                          </div>
                          {onSelectReference && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectReference(item)}
                            >
                              Usar
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Petróleo</h4>
                  <div className="space-y-2">
                    {calibrationPeriodicitiesPetroleum.data?.map((item) => (
                      <Card key={item.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {item.instrumentAndMeasures}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Tipo de Aplicação
                                </Label>
                                <p className="text-xs">
                                  {item.applicationType}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Fiscal
                                </Label>
                                <p className="text-xs font-medium">
                                  {item.fiscal}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Apropriação
                                </Label>
                                <p className="text-xs font-medium">
                                  {item.appropriation}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">
                                  Trans. Custódia
                                </Label>
                                <p className="text-xs font-medium">
                                  {item.custodyTransfer}
                                </p>
                              </div>
                            </div>
                          </div>
                          {onSelectReference && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectReference(item)}
                            >
                              Usar
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Busca Inteligente</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Buscar Incerteza Máxima
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="search-category">Categoria</Label>
                      <select
                        id="search-category"
                        value={searchCategory}
                        onChange={(e) =>
                          setSearchCategory(
                            e.target.value as "petroleum" | "natural_gas"
                          )
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="petroleum">Petróleo</option>
                        <option value="natural_gas">Gás Natural</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="search-system">Sistema de Medição</Label>
                      <Input
                        id="search-system"
                        placeholder="Digite parte da descrição do sistema..."
                        value={searchSystem}
                        onChange={(e) => setSearchSystem(e.target.value)}
                      />
                    </div>
                    {maxUncertaintySearch.data && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        {maxUncertaintySearch.data.maxUncertainty ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">
                              Incerteza máxima encontrada:{" "}
                              <strong>
                                {maxUncertaintySearch.data.maxUncertainty}
                              </strong>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">
                              Nenhuma correspondência encontrada
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Buscar Periodicidade de Calibração
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="search-instrument">Instrumento</Label>
                      <Input
                        id="search-instrument"
                        placeholder="Digite parte da descrição do instrumento..."
                        value={searchInstrument}
                        onChange={(e) => setSearchInstrument(e.target.value)}
                      />
                    </div>
                    {calibrationSearch.data && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        {calibrationSearch.data.periodicity ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">
                              Periodicidade encontrada:{" "}
                              <strong>
                                {calibrationSearch.data.periodicity}
                              </strong>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">
                              Nenhuma correspondência encontrada
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
