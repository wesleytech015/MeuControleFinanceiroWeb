# Preparar a API para Render e Aiven

Este procedimento publica somente o backend Node/Express. O React da web e o aplicativo mobile têm entregas próprias. Nenhum serviço Render é criado automaticamente por este repositório.

## Antes de criar o serviço

1. Revisar e integrar o PR com as correções e a configuração do backend. Render executa o código da branch remota escolhida, não o que está somente na máquina do integrante.
2. Rotacionar quaisquer credenciais válidas anteriormente incluídas em arquivo versionado. A exclusão do arquivo do último commit não apaga o histórico. Não usar credenciais de outro integrante.
3. Preparar um banco de demonstração separado no Aiven, com as tabelas do schema existente. Se houver dados, revisar a estrutura e usar um processo de migração; não importar scripts destrutivos nem reinicializar bancos compartilhados. O deploy não cria tabelas automaticamente.
4. Usar usuário MySQL com apenas os privilégios necessários ao aplicativo, evitando usuário administrativo para a API.

## Configuração do serviço

No Render: New > Web Service > repositório MeuControleFinanceiroWeb.

| Campo | Valor |
|---|---|
| Branch | Branch revisada que contém estas correções |
| Root Directory | backend |
| Runtime | Node |
| Build Command | npm ci --omit=dev |
| Start Command | npm start |
| Health Check Path | /api/teste |
| Plano de demonstração | Free, após conferir os limites atuais |

`backend/.node-version` fixa Node 24.21.0, versão usada nos testes. Remover ou alinhar uma variável NODE_VERSION preexistente que sobreponha esse arquivo. O servidor escuta em 0.0.0.0 e respeita PORT, fornecida pelo Render; não cadastrar a porta local 3001 no painel.

## Variáveis e certificado

Definir diretamente no painel Environment, sem versionar valores reais:

| Variável | Conteúdo |
|---|---|
| NODE_ENV | production |
| DB_HOST | Host do banco de demonstração Aiven |
| DB_PORT | Porta real informada pelo Aiven |
| DB_NAME | Banco de demonstração com schema preparado |
| DB_USER / DB_PASSWORD | Credenciais da aplicação |
| DB_SSL | true |
| DB_CA_PATH | /etc/secrets/aiven-ca.pem |
| JWT_SECRET | Segredo aleatório de pelo menos 32 bytes, exclusivo do ambiente |

Adicionar um Secret File chamado `aiven-ca.pem` com o certificado CA correspondente ao serviço selecionado. Não adicionar chave privada ou certificado de outro banco. A configuração valida o certificado TLS; não desativar rejectUnauthorized para contornar erro de conexão.

Quando DB_CA_PATH não é informado, usa backend/certs/ca.pem. O certificado CA não é senha, mas deve corresponder ao banco atual. A exceção DB_SSL=false existe somente para desenvolvimento com DB_HOST=127.0.0.1 e é rejeitada em produção.

O dotenv local tenta ler .env na raiz do repositório; no Render as variáveis vêm do painel. Não depender desse arquivo no serviço, pois ele é ignorado e fica fora do diretório backend.

## Proxy e proteção de autenticação

O limitador usa o IP calculado pelo Express e mantém trust proxy desativado. Atrás de um proxy, isso pode compartilhar o limite entre usuários. Antes de abrir um piloto, confirmar a topologia real e configurar a confiança somente nos proxies/saltos verificados; testar com clientes distintos e com X-Forwarded-For fornecido pelo cliente. Não usar trust proxy=true nem assumir uma quantidade de saltos sem verificar a implantação.

Esta preparação não afirma que a topologia do Render foi testada. Até essa validação, a configuração é conservadora, podendo limitar usuários em conjunto em vez de confiar em cabeçalhos arbitrários. Para várias instâncias, o armazenamento em memória do limitador também precisa ser substituído por armazenamento compartilhado.

## Verificação após a implantação

1. Confirmar nos logs que a aplicação inicia sem revelar senhas, JWTs ou parâmetros SQL.
2. Abrir https://SEU-SERVICO.onrender.com/api/teste e conferir HTTP 200. Esse endpoint verifica processo/HTTP, não disponibilidade do banco.
3. Com uma conta de demonstração, validar cadastro, login, Dashboard e operações de movimentação, além do isolamento entre usuários.
4. Apontar EXPO_PUBLIC_API_URL do mobile para https://SEU-SERVICO.onrender.com/api, manter EXPO_PUBLIC_AUTH_MODE=api e reiniciar o Expo.
5. Para a versão web, verificar o comportamento de CORS para as origens de interface utilizadas. A política existente não foi restringida por esta preparação.

Não executar os testes destrutivos de integração local contra a API hospedada: eles foram deliberadamente restritos a loopback e ao banco local dashboard_test_*.

No plano gratuito, a retomada após inatividade pode ultrapassar o timeout de 15 segundos do mobile. Testar e explicar essa condição no ambiente de demonstração. Manter o banco fora do sistema de arquivos efêmero do serviço.

## Testes antes do envio

Na pasta backend: `npm.cmd test` e `npm.cmd audit --omit=dev`. Na validação de preparação, passaram nove testes (cinco de segurança e quatro de configuração), 69 verificações de integração local e a auditoria de execução sem alertas conhecidos. Os testes de configuração não conectam ao Aiven e usam certificado fictício por injeção somente no teste. A integração real local exige `.env`, MySQL separado e API em execução: `npm.cmd run test:integration`.

As ferramentas de desenvolvimento ainda podem conter alertas moderados; avaliar atualizações compatíveis sem force. Os resultados de auditoria são temporais e devem ser repetidos antes da implantação.

## Fontes

- https://render.com/docs/deploy-node-express-app
- https://render.com/docs/monorepo-support
- https://render.com/docs/configure-environment-variables
- https://render.com/docs/node-version
- https://render.com/docs/free
- https://aiven.io/docs/platform/concepts/tls-ssl-certificates
- https://expressjs.com/en/guide/behind-proxies/
