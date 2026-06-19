# Todos Protegidos — Novato ao Pro

Interface e **Dashboard** da plataforma **Todos Protegidos** (proteção veicular),
incluindo a área de treinamento de consultores "do novato ao pro".

A identidade visual foi construída a partir das características da marca
(parceira do **Cartão de TODOS** 🍀): **verde** como cor principal, **azul** de
apoio e um acento quente para dar energia — com logo, nome e cores aplicados em
toda a interface.

## 📄 Páginas

| Arquivo | Descrição |
|---|---|
| `index.html` | Landing / interface principal (proteção veicular, cotação, benefícios) |
| `dashboard.html` | Dashboard do consultor — treinamento, vendas, comissões e ranking |
| `styleguide.html` | Referência do Design System (cores, logo, tipografia, componentes) |

## 🎨 Design System

- **Tokens:** `assets/css/tokens.css` — cores, tipografia, espaçamento, sombras e raios
- **Base + componentes:** `assets/css/main.css`
- **Dashboard:** `assets/css/dashboard.css`
- **Logo / marca:** `assets/img/logo.svg`, `logo-mark.svg`, `favicon.svg`

### Paleta principal
| Token | Hex | Uso |
|---|---|---|
| `--tp-green-700` | `#00813f` | Verde profundo (primário) |
| `--tp-green-500` | `#00a859` | Verde vibrante |
| `--tp-blue-900` | `#0b2a4a` | Azul escuro (apoio) |
| `--tp-blue-300` | `#59b3e6` | Azul claro (apoio) |
| `--tp-amber-400` | `#ffc23c` | Acento / CTA / badges |

**Tipografia:** Poppins (títulos) · Inter (texto).

## 🚀 Como visualizar

Não há etapa de build — é HTML/CSS/JS puro. Basta abrir `index.html` no
navegador, ou servir a pasta:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

## 📁 Estrutura

```
.
├── index.html
├── dashboard.html
├── styleguide.html
└── assets/
    ├── css/   (tokens.css, main.css, dashboard.css)
    ├── js/    (app.js)
    └── img/   (logo.svg, logo-mark.svg, favicon.svg)
```
