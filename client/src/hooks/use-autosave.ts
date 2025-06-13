import { useEffect, useRef } from 'react';

export function useAutoSave(data: any, key: string, intervalMs: number = 10000) {
  const lastSaveRef = useRef<string>('');

  useEffect(() => {
    // Salvar dados imediatamente se mudaram
    const dataString = JSON.stringify(data);
    if (dataString !== lastSaveRef.current) {
      try {
        localStorage.setItem(key, dataString);
        lastSaveRef.current = dataString;
      } catch (error) {
        console.warn('Erro ao salvar:', error);
      }
    }
  }, [data, key]);

  useEffect(() => {
    // Salvamento periódico
    const interval = setInterval(() => {
      try {
        const dataString = JSON.stringify(data);
        localStorage.setItem(key, dataString);
        lastSaveRef.current = dataString;
      } catch (error) {
        console.warn('Erro no salvamento automático:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [data, key, intervalMs]);

  // Carregar dados salvos
  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Erro ao carregar dados:', error);
      return null;
    }
  };

  return { loadSavedData };
}