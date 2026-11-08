const express = require('express');
const { equal, validSignature, messages, createSender } = require('./transport');
const { processMessage } = require('./processor');
function createWhatsAppRouter({ config, repository, authenticate, send = config && createSender(config) }) {
  const router = express.Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!config) return res.status(503).json({ erro: 'Integração WhatsApp não habilitada neste ambiente.' });
    next();
  });
  router.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] !== 'subscribe' || !equal(req.query['hub.verify_token'], config.verifyToken)
      || typeof req.query['hub.challenge'] !== 'string' || !/^\d{1,64}$/.test(req.query['hub.challenge'])) return res.sendStatus(403);
    res.type('text/plain').send(req.query['hub.challenge']);
  });
  router.post('/webhook', async (req, res) => {
    if (!validSignature(req.rawBody, req.get('X-Hub-Signature-256'), config.appSecret)) return res.sendStatus(403);
    try {
      for (const message of messages(req.body, config.phoneNumberId)) {
        await repository.receive(message, (store, input) => processMessage(store, input, { timeZone: config.timeZone }));
        // Await the network call before ending the invocation; no detached background work.
        await repository.deliver(message, send);
      }
      res.sendStatus(200);
    } catch {
      // Retry reuses the persisted reply and never repeats the financial write.
      res.status(503).json({ erro: 'Não foi possível processar a mensagem agora.' });
    }
  });
  router.use('/vinculo', authenticate);
  router.get('/vinculo', async (req, res, next) => {
    try { res.json(await repository.status(req.usuario.id)); } catch (error) { next(error); }
  });
  router.post('/vinculo', async (req, res, next) => {
    try {
      const { phone } = require('./repository');
      let number;
      try { number = phone(req.body?.numero); } catch (error) { return res.status(400).json({ erro: error.message }); }
      res.status(201).json(await repository.pairing(req.usuario.id, number));
    } catch (error) { next(error); }
  });
  router.delete('/vinculo', async (req, res, next) => {
    try { await repository.unlink(req.usuario.id); res.json({ mensagem: 'WhatsApp desvinculado.' }); }
    catch (error) { next(error); }
  });
  return router;
}
module.exports = { createWhatsAppRouter };
