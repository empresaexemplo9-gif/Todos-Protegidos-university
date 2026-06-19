# Todos Protegidos — Novato ao Pro

Interface e **Dashboard** da **Academia do Consultor** da **Todos Protegidos**
(proteção veicular): a plataforma que treina e orienta consultores "do novato ao
pro", com **padrão de atendimento** e **protocolos** de cotação, vistoria, venda
e pós-venda.

> O foco é a **capacitação de consultores de proteção veicular** com padrão e
> protocolo. O **Cartão de TODOS** é citado apenas na apresentação institucional
> da empresa (seção "A empresa").

A identidade visual usa **verde** como cor principal, **azul** de apoio e um
acento quente para dar energia — com logo, nome e cores aplicados em toda a
interface.

## 📄 Páginas

| Arquivo | Descrição |
|---|---|
| `index.html` | Landing da Academia do Consultor (apresentação da empresa, método, padrão & protocolo, trilha do novato ao pro) |
| `dashboard.html` | Dashboard do consultor — trilha de treinamento, padrões & protocolos, vendas, comissões e ranking |
| `aula.html` | Player de aula (vídeo, playlist, abas, materiais e anotações) |
| `aula-abordagem.html` | Aula de **abordagem: formas e técnicas** — passo a passo, 5 modelos de abordagem em sinaleiro, área comercial, frases de impacto e como os profissionais de destaque atuam |
| `protocolos.html` | Manual de **padrões & protocolos** (cotação, vistoria, fechamento, pós-venda) com checklists interativas |
| `scripts.html` | **Biblioteca de scripts & objeções** — reativação, Cartão de Todos e contorno de 10 objeções |
| `gestao.html` | **Gestão de conteúdo** — adicionar informações e vídeos para cada nível (do novato ao pro) |
| `styleguide.html` | Referência do Design System (cores, logo, tipografia, componentes) |

> Os scripts comerciais (abordagem em sinaleiro/área comercial, contorno de
> objeções, reativação, Cartão de Todos e checklist de vistoria) foram
> incorporados a partir do material operacional **Script_2805**.

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
