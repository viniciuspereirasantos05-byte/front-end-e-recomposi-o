// ============ LUFFY QUICANDO ============
const luffy = document.getElementById('luffy-quicando');
if (luffy) {
  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let vx = 4, vy = 3, ultimoBlur = 0;

  function animar() {
    const w = window.innerWidth, h = window.innerHeight;
    const lw = luffy.offsetWidth || 120, lh = luffy.offsetHeight || 120;
    x += vx; y += vy;
    let bateu = false;

    if (x <= 0) { x = 0; vx = Math.abs(vx); bateu = true; }
    else if (x + lw >= w) { x = w - lw; vx = -Math.abs(vx); bateu = true; }
    if (y <= 0) { y = 0; vy = Math.abs(vy); bateu = true; }
    else if (y + lh >= h) { y = h - lh; vy = -Math.abs(vy); bateu = true; }

    luffy.style.left = x + 'px';
    luffy.style.top = y + 'px';

    const agora = Date.now();
    if (bateu && agora - ultimoBlur > 2500) {
      ultimoBlur = agora;
      document.body.classList.add('bateu');
      setTimeout(() => document.body.classList.remove('bateu'), 2000);
    }
    requestAnimationFrame(animar);
  }
  setTimeout(() => requestAnimationFrame(animar), 800);
}

// ============ LUFFY ATACANDO (clique) ============
const luffyAtaque = document.getElementById('luffy-ataque');
if (luffyAtaque) {
  luffyAtaque.addEventListener('click', () => {
    luffyAtaque.classList.add('atacando');
    setTimeout(() => luffyAtaque.classList.remove('atacando'), 1000);
  });
}

// ============ ABAS ============
document.querySelectorAll('.aba').forEach(aba => {
  aba.addEventListener('click', () => {
    document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
    document.querySelectorAll('.aba-conteudo').forEach(c => c.classList.remove('ativo'));
    aba.classList.add('ativa');
    document.getElementById('aba-' + aba.dataset.aba).classList.add('ativo');
  });
});

// ============ QUIZ ============
const perguntas = [
  {
    q: "O que é 'Raça' do ponto de vista científico?",
    ops: ["Divisão biológica natural", "Construção social para justificar desigualdades", "Característica genética de inteligência"],
    correta: 1,
    exp: "A ciência provou que não existem 'raças' biológicas. É uma construção social!"
  },
  {
    q: "Qual a diferença entre Racismo e Injúria Racial?",
    ops: ["São a mesma coisa", "Racismo é individual, injúria é coletiva", "Racismo é estrutural/coletivo; injúria é ofensa direta"],
    correta: 2,
    exp: "Injúria atinge uma pessoa. Racismo atinge um grupo ou as estruturas."
  },
  {
    q: "O que é Colorismo?",
    ops: ["Pele mais escura sofre mais discriminação", "Estilo de pintura", "Mistura de etnias"],
    correta: 0,
    exp: "Colorismo é privilégio baseado no tom da pele."
  },
  {
    q: "O que significa 'Lugar de Fala'?",
    ops: ["Só negros falam de racismo", "Quem vive a opressão tem legitimidade de ser ouvido primeiro", "Não debater política em público"],
    correta: 1,
    exp: "Lugar de fala prioriza quem sente a opressão na pele."
  },
  {
    q: "O que é Racismo Estrutural?",
    ops: ["Uma pessoa xingando outra", "Racismo nas instituições que gera desigualdade", "Um prédio antigo"],
    correta: 1,
    exp: "Está nas regras e na falta de oportunidades. Combater é urgente!"
  },
  {
    q: "O que é Apropriação Cultural?",
    ops: ["Usar turbante sem preconceito", "Cultura dominante lucra com elementos de cultura oprimida", "Mistura de comidas"],
    correta: 1,
    exp: "Apropriação apaga a origem e a luta de quem criou o elemento."
  }
];

let idx = 0, acertos = 0;
const perguntaEl = document.getElementById('pergunta');
const opcoesEl = document.getElementById('opcoes');
const balaoEl = document.getElementById('balao');

function carregarPergunta() {
  opcoesEl.innerHTML = '';
  const p = perguntas[idx];
  perguntaEl.innerText = p.q;
  p.ops.forEach((op, i) => {
    const b = document.createElement('button');
    b.classList.add('opcao');
    b.innerText = op;
    b.onclick = () => responder(i, b);
    opcoesEl.appendChild(b);
  });
}

function responder(i, btn) {
  const p = perguntas[idx];
  const todos = opcoesEl.querySelectorAll('.opcao');
  todos.forEach(b => b.disabled = true);

  if (i === p.correta) {
    btn.classList.add('correta');
    acertos++;
    balaoEl.innerHTML = "✅ <strong>Acertou!</strong> " + p.exp;
  } else {
    btn.classList.add('errada');
    todos[p.correta].classList.add('correta');
    balaoEl.innerHTML = "❌ <strong>Quase!</strong> " + p.exp;
  }

  setTimeout(() => {
    idx++;
    if (idx < perguntas.length) {
      balaoEl.innerText = "Próxima pergunta!";
      carregarPergunta();
    } else {
      perguntaEl.innerText = "FIM DO QUIZ!";
      opcoesEl.innerHTML = '';
      balaoEl.innerHTML = `<strong>Resultado: ${acertos}/${perguntas.length}</strong><br>${acertos >= perguntas.length/2 ? "Muito bem! Continue estudando 📚" : "Não desanime! Volte ao conteúdo 💪"}`;
      const r = document.createElement('button');
      r.classList.add('btn');
      r.innerText = "JOGAR NOVAMENTE";
      r.onclick = () => { idx = 0; acertos = 0; carregarPergunta(); };
      opcoesEl.appendChild(r);
    }
  }, 1800);
}

if (perguntaEl) carregarPergunta();

// ============ CHATBOT ============
const baseDNA = [
  { k: ["raça","raca"], r: "Raça NÃO existe biologicamente! O genoma é 99,9% idêntico. É uma construção social." },
  { k: ["etnia","cultura"], r: "Etnia envolve cultura, língua e ancestralidade. É pertencimento cultural, não biologia." },
  { k: ["racismo estrutural","estrutural","instituição","instituicao"], r: "Está enraizado nas instituições. Não precisa de uma pessoa 'malvada' — está nas regras e na falta de oportunidades." },
  { k: ["injúria","injuria","crime"], r: "Injúria é ofender uma pessoa. Racismo atinge um grupo ou as estruturas. Ambos são crimes graves." },
  { k: ["colorismo","pele","retinto"], r: "Colorismo é privilégio pelo tom da pele. Pele retinta sofre mais racismo que pele clara." },
  { k: ["lugar de fala","fala"], r: "Não silencia ninguém, mas prioriza quem sente a opressão na pele. É sobre dar palco a quem foi silenciado." },
  { k: ["representatividade","mídia","midia"], r: "É ver pessoas como você em destaque. A ausência gera apagamento histórico." },
  { k: ["apropriação","apropriacao","turbante","trança","tranca"], r: "Cultura dominante lucra com elementos de cultura oprimida sem sofrer o preconceito que a origem sofre." },
  { k: ["xenofobia","nordestino"], r: "Preconceito contra pessoas de outras regiões/países. É crime no Brasil." },
  { k: ["interseccionalidade","mulher negra"], r: "Opressões que se sobrepõem. Mulher negra sofre racismo E machismo juntos." },
  { k: ["empoderamento","força","forca"], r: "Tomar consciência da própria força e identidade. Não é favor, é direito." },
  { k: ["escravidão","escravidao","abolição","abolicao","1888"], r: "A abolição não veio com inclusão. Negros ficaram sem terras, educação ou trabalho." },
  { k: ["oi","olá","ola","bom dia","boa tarde","boa noite"], r: "Olá, explorador! Pergunte sobre racismo, etnia, colorismo ou representatividade!" },
  { k: ["obrigado","obrigada","valeu"], r: "De nada! Continue estudando e questionando o mundo. 🧬" }
];

const chatHist = document.getElementById('chat-historico');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

function normalizar(t) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function adicionarMsg(txt, tipo) {
  const m = document.createElement('div');
  m.classList.add('msg', tipo);
  m.innerText = txt;
  chatHist.appendChild(m);
  chatHist.scrollTop = chatHist.scrollHeight;
  return m;
}

function buscarResposta(p) {
  const pn = normalizar(p);
  for (const item of baseDNA) {
    for (const kw of item.k) {
      if (pn.includes(normalizar(kw))) return item.r;
    }
  }
  return "Ainda não sei responder isso! Tente perguntar sobre: racismo estrutural, colorismo, lugar de fala, representatividade, apropriação cultural ou xenofobia.";
}

if (chatForm) {
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = chatInput.value.trim();
    if (!p) return;
    adicionarMsg(p, 'user');
    chatInput.value = '';
    const pensando = adicionarMsg("Dr. DNA está pensando... 🧬", 'dna');
    pensando.style.opacity = '.6';
    pensando.style.fontStyle = 'italic';
    setTimeout(() => {
      pensando.remove();
      adicionarMsg(buscarResposta(p), 'dna');
    }, 600);
  });

  document.querySelectorAll('.sugestao').forEach(btn => {
    btn.addEventListener('click', () => {
      chatInput.value = btn.innerText;
      chatForm.dispatchEvent(new Event('submit'));
    });
  });
}
// ============ LUFFY QUICANDO ============
const luffy = document.getElementById('luffy-quicando');
if (luffy) {
  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let vx = 3.5, vy = 2.5;
  let angulo = 0;
  let ultimoBlur = 0;

  // Função que faz o "squash" (achata) quando bate na parede
  function squash() {
    luffy.style.transform = 'scale(1.3, 0.7)';
    setTimeout(() => {
      luffy.style.transform = 'scale(1, 1)';
    }, 150);
  }

  function animar() {
    const w = window.innerWidth, h = window.innerHeight;
    const lw = luffy.offsetWidth || 120, lh = luffy.offsetHeight || 120;
    x += vx; y += vy;
    let bateu = false;

    // Bate nas laterais
    if (x <= 0) { x = 0; vx = Math.abs(vx); bateu = true; }
    else if (x + lw >= w) { x = w - lw; vx = -Math.abs(vx); bateu = true; }
    // Bate em cima/baixo
    if (y <= 0) { y = 0; vy = Math.abs(vy); bateu = true; }
    else if (y + lh >= h) { y = h - lh; vy = -Math.abs(vy); bateu = true; }

    // Balança suavemente (rotação baseada na direção)
    angulo += 0.02;
    const rotacao = Math.sin(angulo) * 8;

    luffy.style.left = x + 'px';
    luffy.style.top = y + 'px';
    luffy.style.transform = `rotate(${rotacao}deg)`;

    // Se bateu, faz o squash e (às vezes) o blur
    if (bateu) {
      squash();
      const agora = Date.now();
      // Blur só a cada 6 segundos e só afeta uma "faixa" da tela
      if (agora - ultimoBlur > 6000) {
        ultimoBlur = agora;
        document.body.classList.add('bateu');
        setTimeout(() => document.body.classList.remove('bateu'), 1200);
      }
    }

    requestAnimationFrame(animar);
  }

  setTimeout(() => requestAnimationFrame(animar), 800);
}