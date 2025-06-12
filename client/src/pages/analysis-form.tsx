import { useState } from "react";
import { IdCard, Save, FolderOpen, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ComprehensiveAnalysisForm from "@/components/comprehensive-analysis-form";

export default function AnalysisForm() {
  const { toast } = useToast();
  const [userInfo] = useState("Sistema");

  return (
    <>
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <IdCard className="text-blue-600 text-2xl mr-3" size={32} />
              <h1 className="text-xl font-bold text-gray-900">Sistema de Análise Crítica</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Usuário: {userInfo}</span>
              <Button className="btn-primary">
                <Save className="mr-2" size={16} />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-screen" style={{ backgroundColor: 'var(--app-bg)' }}>
        <div className="max-w-7xl mx-auto p-6">
          <ComprehensiveAnalysisForm />

          {/* Footer */}
          <footer className="text-center mt-8 text-sm text-gray-600">
            <p>Sistema de Análise Crítica de Certificados v2.1 | Conforme Portaria INMETRO 291/2021 e ISO/IEC 17025</p>
            <p className="mt-2">Desenvolvido para garantir a conformidade metrológica</p>
          </footer>
        </div>
      </div>
    </>
  );
}
