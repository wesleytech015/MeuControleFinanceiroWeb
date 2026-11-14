# WhatsApp: ambiente de desenvolvimento preparado

## Onde estamos trabalhando

Branch separada `feature/whatsapp-vercel-academico` nos repositórios Mobile e Web/backend.
Mobile recebeu develop `51b1090` (tema Azul Fintech de Wesley, já aprovado por PR).
Web/backend recebeu main `8aa630c` (cadastro/recuperação, Dashboard e demais atualizações).
As duas mesclagens estão resolvidas e sem commit. Não fazer outra mesclagem antes de concluir
ou revisar este estado. Não houve push, PR, deploy ou edição do TCC.
O backend é outro repositório Git: a implementação dele não faz parte do commit Mobile.

## O que cada parte faz

- Mobile: entrar, consultar finanças e gerar o comando para vincular seu número.
- Backend: valida sessão, recebe o webhook assinado da Meta e confirma lançamentos.
- Gemini: interpreta mensagens livres, somente após ativação no servidor e consentimento.
- RAG: recupera trechos de uma base local sobre o aplicativo e fornece fontes ao modelo.
- PostgreSQL: guarda vínculos, propostas, consentimento, cota e deduplicação.

O RAG inicial usa busca lexical, sem embeddings ou pgvector, para dispensar outro serviço/API.
A base tem cinco trechos versionados sobre o aplicativo; não é uma base ampla de educação
financeira e não acessa o histórico bancário. Perguntas fora da base são recusadas ou pedem
esclarecimento. Citações válidas não garantem ausência de erro do modelo.

## Preparação privada

No checkout Web/backend existe `.env.assistant.local`, ignorado pelo Git e desabilitado.
Somente o servidor lê esse arquivo em desenvolvimento. Variáveis da plataforma têm prioridade;
em produção/Render/Vercel esse arquivo não é lido.

A conta estudante pode ser usada para acessar AI Studio, mas sua cota de API precisa ser
confirmada no projeto/modelo. Não compartilhar senha. A chave pertence ao backend, nunca a
EXPO_PUBLIC_*, VITE_*, Git, URL pública ou captura de tela.

No checkout Web/backend:

```powershell
npm.cmd run check:assistant --prefix backend
```

O diagnóstico mostra apenas configurado/pendente e não faz chamadas externas. Nesta execução:
banco tem variáveis preenchidas, mas a conexão local foi recusada (ECONNREFUSED); Gemini e Meta estão pendentes
e desabilitados. Não foi criado recurso pago nem prometida cota ilimitada.

## Ordem para o teste real posterior

1. Entrar no Google AI Studio com a conta estudante; conferir disponibilidade de um modelo
   Flash, limites e uso gratuito. Não vincular faturamento pago para este piloto.
2. Preencher GEMINI_API_KEY e GEMINI_MODEL (ID sem models/) no arquivo privado do backend.
   Habilitar GEMINI_ENABLED somente ao decidir executar uma chamada de demonstração.
3. No Web/backend, usar `npm.cmd run test:gemini --prefix backend`: faz uma única pergunta
   sobre o saldo do aplicativo, sem dados de conta ou telefone. Não executar antes de conferir
   a cota. O comando existe, mas a chamada real não foi executada nesta etapa.
4. Criar/configurar app Meta com WhatsApp e conferir os recursos/número de teste no painel.
   O colega pode ser destinatário participante, com autorização. Não converter sua conta
   pessoal em número do bot sem verificar previamente as condições da Meta.
5. Configurar, somente no backend, os campos WHATSAPP_* do arquivo privado. O token de acesso,
   App Secret e verify token são segredos distintos. Não enviá-los ao chat.
6. Em banco de demonstração identificado, revisar o schema e as migrações da main: 001 e 002
   de recuperação de senha, depois 20261109_whatsapp.postgresql.sql e
   20261114_whatsapp_ia.postgresql.sql. Não reaplicar migrações anteriores às cegas: 002 não é
   idempotente. A main atual valida versão da sessão em autenticacao_versoes mesmo com a
   recuperação desabilitada. Nenhum SQL foi executado no Supabase da equipe nesta etapa.
7. Somente após revisão, implantar a branch de teste em endpoint HTTPS. Callback:
   `/api/whatsapp/webhook`, assinar mensagens no painel Meta e verificar desafio/HMAC.
   Não presumir que o Render atual já contém esta branch. Não foi alterado o deploy.
8. Com conta de demonstração, entrar no Mobile, abrir Conectar WhatsApp e gerar código.
   Do mesmo número informado, enviar o comando ao número de teste da equipe. Conferir vínculo.
9. Testar comando estruturado, proposta, confirmação e atualização Web/Mobile. Depois usar
   `ia ativar`, enviar mensagem livre, conferir todos os dados e confirmar. `ia desativar`
   interrompe chamadas futuras ao Gemini. Desvincular cancela vínculo/proposta, sem apagar
   movimentações confirmadas. Remover somente os dados criados para o teste.

## Verificações locais realizadas

- Mobile: 45 testes e TypeScript aprovados; exportação Android e Web aprovada; Expo Doctor 20/20 e expo install --check aprovados.
- Web: 34 testes, lint e build aprovados.
- Backend: 51 testes aprovados; um teste PostgreSQL de recuperação pulado por falta de initdb.
- IA: timeout, 429 sem retry, resposta inválida, fontes inventadas, consentimento, falta de vínculo,
  cota, mensagem antiga, confirmação e reentrega exercitados com provedor/banco simulados.
- Visual: Edge headless, perfil temporário, Expo Web de desenvolvimento, API HTTP simulada local;
  larguras 390 e 320 px. Login azul, geração de código, erro HTTP 503 e confirmação de desvínculo
  executados e capturados. Arquivos locais ignorados em `.expo/whatsapp-visual/`.

Não houve login Google, chamada Gemini real, mensagem Meta real, conexão PostgreSQL bem-sucedida nem teste
no aparelho. No aparelho ainda conferir teclado, rolagem, TalkBack, fonte ampliada, restauração
de sessão e o fluxo com a conta/número de demonstração reais. Bundles não comprovam esses itens.
O detector web do Impeccable não substitui a inspeção nativa.

Após alinhar Expo ~58.0.25, SecureStore ~58.0.3 e StatusBar ~58.0.5, expo install --check passou. O CLI registrou o plugin SecureStore já utilizado. A instalação reportou três alertas moderados no Mobile e três no Web; backend sem alerta na
instalação anterior. Vite avisa sobre chunk de cerca de 997 kB; não foi aplicado upgrade forçado.

## Limites de custo e segurança

A implementação não contrata embeddings nem banco vetorial adicional. A chave pode permanecer
desabilitada. A cota gratuita depende do projeto Google e da Meta, não da assinatura do chat.
IA: até 12 solicitações por usuário/hora, persistidas no PostgreSQL; 8 segundos por chamada,
1024 tokens de saída, sem retry automático. Esse limite não é um teto global de cobrança:
manter projeto gratuito e conferir quotas no painel. Usar apenas dados de demonstração.
O modelo recebe a mensagem atual, a data e os trechos recuperados, sem telefone, JWT, chave
Meta, identidade ou histórico financeiro. A mensagem livre ainda pode conter informação
pessoal digitada pelo usuário: não enviar dados sensíveis. Há filtro de padrões comuns de
credenciais, que não detecta todo segredo possível. Webhook verifica HMAC antes de chamar IA.
A IA nunca confirma, executa SQL, escolhe usuário ou grava movimentações diretamente.

Referências: https://ai.google.dev/gemini-api/docs/api-key ;
https://ai.google.dev/gemini-api/docs/rate-limits ;
https://developers.facebook.com/docs/whatsapp/cloud-api/get-started .


Conectividade verificada separadamente: `npm.cmd run test:connection --prefix backend`
falhou; diagnóstico restrito identificou destino local, TLS desabilitado e ECONNREFUSED.
Isso não testa a disponibilidade do Supabase ou do Render. Antes da demonstração real,
iniciar o PostgreSQL local de testes ou configurar um banco de demonstração identificado,
revisar migrações e repetir o teste. Não foram alteradas credenciais, privilégios ou dados.
