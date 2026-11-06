/* ============================================================================
   MARCENARIA RAÍZES — script.js
   ----------------------------------------------------------------------------
   COMO EDITAR:
   • CONFIG no topo ↓ → número do WhatsApp, etc.
   • Cada recurso do site está isolado numa função comentada.
   • Nada aqui é obrigatório: se apagar um bloco, o site continua
     funcionando (só perde o recurso correspondente).

   O QUE ESTE ARQUIVO FAZ:
   1. Cabeçalho com fundo ao rolar
   2. Menu hambúrguer (celular)
   3. Link da navegação ativo conforme a rolagem
   4. Animação de aparição dos elementos (reveal)
   5. Contadores animados (25+, 800+, 100%)
   6. Filtro do portfólio
   7. Lightbox (imagem ampliada)
   8. Brilho que segue o mouse nos cards de serviço
   9. Validação do formulário → envia pelo WhatsApp
   10. Ano atual no rodapé
   ========================================================================== */

/* ============================================================================
   ⚙️ CONFIG — MURE AQUI O QUE PRECISAR
   ========================================================================== */
const CONFIG = {
  /* Número do WhatsApp da empresa: DDI + DDD + número (só dígitos) */
  whatsapp: "5511999999999", // ← TROQUE (ex.: 5521988887777)

  /* Texto que aparece no WhatsApp antes da mensagem do cliente */
  whatsappPrefix: "Olá! Vim pelo site da marcenaria e gostaria de um orçamento.",
};

/* ============================================================================
   1. CABEÇALHO — ganha fundo/blur quando a página rola
   ========================================================================== */
function configurarCabecalho() {
  const header = document.getElementById("header");
  if (!header) return;

  // Liga/desliga a classe "is-scrolled" (o visual está no CSS)
  const atualizar = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  atualizar();                    // roda 1x ao carregar (pode abrir já rolando)
  window.addEventListener("scroll", atualizar, { passive: true });
}

/* ============================================================================
   2. MENU HAMBÚRGUER (celular)
   ========================================================================== */
function configurarMenuMobile() {
  const botao = document.getElementById("hamburger");
  const nav = document.getElementById("nav");
  if (!botao || !nav) return;

  const alternar = (abrir) => {
    nav.classList.toggle("is-open", abrir);
    botao.classList.toggle("is-open", abrir);
    botao.setAttribute("aria-expanded", String(abrir));
    botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
    document.body.style.overflow = abrir ? "hidden" : ""; // trava a rolagem com o menu aberto
  };

  botao.addEventListener("click", () => alternar(!nav.classList.contains("is-open")));

  // Ao clicar num link, fecha o menu
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => alternar(false)));
}

/* ============================================================================
   3. LINK ATIVO NA NAVEGAÇÃO
   - Observa qual seção está na tela e destaca o link correspondente
   ========================================================================== */
function configurarLinkAtivo() {
  const links = [...document.querySelectorAll(".nav a[href^='#']")];
  const secoes = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (!secoes.length) return;

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) =>
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" } // considera "ativa" a seção no meio da tela
  );
  secoes.forEach((s) => observador.observe(s));
}

/* ============================================================================
   4. ANIMAÇÃO DE APARIÇÃO (reveal)
   - Elementos com .reveal entram com fade + subida ao aparecer na tela
   ========================================================================== */
function configurarReveal() {
  const alvos = document.querySelectorAll(".reveal");
  if (!alvos.length) return;

  // Se o navegador não suporta IntersectionObserver, mostra tudo direto
  if (!("IntersectionObserver" in window)) {
    alvos.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          obs.unobserve(e.target); // anima uma única vez
        }
      });
    },
    { threshold: 0.12 } // dispara quando 12% do elemento aparece
  );
  alvos.forEach((el) => observador.observe(el));
}

/* ============================================================================
   5. CONTADORES ANIMADOS (25+, 800+, 100%)
   - Ao chegar na tela, conta do 0 até o valor final
   ========================================================================== */
function configurarContadores() {
  const numeros = document.querySelectorAll("[data-count]");
  if (!numeros.length) return;

  const animar = (el) => {
    const alvo = parseFloat(el.dataset.count);      // valor final
    const sufixo = el.dataset.suffix || "";         // "+" ou "%"
    const duracao = 1400;                           // ms
    const inicio = performance.now();

    const passo = (agora) => {
      const p = Math.min((agora - inicio) / duracao, 1);   // progresso 0→1
      const suave = 1 - Math.pow(1 - p, 3);                // ease-out (desacelera)
      // Mostra inteiro, exceto se o alvo tem decimal (ex.: 4.9)
      const valor = Number.isInteger(alvo)
        ? Math.round(alvo * suave)
        : (alvo * suave).toFixed(1).replace(".", ",");
      el.textContent = valor + sufixo;
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };

  const observador = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { animar(e.target); obs.unobserve(e.target); }
      });
    },
    { threshold: 0.6 }
  );
  numeros.forEach((n) => observador.observe(n));
}

/* ============================================================================
   6. FILTRO DO PORTFÓLIO
   - Botões "Todos / Cozinhas / Móveis..." mostram só a categoria clicada
   ========================================================================== */
function configurarFiltro() {
  const botoes = document.querySelectorAll(".filter-btn");
  const itens = document.querySelectorAll(".portfolio-item");
  if (!botoes.length || !itens.length) return;

  botoes.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Marca o botão clicado como ativo (e desmarca os outros)
      botoes.forEach((b) => b.classList.toggle("is-active", b === btn));

      const categoria = btn.dataset.filter; // "todos", "cozinha", ...
      itens.forEach((item) => {
        const mostra = categoria === "todos" || item.dataset.category === categoria;
        item.classList.toggle("is-hidden", !mostra);
      });
    });
  });
}

/* ============================================================================
   7. LIGHTBOX (foto ampliada ao clicar no portfólio)
   ========================================================================== */
function configurarLightbox() {
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const caption = document.getElementById("lightbox-caption");
  const btnFechar = document.getElementById("lightbox-close");
  const btnAnterior = document.getElementById("lightbox-prev");
  const btnProximo = document.getElementById("lightbox-next");
  const itens = [...document.querySelectorAll(".portfolio-item")];
  if (!lightbox || !itens.length) return;

  let indiceAtual = 0;

  // Itens visíveis (levantar o filtro esconde com display:none — aí pulamos)
  const visiveis = () => itens.filter((i) => !i.classList.contains("is-hidden"));

  const mostrar = (i) => {
    const lista = visiveis();
    indiceAtual = (i + lista.length) % lista.length; // volta ao início no fim
    const item = lista[indiceAtual];
    const foto = item.querySelector("img");

    img.src = foto.src;
    img.alt = foto.alt;
    // Legenda: título + tag (valores no atributos data- do <figure>)
    caption.innerHTML = `<strong>${item.dataset.title || ""}</strong> — ${item.dataset.tag || ""}`;

    lightbox.hidden = false;
    document.body.style.overflow = "hidden"; // trava a rolagem da página
    btnFechar.focus(); // acessibilidade: foco vai para o botão fechar
  };

  const fechar = () => {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  };

  itens.forEach((item) => item.addEventListener("click", () => mostrar(visiveis().indexOf(item))));
  btnFechar.addEventListener("click", fechar);
  btnAnterior.addEventListener("click", () => mostrar(indiceAtual - 1));
  btnProximo.addEventListener("click", () => mostrar(indiceAtual + 1));

  // Clique no fundo escuro fecha
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) fechar(); });

  // Teclado: ESC fecha, setas navegam
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") fechar();
    if (e.key === "ArrowLeft") mostrar(indiceAtual - 1);
    if (e.key === "ArrowRight") mostrar(indiceAtual + 1);
  });
}

/* ============================================================================
   8. BRILHO QUE SEGUE O MOUSE (cards de serviço)
   - O CSS usa as variáveis --mx/--my para posicionar o radial-gradient
   ========================================================================== */
function configurarBrilhoCards() {
  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

/* ============================================================================
   9. FORMULÁRIO DE CONTATO
   - Valida os campos (mensagem em português)
   - Se tudo certo, abre o WhatsApp com a mensagem pronta
   - ALTERNATIVA por e-mail: troque a linha "window.open(zap)" por
     uma chamada a um serviço de formulário, ex.:
     fetch("https://formspree.io/f/SEU_ID", { method: "POST", body: new FormData(form) })
   ========================================================================== */
function configurarFormulario() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  // Deixa o telefone com máscara enquanto digita: (11) 99999-9999
  const tel = form.querySelector("#telefone");
  tel.addEventListener("input", () => {
    let d = tel.value.replace(/\D/g, "").slice(0, 11);
    if (d.length > 6) d = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    else if (d.length > 2) d = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    else if (d.length) d = `(${d}`;
    tel.value = d;
  });

  // Mostra a mensagem de erro embaixo do campo
  const erro = (campo, texto) => {
    const wrap = campo.closest(".field");
    wrap.classList.toggle("is-invalid", !!texto);
    wrap.querySelector(".field__error").textContent = texto || "";
    return !texto; // true = campo válido
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // impede o recarregamento da página

    const nome = form.querySelector("#nome");
    const msg = form.querySelector("#mensagem");

    const okNome = erro(nome, nome.value.trim().length < 2 ? "Digite seu nome, por favor." : "");
    const okTel = erro(tel, tel.value.replace(/\D/g, "").length < 10 ? "Informe um telefone válido com DDD." : "");
    const okMsg = erro(msg, msg.value.trim().length < 10 ? "Conte um pouco mais (mín. 10 letras)." : "");

    if (!(okNome && okTel && okMsg)) {
      form.querySelector(".is-invalid input, .is-invalid textarea")?.focus();
      return;
    }

    // Monta a mensagem e abre o WhatsApp
    const texto =
      `${CONFIG.whatsappPrefix}%0A%0A` +
      `Nome: ${encodeURIComponent(nome.value.trim())}%0A` +
      `Telefone: ${encodeURIComponent(tel.value)}%0A` +
      `Projeto: ${encodeURIComponent(form.querySelector("#tipo").value)}%0A%0A` +
      encodeURIComponent(msg.value.trim());

    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${texto}`, "_blank", "noopener");
  });
}

/* ============================================================================
   10. ANO ATUAL NO RODAPÉ
   ========================================================================== */
function configurarAnoRodape() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================================
   INICIALIZAÇÃO
   - Chama todas as funções quando a página termina de carregar
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  configurarCabecalho();
  configurarMenuMobile();
  configurarLinkAtivo();
  configurarReveal();
  configurarContadores();
  configurarFiltro();
  configurarLightbox();
  configurarBrilhoCards();
  configurarFormulario();
  configurarAnoRodape();
});
