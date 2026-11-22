const documents = require('./knowledge.json');
const stop = new Set('a o as os um uma uns umas de da do das dos em no na nos nas e ou para por com que qual quais como meu minha meus minhas eu voce pode sobre pelo pela se ao isso este esta app aplicativo'.split(' '));
function tokens(text) {
  return [...new Set(text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]+/g) || [])]
    .filter(token => token.length > 2 && !stop.has(token));
}
// Small, reviewed corpus: deterministic lexical retrieval, no embedding API or private records.
function retrieve(query, corpus = documents) {
  const terms = tokens(query);
  if (!terms.length) return [];
  return corpus.map(doc => {
    const words = new Set(tokens(`${doc.titulo} ${doc.texto}`));
    return { doc, score: terms.reduce((sum, term) => sum + (words.has(term) ? 1 : 0), 0) };
  }).filter(result => result.score >= Math.min(2, terms.length))
    .sort((a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id)).slice(0, 3).map(result => result.doc);
}
module.exports = { retrieve };
