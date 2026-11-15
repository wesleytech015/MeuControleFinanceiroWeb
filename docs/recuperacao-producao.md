# Preparação da recuperação para produção

## Resultado e limites da entrega — 15/11/2026

O código aceita habilitação explícita em produção e mantém o padrão desligado.
Não foram alteradas variáveis reais, dados, migrações ou serviços publicados.
Esta revisão não equivale a homologação Web/Mobile ou autorização para publicação.

| Backend `RECOVERY_ENABLED` | Frontend `VITE_RECOVERY_ENABLED` | Comportamento |
|---|---|---|
| Ausente ou diferente de `true` | Ausente ou diferente de `true` | Aviso no Login, página indisponível, POST retorna 403 `RECOVERY_DISABLED` |
| `true` | Ausente ou diferente de `true` | Endpoint habilitado com todas as proteções; interface continua indisponível |
| Ausente ou diferente de `true` | `true` | Interface disponível; resposta 403 do backend limpa campos e bloqueia o formulário |
| `true` | `true` | Fluxo habilitado com validações, limites e transações existentes |

Somente a string literal `true` habilita: `TRUE`, `1`, espaços ou ausência não
habilitam. O backend avalia sua flag em cada requisição. A flag Vite é pública,
incorporada no build e requer rebuild para mudar; nunca inserir segredos em `VITE_*`.
Manter `NODE_ENV=production`; o ambiente não substitui nem contorna as flags.
Não existe rota alternativa para ignorar o middleware ou os limitadores.

## Revisão de segurança

| Item | Evidência e limite |
|---|---|
| Frase secreta | SHA-256 com contexto e base64 antes de bcrypt custo 10; preserva Unicode e evita truncamento; validação de criação de 12–256 caracteres |
| Senha | bcrypt custo 10 e política existente de 6 caracteres/72 bytes; contrato Mobile preservado |
| SQL Injection | SQL fixo e parâmetros `$1...`; IDs de configuração vêm do JWT validado, nunca do corpo |
| Autorização | PUT exige JWT HS256 válido, versão atual, senha vigente e validação da frase; versão/senha reavaliadas sob lock do usuário |
| Limites | Recuperação: 10 por IP e 10 por e-mail/15 minutos; configuração: 5 por IP e 5 por ID/15 minutos; persistência PostgreSQL e UPSERT atômico |
| Bloqueio | Quinto erro dentro da janela de 15 minutos bloqueia por 15 minutos a partir desse erro; relógio do PostgreSQL obtido após locks |
| Enumeração | Conta ausente, sem frase, frase errada e bloqueio usam o mesmo 400 `RECOVERY_INVALID`; comparação com hash fictício evita pular bcrypt |
| Sessões | Senha e incremento da versão são transacionais; middleware compara `sv`; JWT legado sem `sv` equivale a zero; outros usuários não são revogados |
| Consistência | Lock de usuário antes de recuperação; timeout local de lock/SQL; rollback nas falhas e descarte de conexão cujo rollback falha |
| Logs/frontend | Não há registro de senha/frase/token nos fluxos; frontend usa mensagens locais em vez de ecoar corpo de erro, sem secrets no armazenamento local ou URL |
| Múltiplas instâncias | Estado de recuperação e limites é comum no PostgreSQL; todas as instâncias devem usar o mesmo banco e `JWT_SECRET` estável, pois ele também deriva as chaves HMAC |
| RLS | Role atual tem `BYPASSRLS`; isolamento do aplicativo depende da autorização e filtros/parâmetros no backend. RLS não protege contra abuso dessa role |

Limites de login/cadastro permanecem em memória e não devem ser confundidos com os
limites persistentes da recuperação/configuração. Não se cancelam requisições que
já passaram pela autenticação antes do commit de uma redefinição.

## Conferência somente de leitura do Supabase configurado

Consulta concluída em 15/11/2026, 10:59 UTC, com TLS validado, `BEGIN READ ONLY`,
timeouts locais e rollback. Nenhum hash, senha, frase, token ou linha de usuário
foi retornado; somente catálogo, privilégios e contagens de recuperação.

- `recuperacao_seguranca`, `autenticacao_versoes` e `seguranca_limites` existem,
  com tipos, nulabilidade/defaults, PKs/FKs/checks e índice de expiração compatíveis
  com o código e os scripts 001/002. E-mail de usuário tem constraint de unicidade.
- As três tabelas têm RLS habilitada, sem políticas e sem grants para `PUBLIC`,
  `anon` ou `authenticated`. A role conectada tem SELECT/INSERT/UPDATE e `BYPASSRLS`.
- Recuperação: zero registros e zero estados inconsistentes no momento da consulta.
  Contas precisam cadastrar sua própria frase antes de poder recuperar a senha.
- `recuperacao_janela_consistente` permanece `NOT VALID`, conforme 002. Novas
  escritas já são verificadas, mas o catálogo não certifica os dados anteriores.
- Não é necessária nova migração para o ajuste das flags. **Não reaplicar 001/002**:
  a 002 é de aplicação única e falha se seus objetos já existirem.

Validação posterior da constraint, apenas após autorização específica, em janela
operacional aprovada (não executada nesta entrega):

```sql
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE public.recuperacao_seguranca
  VALIDATE CONSTRAINT recuperacao_janela_consistente;
COMMIT;
```

Impacto: leitura da tabela e locks do PostgreSQL; não altera linhas de usuários nem
hashes. Falha/timeout exige rollback; rodar com parada em erro. Se houver estados
inconsistentes futuramente, interromper e revisar um plano específico, sem corrigi-los
automaticamente. A validação é recomendada antes da liberação operacional.

## Pendências antes de liberar

1. **Configuração local:** o `.env` da raiz continua sem `JWT_SECRET` válido de pelo
   menos 32 bytes. Não foi escrito um segredo nem reduzido o requisito. O servidor
   carrega esse arquivo, não `backend/.env`. Usar segredo aleatório forte e privado
   no ambiente de homologação; não reutilizar, revelar ou rotacionar o do Render.
2. **Homologação:** usar banco isolado, contas fictícias e role equivalente à real;
   testar cadastro/configuração da frase, reset, senha anterior rejeitada, JWT antigo
   rejeitado, novo login, dados financeiros e sessões de outros usuários preservados.
3. **Proxy:** confirmar peer e sanitização da cadeia de headers no Render antes de
   configurar `TRUSTED_PROXY_CIDRS`. Não usar confiança global nem número presumido
   de saltos. Sem configuração correta, usuários podem compartilhar o IP do proxy.
4. **Permissões:** planejar role de menor privilégio no backend. Não habilitar
   permissões públicas para contornar RLS nem tratar `BYPASSRLS` como isolamento.
5. **Operação:** definir retenção/limpeza dos registros expirados dos limitadores,
   métricas e alertas sem conteúdo sensível, e procedimento de suporte para quem
   perdeu a senha sem nunca ter cadastrado uma frase.
6. **Aprovação:** revisar resultados e aprovar publicação/configuração das duas flags.
   Conferir os valores reais já existentes nos provedores: um `true` que antes era
   ignorado pelo bloqueio de produção passará a habilitar o recurso com este código.
   Publicar código com flags desligadas primeiro; confirmar atualização de todas as
   instâncias, habilitar o backend e depois o build da interface, somente após os
   testes de aceitação. Não alterar NODE_ENV. Manter flags, banco e segredo consistentes
   entre instâncias, evitando comportamento intermitente durante o rollout.

Para desligar o endpoint, definir `RECOVERY_ENABLED=false` no serviço, conforme o
procedimento de atualização de ambiente do provedor. Isso deve bloquear novos
pedidos após a atualização, mas não desfaz resets já concluídos. Rebuildar o
frontend com `VITE_RECOVERY_ENABLED=false` remove a interface; a barreira autoritativa
continua sendo a do backend. Não é necessário desfazer o schema nem restaurar senhas.

## Verificações locais

```powershell
npm test
npm test --prefix backend
npm run test:security --prefix backend
npm run build
npm run lint
```

Testes de banco criam cluster PostgreSQL temporário em loopback com credenciais
aleatórias e fixtures próprias, sem executar migrações ou tocar no Supabase.
O `initdb` desse cluster descartável usa `--no-sync` para evitar custo de fsync
na preparação dos testes; isso não altera configuração de nenhum banco real.
Testes frontend usam APIs simuladas. Há testes específicos para opt-in/opt-out em
produção; homologação publicada e configuração real dos provedores não foram executadas.

Resultados desta revisão:

| Verificação | Resultado |
|---|---|
| Frontend | 58 testes aprovados, sem skips |
| Backend | 34 testes aprovados, sem skips, com PostgreSQL descartável e dois processos de backend |
| Revisão de segurança automatizada | Aprovada |
| Build de produção, flag `true` | Aprovado, artefato separado em diretório temporário |
| Build de produção, flag `false` | Aprovado, artefato padrão `dist` mantido desligado |
| Valores configurados de JWT/DB nos bundles | Nenhuma ocorrência encontrada na comparação local, sem exibir os segredos |
| Lint completo | Dois erros preexistentes de variável `err` não utilizada em `cartaoController.js`, linhas 23 e 34; arquivo preservado |
| Lint excluindo esse controller e checagens dos helpers CJS | Aprovados |

O build mantém o aviso de chunk maior que 500 kB. Uma execução intermediária de
teste teve timeout do `initdb`, antes de executar a integração; após ajustar apenas
o helper descartável, a suíte completa foi repetida e aprovada. Nenhum teste de
escrita foi executado no Supabase.

O anexo desta missão termina incompleto. Nenhuma instrução ausente foi inferida
como autorização para escrever no banco, publicar, commitar ou alterar serviços.
