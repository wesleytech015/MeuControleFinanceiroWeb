# Implantação da API: Vercel + Supabase/PostgreSQL

A API compartilhada pertence ao repositório Web. Importar na Vercel somente a branch
revisada, com Root Directory `backend`, framework Express e Node 24. `app.js` exporta
Express sem abrir porta; `server.js` mantém execução local. Instalar com `npm ci`.

Usar as variáveis de `.env.example`: banco Supabase, JWT_SECRET com pelo menos 32
bytes e NODE_ENV=production. O CA do Supabase pode ser arquivo DB_SSL_CA_PATH ou PEM
em DB_SSL_CA_PEM. TLS verifica certificado e hostname, mínimo 1.2. DB_SSL=false é
recusado para host remoto, produção e Vercel. Não usar certificado/segredos Aiven.

Para serverless, copiar do painel Supabase os dados do transaction pooler (usualmente
porta 6543); não adivinhar host ou project ref. Consultas pg não usam nomes de prepared
statements. O pool mantém no máximo duas conexões por instância Vercel; conferir o
limite global da conta. Para administração/schema, seguir a conexão indicada no painel.

Aplicar schema somente por operação coordenada: `schema.postgresql.sql` da equipe e,
para o piloto opt-in, `migrations/20261109_whatsapp.postgresql.sql`. O deploy não
executa DDL. Confirmar o schema existente e não sobrescrever dados compartilhados.

Após validação da API, Web e Mobile usam a mesma URL HTTPS /api e autenticação JWT.
Nunca colocar DB_PASSWORD, CA privado, segredo JWT ou token Meta em EXPO_PUBLIC_*.
WHATSAPP_ENABLED permanece false até configurar Meta, migração e testes do webhook.

Consultar [estado e verificações](integracao-supabase.md). Não houve implantação nesta
etapa. O limite de login em memória precisa de armazenamento compartilhado antes de
exposição pública distribuída; não ativar trust proxy indiscriminadamente.

Fontes: https://vercel.com/docs/frameworks/backend/express ;
https://supabase.com/docs/guides/database/connecting-to-postgres/serverless-drivers .
