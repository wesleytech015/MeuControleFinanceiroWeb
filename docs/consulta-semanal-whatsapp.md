# Consulta de gastos da semana pelo WhatsApp — 15/11/2026

Perguntas aceitas: quanto eu gastei essa semana?, quanto gastei nesta semana?, gastos da semana e meus gastos desta semana. O interpretador reconhece a intenção antes de chamar a IA.

Semana significa segunda-feira até a data atual no fuso WHATSAPP_TIMEZONE (padrão America/Sao_Paulo). A resposta informa as datas e o fuso. A aritmética usa datas de calendário, com limite exclusivo no dia seguinte, sem deslocamento UTC dos lançamentos DATE. Valores futuros, receitas, registros de outras contas e propostas ainda não confirmadas ficam de fora.

A consulta usa o usuario_id obtido do telefone vinculado, SQL fixo e parâmetros para usuário/início/fim. Não aceita SQL ou ID produzidos por Gemini. Consulta financeira não depende de consentimento de IA e não consome chamada ao Google: totais e lançamentos não são enviados ao modelo. O webhook continua exigindo assinatura Meta e a conta vinculada. Se o banco falhar, retorna falha de processamento; não apresenta zero inventado.

O total é formatado a partir da string decimal do PostgreSQL. Consulta não cria proposta, não exige código de confirmação e não cancela/substitui proposta pendente. Lançamentos continuam exigindo confirmação explícita. Resumo continua consultando todo o período.

Escopo: apenas semana atual e total de despesas cadastradas. Perguntas com categoria, outro usuário ou semana passada não são convertidas silenciosamente nessa consulta.

Validação desta mudança:
- 30 testes de regressão WhatsApp/Gemini/consentimento aprovados, incluindo virada de domingo/segunda no fuso de São Paulo, virada do ano, acesso sem vínculo, zero real e erro de banco.
- 24 verificações de integração aprovadas com PostgreSQL portátil descartável e webhook HTTP reais. Conferidos limites de datas, receitas excluídas, outra conta excluída, proposta pendente fora do total e confirmação preservada. Meta e Gemini simulados nessa rodada; a consulta semanal não chamou o modelo.
- Lint e git diff --check aprovados. Sem mudança de dependências, schema ou migração.

Implementação somente local na branch feature/whatsapp-vercel-academico. Sem push, PR, deploy, mensagem WhatsApp real ou acesso ao banco compartilhado.