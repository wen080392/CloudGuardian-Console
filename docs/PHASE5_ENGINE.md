# Fase 5 — Motor Real e Confiança

A confiança num produto de segurança está na credibilidade do motor de
detecção. Esta fase eliminou o comportamento que mais minava essa confiança:
o scanner **fingir** resultados e o webhook aceitar payloads não verificados.

## O que mudou

### 1. Fim do fallback simulado enganoso

Antes, quando o Checkov não estava instalado, o scanner retornava duas regras
hardcoded (`simulateScan`) **rotuladas como se fossem resultado real** de um
scan. Em uma ferramenta de compliance, isso é inaceitável: o cliente tomaria
decisões com base em dados fabricados.

Agora existe uma cadeia de engines explícita, e todo resultado carrega o campo
`engine` que diz exatamente como foi produzido:

| `SCAN_RUNNER` | Comportamento |
|---|---|
| `auto` (padrão) | Usa Checkov se estiver no PATH; senão, o engine nativo |
| `checkov` | Força Checkov no host (falha se ausente) |
| `docker` | Roda Checkov em container isolado (recomendado em produção) |

O campo `engine` (`checkov` \| `checkov-docker` \| `native`) é persistido no
modelo `Scan`, retornado pela API e exibido no comentário do PR. Nunca se
apresenta um resultado nativo como se fosse Checkov.

### 2. Motor nativo real (`services/nativeEngine.ts`)

Não é simulação: faz parsing de blocos `resource` do HCL (balanceando chaves
para capturar blocos aninhados) e avalia um rulepack real, alinhado a IDs do
Checkov/CIS. Regras atuais: S3 público/sem logging, SSH/RDP abertos ao mundo,
RDS público/sem criptografia, EBS sem criptografia, credenciais AWS hardcoded,
listener HTTP sem TLS. É extensível — cada regra é uma função pura testável.

Serve como baseline honesto quando o Checkov não está disponível, e é 100%
coberto por testes (`tests/nativeEngine.test.ts`).

### 3. Runner do Checkov isolado em container

`docker/checkov-runner.Dockerfile` empacota o Checkov. Com `SCAN_RUNNER=docker`,
a API executa o código do cliente num container efêmero **sem rede,
read-only, sem novos privilégios, sem capabilities, com limites de CPU/memória
e de PIDs**:

```
docker run --rm --network none --read-only \
  --security-opt no-new-privileges --cap-drop ALL --pids-limit 512 \
  --memory 512m --cpus 1 --tmpfs /tmp \
  -v <dir>:/tf:ro <CHECKOV_IMAGE> -d /tf -o json --compact --quiet
```

Os argumentos são montados por `buildCheckovDockerArgs` (função pura, testada
em `tests/checkovDocker.test.ts`) e compartilhados pelos **dois** fluxos:

- **snippet** (Scanner da UI): `runCheckovDocker` grava o código num tempdir e o monta.
- **repositório** (webhook de PR): `runCheckovAndSave` monta o repo clonado —
  antes ele rodava o Checkov direto no host sobre um repositório **não
  confiável**; agora, com `SCAN_RUNNER=docker`, roda na sandbox isolada.

Symlinks dentro do repo apontando para fora de `/tf` são inertes: o filesystem
do host não é montado no container, então directory traversal via symlink não
resolve. Isso resolve o risco de rodar IaC de terceiros no host da API.

**Produção:** fixe a imagem por digest (`CHECKOV_IMAGE=bridgecrew/checkov@sha256:…`)
em vez de `:latest`, para builds reprodutíveis e imunes a um push malicioso na tag.

### 4. Webhook do GitHub fail-closed

Antes, o webhook logava "assinatura inválida" e **seguia processando** — ou
seja, qualquer um podia forjar um evento de PR e disparar scans/clones. Agora
`verifyGithubSignature` faz verificação HMAC-SHA256 **timing-safe** e é
fail-closed: sem `GITHUB_WEBHOOK_SECRET` ou com assinatura divergente, retorna
`401`. Coberto por `tests/githubWebhook.test.ts`.

### 5. Clone de PR sem injeção de shell

O worker de PR trocou `exec` com string interpolada por `execFile` com
argumentos separados, valida `repoUrl`/`prNumber` antes de tocar no shell e
limpa o diretório temporário no `finally`.

## Pendências para produção

- **Distribuir a fila**: `queueService` ainda é em memória (perde jobs em
  restart). Migrar para Redis/BullMQ.
- **Publicar o GitHub App** e validar o fluxo de PR ponta a ponta.
- **Conectar clouds reais**: drift (`terraform plan --refresh-only`) e FinOps
  (Cost Explorer) continuam com dados simulados nas telas.
- **Fixar a imagem do Checkov por digest** em produção (hoje usa `:latest`).
