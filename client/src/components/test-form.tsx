import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function TestForm() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Formulário Básico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test1">Campo de Teste 1</Label>
              <Input id="test1" placeholder="Digite algo aqui" />
            </div>
            <div>
              <Label htmlFor="test2">Campo de Teste 2</Label>
              <Input id="test2" placeholder="Digite algo aqui" />
            </div>
            <Button>Botão de Teste</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}