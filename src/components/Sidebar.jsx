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
      <div className="sidebar-decoration" aria-hidden="true">
        <svg viewBox="0 0 240 200" fill="none">
          <defs><linearGradient id="sidebar-bar" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8dc9ff" /><stop offset=".5" stopColor="#3b82f6" /><stop offset="1" stopColor="#1649bc" /></linearGradient><linearGradient id="sidebar-gold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff095" /><stop offset=".5" stopColor="#ffcd4d" /><stop offset="1" stopColor="#de921b" /></linearGradient></defs>
          <path d="M0 110Q48 10 110 85t130-5v120H0Z" fill="#1a47a6" opacity=".25" />
          <ellipse cx="120" cy="183" rx="104" ry="10" fill="#041737" opacity=".5" />
          <g fill="url(#sidebar-bar)" stroke="#77b6ff" strokeWidth=".7"><rect x="31" y="132" width="33" height="47" rx="4" /><rect x="86" y="101" width="34" height="78" rx="4" /><rect x="151" y="67" width="36" height="112" rx="4" /></g>
          <path d="M22 127C67 76 112 102 186 32l-15-8 48-9-14 46-7-16C127 108 73 91 22 127Z" fill="#278bff" />
          <ellipse cx="145" cy="155" rx="34" ry="37" fill="#d69722" /><ellipse cx="139" cy="152" rx="33" ry="37" fill="url(#sidebar-gold)" stroke="#ffe785" strokeWidth="2" /><ellipse cx="139" cy="152" rx="25" ry="29" stroke="#e7a62d" strokeWidth="2" /><path d="M147 139c-17-9-25 10-8 14 20 4 7 23-8 15m8-37v46" stroke="#fff0a0" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    </aside>
  </>;
}
