import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-16" : "lg:pl-60"}`}>
        <main className="min-h-screen p-6 pt-20 lg:p-8 lg:pt-8">
          <div className="mb-4 lg:hidden">
            <Button variant="outline" size="icon" onClick={() => setMobileSidebarOpen(true)}>
              <Menu size={18} />
            </Button>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
