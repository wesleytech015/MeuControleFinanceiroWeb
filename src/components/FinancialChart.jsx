import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { monthlyMovements } from "./monthlyMovements.js";


export default function FinancialChart({ movimentacoes, carregando, erro, moeda }) {
  const data = monthlyMovements(movimentacoes);
  const singleMonth = data.length === 1;
  const Chart = singleMonth ? BarChart : AreaChart;
  if (carregando) return <div className="dashboard-empty" role="status">Carregando evolução financeira...</div>;
  if (erro) return <div className="dashboard-empty" role="status">Não foi possível carregar o gráfico.</div>;
  if (!data.length) return <div className="dashboard-empty">Ainda não há movimentações para exibir a evolução financeira. Cadastre sua primeira receita ou despesa para começar.</div>;
  return <>
    <div className="dashboard-chart" role="img" aria-label="Receitas e despesas mensais. Os valores detalhados estão na tabela abaixo.">
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 0 }} accessibilityLayer>
          <defs><linearGradient id="dashboard-income" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#16a34a" stopOpacity={0.24} /><stop offset="1" stopColor="#16a34a" stopOpacity={0.03} /></linearGradient><linearGradient id="dashboard-expense" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ef4444" stopOpacity={0.24} /><stop offset="1" stopColor="#ef4444" stopOpacity={0.03} /></linearGradient></defs>
          <CartesianGrid stroke="#e6edf6" vertical={false} />
          <XAxis dataKey="month" tickFormatter={(v) => `${v.slice(5)}/${v.slice(2, 4)}`} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tickFormatter={(v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(v)} width={76} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip formatter={(v) => moeda(v)} labelFormatter={(v) => `${v.slice(5)}/${v.slice(0, 4)}`} contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} />
          <Legend verticalAlign="top" iconType="circle" height={40} />
          {singleMonth ? <>
            <Bar dataKey="receitas" name="Receitas" fill="#16a34a" maxBarSize={64} radius={[6, 6, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="despesas" name="Despesas" fill="#ef4444" maxBarSize={64} radius={[6, 6, 0, 0]} isAnimationActive={false} />
          </> : <>
            <Area type="linear" dataKey="receitas" name="Receitas" stroke="#16a34a" fill="url(#dashboard-income)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
            <Area type="linear" dataKey="despesas" name="Despesas" stroke="#ef4444" fill="url(#dashboard-expense)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
          </>}
        </Chart>
      </ResponsiveContainer>
    </div>
    <details className="dashboard-chart-details"><summary>Ver valores mensais</summary><div className="dashboard-table-scroll"><table className="dashboard-table"><caption>Totais por mês com movimentações cadastradas</caption><thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th></tr></thead><tbody>{data.map((row) => <tr key={row.month}><td>{row.month.slice(5)}/{row.month.slice(0, 4)}</td><td>{moeda(row.receitas)}</td><td>{moeda(row.despesas)}</td></tr>)}</tbody></table></div></details>
  </>;
}
