const segredo = process.env.JWT_SECRET;

if (typeof segredo !== 'string' || segredo.trim() === '' || Buffer.byteLength(segredo, 'utf8') < 32) {
  throw new Error('JWT_SECRET é obrigatória e deve ter pelo menos 32 bytes. Configure antes de iniciar o backend.');
}

module.exports = segredo;
