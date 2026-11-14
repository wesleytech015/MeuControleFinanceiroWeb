import { NavLink } from "react-router-dom";
import { isCardsFeatureEnabled } from "../config/featureFlags.js";
import FinanceIcon from "./FinanceIcon";
export default function Sidebar({ open, onClose }) {
  const links = [["/dashboard", "home", "Dashboard"], ["/receitas", "up", "Receitas"], ["/despesas", "down", "Despesas"], ["/movimentacoes", "list", "Movimentações"], ["/metas", "target", "Metas"], ["/relatorios", "chart", "Relatórios"]];
  if (isCardsFeatureEnabled()) links.push(["/cartoes", "card", "Cartões"]);
  return <>
    {open && <button className="sidebar-backdrop" onClick={onClose} aria-label="Fechar menu" />}
    <aside id="main-navigation" className={`sidebar${open ? " sidebar-open" : ""}`}>
      <div className="sidebar-brand"><span className="sidebar-brand-mark" aria-hidden="true"><i /><i /><i /></span><div><h2>MeuControle</h2><p>Controle Financeiro</p></div></div>
      <nav className="sidebar-menu" aria-label="Navegação principal">
        {links.map(([to, icon, label]) => <NavLink key={to} to={to} onClick={onClose}><FinanceIcon name={icon} /><span>{label}</span></NavLink>)}
      </nav>

    </aside>
  </>;
}
