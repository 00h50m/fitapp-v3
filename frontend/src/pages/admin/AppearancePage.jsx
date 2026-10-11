import React, { useState, useEffect, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Palette, Loader2, Save, Upload, Smartphone, Monitor, Sparkles, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDraftSettings, saveDraft, publishDraft, discardDraft, uploadBrandingImage,
} from "@/services/appSettingsService";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { FocalYSlider } from "@/components/ui/cover-position-picker";

const Field = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
  </div>
);

const ImageUploadField = ({ label, value, onChange, folder, hint }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBrandingImage(file, folder);
      onChange(url);
    } catch (err) { toast.error("Erro ao enviar imagem: " + err.message); }
    finally { setUploading(false); }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground/40" />}
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {value ? "Trocar imagem" : "Enviar imagem"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </Field>
  );
};

const ColorField = ({ label, value, onChange }) => (
  <Field label={label}>
    <div className="flex items-center gap-2">
      <input type="color" value={value || "#000000"} onChange={e => onChange(e.target.value)} className="h-9 w-12 rounded-md border border-border cursor-pointer bg-transparent" />
      <Input value={value || ""} onChange={e => onChange(e.target.value)} placeholder="#F5C518" className="flex-1" />
    </div>
  </Field>
);

const AppearancePage = () => {
  const { reload: reloadPublished } = useAppSettings();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("mobile");

  const load = useCallback(async () => {
    setLoading(true);
    try { setDraft(await getDraftSettings()); }
    catch (err) { toast.error("Erro ao carregar configurações: " + err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (field, value) => setDraft(prev => ({ ...prev, [field]: value }));

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { id, updated_at, ...fields } = draft;
      await saveDraft(fields);
      toast.success("Rascunho salvo!");
    } catch (err) { toast.error("Erro ao salvar: " + err.message); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await handleSaveDraft();
      await publishDraft();
      await reloadPublished();
      toast.success("Alterações publicadas! Já está no ar.");
    } catch (err) { toast.error("Erro ao publicar: " + err.message); }
    finally { setPublishing(false); }
  };

  const handleDiscard = async () => {
    try { setDraft(await discardDraft()); toast("Rascunho descartado — voltou ao que está publicado."); }
    catch (err) { toast.error("Erro: " + err.message); }
  };

  if (loading || !draft) {
    return <AdminLayout><div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in max-w-5xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />Aparência do aplicativo
            </h1>
            <p className="text-muted-foreground mt-1">Configure a identidade que seus alunos veem — nada fica fixo no código.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleDiscard}>Descartar rascunho</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSaveDraft} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Salvar rascunho
            </Button>
            <Button variant="premium" size="sm" className="gap-1.5" onClick={handlePublish} disabled={publishing}>
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Publicar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-5">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Identidade</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nome exibido no aplicativo"><Input value={draft.display_name || ""} onChange={e => set("display_name", e.target.value)} /></Field>
                <Field label="Nome profissional"><Input value={draft.professional_name || ""} onChange={e => set("professional_name", e.target.value)} /></Field>
                <ImageUploadField label="Logotipo" value={draft.logo_url} onChange={v => set("logo_url", v)} folder="logo" />
                <ImageUploadField label="Foto de perfil" value={draft.avatar_url} onChange={v => set("avatar_url", v)} folder="avatar" />
                <div className="sm:col-span-2">
                  <Field label="Apresentação profissional">
                    <textarea className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={draft.professional_bio || ""} onChange={e => set("professional_bio", e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Descrição do método">
                    <textarea className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={2} value={draft.method_description || ""} onChange={e => set("method_description", e.target.value)} />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Banner principal</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadField label="Imagem — celular" value={draft.banner_mobile_url} onChange={v => set("banner_mobile_url", v)} folder="banner-mobile" />
                  <ImageUploadField label="Imagem — desktop" value={draft.banner_desktop_url} onChange={v => set("banner_desktop_url", v)} folder="banner-desktop" />
                </div>
                {draft.banner_mobile_url && (
                  <Field label="Ponto focal da imagem">
                    <FocalYSlider value={draft.banner_focal_y ?? 50} onChange={v => set("banner_focal_y", v)} />
                  </Field>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Título do banner"><Input value={draft.banner_title || ""} onChange={e => set("banner_title", e.target.value)} /></Field>
                  <Field label="Texto complementar"><Input value={draft.banner_subtitle || ""} onChange={e => set("banner_subtitle", e.target.value)} /></Field>
                  <Field label="Texto do botão"><Input value={draft.banner_button_text || ""} onChange={e => set("banner_button_text", e.target.value)} /></Field>
                  <Field label="Destino do botão" hint="Ex: /student/catalog"><Input value={draft.banner_button_href || ""} onChange={e => set("banner_button_href", e.target.value)} /></Field>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Cores</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ColorField label="Cor principal" value={draft.primary_color} onChange={v => set("primary_color", v)} />
                <ColorField label="Cor secundária" value={draft.secondary_color} onChange={v => set("secondary_color", v)} />
                <ColorField label="Cor dos botões" value={draft.button_color} onChange={v => set("button_color", v)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Contato</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="WhatsApp" hint="Só números, com DDI. Ex: 5511999999999"><Input value={draft.whatsapp || ""} onChange={e => set("whatsapp", e.target.value)} /></Field>
                <Field label="Instagram"><Input value={draft.instagram_url || ""} onChange={e => set("instagram_url", e.target.value)} placeholder="https://instagram.com/..." /></Field>
                <Field label="Vídeo de boas-vindas" hint="Link do YouTube"><Input value={draft.welcome_video_url || ""} onChange={e => set("welcome_video_url", e.target.value)} /></Field>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Card className="lg:sticky lg:top-6">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-sm">Como vai ficar</CardTitle>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  <button className={`h-7 w-7 rounded-md flex items-center justify-center ${previewDevice === "mobile" ? "bg-card shadow-sm" : ""}`} onClick={() => setPreviewDevice("mobile")}>
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                  <button className={`h-7 w-7 rounded-md flex items-center justify-center ${previewDevice === "desktop" ? "bg-card shadow-sm" : ""}`} onClick={() => setPreviewDevice("desktop")}>
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`mx-auto border border-border rounded-2xl overflow-hidden bg-background ${previewDevice === "mobile" ? "max-w-[280px]" : "max-w-full"}`}>
                  <div className="relative h-36 overflow-hidden">
                    {(previewDevice === "mobile" ? draft.banner_mobile_url : draft.banner_desktop_url || draft.banner_mobile_url) ? (
                      <img
                        src={previewDevice === "mobile" ? draft.banner_mobile_url : (draft.banner_desktop_url || draft.banner_mobile_url)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: `center ${draft.banner_focal_y ?? 50}%` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/8 to-transparent" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-foreground bg-background/70 backdrop-blur-md border border-border/50 rounded-full px-2 py-0.5 mb-2">
                        <Sparkles className="h-3 w-3 text-primary" />{draft.banner_title || "Título do banner"}
                      </span>
                      <p className="text-[11px] text-muted-foreground max-w-[220px]">{draft.banner_subtitle}</p>
                      <Button size="sm" variant="premium" className="mt-2 text-xs h-7">{draft.banner_button_text || "Botão"}</Button>
                    </div>
                  </div>
                  <div className="p-3 flex items-center gap-2 border-t border-border">
                    {draft.logo_url ? <img src={draft.logo_url} alt="" className="h-6 w-6 rounded-md object-cover" /> : <div className="h-6 w-6 rounded-md bg-primary" />}
                    <span className="text-xs font-semibold">{draft.display_name || "Nome do app"}</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 text-center">Pré-visualização aproximada — publique para ver no app real.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AppearancePage;
