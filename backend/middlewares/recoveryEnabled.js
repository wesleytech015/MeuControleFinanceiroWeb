module.exports = (req, res, next) => {
  // Não existe override que habilite recuperação por frase em produção.
  if (process.env.NODE_ENV === 'production' || process.env.RECOVERY_ENABLED !== 'true') {
    return res.status(403).set('Cache-Control', 'no-store').json({
      erro: 'A recuperação de senha está indisponível neste ambiente.', codigo: 'RECOVERY_DISABLED'
    });
  }
  next();
};
