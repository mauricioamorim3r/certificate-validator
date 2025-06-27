import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import ComprehensiveAnalysisForm from "@/components/comprehensive-analysis-form";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <ComprehensiveAnalysisForm />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
