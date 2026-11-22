# Integração PostgreSQL / Supabase — 09/11/2026

## Origem e escopo

Importado o commit `6b57639fd530363745997453f7757c938f6f8365`, de Wesley,
da branch remota `feature/migracao-postgresql-supabase` para a feature local
`feature/whatsapp-vercel-academico`. Não houve mudança de develop/main nem push.
O novo backend compartilhado de Web e Mobile usa PostgreSQL no Supabase e API Express
preparada para Vercel; o aplicativo não se conecta diretamente ao banco.

Preservados JWT/HS256, limite de autenticação, validação financeira, isolamento por
usuario_id e os contratos HTTP existentes. Consultas usam parâmetros $1/$2,
RETURNING id, rows/rowCount e SQLSTATE 23505. Os aliases de conexão usam o mesmo
pool pg. A listagem de usuários continua restrita ao usuário do token.

## Piloto WhatsApp

`backend/whatsapp/repository.js` usa pg, BEGIN/COMMIT/ROLLBACK no mesmo cliente,
UPSERT por ON CONFLICT e journal persistente. A migração adicional é
`backend/database/migrations/20261109_whatsapp.postgresql.sql`, com três tabelas,
JSONB, TIMESTAMPTZ e RLS sem políticas públicas. O backend mantém a autorização
por usuário; a role postgres do Supabase pode ignorar RLS.
Não aplicar automaticamente no banco da equipe. O schema MySQL e a antiga migração
permanecem somente como histórico, nunca como scripts para o Supabase.

## Configuração

Segredos ficam somente no .env ignorado do backend ou nas variáveis da Vercel.
Usar os valores do painel Supabase para DB_HOST, DB_PORT, DB_NAME, DB_USER e
DB_PASSWORD. Certificado em DB_SSL_CA_PATH (caminho relativo à raiz) ou
DB_SSL_CA_PEM (conteúdo PEM, incluindo \n literais). Sem CA explícito, usa
autoridades confiáveis do Node. Nunca reutilizar o CA Aiven nem desativar TLS remoto.
Na Vercel, pool pg limitado a duas conexões por instância; usar o pooler recomendado
pelo painel para funções serverless e consultas sem prepared statement nomeado.
Não há credencial Supabase nesta branch ou no aplicativo.

## Ambiente local e verificações

Foi preparado PostgreSQL local com autenticação SCRAM, usuário de aplicação sem
superusuário e acesso somente por loopback, na porta 55432. O .env local da feature
aponta para esse banco de demonstração; ele não é uma cópia dos dados remotos.
Os scripts base e WhatsApp foram aplicados apenas nesse banco novo.

- Backend: 29 testes locais aprovados, incluindo os cinco testes importados.
- API + PostgreSQL reais locais: 69 verificações aprovadas.
- WhatsApp + HTTP + PostgreSQL reais locais: 22 verificações aprovadas; Meta simulada.
- Mobile: 45 testes e TypeScript aprovados. Teste adicional usa os serviços reais
  de cadastro, login, movimentações e Dashboard contra o PostgreSQL local.
- Contas e tabelas temporárias dos testes removidas seletivamente.

Executar em backend:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run test:connection
npm.cmd start
# Em outro terminal, API local na porta configurada:
$env:API_TEST_BASE_URL='http://127.0.0.1:3002/api'
npm.cmd run test:integration
$env:WHATSAPP_TEST_ENV_FILE=(Resolve-Path ../.env).Path
npm.cmd run test:whatsapp
```

Os testes de integração recusam bancos remotos e exigem banco local identificado.
Não copiar a configuração local com DB_SSL=false para a Vercel.

## Pendências

Falta acesso autorizado/configuração do Supabase da equipe para consultar metadados
reais e validar TLS remoto. A importação do schema no Supabase descrita no guia de
Wesley é evidência dele; não foi repetida nesta feature. Não houve escrita no banco
compartilhado. Continuam pendentes implantação Vercel, mensagens Meta reais, interface
Web no navegador e fluxo nativo no aparelho. Os resultados locais não comprovam isso.
Atualizações da develop devem passar por PR/revisão da equipe.

Fontes: commit 6b57639; https://node-postgres.com/features/transactions ;
https://supabase.com/docs/guides/database/connecting-to-postgres ;
https://supabase.com/docs/guides/database/connecting-to-postgres/serverless-drivers .
