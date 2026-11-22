# Gemini no assistente WhatsApp — 15/11/2026

## Implementado

O app.js agora seleciona o adaptador Gemini existente. O diagnóstico e os textos de consentimento no WhatsApp e no Mobile identificam Google Gemini. A chave permanece exclusivamente no backend. O adaptador Qwen foi preservado como alternativa de teste, sem seleção ou fallback automático.

O repositório grava e consulta ai_provider=gemini usando parâmetros SQL. Autorização anterior para Qwen não permite chamadas Gemini nem consumo da cota. O comando ia ativar registra o consentimento para o provedor atual; ia desativar o remove. Vincular outro número também limpa o consentimento.

Mantidos: webhook com assinatura HMAC, vínculo por sessão JWT, limite persistido de 12 solicitações por usuário/hora, timeout de 8 segundos, saída limitada, ausência de retries automáticos, validação financeira e fontes RAG locais. Toda movimentação exige confirmação com código; a IA não executa SQL nem confirma o próprio lançamento.

## Configurar para desenvolvimento

1. No Google AI Studio, selecionar projeto Free Tier sem faturamento vinculado e conferir cotas do modelo. Não cadastrar cartão nem clicar em Configurar faturamento para este piloto.
2. Criar chave privada específica para desenvolvimento. Nunca inserir a chave em código, chat, URL, EXPO_PUBLIC_*, VITE_* ou captura de tela.
3. Usar .env.assistant.local ignorado, somente no backend, com GEMINI_API_KEY, GEMINI_MODEL e GEMINI_ENABLED=true; manter QWEN_ENABLED=false. O servidor já lê esse arquivo apenas em desenvolvimento; variáveis da plataforma têm prioridade.
4. Executar npm.cmd run test:gemini --prefix backend: uma chamada de demonstração sem dados reais, telefone ou banco. Se a cota for recusada, manter o fluxo indisponível sem retry e sem ativar cobrança.
5. Para WhatsApp real, configurar separadamente os recursos Meta e WHATSAPP_*, banco de demonstração, migrações revisadas e webhook HTTPS. Não aplicar SQL no Supabase compartilhado como parte de teste local.

No Render, as variáveis ficam no serviço backend; o arquivo privado local não é lido em produção. Este trabalho não publica automaticamente a branch de teste nem habilita serviços externos.

## Conta e custos

Gemini usa conta Google e projeto/chave da API; não exige assinatura Business do Google Workspace nem Gemini pago para tentar o nível gratuito, sujeito à elegibilidade e disponibilidade de modelos. Conferir o plano efetivo no AI Studio, não inferir da assinatura do aplicativo Gemini. WhatsApp é separado e usa recursos WhatsApp Business Platform da Meta.

Cotas do app não são teto global de cobrança. Não vincular faturamento neste piloto. Usar exclusivamente dados fictícios no teste gratuito; os termos de tratamento de dados diferem do serviço pago.

## Verificação

- Testes do adaptador Gemini e consentimento: 14 aprovados.
- Ensaio backend/tests/whatsapp-gemini-integration.cjs: 20 verificações aprovadas com PostgreSQL portátil descartável, SQL e HTTP reais, Google e Meta simulados. Usa o adaptador Gemini real com transporte simulado. Confere consentimento Qwen recusado, proposta sem gravação, confirmação, reentrega, isolamento entre usuários, consumo Web/Mobile, RAG, cota e revogação.
- Mobile: 45 testes e TypeScript aprovados.
- Suíte backend completa: 75 testes aprovados, sem skips, incluindo recuperação em PostgreSQL descartável.
- Lint Web/backend aprovado.
- Configuração real Google, chamada externa e mensagens Meta devem ser registradas separadamente após sua execução. Não confundir esse ensaio com teste no aparelho ou publicação.

Fontes oficiais consultadas em 15/11/2026:
https://ai.google.dev/gemini-api/docs/billing
https://aistudio.google.com/docs/get-started
https://ai.google.dev/gemini-api/docs/structured-output
## Configuração e chamadas reais — 15/11/2026

Após autorização explícita, criada a chave MeuControleFinanceiro - desenvolvimento no Default Gemini Project. O painel confirmou Nível gratuito. Nenhum cartão foi cadastrado, faturamento não foi habilitado e nenhum serviço pago foi contratado.

Chave salva exclusivamente em .env.assistant.local, ignorado pelo Git; arquivo temporário removido. Gemini habilitado somente no desenvolvimento local, modelo gemini-3.5-flash-lite; Qwen desabilitado. Não houve alteração no Render nem publicação da branch.

O teste inicial com gemini-2.5-flash-lite retornou 404: a API informou que esse modelo não está disponível para novos usuários e indicou gemini-3.5-flash-lite. O painel confirmou cota gratuita do modelo selecionado (15 RPM, 250 mil TPM, 500 RPD no momento da consulta; valores podem mudar).

Testes reais aprovados:
- npm run test:gemini --prefix backend: pergunta sobre saldo respondida pelo Google Gemini com fonte RAG validada. Sem telefone, dados de usuário ou banco.
- Proposta financeira com Gemini real: mensagem fictícia de almoço de R$ 25,90 interpretada como despesa; nenhuma escrita antes do código de confirmação. Persistência e conta simuladas; sem banco e sem mensagem Meta.

Limites: a integração WhatsApp real ainda depende da configuração Meta, webhook HTTPS e banco de demonstração. Os testes Google reais não comprovam esses serviços nem funcionamento no aparelho. A chave não foi enviada ao Render, ao aplicativo ou ao repositório.