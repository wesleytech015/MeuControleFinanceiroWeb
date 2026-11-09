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
- Testes locais, sem banco remoto: `npm test --prefix backend`.
- Build Web: `npm run build`.
- Lint: `npm run lint`.

O ESLint usa configuração nativa JavaScript/JSX e CommonJS para o backend; não
depende de `typescript-eslint` instalado na raiz. A configuração carrega, mas a
revisão atual registra dez erros de código ainda pendentes, descritos no relatório
PostgreSQL. A compilação e os testes locais passam.
