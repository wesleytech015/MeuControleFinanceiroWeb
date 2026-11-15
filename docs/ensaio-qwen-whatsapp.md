# Ensaio de viabilidade WhatsApp + Qwen + RAG

Executado em 14/11/2026 na branch feature/whatsapp-vercel-academico.

Resultado: 20 verificações aprovadas. PostgreSQL 17 real, container descartável,
porta aleatória restrita a loopback, cadastro/login JWT, consultas e gravações reais.
Meta e Qwen simulados: o adaptador Qwen e o processador WhatsApp foram executados,
mas as respostas do modelo e o transporte de mensagens foram substituídos por fixtures.
O serviço do Dashboard Mobile e o normalizador Web consumiram os dados persistidos.
Não houve execução de interface Web/Mobile neste ensaio, chamada Alibaba, mensagem
real Meta ou acesso ao Supabase da equipe. Não comprova qualidade do modelo em português.

Cenário: uma despesa de R$ 25,90, proposta sem escrita, código inválido recusado,
confirmação válida, uma única gravação após reentrega. Outra conta sem acesso ao registro.
Consentimento antigo Gemini recusado; Qwen exige ativação específica. Limite persistido
no banco impediu chamada extra; revogação interrompeu chamadas e desvínculo preservou
movimentações já confirmadas. RAG local recuperou fonte válida.

Verificações executadas:

- schema e quatro migrações aplicados somente no container descartável
- cadastro e login reais de duas contas isoladas
- assinatura ausente recusada antes de processar
- vínculo real com código e JWT
- consentimento antigo Gemini não autoriza Qwen
- consentimento Qwen ainda ausente
- consentimento Qwen persistido
- proposta sem gravação antes de confirmar
- uma chamada pelo adaptador Qwen simulado
- reentrega não repete IA
- código errado não grava
- confirmação e reentrega resultam em uma gravação exata
- API reflete despesa e saldo negativo
- outra conta não vê a movimentação
- serviço real do Dashboard Mobile lê o lançamento persistido
- normalizador real do Web aceita os mesmos dados
- RAG recupera fonte e produz resposta pelo adaptador Qwen
- cota persistida no PostgreSQL bloqueia chamada adicional
- revogação impede chamada posterior
- desvínculo remove acesso e mantém lançamento

## Reproduzir

Requer Node 24, Docker em execução, imagem postgres:17 e dependências instaladas.
A partir da raiz Web/backend, configurar MOBILE_TEST_ROOT com o checkout Mobile que
contém tests/helpers/load-typescript.cjs, caso ele não esteja dois diretórios acima:

```powershell
$env:MOBILE_TEST_ROOT="CAMINHO_ABSOLUTO_DO_MOBILE"
node backend/tests/whatsapp-qwen-integration.cjs
```

O teste cria e remove somente seu próprio container, com senha aleatória não impressa.
Artefato sem credenciais em node_modules/.cache/qwen-rehearsal/result.json, ignorado.
A configuração local anterior do backend não foi reescrita; esse container não é um banco
permanente. A suíte backend também passou: 54 aprovados e um teste específico da recuperação
PostgreSQL pulado por ausência de initdb (independente deste ensaio Docker).

## O que ainda precisa ser comprovado

- Conta Alibaba, cota gratuita/Free Quota Only e resposta real do modelo selecionado.
- Configuração Meta, webhook HTTPS e recebimento/envio reais.
- Banco de demonstração persistente, migrações revisadas e publicação autorizada.
- Fluxo visual no Web e no aparelho com esses serviços reais e dados descartáveis.

Nenhuma alteração no TCC, push, deploy ou migração no banco compartilhado.
