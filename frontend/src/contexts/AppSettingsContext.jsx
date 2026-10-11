import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getPublishedSettings } from "@/services/appSettingsService";
import { hexToHslString } from "@/lib/colorUtils";

// Valores que já estavam fixos no código — servem de fallback enquanto
// app_settings carrega (ou se a tabela ainda não existir num ambiente novo),
// pra nunca deixar a tela sem identidade.
export const DEFAULT_APP_SETTINGS = {
  display_name: "Santana Method",
  professional_name: "Personal Trainer",
  avatar_url: null,
  logo_url: null,
  banner_mobile_url: null,
  banner_desktop_url: null,
  banner_focal_y: 50,
  banner_title: "Método do seu personal",
  banner_subtitle: "Resultado não vem de treino aleatório — vamos pro treino de hoje?",
  banner_button_text: "Treinar agora",
  banner_button_href: null,
  primary_color: null,
  secondary_color: null,
  button_color: null,
  professional_bio: "",
  method_description: "",
  welcome_video_url: null,
  whatsapp: "5511949997913",
  instagram_url: null,
  contact_links: [],
};

const AppSettingsContext = createContext({ settings: DEFAULT_APP_SETTINGS, loading: true, reload: () => {} });

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getPublishedSettings();
      if (data) setSettings({ ...DEFAULT_APP_SETTINGS, ...data });
    } catch {
      // tabela ainda não existe ou falhou — mantém os defaults, nunca quebra a tela
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Aplica a identidade visual (cor principal/secundária) nas CSS vars do
  // tema em runtime — sem isso, a cor ficaria fixa no código mesmo com o
  // personal editando pela tela.
  useEffect(() => {
    const root = document.documentElement;
    const primaryHsl = hexToHslString(settings.primary_color);
    const secondaryHsl = hexToHslString(settings.secondary_color);
    if (primaryHsl) { root.style.setProperty("--primary", primaryHsl); root.style.setProperty("--ring", primaryHsl); }
    if (secondaryHsl) root.style.setProperty("--secondary", secondaryHsl);
  }, [settings.primary_color, settings.secondary_color]);

  return (
    <AppSettingsContext.Provider value={{ settings, loading, reload: load }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppSettingsContext);
