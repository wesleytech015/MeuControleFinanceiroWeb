# Protótipo acadêmico: WhatsApp e API na Vercel

## Entrega e limites

Este piloto conecta a Cloud API oficial a este backend Express, sem contratar IA ou intermediário de mensagens. O interpretador usa regras, não um modelo de IA. Aceita despesas, receitas, consulta de resumo, confirmação e cancelamento. O aplicativo continua consultando `/api/transacoes` com sua sessão JWT real.

Não há deploy automático, conta Meta criada, mensagens enviadas ou promessa de gratuidade de produção nesta entrega. Confirmar as condições atuais do número de teste no painel Meta antes da demonstração. Configurações pessoais ficam somente no ambiente do servidor. Não integrar pelo WhatsApp Web.

## Preparar o banco

Em um banco de demonstração identificado, com o schema já existente, revisar e aplicar explicitamente `backend/database/migrations/20261108_whatsapp.sql`. A migração acrescenta três tabelas e não altera as tabelas financeiras. `usuarios` e `movimentacoes` precisam usar InnoDB para que gravação e deduplicação compartilhem a mesma transação.

Não executar a migração em banco compartilhado sem coordenação. O deploy não cria tabelas, não recupera o Aiven e não publica as correções anteriores da API. Revisar as correções herdadas da branch `fix/security-local-api` antes de integrar este trabalho à equipe.

Vínculos e propostas duram entre requisições porque ficam no MySQL. Códigos de vínculo são aleatórios, armazenados como hash e válidos por dez minutos. Propostas têm outro código de confirmação e expiram em dez minutos. Cada ID de mensagem recebido é registrado com a gravação financeira na mesma transação: uma reentrega não repete o lançamento.

## Configurar a Meta

1. Criar/configurar o app com o caso de uso WhatsApp no painel Meta e selecionar seus recursos de teste.
2. Autorizar os números participantes conforme as regras do ambiente de teste. Usar conta e dados de demonstração.
3. Configurar no servidor `WHATSAPP_ENABLED=true`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (segredo próprio para o desafio), `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_GRAPH_VERSION` (versão disponível no painel, por exemplo no snippet de envio).
4. Manter `WHATSAPP_TIMEZONE=America/Sao_Paulo`, ou escolher explicitamente outro fuso IANA. A data omitida vem desse fuso, não da hora UTC da função. Não há data abreviada com ano inferido.
5. Cadastrar callback `https://SEU-PROJETO.vercel.app/api/whatsapp/webhook`, usando o mesmo verify token, e assinar eventos `messages` da conta WhatsApp. O GET valida o desafio; o POST valida HMAC SHA-256 dos bytes originais com o App Secret.

Tokens temporários da Meta expiram: conferir validade antes da apresentação. Nunca colocar credenciais Meta/JWT/MySQL no mobile, em `EXPO_PUBLIC_*`, no Git, em capturas ou em links de WhatsApp. O token da Meta não substitui a sessão JWT de um usuário.

## Vincular uma conta e demonstrar

Esta etapa fornece endpoints e o serviço `whatsappService.ts` no mobile; não acrescenta uma tela de vínculo ao aplicativo. Para o piloto, fazer o vínculo por um cliente HTTP, como Postman:

1. Cadastrar/entrar normalmente em `/api/usuarios` e `/api/login` com uma conta de demonstração.
2. Com o Bearer JWT dessa conta, enviar `POST /api/whatsapp/vinculo` com JSON `{ "numero": "5511999990000" }`. O número é ilustrativo; substituir pelo participante autorizado, com DDI/DDD e somente dígitos. Não enviar `usuario_id`: a conta vem do JWT.
3. A resposta contém `codigo`, `comando` e `expiraEmSegundos: 600`. Do mesmo número informado, enviar o comando `vincular CODIGO` ao número de teste da Meta. Não compartilhar o código com terceiros.
4. Enviar `compra 15 reais frutas`. O bot propõe despesa de R$ 15,00, a data local completa e categoria Alimentação. A categoria é apenas uma regra simples e aparece antes da confirmação.
5. Responder `confirmar CODIGO_DA_PROPOSTA` ou `sim CODIGO_DA_PROPOSTA`. Só então a movimentação é gravada. `sim` sozinho não confirma: o código evita confirmar outra proposta por engano.
6. Atualizar o Dashboard no aplicativo e conferir o lançamento real. Enviar `resumo` mostra receitas, despesas e saldo de todo o período; não equivale ao saldo bancário.
7. `cancelar` remove a proposta pendente. Não substituímos uma proposta ativa silenciosamente. Para corrigir antes de salvar, cancelar e enviar outra.

Comandos adicionais:

```text
despesa 25,90 almoço
recebi 500 trabalho | categoria=Freelance | data=07/11/2026
despesa 32 ônibus | categoria=Transporte
ajuda
resumo
cancelar
```

Não usar separadores de milhar. Data explícita deve ter DD/MM/AAAA. Não há suporte a áudio, comprovantes, linguagem livre genérica, notificações proativas, exclusão ou edição pelo chat. Consulta autenticada `GET /api/whatsapp/vinculo` informa somente status e final mascarado. `DELETE /api/whatsapp/vinculo` revoga vínculo, código e proposta; não apaga movimentações já confirmadas. Um número não pode ser tomado de outra conta com novo código.

## Vercel

Publicar o repositório backend por PR conforme o fluxo da equipe e importar a branch revisada na Vercel, com **Root Directory: backend**, Node.js 24 e framework Express. `backend/app.js` exporta a aplicação sem abrir porta; `npm start` continua funcionando localmente via `server.js`. `backend/vercel.json` declara Express. Preservar `backend/package-lock.json` e usar `npm ci` na instalação.

Configurar as variáveis da `.env.example` no painel. `NODE_ENV=production`, MySQL externo acessível, `DB_SSL=true` e `JWT_SECRET` próprio são obrigatórios. Na Vercel, `DB_CA_PEM` aceita o conteúdo completo do certificado CA do Aiven, inclusive com `\n` literais. Isso evita depender de um Secret File específico do Render. TLS continua verificando o certificado. `DB_CA_PATH` permanece como alternativa para execução local/Render.

O pool usa até duas conexões por instância quando `VERCEL` está definido. Não é um limite global: conferir conexões disponíveis no banco e concorrência do serviço. Nenhum estado da conversa depende da memória da função. O limitador de login herdado ainda usa memória e não garante um limite global entre funções; antes de um piloto público, revisar armazenamento compartilhado e topologia de proxy conforme `docs/seguranca.md`.

O webhook precisa ser acessível à Meta sem tela de login de preview; confirmar a política da URL implantada. Abrir `/api/teste` valida HTTP, não o banco nem o WhatsApp. Testar cadastro/login, transações e isolamento após o deploy. Na configuração local ignorada do mobile: `EXPO_PUBLIC_API_URL=https://SEU-PROJETO.vercel.app/api` e `EXPO_PUBLIC_AUTH_MODE=api`, reiniciando Expo depois. As despesas do WhatsApp e a hospedagem têm condições de cobrança separadas; o plano Hobby da Vercel é destinado a uso pessoal não comercial.

## Retentativas e dados

Envio da resposta é aguardado antes de terminar a função. Falha retorna HTTP 503; a reentrega reaproveita o processamento persistido. Uma lease no banco evita envios simultâneos da mesma resposta. Se a Meta aceitar uma resposta mas o processo falhar antes de marcar `sent_at`, a resposta de chat pode se repetir; a movimentação não deve se repetir. Não se promete entrega exatamente uma vez.

Mensagens com timestamp anterior a quinze minutos não executam comandos. Respostas pendentes deixam de ser entregues após quinze minutos. Não há worker de reenvio independente: após falha, o piloto depende da reentrega de webhook. Usar um novo comando para retomar se a janela passar.

O diário contém telefone e texto da resposta (inclusive descrição e valor): é dado privado. Não registrar payloads em logs. Para o piloto, revisar retenção e remover por processo controlado diários com mais de trinta dias, sem apagar dados financeiros; a barreira de timestamp impede reprocessar comandos antigos após a remoção. Pendências expiradas e códigos devem ser limpos no mesmo processo. Não há rotina agendada automática nesta etapa.

## Verificação em 08/11/2026

- `npm.cmd test` em backend: 24 testes aprovados; parser, confirmação, assinatura, rotas HTTP loopback e transporte Meta simulado.
- A execução local reutilizou as dependências já instaladas na cópia de validação via `NODE_PATH`. Em um checkout novo, executar `npm.cmd ci` dentro de `backend` antes dos testes; nenhuma dependência foi acrescentada.
- Mobile: 45 testes aprovados e `npm.cmd run typecheck` aprovado; os novos testes usam HTTP simulado.
- Integração MySQL: **não concluída**. A conta local da aplicação não tem CREATE DATABASE nem CREATE TABLE. Não foram alterados privilégios ou usados arquivos administrativos.
- Meta, Aiven remoto, deploy Vercel e aparelho físico: **não executados**.

O teste opt-in `node tests/whatsapp-live.cjs` exige `WHATSAPP_TEST_ENV_FILE` apontando para ambiente local identificado (`DB_HOST=127.0.0.1`, `DB_NAME=dashboard_test_<hex>`). Usa somente essa conta; ela precisa de CREATE/DROP TABLE no banco de validação. Ele cria nomes aleatórios próprios, verifica que não existem e remove apenas essas tabelas ao terminar. Não concede privilégios, não usa conta administrativa e não acessa Aiven. O teste usa HTTP/MySQL reais e transporte Meta simulado. Não executar contra o banco da equipe.

## Referências consultadas

- Express/Vercel: https://vercel.com/docs/frameworks/backend/express
- Backend e conexões: https://vercel.com/docs/frameworks/backend
- Hobby: https://vercel.com/docs/plans/hobby
- Coleção oficial Meta: https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api

As regras de cobrança e liberação de teste devem ser verificadas na conta usada, não inferidas deste protótipo.
