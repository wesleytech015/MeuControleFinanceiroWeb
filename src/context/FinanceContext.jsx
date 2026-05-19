import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const FinanceContext = createContext();

export function FinanceProvider({ children }) {

  // CARREGA DADOS SALVOS
  const [movimentacoes, setMovimentacoes] = useState(() => {

    const dadosSalvos = localStorage.getItem("movimentacoes");

    return dadosSalvos
      ? JSON.parse(dadosSalvos)
      : [];

  });

  // SALVA AUTOMATICAMENTE
  useEffect(() => {

    localStorage.setItem(
      "movimentacoes",
      JSON.stringify(movimentacoes)
    );

  }, [movimentacoes]);

  function adicionarMovimentacao(novaMovimentacao) {

    setMovimentacoes([
      ...movimentacoes,
      novaMovimentacao,
    ]);

  }

  function excluirMovimentacao(index) {

    const novaLista = movimentacoes.filter(
      (_, i) => i !== index
    );

    setMovimentacoes(novaLista);

  }

  return (
    <FinanceContext.Provider
      value={{
        movimentacoes,
        adicionarMovimentacao,
        excluirMovimentacao,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinanceiro() {
  return useContext(FinanceContext);
}