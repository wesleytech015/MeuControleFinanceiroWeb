# Frontend de recuperação por palavra-chave

O Login, `/recuperar-senha` e `RecoveryForm` usam o mesmo controle:
`VITE_RECOVERY_ENABLED` deve ser o texto literal `true`, inclusive em produção.
Sem habilitação explícita, o Login mostra somente um aviso e o acesso direto à
página não monta o formulário. A flag é pública e incorporada no build, exige
rebuild para mudar e não constitui autorização de acesso ao backend.
Nenhuma variável real de serviço foi alterada nesta entrega.

Para validar em desenvolvimento/homologação isolada, configure a variável Vite
nesse ambiente e reinicie o servidor Vite. O backend também precisa
de `RECOVERY_ENABLED=true`; mantenha `NODE_ENV=production` ao testar o modo de produção. A variável
Vite não informa o estado do backend; se ele responder 403, a tela limpa as
credenciais e passa a mostrar indisponibilidade, sem permitir novo envio.
Não alterar `NODE_ENV` de um serviço de produção para contornar a proteção.

O formulário chama `redefinirPorPalavraChave` em `src/services/recoveryApi.js`:
`POST ${VITE_API_URL}/recuperacao-senha`, com a base normalizada para um único `/api`.
O JSON contém somente `email`, `palavraChave` e `novaSenha`; confirmação é validada
no navegador e não é enviada. Somente o e-mail é aparado. A palavra-chave e a
senha preservam espaços e Unicode. A política existente de senha é reutilizada,
incluindo mínimo de seis caracteres, limite de 72 bytes e senhas comuns proibidas.
O limite de 256 caracteres da palavra-chave segue o endpoint; a recuperação não
reaplica a política de criação da frase a uma credencial já cadastrada.

As respostas de erro da recuperação usam mensagens locais. Conta inexistente,
palavra-chave incorreta e credencial ausente não têm mensagens distintas. Corpos
de erro e exceções de rede não são ecoados nem anexados como causa; códigos de
erro são limitados a uma lista conhecida. Valores secretos existem apenas no
estado do formulário e no corpo da requisição HTTPS, sem logs, URL ou localStorage.
Mostrar/ocultar a frase é uma ação explícita do usuário. Em sucesso, a sessão local
é limpa e o Login exibe a confirmação da redefinição. Dados locais alheios à sessão
são preservados. Falhas mantêm a sessão; 403 de recuperação limpa os campos.

`/seguranca` mantém seu contrato independente: exige sessão, senha atual e
confirmação da nova frase; usa `PUT /api/usuarios/palavra-chave`. A configuração
autenticada não é habilitada/desabilitada pela flag da recuperação pública.

## Validação local

`npm test` testa contrato do corpo, confirmação, política de senha, segredo
incorreto, conta inexistente, erros de rede/servidor, timeout, duplicação de envio,
limpeza de sessão, navegação, bloqueio com flag ausente/falsa e habilitação
explícita em produção. As APIs são simuladas; nenhum pedido atinge o Render ou Supabase.

O build pode usar `VITE_API_URL=https://meucontrolefinanceiroweb.onrender.com/api`.
O build de produção permanece bloqueado por padrão e permite a interface somente
com `VITE_RECOVERY_ENABLED=true`. Essa flag não deve conter segredos. A liberação
real de Render/Vercel continua pendente de aprovação; ver `recuperacao-producao.md`.

## Dependências da validação do backend

- A auditoria somente de leitura de 15/11/2026 confirmou schema, permissões e
  ausência de registros de recuperação no Supabase configurado. A constraint de
  janela permanece `NOT VALID`. Não reaplicar 001/002; nenhuma migração foi executada.
- Validar em homologação isolada os bloqueios persistentes, limite por IP/conta,
  configuração correta do proxy, respostas genéricas, concorrência e rollback.
- Confirmar que a senha antiga e JWTs anteriores são rejeitados, nova senha funciona
  e sessões de outros usuários permanecem válidas. Uma conta precisa ter frase
  previamente cadastrada para usar esse fluxo.
- Verificar a compatibilidade Web/Mobile com a versão publicada e o comportamento
  diante de 403, 429 e 503. Os testes frontend não demonstram implantação correta.
- As barreiras agora aceitam opt-in em produção. A liberação operacional exige
  aprovação e configuração explícita das duas flags; esta entrega não altera
  serviços nem publica alterações.
