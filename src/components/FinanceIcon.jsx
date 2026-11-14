export default function FinanceIcon({ name, ...props }) {
  const paths = {
    plus: <path d="M12 4v16M4 12h16" />,
    close: <path d="m5 5 14 14M5 19 19 5" />,
    edit: <><path d="m14 4 6 6M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z" /></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
    home: <path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z" />,
    up: <path d="m3 17 7-7 4 4 7-10M15 4h6v6" />,
    down: <path d="m3 7 7 7 4-4 7 10M15 20h6v-6" />,
    list: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 8h10M7 12h10M7 16h5" /></>,
    target: <><circle cx="11" cy="13" r="8" /><circle cx="11" cy="13" r="4" /><path d="m11 13 9-10m-4 0h4v4" /></>,
    chart: <path d="M4 20v-6M10 20V9M16 20V4M2 21h20" />,
    coins: <><ellipse cx="9" cy="12" rx="6" ry="3" /><path d="M3 12v8c0 4 12 4 12 0v-8M3 16c0 4 12 4 12 0M15 15c4 0 6-1 6-3V5M15 11c4 0 6-1 6-3" /><ellipse cx="15" cy="5" rx="6" ry="3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6M17 2v6M3 11h18m-13 5 3 3 5-5" /></>,
    pie: <path d="M11 3a9 9 0 1 0 9 10h-9ZM14 2v8h8a9 9 0 0 0-8-8Z" />,
    logout: <path d="M10 3H4v18h6m-1-9h13m-5-5 5 5-5 5" />,
    card: <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 9h20M6 15h4" /></>,
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  };
  return <svg className="finance-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
