import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [movimentacoes, setMovimentacoes] = useState(() => {
    const dadosSalvos = localStorage.getItem("movimentacoes");
    return dadosSalvos ? JSON.parse(dadosSalvos) : [];
  });

  const [carregando] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "movimentacoes",
      JSON.stringify(movimentacoes)
    );
  }, [movimentacoes]);

  function adicionarMovimentacao(novaMovimentacao) {
    setMovimentacoes((listaAtual) => [
      ...listaAtual,
      novaMovimentacao,
    ]);
  }

  function excluirMovimentacao(index) {
    setMovimentacoes((listaAtual) =>
      listaAtual.filter((_, i) => i !== index)
    );
  }

  function atualizarMovimentacao(index, dadosAtualizados) {
    setMovimentacoes((listaAtual) =>
      listaAtual.map((item, i) =>
        i === index
          ? {
              ...item,
              ...dadosAtualizados,
            }
          : item
      )
    );
  }

  return (
    <FinanceContext.Provider
      value={{
        movimentacoes,
        carregando,
        adicionarMovimentacao,
        excluirMovimentacao,
        atualizarMovimentacao,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceiro() {
  return useContext(FinanceContext);
}