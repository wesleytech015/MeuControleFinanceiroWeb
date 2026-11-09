import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import Movimentacoes from "./pages/Movimentacoes";
import Metas from "./pages/Metas";
import Relatorios from "./pages/Relatorios";
import Cartoes from "./pages/Cartoes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/receitas" element={<Receitas />} />
        <Route path="/despesas" element={<Despesas />} />
        <Route path="/movimentacoes" element={<Movimentacoes />} />
        <Route path="/metas" element={<Metas />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/cartoes" element={<Cartoes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;