# Recuperação de senha por frase secreta

O fluxo usa uma frase secreta cadastrada pelo usuário. **Não envia e-mail, SMS ou
código externo**, apesar do nome histórico da branch `feature/recuperacao-senha-email`.
Não foram adicionados TOTP ou Argon2id.

## Contratos Web e Mobile

- `POST /api/usuarios`: `{ nome, email, senha, palavraChave? }`; resposta preservada
  `{ mensagem, id }`. A frase é opcional para clientes Mobile existentes. Quando
  presente, é validada e gravada na mesma transação que o usuário. O Web exige
  frase e confirmação; a confirmação é validada somente no cliente.
- `POST /api/login`: mantém `{ email, senha }` e a resposta
  `{ mensagem, token, usuario: { id, nome, email } }`. JWT HS256 válido por 24 horas,
  agora com a claim adicional `sv` (versão da sessão).
- `PUT /api/usuarios/palavra-chave`: Bearer JWT e
  `{ senhaAtual, palavraChave }`. Usa o ID autenticado e exige a senha vigente.
  Substitui a frase, limpa tentativas e nunca retorna a frase anterior ou seu hash.
- `POST /api/recuperacao-senha`: `{ email, palavraChave, novaSenha }`.
  Conta inexistente, conta sem frase, frase incorreta e bloqueio recebem o mesmo
  HTTP 400 com `codigo: RECOVERY_INVALID`. Erros de formato/política são validados
  antes da consulta da conta. Sucesso retorna uma mensagem e exige novo login.

Contas antigas precisam configurar a frase enquanto ainda possuem acesso e a senha
atual. Não existe frase padrão nem recuperação automática para quem nunca a cadastrou.
O Mobile pode continuar cadastrando sem `palavraChave` e tratando JWT como token
opaco. Deve respeitar 401 (novo login) e distinguir 503 (validação indisponível).
A configuração/recuperação requer telas próprias no Mobile caso sejam oferecidas.

## Credencial e bloqueio

A frase tem 12 a 256 caracteres Unicode e rejeita valores óbvios e informações
pessoais iguais à frase quando disponíveis. A comparação é exata, preservando
maiúsculas, acentos e espaços. A normalização serve apenas à avaliação de força.

Armazenamento: SHA-256 com contexto `recovery-secret:v1` e byte NUL, convertido
para base64 (44 bytes), seguido de bcrypt custo 10. Isso evita truncamento de
frases Unicode pelo limite de entrada do bcrypt. A senha de login permanece no
bcrypt existente, sem mudança de algoritmo. A frase não é registrada em logs,
respostas ou armazenamento do navegador. A nova senha não pode ser igual à frase.

Cinco erros dentro de uma janela de 15 minutos bloqueiam a recuperação por
15 minutos **a partir do quinto erro**. Tentativas durante o bloqueio não o
prolongam. Ao expirar o bloqueio ou a janela sem bloqueio, a próxima falha inicia
uma nova contagem em um. Sucesso e troca autenticada da frase limpam o estado.
O relógio usado é `clock_timestamp()` do PostgreSQL, obtido depois dos bloqueios.
O login continua disponível durante o bloqueio da recuperação.

## Limites persistentes

A tabela `seguranca_limites` mantém janelas fixas de 15 minutos, com UPSERT atômico:

| Operação | Identidade | Máximo por janela |
|---|---|---:|
| Recuperação | IP (IPv6 agrupado em /56) | 10 |
| Recuperação | E-mail informado, com trim | 10 |
| Configuração | IP (IPv6 agrupado em /56) | 5 |
| Configuração | ID do usuário autenticado | 5 |

A próxima tentativa retorna 429, `Retry-After` e `Cache-Control: no-store`.
O limite de IP precede a validação do corpo; o de conta vem após ela. Configuração
exige autenticação antes dos limites. E-mail/IP não são gravados em texto puro:
as chaves usam HMAC-SHA-256 com contexto e `JWT_SECRET`. Alterar esse segredo
invalida JWTs e altera as chaves dos limites. Manter o mesmo segredo entre instâncias.
Falhas do limitador retornam 503 e impedem a operação, sem fallback em memória.
Login/cadastro mantêm os seus limites preexistentes em memória (15/20 por IP).

Linhas expiradas são reutilizadas quando a mesma identidade volta a tentar.
Não existe limpeza automática das identidades abandonadas; definir retenção e
rotina de limpeza antes de oferecer o recurso publicamente, em trabalho separado.

## Sessões e transações

`autenticacao_versoes` registra a versão por usuário. Ausência de linha equivale
a zero; ausência da claim `sv` em JWT antigo também equivale a zero. Usuário
inexistente, versão inválida ou divergente recebe 401. Falha ao consultar a versão
retorna 503 e não autentica o pedido.

A redefinição atualiza a senha, incrementa a versão e limpa tentativas numa única
transação. Falha em qualquer gravação desfaz todas. Depois do commit, JWTs anteriores
daquele usuário são rejeitados; sessões de outros usuários permanecem válidas.
Requisições já autenticadas antes do commit podem estar em andamento; não há
cancelamento retroativo dessas operações.

Login, configuração e redefinição bloqueiam primeiro a mesma linha em `usuarios`
com `FOR UPDATE`; configuração/redefinição acessam depois a recuperação. O login
verifica a senha e emite a versão dentro da transação. A configuração revalida a
versão sob o bloqueio, protegendo contra redefinição entre middleware e controller.
As transações instalam `lock_timeout=3s` e `statement_timeout=5s` com `SET LOCAL`.
Erros causam rollback; conexão cujo rollback falhou é descartada. Não há atualização
em tabelas financeiras pela recuperação.

## Ambiente e Render

| Variável | Uso |
|---|---|
| `JWT_SECRET` | Obrigatório; assinatura JWT e HMAC dos limites |
| `RECOVERY_ENABLED` | Somente o valor literal `true` permite recuperação fora de produção; padrão desabilitado |
| `NODE_ENV` | `production` sempre bloqueia a recuperação, mesmo com `RECOVERY_ENABLED=true` |
| `TRUSTED_PROXY_CIDRS` | IPs/CIDRs explícitos separados por vírgula; vazio mantém `trust proxy=false` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_CA_PATH` | Configuração existente do PostgreSQL/TLS; não usada pela suíte isolada |
| `VITE_API_URL` | URL pública HTTPS da API para build Web em produção |
| `PG_TEST_BIN` | Opcional, diretório de `initdb` e `pg_ctl` para testes locais |

O backend bloqueia **a rota pública de redefinição** em produção. O build Web de
produção oculta o link e mostra indisponibilidade na página de recuperação.
Cadastro com frase e configuração autenticada continuam disponíveis; o bloqueio
não remove suas dependências de schema.

`render.yaml` permanece com `NODE_ENV=production`, sem ativar recuperação e sem
allowlist de proxy. `server.js` só confia nos IPs/CIDRs explicitamente configurados;
a validação rejeita booleanos, contagem de saltos e redes /0. **A cadeia real de
proxy do serviço Render ainda precisa de verificação operacional autorizada.**
Não assumir quantidade de saltos nem usar `trust proxy=true`. Confirmar endereço
do peer, cadeia encaminhada e sanitização dos headers antes de definir a allowlist.
Com a confiança desabilitada, clientes atrás do mesmo proxy podem compartilhar o
limite do peer. Os testes verificam que headers encaminhados falsificados não
mudam o IP quando não existe confiança e que a allowlist do Express é específica.

## Migrações preparadas, não executadas

Ordem obrigatória: **001 e depois 002, antes de iniciar o backend atualizado**.
Não existe inicialização automática de schema no servidor. Mesmo com recuperação
desabilitada, login e rotas autenticadas consultam `autenticacao_versoes`.

1. `001_recuperacao_palavra_chave.sql`: cria `recuperacao_seguranca`, chave
   estrangeira para `public.usuarios(id)`, hash, tentativas e bloqueio. Habilita RLS
   e revoga permissões públicas e das roles `anon`/`authenticated` quando existirem.
2. `002_recuperacao_seguranca.sql`: adiciona `inicio_janela`, constraint de estado,
   `autenticacao_versoes`, `seguranca_limites` e índice de expiração. Não faz backfill
   nem altera linhas de `usuarios`. Habilita RLS e revoga permissões públicas.

Revisão antes de qualquer aplicação futura:

- Confirmar `public.usuarios(id INTEGER)`, unicidade de e-mail, nomes, tipos, FKs,
  constraints e permissões existentes. O banco remoto não foi inspecionado nesta etapa.
- A 001 usa `IF NOT EXISTS` para a tabela; isso **não valida** uma tabela preexistente.
  Reaplicá-la também reaplica RLS/revogação. Conferir o catálogo antes de decidir.
- A 002 é de aplicação única, transacional. Reaplicação encontra objetos existentes
  e deve falhar; usar controle de migrações, não reaplicar cegamente ou ocultar
  divergências com `IF NOT EXISTS`. Executar com parada em erro e rollback explícito
  se a ferramenta mantiver a transação abortada aberta.
- A constraint de janela é `NOT VALID` para permitir registros legados. Novas
  gravações já são verificadas. Inspecionar e planejar a regularização dos estados
  legados antes de um futuro `VALIDATE CONSTRAINT`; não houve correção de dados aqui.
- Uma role restrita do backend precisa de GRANTs e políticas RLS específicos. O
  proprietário/superusuário pode contornar RLS; não presumir que habilitar RLS basta
  para impedir acesso de roles privilegiadas. Não liberar acesso para roles públicas.

Os arquivos SQL foram revisados estaticamente. **Nenhum arquivo de migração foi
executado**, nem mesmo na instância descartável dos testes; esta cria fixtures
independentes. A aplicação real, a compatibilidade do schema remoto e suas
permissões continuam pendentes de homologação autorizada.

## Testes locais

```powershell
npm test
npm test --prefix backend
npm run test:security --prefix backend
npm run build
npm run lint
```

A suíte de recuperação cria um cluster PostgreSQL descartável com `initdb` e
`pg_ctl`, senha aleatória, porta livre e escuta apenas em `127.0.0.1`. Injeta esse
pool no módulo da aplicação antes de carregar o servidor; não usa URL, credenciais
ou pool do Supabase. Cria somente fixtures e falhas controladas por triggers,
encerra o servidor e remove seu próprio diretório temporário ao terminar.
No Windows procura PostgreSQL 18/17/16/15; alternativamente configure `PG_TEST_BIN`.
Em outros sistemas usa os executáveis do PATH (rodar como usuário não root).
Sem `initdb`, a integração é marcada como skip explícito; isso não equivale a
validação de concorrência. Falhas ao iniciar um binário instalado falham o teste.
O sandbox do Windows pode impedir a criação do token do `initdb`; nesse caso a
execução exige autorização fora do sandbox, sem trocar para um banco externo.

Cobertura: fronteiras exatas de 15 minutos, bloqueio após cinco erros, reinício de
janela, tentativas paralelas reais, resets paralelos, login durante redefinição,
versões sem atualização perdida, JWT legado e atual revogados, sessões independentes,
novo login, rollback por falha da versão, banco indisponível, limites persistentes
atômicos por IP/conta/usuário, expiração e headers de proxy falsificados. Testes Web
validam formulários, mensagens, API e limpeza somente da sessão após recuperação.
A suíte antiga preserva contratos de cadastro/login e isolamento financeiro.

## Implantação futura — exige nova autorização

1. Revisar e aprovar SQL, backup, schema real, permissões, registros legados e
   procedimento de rollback operacional. Não publicar backend antes do schema.
2. Aplicar 001/002 em homologação somente após autorização específica, testar com
   role equivalente à real e executar os testes de aceitação Web/Mobile.
3. Verificar proxy do Render e configurar apenas a allowlist comprovada, se necessária.
4. Após aprovações de migração/publicação, preparar backend e frontend na ordem
   correta, confirmar branches, API alvo e rewrites. Manter recuperação pública
   desabilitada em produção; esta entrega não autoriza ativá-la.
5. Avaliar limpeza dos limites e acompanhar erros, bloqueios e sessões sem registrar
   frases, senhas ou tokens. Revalidar rotas autenticadas e dados financeiros.

Nenhum commit, push, merge, deploy ou acesso ao banco de produção faz parte desta etapa.
