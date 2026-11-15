module.exports = (req, res, next) => {
  // Opt-in explícito em qualquer ambiente, mantendo NODE_ENV=production no deploy.
  if (process.env.RECOVERY_ENABLED !== 'true') {
    return res.status(403).set('Cache-Control', 'no-store').json({
      erro: 'A recuperação de senha está indisponível neste ambiente.', codigo: 'RECOVERY_DISABLED'
    });
  }
  next();
};
