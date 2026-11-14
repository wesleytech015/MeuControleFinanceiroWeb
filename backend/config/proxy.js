const { isIP } = require('node:net');

function trustedProxies(value = '') {
  if (!value.trim()) return false;
  const networks = value.split(',').map(part => part.trim());
  for (const network of networks) {
    const [address, prefix, extra] = network.split('/');
    const family = isIP(address);
    if (!family || extra !== undefined || (prefix !== undefined
      && (!/^\d+$/.test(prefix) || Number(prefix) > (family === 4 ? 32 : 128) || Number(prefix) === 0))) {
      throw new Error('TRUSTED_PROXY_CIDRS deve conter somente IPs ou redes CIDR específicas.');
    }
  }
  return networks;
}

module.exports = { trustedProxies };
