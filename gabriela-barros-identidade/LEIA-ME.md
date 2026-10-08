# Gabriela Barros — Confeitaria · Identidade visual v1.0

## Pastas
| Pasta | Conteúdo |
|---|---|
| `svg/` | 24 SVG vetoriais (6 versões × 4 cores), letras convertidas em curvas, grupos nomeados |
| `svg-texto-editavel/` | 20 SVG com "Gabriela Barros" e "CONFEITARIA" como texto ativo (instale as fontes de `fontes/`) |
| `pdf/` | 24 PDF vetoriais para gráfica (sem imagens rasterizadas) |
| `png/` | 24 PNG com fundo transparente, 3.000 px no maior lado |
| `padrao/` | 2 padrões repetíveis (tile 800×800) em SVG, PDF e PNG + prévia de repetição 3×3 |
| `guia/` | Guia da marca em PDF (11 páginas) |
| `fontes/` | Grand Hotel e Montserrat originais + licenças SIL OFL 1.1 |
| `mockups/` | Simulações ilustrativas (caixa, adesivo, tags, cartão, perfil) |
| `apresentacao/` | Prancha de apresentação (PNG + PDF) — prévia, não substitui os arquivos |
| `_scripts/` | Código-fonte que gera todos os arquivos (Python) |

## Nomes
`gabriela-barros_[versão]_[cor].[formato]`
- versão: `logo-principal`, `logo-horizontal`, `logo-compacta`, `selo-circular`, `simbolo`, `lettering`
- cor: `colorida`, `bordo`, `preto`, `branco` (branco = para fundos escuros)

## Grupos nos SVG
`fundo` (só no selo colorido) · `moldura` (selo) · `simbolo` (forminha, brigadeiro, granulados, coracao) ·
`lettering` (gabriela, barros) · `descritor` (confeitaria, fios) · `elementos-decorativos` (traço sob "Barros", coração do selo).
Os grupos aparecem como camadas nomeadas no Inkscape e como grupos com id no Illustrator/Figma.

## Cores
| Cor | HEX | RGB |
|---|---|---|
| Bordô | #621B28 | 98 · 27 · 40 |
| Rosa claro | #F2B5B0 | 242 · 181 · 176 |
| Terracota | #C1603F | 193 · 96 · 63 |
| Marrom | #45211A | 69 · 33 · 26 |
| Creme | #FBF1EA | 251 · 241 · 234 |

Os valores CMYK estão no guia (conversão sRGB → "Artifex CMYK SWOP Profile", intenção colorimétrica relativa).
São uma referência de partida: peça à gráfica a conversão no perfil dela (ex.: FOGRA39) e aprove com prova de cor.

## Fontes
- **Grand Hotel** — Astigmatic (Brian J. Bonislawsky e Jim Lyles). Google Fonts. SIL Open Font License 1.1.
  Base do lettering; no logo, foi convertida em curvas, engrossada e reespaçada.
- **Montserrat** — Julieta Ulanovsky e colaboradores. Google Fonts. SIL Open Font License 1.1. Descritor (SemiBold 600) e textos.

Os SVG de texto editável usam o mesmo traço engrossado (via contorno) e o mesmo espaçamento.
Para fidelidade total em produção, use sempre os arquivos em curvas (`svg/` ou `pdf/`).
