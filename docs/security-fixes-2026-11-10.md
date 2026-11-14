# Correções de segurança — 10/11/2026

Branch local: fix/render-api-mobile, baseada na develop 195d2a9. O relatório
security-review-2026-11-10.md preserva os achados anteriores; este documento
registra as correções posteriores. As mudanças ainda não estão no servidor.

## Corrigido

- GET /api/usuarios mantém a resposta em array, mas consulta somente o ID do JWT,
  com SQL parametrizado, sem senha/hash. Não existe listagem administrativa.
- Cadastro valida nome, e-mail, senha de pelo menos oito caracteres e no máximo
  72 bytes UTF-8. Login mantém compatibilidade com senhas antigas dentro do limite
  bcrypt, mas rejeita objetos, arrays e outros tipos inválidos.
- Login: 15 requisições por IP a cada 15 minutos. Cadastro: 20 por IP no mesmo
  período. Retorna JSON 429 e Retry-After. As duas rotas usam contadores separados.
- JWT exige segredo com pelo menos 32 bytes, aceita somente HS256 e exige ID
  inteiro positivo seguro. Tokens expirados e inválidos continuam recebendo 401.
- Operações financeiras rejeitam booleanos, arrays, objetos, valores negativos,
  zero, infinitos, notação exponencial, mais de duas casas, datas inexistentes,
  textos acima dos limites do esquema e IDs malformados. Valores aceitos mantêm
  o contrato numérico/decimal existente; não houve migração do cálculo de totais.
- JSON limitado a 16 kB, sem descompressão. Erros de parser/tamanho retornam JSON
  400/413/415 sem stack trace. As consultas continuam parametrizadas.
- Dependências atualizadas dentro das faixas permitidas, sem force/overrides.
  Removido typescript-eslint do backend: não havia script ou configuração que o
  utilizasse; o lint da raiz usa suporte nativo JavaScript/CommonJS.

## Dependências após correção

- Backend: zero alertas na auditoria completa e de produção.
- Web: zero alertas de produção; quatro moderados restantes na cadeia
  ESLint/minimatch de desenvolvimento. Nenhum alto restante. A proposta automática
  restante muda a versão principal do ESLint; não aplicada nesta correção.
- Mobile: cinco moderados previamente identificados em ferramentas Expo/glob;
  não houve alteração de dependências mobile. Propostas de downgrade do SDK não
  foram aplicadas. Essas pendências não são declaradas resolvidas.

## Validação

`npm test --prefix backend`: oito testes aprovados, incluindo isolamento entre
contas, valores/datas inválidos, limite de senha, JWT alternativo/ID inválido,
limitação de login, JSON inválido e corpo excessivo. `npm run test:security
--prefix backend`: sondagens de cinco operações SQL e regressões HTTP aprovadas.
Pool simulado: nenhuma consulta ao Supabase, criação ou exclusão de dado remoto.

Web: 16 testes, lint e build aprovados. O build usou URL fictícia, sem publicação;
continua o aviso de bundle acima de 500 kB. Mobile deve ser validado também contra
a API real depois da implantação; suíte isolada não comprova essa integração.

## Ações externas pendentes

O responsável deve trocar senhas de banco e JWT_SECRET históricos que ainda
estejam ativos e atualizar ambientes. A rotação de JWT encerra sessões antigas.
Não é possível revogar credenciais apenas com alteração do código ou .gitignore.
O histórico compartilhado não foi reescrito: remoção exige planejamento com a
equipe, incluindo clones/forks. Não foi testada validade de segredo encontrado.

O limitador usa memória de uma instância. Atrás do Render, trust proxy continua
desativado: pode agrupar usuários pelo IP do proxy, mas não aceita IP arbitrário
de X-Forwarded-For. Validar topologia antes de abrir o piloto; múltiplas instâncias
exigem armazenamento de contadores compartilhado. Não configura trust proxy=true.

Faltam validação PostgreSQL isolada real, integração Supabase/Render, testes no
aparelho e rotação de credenciais. CORS e sessões web em localStorage continuam
com a arquitetura anterior; não se afirma segurança absoluta ou pentest completo.
