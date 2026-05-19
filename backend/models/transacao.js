const conexao = require('../database/conexao');

class Transacao {
    static async listarTodas() {
        const [rows] = await conexao.query('SELECT * FROM movimentacoes');
        return rows;
    }

    static async criar(transacao) {
        const { descricao, valor, tipo, data } = transacao;
        const sql = `
            INSERT INTO movimentacoes (descricao, valor, tipo, data)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await conexao.query(sql, [descricao, valor, tipo, data]);
        return result;
    }

    static async deletar(id) {
        const [result] = await conexao.query(
            'DELETE FROM movimentacoes WHERE id = ?',
            [id]
        );
        return result;
    }
}

module.exports = Transacao;
