import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { MobileContainer, MobileHeader, MobileContent } from "@/components/layout/MobileContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { ChevronRight, Library, Bookmark, ChartNoAxesColumnIncreasing, MessageCircle, LogOut, HelpCircle, Compass } from "lucide-react";
import { PLAN_VALUE_LABEL } from "@/lib/planPermissions";
import { useAppSettings } from "@/contexts/AppSettingsContext";

const SettingRow = ({ icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-3 rounded-2xl bg-card shadow-sm p-4 text-left mb-2 hover:shadow-md transition-all"
  >
    <Icon className="h-[18px] w-[18px] text-muted-foreground flex-shrink-0" />
    <span className="flex-1 text-sm font-medium">{label}</span>
    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
  </button>
);

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { settings } = useAppSettings();

  return (
    <MobileContainer className="pb-24">
      <MobileHeader>
        <h1 className="text-xl font-semibold">Seu perfil</h1>
        <p className="text-xs text-muted-foreground mt-1">Conta e preferências</p>
      </MobileHeader>

      <MobileContent>
        <div className="rounded-2xl bg-card shadow-sm p-4 flex items-center gap-3 mb-5">
          <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
            {(profile?.name || "A").trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{profile?.name || "Aluno"}</p>
            <span className="inline-flex mt-1 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
              Plano {PLAN_VALUE_LABEL[profile?.plan] || profile?.plan || "—"}
            </span>
          </div>
        </div>

        <SettingRow icon={Compass} label="Comece por aqui" onClick={() => navigate("/student/comece-por-aqui")} />
        <SettingRow icon={Library} label="Jornadas e programas" onClick={() => navigate("/student/catalog")} />
        <SettingRow icon={Bookmark} label="Treinos ativos" onClick={() => navigate("/student")} />
        <SettingRow icon={ChartNoAxesColumnIncreasing} label="Minha evolução" onClick={() => navigate("/student/evolution")} />
        <SettingRow icon={HelpCircle} label="Aprenda a usar" onClick={() => navigate("/student/ajuda")} />
        <SettingRow
          icon={MessageCircle}
          label="Falar com o personal"
          onClick={() => window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Olá! Preciso falar com meu personal.")}`, "_blank")}
        />

        <Button
          variant="outline"
          className="w-full mt-4 gap-2"
          onClick={async () => { try { await logout(); } catch {} }}
        >
          <LogOut className="h-4 w-4" />Sair da conta
        </Button>
      </MobileContent>

      <BottomNav />
    </MobileContainer>
  );
};

export default StudentProfilePage;
