# 🔍 Certificate Validator

Sistema avançado de validação e análise crítica de certificados de calibração, desenvolvido para garantir conformidade com ISO/IEC 17025, Portaria INMETRO 291/2021 e outros padrões metrológicos.

## 🚀 Funcionalidades

- ✅ **Análise Completa**: 17 seções de avaliação crítica
- 🔄 **Cálculo Automático**: Erros e conformidade segundo regra |Error| + U ≤ EMA
- 📊 **Export JSON**: Análise estruturada para relatórios
- 💾 **Auto-save**: Backup automático do progresso
- 🎨 **Interface Moderna**: UI responsiva com Tailwind CSS
- 📱 **PWA Ready**: Funciona offline como aplicativo nativo
- 🔧 **TypeScript**: Código type-safe e robusto

## 🛠️ Tecnologias

### Frontend

- **React 18** + **TypeScript**
- **Tailwind CSS** + **Radix UI**
- **React Query** para gerenciamento de estado
- **React Hook Form** + **Zod** para validação
- **Vite** para build otimizado

### Backend

- **Node.js** + **Express**
- **TypeScript** end-to-end
- **Drizzle ORM** para banco de dados
- **Zod** para validação de esquemas

### DevOps & Qualidade

- **ESLint** + **Prettier** para qualidade de código
- **Vitest** para testes unitários
- **GitHub Actions** para CI/CD
- **Service Worker** para PWA

## 📦 Instalação

### Pré-requisitos

- Node.js 18.x ou superior
- npm ou yarn

### Configuração

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/certificate-validator.git
cd certificate-validator

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute em desenvolvimento
npm run dev
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build e Produção
npm run build        # Build para produção
npm start           # Inicia servidor de produção

# Qualidade de Código
npm run check       # Verificação TypeScript
npm run lint        # ESLint com correção automática
npm run format      # Formatação com Prettier

# Testes
npm test           # Executa testes unitários
npm run test:watch # Testes em modo watch

# Banco de Dados
npm run db:push    # Aplica mudanças no schema
```

## 📖 Guia de Uso

### 1. Análise de Certificado

1. Acesse http://localhost:8080
2. Preencha as informações básicas do certificado
3. Navegue pelas 17 seções de análise
4. Use o cálculo automático na Seção 8 para validação de conformidade
5. Exporte o resultado em JSON

### 2. Funcionalidades Avançadas

#### Cálculo Automático (Seção 8)

- Digite valores de referência e medição
- Clique em "Calcular Erros Automaticamente"
- Sistema aplica regra |Error| + U ≤ EMA automaticamente
- Visualize conformidade com indicadores coloridos

#### Export de Análise

- Botão "Gerar Análise JSON" na Seção 8
- Relatório completo com conformidade detalhada
- Estrutura padronizada para integração

## 🏗️ Arquitetura

```
certificate-validator/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilitários
│   │   └── test/          # Setup de testes
├── server/                # Backend Node.js
│   ├── index.ts          # Servidor principal
│   ├── routes.ts         # Rotas da API
│   └── storage.ts        # Camada de dados
├── shared/               # Código compartilhado
│   └── schema.ts        # Schemas Zod/Drizzle
└── .github/             # GitHub Actions
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes específicos
npm test -- App.test.tsx

# Coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### Estrutura de Testes

- **Unit Tests**: Componentes individuais
- **Integration Tests**: Fluxos completos
- **E2E Tests**: Cenários de usuário (planejado)

## 🚀 Deploy

### Ambiente de Produção

```bash
# Build da aplicação
npm run build

# Iniciar em produção
npm start
```

### CI/CD

- **GitHub Actions** configurado para:
  - Testes automatizados
  - Build verification
  - Deploy automático na branch `main`

### Docker (Opcional)

```dockerfile
# Dockerfile exemplo
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

## 📊 Monitoramento

### Performance

- **Web Vitals** integrados
- **Error tracking** automático
- **Resource monitoring** para assets lentos

### Logs

- Ambiente desenvolvimento: logs detalhados
- Ambiente produção: logs essenciais apenas
- Integração com serviços de analytics (configurável)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Código

- Siga as configurações do ESLint/Prettier
- Escreva testes para novas funcionalidades
- Mantenha cobertura de testes acima de 80%
- Use commits semânticos

## 📋 Roadmap

### v2.0 (Planejado)

- [ ] Banco de dados PostgreSQL
- [ ] Autenticação e autorização
- [ ] Dashboard analytics
- [ ] Relatórios PDF avançados
- [ ] API REST completa
- [ ] Integração com laboratórios

### v1.1 (Em desenvolvimento)

- [x] PWA completo
- [x] Testes automatizados
- [x] CI/CD pipeline
- [ ] Backup automático na nuvem
- [ ] Notificações push

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/certificate-validator/issues)
- **Email**: suporte@certificatevalidator.com
- **Documentação**: [docs.certificatevalidator.com](https://docs.certificatevalidator.com)

---

⭐ **Se este projeto foi útil, considere dar uma estrela no GitHub!**

## 🌐 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Conecte seu repositório no [Vercel](https://vercel.com)
3. O deploy será automático a cada push

### Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build para produção
npm start        # Executar produção
npm run test     # Executar testes
npm run lint     # Verificar código
npm run format   # Formatar código
```

## 📁 Estrutura do Projeto

```
certificate-validator/
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes UI
│   │   ├── hooks/       # Hooks customizados
│   │   ├── lib/         # Utilitários
│   │   └── pages/       # Páginas
│   └── public/      # Arquivos estáticos
├── server/          # Backend Express
│   ├── index.ts     # Servidor principal
│   ├── routes.ts    # Rotas da API
│   └── storage.ts   # Gerenciamento de dados
├── shared/          # Tipos compartilhados
└── vercel.json      # Configuração Vercel
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` (para desenvolvimento) com:

```env
NODE_ENV=development
PORT=8080
```

### Para produção no Vercel:

As variáveis são configuradas automaticamente. Adicione variáveis customizadas no painel do Vercel se necessário.

## 📊 Características Técnicas

- **Hot Reload**: Desenvolvimento com recarregamento automático
- **TypeScript**: Tipagem estática em todo projeto
- **Responsivo**: Interface adaptável a todos dispositivos
- **Acessível**: Componentes com padrões de acessibilidade
- **Performance**: Bundle otimizado e lazy loading
- **SEO**: Meta tags e estrutura semântica

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Status

🟢 **Em produção** - Acesse: [certificate-validator.vercel.app](https://certificate-validator.vercel.app)

---

Desenvolvido com ❤️ para análise profissional de certificados de calibração.
