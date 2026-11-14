# API compartilhada no Render

Base desta preparação: `develop` em `195d2a9`. O backend Express atende Web e
Mobile, preservando bcrypt/JWT e o PostgreSQL existente no Supabase. Esta
preparação não cria banco, não importa SQL e não publica o piloto WhatsApp.

## Configuração

O `render.yaml` na raiz é uma opção de Blueprint. Se já houver um Web Service,
configure esse serviço manualmente para evitar duplicação:

| Campo | Valor |
| --- | --- |
| Branch após integração revisada | develop |
| Root Directory | backend |
| Runtime | Node |
| Build Command | npm ci --omit=dev |
| Start Command | npm start |
| Health Check | /api/health |
| Plano | Free |
| Node | 24.21.0 |

O health novo só estará disponível depois de publicar estas mudanças. Na versão
anterior, `/api/teste` é a verificação HTTP disponível. Nenhum dos dois comprova
conectividade com o banco. O servidor respeita `PORT` e escuta em `0.0.0.0`.
Não substitua a porta fornecida pelo Render pela porta local.

Configure `NODE_ENV=production`, `TZ=America/Sao_Paulo` e um `JWT_SECRET` aleatório
exclusivo desse ambiente. Web e Mobile usam os tokens da mesma API. A troca do
segredo invalida sessões emitidas anteriormente.

Copie `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` dos parâmetros do
Session Pooler do projeto Supabase da equipe. Não use Project URL, anon key ou
service_role. Adicione em Secret Files o certificado CA oficial desse projeto
com nome `supabase-ca.crt`; configure
`DB_SSL_CA_PATH=/etc/secrets/supabase-ca.crt`. Não use a CA da Aiven nem desative
TLS. O Blueprint solicita as variáveis privadas, mas o certificado precisa ser
adicionado no painel. Nunca publique credenciais ou certificados locais no Git.

O deploy automático está desativado no Blueprint; use deploy manual após revisão.
Isso não altera configurações de um serviço já criado manualmente.

## Verificação

Antes de publicar, execute `npm ci --prefix backend`, `npm test --prefix backend`
e `npm run test:web`. Os testes do backend usam HTTP local e banco simulado;
os testes do pool verificam configurações e parsers sem abrir conexão remota.

Depois de configurar a API:

1. Confira `/api/health`: deve retornar HTTP 200 e somente `{"status":"ok"}`.
2. Execute `npm run test:connection --prefix backend` em ambiente com os mesmos
   parâmetros: faz SELECT 1, sem criar tabelas ou registros.
3. Com contas temporárias, valide cadastro, login, conta vazia, receita de
   R$ 100, despesa de R$ 30 e resultado de R$ 70; edite e exclua os registros.
4. Confira isolamento entre duas contas e rejeição de token inválido.
5. Verifique datas no último/primeiro dia do mês e recarregamento dos dados.
6. Remova apenas os registros temporários do teste, identificados previamente.

No Mobile, configure localmente `EXPO_PUBLIC_AUTH_MODE=api` e
`EXPO_PUBLIC_API_URL=https://SEU-SERVICO.onrender.com/api`; reinicie o Expo.
No frontend Web, configure `VITE_API_URL` com a mesma URL base, incluindo `/api`,
e publique novo build. Confirme no cliente a variável suportada antes de editar.
Nenhum segredo do backend pertence às variáveis EXPO_PUBLIC ou VITE.

O plano gratuito pode suspender por inatividade; valide o tempo de retomada com
o timeout do mobile. Não interprete timeout como senha incorreta. A validação
no navegador não substitui teste no aparelho com teclado, fonte ampliada e rede.

## Pendências

- Parâmetros e CA do Supabase ainda precisam ser confirmados pelo responsável.
- Deploy público e integração real ainda não foram executados nesta preparação.
- A autenticação e os filtros por usuário precisam de revisão antes de abrir um
  piloto público; o health não atesta segurança ou integridade financeira.

Fontes: https://render.com/docs/blueprint-spec e
https://render.com/docs/web-services#port-binding.

## Resultado local de 10/11/2026

- Backend: 6 testes aprovados, incluindo health sem banco, JWT e CRUD/isolamento
  por HTTP com pool simulado.
- Smoke de produção: bind em 0.0.0.0, health HTTP 200 e rota protegida HTTP 401,
  utilizando configuração fictícia e sem consultas ao PostgreSQL.
- Web: 16 testes aprovados; lint aprovado; build aprovado com aviso de chunk
  acima de 500 kB. O build usou URL fictícia `https://api.example.invalid/api` e
  não deve ser publicado como aplicação configurada para o ambiente real.
- Mobile na branch local do piloto: 45 testes aprovados e TypeScript sem erros.
- Auditoria de produção do backend: zero vulnerabilidades reportadas. Instalação
  completa ainda registra nove avisos moderados no backend e 13 na raiz; não
  foram aplicadas atualizações fora do escopo.
- `git diff --check` aprovado. Blueprint revisado contra a documentação, mas
  ainda não validado pelo serviço Render.
- A busca nos arquivos locais de configuração conhecidos não encontrou host
  identificado como Supabase. Credenciais não foram copiadas ou publicadas.
- Nenhum teste remoto, teste físico no celular, deploy, commit ou push foi
  realizado nesta preparação.
