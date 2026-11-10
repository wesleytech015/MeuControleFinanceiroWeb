# Sistema de Controle Financeiro Pessoal

Aplicação Web desenvolvida para auxiliar no gerenciamento financeiro pessoal, permitindo o acompanhamento de receitas, despesas e indicadores financeiros de forma simples, organizada e segura.
O projeto surgiu a partir da ideia de uma planilha de controle financeiro em Excel, evoluindo para uma plataforma digital moderna, com maior acessibilidade, confiabilidade e escalabilidade.

---

# Sobre o Projeto

Grande parte da população brasileira ainda possui dificuldades no controle das finanças pessoais, o que contribui para problemas de endividamento e falta de planejamento financeiro.
Pensando nisso, este sistema foi desenvolvido com o objetivo de centralizar e facilitar o gerenciamento financeiro através de uma interface intuitiva e funcionalidades automatizadas.

---

# Funcionalidades

- Cadastro de receitas;
- Cadastro de despesas;
- Controle de categorias financeiras;
- Controle de formas de pagamento;
- Dashboard financeiro;
- Relatórios e gráficos;
- Organização mensal das movimentações;
- Sistema de autenticação de usuários;
- Armazenamento seguro de dados;
- Integração entre frontend e backend via API REST.

---

# Tecnologias Utilizadas

## Frontend
- React
- Vite
- JavaScript
- HTML5
- CSS3

## Backend
- Node.js
- Express

## Banco de Dados
- PostgreSQL
- Supabase (Session Pooler com TLS e CA oficial)

## Ferramentas e Metodologias
- Git & GitHub
- Scrum
- API REST
- BCrypt

---

# Arquitetura da Aplicação

```bash id="o9j9vh"
[ Frontend React ]
          ↓
[ API REST - Node.js ]
          ↓
[ PostgreSQL / Supabase ]
```

## Configuração e validação

Instale as dependências da raiz com `npm ci` e as do backend com
`npm ci --prefix backend`. Configure o `.env` local a partir de `.env.example`,
incluindo a senha do banco, o segredo JWT e o caminho da CA oficial baixada do
painel Supabase. Não versione o `.env` nem os certificados locais.

Consulte [as instruções PostgreSQL](backend/database/README.postgresql.md) antes
de iniciar o backend ou executar qualquer SQL. O esquema MySQL original permanece
apenas como histórico. A aplicação não importa esquemas automaticamente.

- Backend: `npm start --prefix backend`.
- Frontend: `npm run dev`.
- Testes Web: `npm run test:web`.
- Testes locais do backend, sem banco remoto: `npm test --prefix backend`.
- Build Web: `npm run build`.
- Lint: `npm run lint`.

O ESLint usa configuração nativa JavaScript/JSX e CommonJS para o backend; não
depende de `typescript-eslint` instalado na raiz. Os arquivos versionados da
versão Web passam no lint, e os testes Web/backend usam dados locais ou mocks,
sem acessar o Supabase.

## Hospedagem do frontend na Vercel

O frontend usa `VITE_API_URL` para localizar a API. Em desenvolvimento, se essa
variável não estiver definida, a aplicação usa `http://localhost:3000/api`.
Builds de produção exigem uma URL pública HTTPS, por exemplo
`https://api.seudominio.com` ou `https://api.seudominio.com/api`. O sufixo `/api`
é normalizado para aparecer uma única vez. Não inclua credenciais, `DB_PASSWORD`
ou `JWT_SECRET` nessa variável: valores com prefixo `VITE_` são incorporados ao
código entregue ao navegador.

No painel da Vercel, configure `VITE_API_URL` nos ambientes que serão publicados
(Production e, se necessário, Preview) com a URL HTTPS pública do backend. A URL
pública ainda precisa ser confirmada antes de login, cadastro e demais chamadas
à API funcionarem no site publicado.

Configuração do projeto Vercel:

- **Root Directory:** `.`
- **Install Command:** `npm ci`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

O arquivo `vercel.json` reescreve as rotas da aplicação React para `index.html`
para permitir acesso direto e recarregamento. As rotas `/api` não são reescritas.

Cartões está temporariamente desabilitado em builds de produção porque ainda não
há integração completa com a API. Em `npm run dev`, a tela continua disponível
para desenvolvimento local. Em produção, o item não aparece na navegação e o
acesso direto a `/cartoes` redireciona para `/dashboard`; o rewrite SPA permanece
para que a rota seja tratada pelo React. A opção de pagamento com cartão também
fica indisponível, sem apagar os dados já existentes em `localStorage`.

Metas ainda são armazenadas somente no `localStorage` do navegador. Elas não são
sincronizadas com a API, com a conta do usuário ou entre dispositivos; portanto,
devem ser consideradas dados locais até que a integração seja implementada.
