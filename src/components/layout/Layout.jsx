import { Outlet } from "react-router-dom";
import MobileNav from "./MobileNav";
import Navbar from "./Navbar";
import OnboardingWizard from "../ui/OnboardingWizard";
import InstallPrompt from "../ui/InstallPrompt";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <MobileNav />
      <OnboardingWizard />
      <InstallPrompt />
    </div>
  );
}
