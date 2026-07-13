import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
