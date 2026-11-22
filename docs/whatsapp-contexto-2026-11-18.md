# WhatsApp como entrada do aplicativo financeiro

O aplicativo real permanece como a interface de consulta e gerenciamento. O WhatsApp é outra entrada para a mesma API e tabela de movimentações, sempre associada ao usuário autenticado que vinculou o número. Não há uma base financeira independente do bot.

## Fluxo

1. O usuário entra no aplicativo e gera o código de vínculo com JWT real.
2. Envia o código do mesmo número informado. O servidor resolve o usuário pelo vínculo, nunca por nome, e-mail ou ID sugerido pelo modelo.
3. O assistente recebe a mensagem atual, até cinco mensagens anteriores permitidas da conversa e, quando houver correção, os dados da proposta pendente. Não recebe JWT, telefone, código de confirmação nem acesso ao SQL.
4. Se faltar informação, pede complemento. A memória é persistida no PostgreSQL e não depende da instância do servidor.
5. Uma proposta completa é exibida com código de confirmação. Correções explícitas atualizam a proposta e invalidam o código anterior. Outra proposta não substitui silenciosamente a pendente.
6. Somente uma confirmação válida grava a movimentação com o usuário obtido do vínculo. A deduplicação de mensagens permanece transacional.
7. O aplicativo lê a mesma movimentação e recalcula os totais pela API ao atualizar ou retornar à tela. Não foi implementada atualização instantânea por push nesta etapa.

## Contexto e escopo

- Janela máxima: cinco mensagens anteriores, somando usuário e assistente. A mensagem atual é separada. A proposta pendente é um objeto separado, sem código.
- Contexto de mensagens livres somente após consentimento de IA, associado à conta, ao número e ao provedor atuais. Consulta a outro usuário/número não retorna histórico.
- Contexto sem atividade por 15 minutos deixa de ser utilizado. A lista tem até cinco entradas; expiração de uso não equivale a exclusão física agendada. Nova conversa substitui entradas antigas.
- Confirmação, cancelamento, troca de consentimento e novo vínculo limpam o contexto. Desvincular remove vínculo e memória, preservando movimentações confirmadas.
- Mensagens com os padrões de credenciais já tratados não são lembradas. Códigos de confirmação/vínculo são removidos do histórico enviado ao modelo. Isso não é um detector universal de dados pessoais.
- Perguntas externas como “qual o preço do pneu?” são recusadas antes do modelo. “Paguei 300 no pneu” pode gerar proposta financeira.
- Respostas explicativas são montadas com textos revisados da base do app, selecionados por fontes válidas; o texto livre produzido pelo modelo não é exibido. A seleção lexical ainda pode pedir reformulação ou recuperar um trecho pouco adequado.
- Histórico e mensagem atual são dados não confiáveis, sem poder de alterar regras, executar SQL, escolher usuário ou confirmar operações.

## Implementação local

Arquivos principais: `backend/assistant/context.js`, `backend/assistant/service.js`, `backend/whatsapp/processor.js` e `backend/whatsapp/repository.js`. A referência antiga ao Qwen na base de privacidade foi alinhada ao Gemini ativo.

Migração aditiva preparada: `backend/database/migrations/20261118_whatsapp_context.postgresql.sql`. Deve ser revisada e aplicada explicitamente no ambiente de demonstração após as migrações WhatsApp anteriores. Nenhum deploy aplica o SQL automaticamente. A versão nova exige essas colunas; não publicar o código antes da migração revisada no ambiente correspondente.

## Validação e limites

Testes cobrem recusa de preço externo, bloqueio de texto externo mesmo com fonte válida, janela de cinco mensagens, remoção de credenciais/códigos, complemento de valor, correção e invalidação do código anterior, cancelamento e consentimento. PostgreSQL portátil descartável exercita persistência após recriar o repositório, isolamento entre duas contas/números, expiração, limpeza, confirmação e deduplicação com SQL real.

Resultados desta rodada: 85 testes backend aprovados, zero falhas e zero skips, com PG_TEST_BIN apontando ao PostgreSQL portátil 17.11; 24 verificações no ensaio WhatsApp/Gemini/API/PostgreSQL aprovadas, incluindo leitura do lançamento persistido pelo serviço original do Dashboard Mobile e pelo normalizador Web. Lint e git diff --check aprovados. O teste PostgreSQL adicional também passou isoladamente antes da suíte completa. Não houve mudança no mobile que exigisse repetir seus testes nesta rodada.

Google e Meta são simulados; não houve mensagem real, acesso ao Supabase da equipe, push, PR, deploy ou alteração no TCC. A conexão ao WhatsApp Business real depende da configuração Meta e da publicação coordenada do backend e das migrações. O aplicativo publicado ainda não recebeu esta mudança.
