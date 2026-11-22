# Integração da branch WhatsApp — 14/11/2026

Web/backend: feature/whatsapp-vercel-academico, HEAD 217a96f; mesclagem local sem commit
de origin/main 8aa630c40d4c19a10f87760ea9aa55554e30674c. A primeira etapa incorporou
3a05ede; a etapa atual também incorpora cadastro/recuperação 70e76c2/0318d32 e respectivos
merges. Conflitos resolvidos, mantendo app.js exportado, health, proxy/recuperação da main,
corpo original HMAC, TLS/CA, validação decimal e piloto WhatsApp. Frontend Web atualizado.
Mobile: feature/whatsapp-vercel-academico, HEAD 1f39bc4, merge local sem commit de upstream/
develop 51b1090. A main Mobile permanece em 2b8c005 e já era ancestral. O tema azul do
Wesley veio da develop conforme pedido explícito. Serviço, contrato e histórico preservados.

Implementação nova: backend/assistant (Gemini + RAG lexical), migração de consentimento e
cota, diagnóstico sem segredos, smoke test real opt-in e configuração privada local.
Mobile: Conectar WhatsApp no Início, usando o tema azul. Nenhuma mudança no TCC.

Verificações: 45 Mobile, TypeScript aprovado; 34 Web; 51 backend aprovados e um teste PG
pulado por initdb indisponível; lint/build Web aprovados e bundles Android/Web exportados.
Visual Edge headless em 390/320 px, HTTP local simulado: login, vínculo, geração, erro 503
com recuperação e confirmação de desvínculo. Provedor e banco foram simulados; nenhum
teste comprova mensagem real, Gemini real, PostgreSQL remoto ou uso no aparelho.

As duas mesclagens continuam pendentes de commit autorizado; não houve push, PR, merge
nas branches principais, migração compartilhada nem deploy. Não iniciar outra mesclagem
sobre esse estado. Ver [roteiro completo](gemini-rag-whatsapp.md).


O teste de conectividade PostgreSQL foi executado e falhou: destino local com
ECONNREFUSED, sem alterar dados. Isso não verifica Supabase/Render. Configuração privada
continua desabilitada e ignorada. Expo SDK 58 mantido; patches ~58.0.25/~58.0.3/~58.0.5
alinhados e verificação de compatibilidade aprovada. Três alertas moderados no Mobile.
