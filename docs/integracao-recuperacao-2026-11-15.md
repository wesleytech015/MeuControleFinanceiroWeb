# Integração da recuperação de senha — 15/11/2026

Importada origin/main 464e922 (PR #46), que contém a atualização de Wesley bc042fa (PR #45), na branch local feature/whatsapp-vercel-academico. WhatsApp, Qwen, RAG e contratos financeiros preservados. Único conflito em .env.example: mantidas as opções do piloto e a orientação atual de recuperação por opt-in em produção. Nenhuma configuração privada foi editada.

Validação atual:
- Web: 58 testes aprovados.
- Backend: 73 testes aprovados, sem skips, incluindo recuperação em PostgreSQL portátil 17 descartável com PG_TEST_BIN. A primeira rodada sem esse caminho aprovou 55 e pulou a integração; a rodada completa substitui essa limitação.
- Revisão automatizada de segurança e lint: aprovados.
- Build Web com VITE_API_URL=https://meucontrolefinanceiroweb.onrender.com/api e VITE_RECOVERY_ENABLED=true: aprovado, em node_modules/.cache/recovery-integration-build. Aviso de bundle de aproximadamente 1 MB mantido. A primeira tentativa sem VITE_API_URL foi bloqueada corretamente pela validação de configuração.
- Mobile: 45 testes e TypeScript aprovados; nenhuma tela nova criada.

Conferência somente de leitura no Render:
- Branch main; Root Directory backend/; Auto-Deploy Off.
- Commit ativo 428f0c35d6370e6afa16ad8f5df09c686a11805f, anterior à atualização de recuperação. O deploy de atualização de ambiente reutilizou esse commit.
- NODE_ENV=production e RECOVERY_ENABLED=true confirmados. Flags configuradas não comprovam publicação do novo código.
- Nenhum deploy ou ajuste de configuração realizado nesta integração.

Frontend: a função isRecoveryFeatureEnabled exige VITE_RECOVERY_ENABLED literal true no build. O painel Vercel acessível na conta consultada não mostrou projeto; não foi possível confirmar as variáveis ou o build do frontend publicado.

Mobile remoto develop ainda mostra indisponibilidade ao tocar na recuperação; a atualização de Wesley importada é Web/backend. Não houve teste visual no aparelho, reset de senha real ou escrita no Supabase. Sem push ou PR nesta etapa.