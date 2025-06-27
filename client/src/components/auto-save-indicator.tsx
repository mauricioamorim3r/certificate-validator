import React from "react";
import { useEffect, useState } from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";

interface AutoSaveIndicatorProps {
  lastSaved?: Date;
  hasUnsavedChanges?: boolean;
}

export function AutoSaveIndicator({
  lastSaved,
  hasUnsavedChanges,
}: AutoSaveIndicatorProps) {
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");

  useEffect(() => {
    if (hasUnsavedChanges) {
      setStatus("saving");
      const timer = setTimeout(() => setStatus("saved"), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges]);

  const getIcon = () => {
    switch (status) {
      case "saving":
        return <Save className="animate-pulse text-blue-500" size={16} />;
      case "error":
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <CheckCircle className="text-green-500" size={16} />;
    }
  };

  const getText = () => {
    switch (status) {
      case "saving":
        return "Salvando...";
      case "error":
        return "Erro ao salvar";
      default:
        return lastSaved
          ? `Salvo ${lastSaved.toLocaleTimeString()}`
          : "Dados salvos";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg px-3 py-2 shadow-lg flex items-center space-x-2 text-sm">
      {getIcon()}
      <span className="text-gray-700">{getText()}</span>
    </div>
  );
}
