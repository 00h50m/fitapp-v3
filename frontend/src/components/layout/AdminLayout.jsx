import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, LogOut, Menu, X,
  ChevronRight, ChevronDown, Zap, ClipboardList, UserCog, Library, BookOpen,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Alunos", href: "/admin/alunos", icon: Users },
  {
    title: "Treinos",
    icon: ClipboardList,
    children: [
      { title: "Exercícios", href: "/admin/treinos/exercicios", icon: Library },
      { title: "Treinos Padrão", href: "/admin/treinos/templates", icon: ClipboardList },
      { title: "Treinos Personalizados", href: "/admin/treinos/personalizados", icon: UserCog },
    ],
  },
  { title: "Catálogo", href: "/admin/catalog", icon: BookOpen },
];

export const AdminSidebar = ({ isOpen, onToggle, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState(["Treinos"]);

  const handleClose = () => { if (window.innerWidth < 1024) onClose(); };
  const toggleSubmenu = (title) => setExpandedMenus(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  const isChildActive = (children) => children?.some(c => location.pathname.startsWith(c.href));
  const handleLogout = async () => { await logout(); window.location.href = "/login"; };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={handleClose} />}
      <aside className={cn("fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto", isOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="h-16 px-6 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground text-lg leading-none">Santana Method</h1>
              <span className="text-[10px] text-primary font-medium uppercase tracking-wider">Admin</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggle}><X className="h-5 w-5" /></Button>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              if (item.children) {
                const isExpanded = expandedMenus.includes(item.title);
                const hasActive = isChildActive(item.children);
                return (
                  <div key={item.title} className="space-y-1">
                    <button onClick={() => toggleSubmenu(item.title)} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sm font-medium transition-all duration-200", hasActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                      <item.icon className={cn("h-5 w-5 flex-shrink-0", hasActive ? "text-primary" : "text-muted-foreground")} />
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 pl-4 border-l border-border space-y-1">
                        {item.children.map((child) => {
                          const isActive = location.pathname.startsWith(child.href);
                          return (
                            <NavLink key={child.href} to={child.href} onClick={handleClose} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200", isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                              <child.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                              <span className="flex-1">{child.title}</span>
                              {isActive && <ChevronRight className="h-4 w-4 text-primary/60" />}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              const isActive = location.pathname === item.href || (item.href !== "/admin" && location.pathname.startsWith(item.href));
              return (
                <NavLink key={item.href} to={item.href} onClick={handleClose} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden", isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  {isActive && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />}
                  <item.icon className={cn("h-5 w-5 flex-shrink-0 relative z-10", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="relative z-10 flex-1">{item.title}</span>
                  {isActive && <ChevronRight className="h-4 w-4 text-primary/60 relative z-10" />}
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="h-5 w-5" /><span>Sair</span>
          </Button>
        </div>
      </aside>
    </>
  );
};

export const AdminHeader = ({ onMenuToggle }) => {
  const { profile, user } = useAuth();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Admin";
  const displayEmail = user?.email || "";
  const initials = displayName.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "A";
  return (
    <header className="h-16 px-4 lg:px-6 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}><Menu className="h-5 w-5" /></Button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">{displayEmail}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
      </div>
    </header>
  );
};

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <AdminHeader onMenuToggle={() => setSidebarOpen(p => !p)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
