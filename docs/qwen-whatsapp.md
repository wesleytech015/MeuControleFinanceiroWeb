Atualização de 15/11/2026: o provedor ativo voltou a ser Google Gemini. Consulte [a implementação atual](gemini-implementacao-2026-11-15.md). Os registros abaixo descrevem etapas históricas.

# Qwen no piloto WhatsApp

Qwen agora é o provedor ativo do adaptador, mas QWEN_ENABLED=false por padrão.
Configurar QWEN_API_KEY, QWEN_MODEL e QWEN_WORKSPACE_ID somente no ambiente privado.
Endpoint restrito a workspace de Singapura, sem URL arbitrária. Confirmar cota elegível
e ativar Free Quota Only no painel antes de chamar. Não houve chamada real nesta etapa.
JSON Object não garante schema: permanece a validação financeira e de fontes do serviço.
Modelo precisa suportar JSON e modo não-thinking. Sem retries, timeout 8 s e saída 1024 tokens.
O RAG local e confirmação obrigatória permanecem. Teste manual: npm run test:qwen --prefix backend.

Consentimento anterior mencionava Google: antes de habilitar Qwen, em banco de demonstração,
aplicar a migração com ai_provider e solicitar novo ia ativar. O backend exige ai_provider=qwen; consentimentos anteriores sem esse identificador não são aceitos. Não executar essa
atualização automaticamente nem enviar mensagens à Alibaba com consentimento antigo.
Nenhuma migração/deploy foi executada. O conector Gemini permanece disponível para testes antigos.

Jira: recomenda-se card específico Integrar Qwen ao assistente WhatsApp, separado do Dashboard
 e do TCC. Aceite: chave privada, JSON validado, RAG com fontes, confirmação, consentimento
para Alibaba, limite, teste real com cota gratuita e regressões Web/Mobile. Status em andamento
até teste real. Não foi possível consultar duplicatas ou criar card por conector nesta sessão.

Fontes: https://www.alibabacloud.com/help/en/model-studio/new-free-quota
https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope


## Card Jira proposto

Título: Integrar Qwen ao assistente WhatsApp
Projeto: confirmar com a equipe se fica em MOB ou no projeto do backend compartilhado.
Descrição: adaptar o provedor de IA para Qwen, reaproveitar RAG local e confirmação,
proteger chave, exigir consentimento específico e validar cota gratuita.
Aceite:
- Adaptador Qwen com JSON validado, timeout e erros sem segredos.
- RAG retorna fontes válidas e nenhuma gravação ocorre antes de confirmar.
- Consentimento identifica Alibaba/Qwen e não reutiliza autorização Google.
- Conta com Free Quota Only verificada e chamada real de demonstração aprovada.
- Mensagem real Meta e persistência em banco de demonstração conferidas.
Status sugerido: Em andamento; últimos dois itens ainda pendentes.
Tentativa de acesso ao board pelo navegador falhou por timeout do serviço de controle;
não foi possível verificar duplicatas nem cadastrar o card. Nenhum card foi criado.

Validação desta etapa: 54 testes backend aprovados, um PG pulado; lint aprovado.
Mobile: 45 testes e TypeScript aprovados. Provedores/banco simulados; não houve teste
real Qwen, migração Supabase, publicação ou novo teste visual da mudança de texto.
Commits da base e da troca ficaram separados, nas branches feature/whatsapp-vercel-academico.
