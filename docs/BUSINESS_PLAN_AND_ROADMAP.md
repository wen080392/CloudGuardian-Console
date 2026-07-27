# CloudGuardian - Business Plan & Roadmap

## 1. Roadmap Técnico

### ✅ O que já está funcionando (Core Engine)
- **Autenticação e Multi-Tenancy**: Sistema robusto pronto para isolar clientes e dados.
- **Integrações de CI/CD (GitHub Webhooks)**: Conexão com GitHub para interceptar PRs em tempo real.
- **Scanner de Infraestrutura (IaC)**: Detecção de vulnerabilidades no código (Terraform, etc.) via regras customizadas e base Checkov.
- **Motor de Políticas (OPA)**: Engine que avalia as configurações contra políticas customizadas usando Open Policy Agent.
- **Relatórios Executivos em PDF**: Geração de relatórios com gráficos (pizza, barras) em PDF com branding, prontos para a diretoria.
- **Armazenamento em Nuvem**: Módulo de S3 para salvar e recuperar evidências e PDFs gerados.
- **Notificações**: Integração modular com Slack, Teams e Email para disparar alertas sobre vulnerabilidades críticas e drift.
- **Visibilidade de Custos (FinOps)**: Integração inicial de estimativa de impacto de custo na infraestrutura.

### 🚧 O que falta para finalizar (Nível Enterprise - Next Steps)
1. **Filas Assíncronas (Workers)**: (Implementado nesta etapa) - Desacoplamento de rotinas pesadas (scans e PDFs) para não travar a API, vital para escala.
2. **Gestão Segura de Segredos (KMS)**: Usar AWS KMS ou similar para encriptar chaves de clientes no banco. Não podemos armazenar `access_key` em plain-text.
3. **Audit Logs (Trilha de Auditoria)**: Registro imutável de quem aprovou o quê, quem ignorou uma vulnerabilidade, etc. Obrigatório para certificações SOC2.
4. **Auto-Remediação**: Geração automática de pull requests com as correções (ex: `auto-fix` para permissões abertas no S3).

---

## 2. Plano de Negócios (Business Plan)

### A Dor do Mercado (O Problema que Resolvemos)
Empresas correm para a nuvem usando Terraform, Kubernetes e CloudFormation. Os desenvolvedores implantam rápido, mas a equipe de Segurança (SecOps) é um gargalo e só descobre as falhas *depois* que a infra já está rodando. Isso causa vazamentos, multas e falhas em auditorias (SOC2, ISO27001).

### A Proposta de Valor do CloudGuardian
**"Segurança invisível para o desenvolvedor, visibilidade total para o CISO."**
Atuamos na filosofia "Shift-Left": nós auditamos a infraestrutura e os custos *durante* o Pull Request. Bloqueamos erros antes de virarem contas milionárias ou vazamentos, e geramos automaticamente relatórios de compliance contínuos.

### Modelo de Monetização (SaaS B2B)

- **Developer / Starter (US$ 499 / mês)**
  - Foco: Startups Series A.
  - O que inclui: Até 50 desenvolvedores. Scans ilimitados, integração GitHub + Slack, políticas padrão (CIS Benchmarks).

- **Business / Growth (US$ 1.299 / mês)** 
  - Foco: Empresas em fase de certificação.
  - O que inclui: Até 200 desenvolvedores. Políticas OPA customizadas, relatórios automáticos SOC2 / HIPAA / ISO27001 em PDF, integração Jira/Teams.

- **Enterprise (A partir de US$ 5.000 / mês)**
  - Foco: Fintechs, Bancos, Empresas Reguladas.
  - O que inclui: Single Sign-On (SAML), Audit Logs imutáveis, KMS Customizado (Bring Your Own Key), implantação em nuvem privada/VPC, suporte 24/7.

### Estratégia de Tração (Como Atrair Clientes)
1. **Auditoria de 5 Minutos (Product-Led Growth)**: Permitir que o Lead conecte o repositório Terraform dele no site do CloudGuardian e, em 5 minutos, receba um "Executive Report" (o PDF que criamos) mostrando os riscos atuais. Isso converte a dor em ação.
2. **Foco na Certificação**: Vender diretamente para o CISO ou CTO. O gancho: "Não gaste 6 meses preparando evidências para sua auditoria SOC2. O CloudGuardian gera essas evidências toda semana automaticamente."
3. **Comunidade e Open Source**: Fornecer um set de políticas OPA gratuitas (Open Source) para a comunidade DevOps, o que gera adoção orgânica da nossa engine e atrai Leads para a versão SaaS Enterprise.
