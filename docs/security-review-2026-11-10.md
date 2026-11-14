# Revisão de segurança — 10/11/2026

Escopo: cópia local do backend sobre develop 195d2a9, preparação Render local,
branch mobile atual e objetos alcançáveis pelas referências Git locais. Não é
pentest do Supabase, Render ou Vercel; não verifica todos os repositórios da conta
GitHub nem configurações administrativas, forks e objetos remotos inacessíveis.

## Achados por prioridade

1. ALTA — Possíveis segredos no histórico do backend. Foram identificados valores
   preenchidos em DB_PASSWORD/JWT_SECRET em versões históricas de .env e
   eliezer.env. Não foram impressos, copiados nem testados contra serviços reais.
   Excluir o arquivo atual não remove o histórico. Tratar os valores como expostos:
   o responsável deve rotacionar os que ainda estiverem ativos e atualizar os
   ambientes. Limpeza do histórico exige coordenação com a equipe e não foi feita.
2. ALTA — GET /api/usuarios retorna a lista de todas as contas para qualquer JWT
   válido. usuarioController.listar chama Usuario.listarTodos sem filtro. O model
   omite hashes, mas expõe IDs, nomes e e-mails de terceiros. Reprodução HTTP com
   pool simulado retornou conta 2 ao token da conta 1. Restringir consulta ao ID
   autenticado; listagem administrativa exigiria autorização específica.
3. MÉDIA — Cadastro aceita senha de um caractere. Reprodução local HTTP 201 para
   senha fictícia de um caractere; falta validação de tipo, tamanho e limite de
   72 bytes do bcrypt. Criar validação no servidor, sem depender do mobile.
4. MÉDIA — Ausência de limitação de tentativas. Quinze logins inválidos consecutivos
   retornaram 401 sem 429 e não há middleware limitador. O ensaio não mede um ataque
   de grande volume. Adicionar limitação e validar a configuração de proxy Render
   antes de confiar em X-Forwarded-For.
5. MÉDIA — Validação financeira insuficiente. valor=true foi aceito como 1;
   2026-02-31 alcançou o model. O teste com pool simulado não comprova aceitação
   dessa data no PostgreSQL: o banco real pode rejeitá-la, causando erro 500.
   Rejeitar tipos incorretos, valores não finitos, precisão excedente e datas
   impossíveis com HTTP 400 antes de SQL.
6. BAIXA — JWT aceita HS384 além do HS256 emitido. Não é bypass sem conhecer o
   segredo; restringir algorithms e validar ID numérico positivo reduz a superfície.
   O segredo atual só exige texto não vazio, sem tamanho mínimo.

## SQL injection e autenticação

`node backend/tests/security-review.cjs` executou cinco operações reais dos models
com pool gravador: busca/cadastro de usuário e criação/edição/exclusão de movimento.
O payload ficou no array de parâmetros; não foi concatenado ao SQL. Login com
entrada SQL não autenticou no cenário simulado. JWT inválido e expirado retornaram
401. Esses resultados não substituem testes com PostgreSQL isolado real.

A suíte de integração local já verifica que conta B não edita/exclui movimentação
de A. A proteção por usuario_id está presente nessas consultas, mas não corrige a
listagem global de usuários.

## Dependências (npm audit, nesta data)

| Projeto | Auditoria completa | Somente produção |
| --- | --- | --- |
| Backend | 9 moderadas | 0 |
| Web | 13: 1 baixa, 5 moderadas, 7 altas | 0 |
| Mobile | 5 moderadas | 5 moderadas |

Na Web, alertas altos incluem ferramentas Vite/PostCSS e transitivas de build;
isso não comprova exploração do bundle publicado. No mobile, os avisos envolvem
Expo CLI/fingerprint, glob e minimatch; a classificação npm produção decorre da
árvore declarada e não demonstra que as ferramentas estão executando no aparelho.
Não foi aplicado audit fix --force: sugestões incluem trocar versões principais
ou rebaixar Expo. Correções exigem compatibilidade e novos testes.

## Git e limites

Revisão direcionada: 239 blobs históricos do Web/backend e 69 do mobile, excluindo
lockfiles e dependências vendorizadas. Nenhuma ocorrência do padrão pesquisado
foi encontrada no histórico mobile. Isso não garante ausência de segredos em
outros formatos, binários, branches não obtidas ou serviços externos.

Um certificado CA Aiven continua rastreado, mas certificado público não equivale
a chave privada ou senha e não serve para a conexão Supabase atual.

Não foram alteradas senhas, reescrito histórico, removidos arquivos, atualizadas
dependências, publicados commits ou executados ataques contra sistemas públicos.
Somente diagnóstico e relatório foram acrescentados nesta etapa. Prioridade antes
do piloto público: rotação de segredos ativos, isolamento de usuários e proteção
do login. Revisão de CORS, armazenamento web em localStorage (exposição em caso de
XSS), logs, controles GitHub e infraestrutura permanece complementar.
