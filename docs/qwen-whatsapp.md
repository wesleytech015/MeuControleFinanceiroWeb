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
