// Monitoramento de Web Vitals
export interface PerformanceMetrics {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
}

// Thresholds baseados nas recomendações do Google
const THRESHOLDS = {
  FCP: [1800, 3000], // First Contentful Paint
  LCP: [2500, 4000], // Largest Contentful Paint
  FID: [100, 300], // First Input Delay
  CLS: [0.1, 0.25], // Cumulative Layout Shift
  TTFB: [800, 1800], // Time to First Byte
};

export function getRating(
  name: string,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!thresholds) return "good";

  if (value <= thresholds[0]) return "good";
  if (value <= thresholds[1]) return "needs-improvement";
  return "poor";
}

export function logMetric(metric: PerformanceMetrics) {
  if (process.env.NODE_ENV === "development") {
    console.log(`📊 Performance: ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Em produção, enviar para serviço de analytics
  if (process.env.NODE_ENV === "production") {
    // Exemplo: enviar para Google Analytics, DataDog, etc.
    sendToAnalytics(metric);
  }
}

function sendToAnalytics(metric: PerformanceMetrics) {
  // Implementar envio para serviço de analytics
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as any).gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ),
      non_interaction: true,
    });
  }
}

// Monitor de erros JavaScript
export function setupErrorMonitoring() {
  window.addEventListener("error", (event) => {
    if (process.env.NODE_ENV === "production") {
      console.error("Erro JavaScript:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (process.env.NODE_ENV === "production") {
      console.error("Promise rejeitada:", {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    }
  });
}

// Monitor de recursos
export function monitorResourceLoading() {
  if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes(".js") || entry.name.includes(".css")) {
          const resourceEntry = entry as PerformanceResourceTiming;
          const loadTime =
            resourceEntry.responseEnd - resourceEntry.requestStart;
          if (loadTime > 1000) {
            // Recursos que demoram mais de 1s
            console.warn(`Recurso lento: ${entry.name} - ${loadTime}ms`);
          }
        }
      });
    });

    observer.observe({ entryTypes: ["resource"] });
  }
}
