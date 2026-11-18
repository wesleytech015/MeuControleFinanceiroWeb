# Ativação do bot na API compartilhada — 18/11/2026

Destino escolhido por Marcus: API atual no Render, com o mesmo banco do aplicativo.
Base conhecida: https://meucontrolefinanceiroweb.onrender.com/api.
Este documento não comprova publicação, migração remota ou entrega WhatsApp.

## Comportamento

WhatsApp → webhook HMAC da API → vínculo com usuário JWT → interpretação de comandos/Gemini opcional → proposta → confirmação → mesma tabela `movimentacoes` → `GET /api/transacoes` do Web/Mobile.

O vínculo é gerado no aplicativo, usando o telefone que enviará as mensagens. O modelo não escolhe usuário, não recebe JWT, não executa SQL e não confirma gravações. Mensagens livres exigem `ia ativar`, que registra consentimento para Google Gemini. A janela de contexto contém até cinco mensagens anteriores, com expiração de uso após quinze minutos. Comandos estruturados funcionam sem Gemini.

## Publicação na API atual

1. Revisar e integrar a branch backend `feature/whatsapp-vercel-academico` pelo fluxo de PR para `develop`, com revisão de outro integrante. Preservar o segredo JWT e as variáveis de banco do serviço existente. Não apontar o Render para o PostgreSQL local desta máquina.
2. No banco já usado pelo Render, verificar primeiro as migrações da atualização de autenticação já incorporada da main: `001_recuperacao_palavra_chave.sql` e `002_recuperacao_seguranca.sql`. A versão nova consulta `autenticacao_versoes` mesmo quando a recuperação está desabilitada; publicar sem essa tabela pode interromper login e rotas autenticadas. A migração 002 é de aplicação única e não deve ser reaplicada sem conferir o catálogo. Depois revisar/aplicar, em ordem, somente as migrações WhatsApp ainda ausentes: `20261109_whatsapp.postgresql.sql`, `20261114_whatsapp_ia.postgresql.sql`, `20261118_whatsapp_context.postgresql.sql`. Essas migrações não recriam usuários nem movimentações. Conferir privilégios e compatibilidade antes da aplicação. Não reaplicar o schema completo.
3. Configurar somente no servidor: `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_GRAPH_VERSION` e `WHATSAPP_TIMEZONE=America/Sao_Paulo`. Os IDs do painel de teste são Phone Number ID `1479160105278609` e WABA `2375178223313393`. Usar a versão Graph disponível no painel Meta. O access token temporário precisa estar válido; App Secret e verify token são credenciais diferentes.
4. Configurar `GEMINI_API_KEY`, `GEMINI_MODEL` e `GEMINI_ENABLED=true` no servidor se a interpretação livre for usada. Usar exclusivamente dados fictícios no piloto gratuito já escolhido. Nenhum segredo vai para `EXPO_PUBLIC_*`, `VITE_*`, Git ou logs.
5. Habilitar `WHATSAPP_ENABLED=true` apenas com configurações e estrutura preparadas. Publicar manualmente a versão revisada no serviço atual. O backend não executa migrações durante o deploy.
6. No ambiente do serviço, executar `npm run check:whatsapp -- --database` a partir de `backend`. O comando faz apenas leitura da estrutura e informa pendências sem mostrar valores privados. Saída 0 comprova configuração ativa e colunas presentes, mas não validade dos tokens ou entrega externa.
7. No Meta Developers, usar callback `https://meucontrolefinanceiroweb.onrender.com/api/whatsapp/webhook`, informar o mesmo verify token do servidor e assinar o campo `messages`. A verificação GET deve devolver o challenge. POST sem assinatura deve ser rejeitado com 403.

## Erro observado na Meta

O histórico de teste retornou `status=failed`, código `130497`, restrição de envio ao país do destinatário. O Business Support Home do MarcusV listou a conta de teste sem ocorrências e deixou Request review desabilitado. A etapa de verificação empresarial estava marcada como opcional; portanto não há evidência de que pagamento ou documentos, isoladamente, resolvam este caso.

Chamado enviado em Suporte Direto → Dev: Account & WABA → Account Activity Issues, identificando a conta e o número de teste. Protocolo `29505663689045924`, status Open. A primeira tentativa encontrou falha de geometria e rejeição da operação de ativação da janela. Após o usuário abrir o Render e nova identificação segura da janela, o envio foi concluído pelo formulário original. A Meta ainda não respondeu nem liberou o envio ao Brasil.

Render observado nesta rodada: serviço `srv-dbpkq03l550s73dkqv00`, branch main, commit ativo `428f0c3`, Root Directory `backend/`, Build Command `npm ci --omit=dev`, Start Command `node server.js`, health `/api/health`. Configurações de banco/JWT e CA Supabase existem; não havia variáveis `WHATSAPP_*` ou `GEMINI_*`. Nenhuma configuração ou implantação foi modificada nesta inspeção.

O backend agora reconhece status de falha assinados do número configurado e registra somente evento, código numérico e categoria fixa. Não grava lançamento, não responde ao status e não registra destinatário, texto, ID da mensagem ou erro bruto. Exemplo: `{"event":"whatsapp_delivery_failure","code":130497,"category":"country_restriction"}`. Aceitação inicial da Graph API não equivale à entrega no celular.

## Aceitação com conta temporária

1. Criar/entrar em uma conta de teste na API real e gerar o vínculo pelo aplicativo.
2. Enviar `vincular CODIGO` do destinatário de teste verificado ao número Meta.
3. Enviar `despesa 15 frutas`: não pode haver gravação antes da confirmação.
4. Enviar `confirmar CODIGO`: deve haver uma única movimentação de R$ 15,00 para a conta vinculada. Conferir pelo aplicativo após atualizar.
5. Reentregar o mesmo evento: não deve duplicar a movimentação. Outra conta não pode consultar esse lançamento.
6. Autorizar Gemini com `ia ativar`; testar uma despesa fictícia em linguagem livre, complemento de valor e correção antes de confirmar. Pergunta externa como preço de pneu deve ser recusada.
7. Conferir recebimento e entrega reais no webhook. Se houver 130497, a homologação externa permanece bloqueada, mesmo com testes locais aprovados.
8. Remover seletivamente os dados criados pelo teste e desvincular a conta de demonstração, preservando os demais registros.

Nenhuma atualização desta fase deve ser inserida no TCC congelado.
