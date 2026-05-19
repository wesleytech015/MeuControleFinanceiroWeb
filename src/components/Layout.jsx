import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "../styles/layout.css";

function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />

      <main className="layout-main">
        <Navbar />

        <section className="layout-content">
          {children}
        </section>
      </main>
    </div>
  );
}

export default Layout;