import React, { useState, useEffect } from 'react';
import { Palette, Sun, Moon, Sparkles, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Theme = 'default' | 'modern' | 'soft' | 'professional' | 'dark';

interface ThemeOption {
  id: Theme;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const themes: ThemeOption[] = [
  {
    id: 'default',
    name: 'Padrão',
    icon: <Sun className="w-4 h-4" />,
    description: 'Tema original da aplicação'
  },
  {
    id: 'modern',
    name: 'Moderno',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Gradientes vibrantes e animados'
  },
  {
    id: 'soft',
    name: 'Suave',
    icon: <Palette className="w-4 h-4" />,
    description: 'Cores suaves e relaxantes'
  },
  {
    id: 'professional',
    name: 'Profissional',
    icon: <Briefcase className="w-4 h-4" />,
    description: 'Visual corporativo elegante'
  },
  {
    id: 'dark',
    name: 'Escuro',
    icon: <Moon className="w-4 h-4" />,
    description: 'Tema escuro moderno'
  }
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('default');

  useEffect(() => {
    // Carrega o tema salvo do localStorage
    const savedTheme = localStorage.getItem('certificate-validator-theme') as Theme;
    if (savedTheme && themes.find(t => t.id === savedTheme)) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (theme: Theme) => {
    // Remove todas as classes de tema do body
    document.body.classList.remove(
      'modern-gradient',
      'soft-gradient', 
      'professional-theme',
      'dark-elegant'
    );

    // Adiciona a classe do tema selecionado
    switch (theme) {
      case 'modern':
        document.body.classList.add('modern-gradient');
        break;
      case 'soft':
        document.body.classList.add('soft-gradient');
        break;
      case 'professional':
        document.body.classList.add('professional-theme');
        break;
      case 'dark':
        document.body.classList.add('dark-elegant');
        break;
      default:
        // Tema padrão - remove todas as classes
        break;
    }

    // Aplica melhorias de glassmorphism em containers
    const containers = document.querySelectorAll('.app-container');
    containers.forEach(container => {
      if (theme !== 'default') {
        container.classList.add('enhanced-glass', 'floating-card');
      } else {
        container.classList.remove('enhanced-glass', 'floating-card');
      }
    });

    // Aplica estilos modernos aos elementos
    const cards = document.querySelectorAll('[class*="card"], .card');
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input, textarea, select');
    const tabs = document.querySelectorAll('[role="tablist"]');

    if (theme !== 'default') {
      cards.forEach(card => card.classList.add('enhanced-hover', 'smooth-appear'));
      buttons.forEach(btn => {
        if (!btn.classList.contains('text-sm')) { // Evita botões pequenos
          btn.classList.add('modern-button');
        }
      });
      inputs.forEach(input => input.classList.add('modern-input'));
      tabs.forEach(tab => tab.classList.add('modern-tabs'));
    } else {
      cards.forEach(card => card.classList.remove('enhanced-hover', 'smooth-appear'));
      buttons.forEach(btn => btn.classList.remove('modern-button'));
      inputs.forEach(input => input.classList.remove('modern-input'));
      tabs.forEach(tab => tab.classList.remove('modern-tabs'));
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    localStorage.setItem('certificate-validator-theme', theme);
  };

  const currentThemeOption = themes.find(t => t.id === currentTheme);

  return (
    // Container com funcionalidade de auto-ocultar
    <div className="group relative">
      {/* Área invisível para trigger do hover */}
      <div className="w-16 h-8 bg-transparent hover:bg-white/10 rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100">
        <Palette className="h-4 w-4 text-white/40 group-hover:text-white/80" />
      </div>

      {/* Botão que aparece no hover */}
      <div className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-all duration-300"
            >
              {currentThemeOption?.icon}
              <span className="hidden sm:inline">Tema</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {themes.map((theme) => (
              <DropdownMenuItem
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`flex items-center gap-3 p-3 cursor-pointer ${
                  currentTheme === theme.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <div className="flex items-center gap-2 flex-1">
                  {theme.icon}
                  <div className="flex flex-col">
                    <span className="font-medium">{theme.name}</span>
                    <span className="text-xs text-gray-500">{theme.description}</span>
                  </div>
                </div>
                {currentTheme === theme.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 