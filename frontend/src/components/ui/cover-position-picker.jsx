import React from "react";
import { Slider } from "@/components/ui/slider";
import { MoveVertical } from "lucide-react";

// Slider de ajuste do ponto focal vertical de uma foto de capa — pra usar
// ao lado de uma prévia já existente (que aplica objectPosition com o
// mesmo valor), sem duplicar o preview.
export function FocalYSlider({ value = 50, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <MoveVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={0}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-[11px] text-muted-foreground w-8 text-right flex-shrink-0">{value}%</span>
      </div>
      <p className="text-[11px] text-muted-foreground">Arraste pra ajustar qual parte da foto aparece no recorte.</p>
    </div>
  );
}

// Versão com preview própria (recortada do jeito que vai aparecer no app),
// pra usar quando não há outra prévia na tela.
export function CoverPositionPicker({ src, focalY = 50, onChange, aspectClassName = "h-40" }) {
  if (!src) return null;
  return (
    <div className="space-y-2">
      <div className={`relative rounded-xl overflow-hidden ${aspectClassName}`}>
        <img
          src={src}
          alt="Pré-visualização da capa"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: `center ${focalY}%` }}
        />
      </div>
      <FocalYSlider value={focalY} onChange={onChange} />
    </div>
  );
}
