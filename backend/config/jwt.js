const segredo = process.env.JWT_SECRET;

if (typeof segredo !== 'string' || segredo.trim() === '') {
  throw new Error('JWT_SECRET é obrigatória. Configure a variável de ambiente antes de iniciar o backend.');
}

module.exports = segredo;
