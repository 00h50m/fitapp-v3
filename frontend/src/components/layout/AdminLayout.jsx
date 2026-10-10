import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, LogOut, Menu, X,
  Zap, ClipboardList, UserCog, Library, BookOpen, Settings, CreditCard,
} from "lucide-react";

// Sidebar fiel ao protótipo do personal: agrupada em seções, sempre escura
// (não acompanha o tema claro/escuro do resto do app — é a "marca" do painel).
const navGroups = [
  {
    label: "Gestão",
    items: [
      { title: "Visão geral", href: "/admin", icon: LayoutDashboard },
      { title: "Alunos", href: "/admin/alunos", icon: Users },
      { title: "Exercícios", href: "/admin/treinos/exercicios", icon: Library },
    ],
  },
  {
    label: "Treinos e conteúdo",
    items: [
      { title: "Treinos padrão", href: "/admin/treinos/templates", icon: ClipboardList },
      { title: "Personalizados", href: "/admin/treinos/personalizados", icon: UserCog },
      { title: "Catálogo", href: "/admin/catalog", icon: BookOpen },
      { title: "Planos e acessos", href: "/admin/planos", icon: CreditCard },
    ],
  },
];

export const AdminSidebar = ({ isOpen, onToggle, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const handleClose = () => { if (window.innerWidth < 1024) onClose(); };
  const handleLogout = async () => { await logout(); window.location.href = "/login"; };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={handleClose} />}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
        "bg-[hsl(220,20%,6%)] border-r border-white/10",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-none">Santana Method</h1>
              <span className="text-[10px] text-primary font-medium uppercase tracking-wider">Painel de gestão</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10" onClick={onToggle}><X className="h-5 w-5" /></Button>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-5">
            {navGroups.map(group => (
              <div key={group.label}>
                <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">{group.label}</p>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const isActive = location.pathname === item.href || (item.href !== "/admin" && location.pathname.startsWith(item.href));
                    return (
                      <NavLink key={item.href} to={item.href} onClick={handleClose} className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                      )}>
                        <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive ? "text-primary" : "text-white/40")} />
                        <span className="flex-1">{item.title}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
        <div className="p-3 border-t border-white/10 space-y-0.5 flex-shrink-0">
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            <Settings className="h-[18px] w-[18px] text-white/40" />Configurações
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-sm font-medium text-white/60 hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="h-[18px] w-[18px]" />Sair
          </button>
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
