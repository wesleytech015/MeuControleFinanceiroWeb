import { useCallback, useEffect, useRef, useState } from "react";
import {
  criarTransacao,
  deletarTransacao,
  editarTransacao,
  listarTransacoes,
} from "../services/api.js";
import {
  normalizeTransacao,
  normalizeTransacoesResponse,
  toApiTransacao,
} from "../services/financeData.js";
import { readAuthSession } from "../services/authSession.js";
import { FinanceContext } from "./financeContext.js";

export function FinanceProvider({ children }) {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const sessionKeyRef = useRef(null);
  const requestIdRef = useRef(0);

  const carregarMovimentacoes = useCallback(async (session) => {
    if (!session) {
      setMovimentacoes([]);
      setCarregando(false);
      return [];
    }

    const requestId = ++requestIdRef.current;
    setCarregando(true);
    setErro("");

    try {
      const response = await listarTransacoes();
      const lista = normalizeTransacoesResponse(response);
      const sessionAtual = readAuthSession();

      if (
        requestId === requestIdRef.current &&
        sessionKeyRef.current === session.key &&
        sessionAtual?.key === session.key
      ) {
        setMovimentacoes(lista);
      }

      return lista;
    } catch (error) {
      const sessionAtual = readAuthSession();
      if (
        requestId === requestIdRef.current &&
        sessionKeyRef.current === session.key &&
        sessionAtual?.key === session.key
      ) {
        setErro(error.message || "Não foi possível carregar movimentações.");
      }
      return null;
    } finally {
      if (
        requestId === requestIdRef.current &&
        sessionKeyRef.current === session.key
      ) {
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    function sincronizarSessao(event) {
      const session = readAuthSession();
      const nextKey = session?.key ?? null;

      if (nextKey === sessionKeyRef.current) return;

      sessionKeyRef.current = nextKey;
      requestIdRef.current += 1;
      setMovimentacoes([]);
      setErro(event?.detail?.error || "");
      setCarregando(Boolean(session));

      if (session) {
        carregarMovimentacoes(session);
      } else {
        setCarregando(false);
      }
    }

    window.addEventListener("auth-change", sincronizarSessao);
    window.addEventListener("storage", sincronizarSessao);
    sincronizarSessao();

    return () => {
      requestIdRef.current += 1;
      sessionKeyRef.current = null;
      window.removeEventListener("auth-change", sincronizarSessao);
      window.removeEventListener("storage", sincronizarSessao);
    };
  }, [carregarMovimentacoes]);

  function exigirSessaoAtual() {
    const session = readAuthSession();
    if (!session || session.key !== sessionKeyRef.current) {
      throw new Error("Entre novamente para acessar suas movimentações.");
    }
    return session;
  }

  async function recarregarAposOperacao(session, fallback) {
    const movimentacoesAtualizadas = await carregarMovimentacoes(session);
    if (!movimentacoesAtualizadas) {
      if (
        sessionKeyRef.current === session.key &&
        readAuthSession()?.key === session.key
      ) {
        setMovimentacoes(fallback);
      }
    }
  }

  async function adicionarMovimentacao(novaMovimentacao) {
    const session = exigirSessaoAtual();
    try {
      const payload = toApiTransacao(novaMovimentacao);
      const response = await criarTransacao(payload);
      if (response?.id == null) {
        throw new Error("A API não retornou o ID da movimentação criada.");
      }

      const fallback = [
        ...movimentacoes,
        normalizeTransacao({ ...payload, id: response.id }),
      ];
      await recarregarAposOperacao(session, fallback);
      return response;
    } catch (error) {
      if (sessionKeyRef.current === session.key) {
        setErro(error.message || "Não foi possível cadastrar a movimentação.");
      }
      throw error;
    }
  }

  async function excluirMovimentacao(id) {
    const session = exigirSessaoAtual();
    try {
      await deletarTransacao(id);
      const fallback = movimentacoes.filter((item) => item.id !== id);
      await recarregarAposOperacao(session, fallback);
    } catch (error) {
      if (sessionKeyRef.current === session.key) {
        setErro(error.message || "Não foi possível excluir a movimentação.");
      }
      throw error;
    }
  }

  async function atualizarMovimentacao(id, dadosAtualizados) {
    const session = exigirSessaoAtual();
    try {
      const atual = movimentacoes.find((item) => item.id === id);
      if (!atual) {
        throw new Error("A movimentação não está mais disponível para edição.");
      }

      const payload = toApiTransacao({ ...atual, ...dadosAtualizados });
      await editarTransacao(id, payload);
      const fallback = movimentacoes.map((item) =>
        item.id === id ? normalizeTransacao({ ...payload, id }) : item
      );
      await recarregarAposOperacao(session, fallback);
    } catch (error) {
      if (sessionKeyRef.current === session.key) {
        setErro(error.message || "Não foi possível editar a movimentação.");
      }
      throw error;
    }
  }

  return (
    <FinanceContext.Provider
      value={{
        movimentacoes,
        carregando,
        erro,
        adicionarMovimentacao,
        excluirMovimentacao,
        atualizarMovimentacao,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
