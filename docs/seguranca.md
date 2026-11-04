# Correções de segurança — 03/11/2026

Correções de autorização, validação, autenticação e dependências do backend. Consulte `implantacao-render.md` para a configuração de hospedagem e conexão MySQL.

## Credenciais anteriormente versionadas

Um arquivo de ambiente com dados de conexão aparentes foi removido do controle de versão, preservando a cópia local ignorada pelo Git. Isso não remove os commits antigos: se essas credenciais forem válidas, o responsável pelo banco deve rotacioná-las no Aiven. Não reutilizar essas credenciais na hospedagem nem copiar dados de ambiente de outros integrantes. Uma limpeza de histórico exige coordenação separada com a equipe.

## Autorização e dados do usuário

`GET /api/usuarios` continua exigindo JWT e mantém a resposta em array para preservar o formato, mas agora retorna somente o perfil identificado pelo token. A consulta seleciona explicitamente `id`, `nome`, `email` e `criado_em`; o hash de senha não é enviado. A listagem global deixa de estar disponível a contas comuns. Uma futura função administrativa precisa de autorização própria, não da restauração de `SELECT *` nessa rota.

## Validação antes do banco

`backend/validation/transacao.js` é usado tanto na criação quanto na atualização:

- aceita apenas receita/despesa;
- descrição textual, com trim e limite de 200 caracteres;
- valor positivo, no máximo duas casas decimais, respeitando DECIMAL(15,2);
- rejeita booleanos, arrays, notação exponencial e valores inferiores a um centavo;
- mantém o valor validado como string decimal até o MySQL para evitar arredondamento intermediário;
- valida data real em AAAA-MM-DD, dentro da faixa do MySQL; data omitida mantém o padrão UTC existente;
- valida também categoria e forma de pagamento conforme os limites do schema.

Entradas inválidas retornam 400 antes do SQL. O banco não foi migrado, e dados antigos não foram reescritos. O cálculo agregado existente do Dashboard usa Number; para exigências contábeis adicionais ou totais extremamente grandes, avaliar separadamente soma decimal exata e estratégia de arredondamento.

## Autenticação e requisições

- Sem JWT_SECRET de pelo menos 32 bytes, a aplicação interrompe a inicialização. Gerar um segredo aleatório e mantê-lo somente no ambiente do servidor. Não há segredo padrão no código.
- Emissão e validação restritas a HS256; identificador do usuário deve ser inteiro positivo seguro.
- Cadastro valida nome, e-mail e senha: mínimo de oito caracteres, máximo de 72 bytes UTF-8. O limite superior evita truncamento silencioso pelo bcrypt. A regra mínima vale para novos cadastros; login não impõe retroativamente oito caracteres às contas existentes.
- Login e cadastro compartilham limite de 30 tentativas malsucedidas por IP em 15 minutos; ao exceder, retornam 429 com Retry-After. Respostas bem-sucedidas não consomem o orçamento persistente.
- O limitador usa memória do processo: reinicia com o servidor e não é compartilhado entre instâncias. Em implantação distribuída, configurar armazenamento comum. Não habilitar trust proxy indiscriminadamente; definir os proxies realmente confiáveis.
- JSON limitado a 16kb, sem descompressão automática. JSON malformado retorna 400, corpo grande 413 e codificação comprimida 415. Erros retornam JSON sem stack trace; o cabeçalho X-Powered-By foi desabilitado.
- Logs dos controllers revisados não incluem o objeto de erro SQL, que pode conter parâmetros sensíveis. Uma implantação real deve adotar observabilidade com redação de dados.

## Dependências

Aplicadas atualizações compatíveis e adicionado express-rate-limit. `qs` sob Express tem override para 6.16.2: a versão de Express instalada ainda restringe esse pacote a uma linha vulnerável. O override permanece na mesma versão principal e foi validado pelos testes HTTP; reavaliá-lo quando Express incorporar a correção diretamente.

Após as mudanças, `npm audit --omit=dev` reportou zero alertas. A árvore completa do backend ainda tem dez alertas moderados associados a ferramentas de desenvolvimento e minimatch. Não foi aplicada troca de versão principal para mascarar esses alertas.

## Validação

- `npm.cmd test`: testes de regressão em `backend/tests/security.test.cjs`, incluindo limite 429 e falha de inicialização sem segredo, além dos testes de configuração disponíveis.
- `npm.cmd run test:integration`: verificações HTTP/MySQL reproduzíveis em `backend/tests/live-security.cjs`. Exige API em loopback, DB_HOST=127.0.0.1 e banco isolado chamado dashboard_test_*; cria contas temporárias e remove seus registros no final. Execute a partir de backend, com .env local configurado e API em execução. Nunca apontar para dados de produção.
- API/MySQL locais reais: 69 verificações aprovadas, contra 45 aprovadas/24 reprovadas antes.
- Três testes HTTP adicionais aprovados para erros de parsing e tamanho.
- Integração com os serviços reais do mobile: oito cenários aprovados e limpeza confirmada.
- Contas e movimentações temporárias removidas ao finalizar.

Não houve teste visual novo no aparelho nem avaliação de servidor público. HTTP é configuração local de desenvolvimento; o ambiente de produção precisa de HTTPS. Estas correções não tornam uma auditoria pontual uma garantia completa de segurança.

## Por que há comentários no código

Foram documentadas as decisões que poderiam ser removidas por engano em uma refatoração: seleção explícita dos campos do usuário, ausência de segredo JWT padrão, limite do bcrypt, tratamento exato dos centavos e confiança em proxies. Procedimentos, resultados e limitações ficam neste documento e nos testes, sem comentários repetindo cada instrução do código.
