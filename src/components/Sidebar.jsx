import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="sidebar-logo">MeuControle</h2>

      <nav className="sidebar-menu">
        <NavLink to="/dashboard">📊 Dashboard</NavLink>
        <NavLink to="/receitas">💰 Receitas</NavLink>
        <NavLink to="/despesas">💸 Despesas</NavLink>
        <NavLink to="/movimentacoes">📋 Movimentações</NavLink>
        <NavLink to="/metas">🎯 Metas</NavLink>
        <NavLink to="/relatorios">📈 Relatórios</NavLink>
        <NavLink to="/cartoes">💳 Cartões</NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;