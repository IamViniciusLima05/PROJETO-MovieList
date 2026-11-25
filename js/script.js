/* MovieList — lista de filmes com status, nota, comentário e filtro por gênero */

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const banco = {
  ler(k, padrao) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? padrao; } catch { return padrao; } },
  salvar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem storage */ } }
};
const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const GENEROS = ['Ação', 'Animação', 'Aventura', 'Comédia', 'Crime', 'Documentário', 'Drama', 'Fantasia', 'Ficção científica', 'Musical', 'Romance', 'Suspense', 'Terror'];

const EXEMPLOS = [
  { id: 8, titulo: 'Ainda Estou Aqui', ano: 2024, dur: 137, dir: 'Walter Salles', generos: ['Drama'], visto: false, nota: 0, coment: '' },
  { id: 7, titulo: 'Duna: Parte Dois', ano: 2024, dur: 166, dir: 'Denis Villeneuve', generos: ['Ficção científica', 'Aventura'], visto: false, nota: 0, coment: '' },
  { id: 6, titulo: 'Cidade de Deus', ano: 2002, dur: 130, dir: 'Fernando Meirelles', generos: ['Crime', 'Drama'], visto: true, nota: 5, coment: 'Obrigatório. A montagem é absurda.' },
  { id: 5, titulo: 'Interestelar', ano: 2014, dur: 169, dir: 'Christopher Nolan', generos: ['Ficção científica', 'Drama'], visto: true, nota: 5, coment: 'A trilha sonora sozinha já vale.' },
  { id: 4, titulo: 'O Auto da Compadecida', ano: 2000, dur: 104, dir: 'Guel Arraes', generos: ['Comédia'], visto: true, nota: 4, coment: 'Rever com a família todo ano.' },
  { id: 3, titulo: 'Parasita', ano: 2019, dur: 132, dir: 'Bong Joon-ho', generos: ['Suspense', 'Drama'], visto: false, nota: 0, coment: '' },
  { id: 2, titulo: 'Divertida Mente', ano: 2015, dur: 95, dir: 'Pete Docter', generos: ['Animação', 'Comédia'], visto: true, nota: 4, coment: '' },
  { id: 1, titulo: 'Tropa de Elite', ano: 2007, dur: 115, dir: 'José Padilha', generos: ['Ação', 'Crime'], visto: false, nota: 0, coment: '' }
];
let filmes = banco.ler('ml_filmes', null) ?? EXEMPLOS;
const salvar = () => banco.salvar('ml_filmes', filmes);
const estado = { status: 'todos', genero: null, busca: '', ordem: 'recentes' };

/* Cartaz gerado a partir do título: cores e desenho mudam conforme o nome */
const PALETAS = {
  'Ação': ['#c1121f', '#3a0a0f'], 'Animação': ['#ff9f1c', '#2ec4b6'], 'Aventura': ['#e09f3e', '#335c67'], 'Comédia': ['#ffd166', '#ef476f'],
  'Crime': ['#3d405b', '#0b0c10'], 'Documentário': ['#6c757d', '#212529'], 'Drama': ['#7b2cbf', '#10002b'], 'Fantasia': ['#9d4edd', '#ff70a6'],
  'Ficção científica': ['#00b4d8', '#03045e'], 'Musical': ['#f72585', '#4361ee'], 'Romance': ['#ff758f', '#590d22'], 'Suspense': ['#2b2d42', '#8d0801'], 'Terror': ['#1b1b1b', '#6a040f']
};
function hash(t) { let h = 2166136261; for (const c of t) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function cartaz(f) {
  const h = hash(f.titulo);
  const [a, b] = PALETAS[f.generos[0]] || ['#495057', '#111'];
  const ang = 20 + (h % 140), x = 20 + (h % 60);
  const simbolo = f.titulo.trim().charAt(0).toUpperCase();
  return { estilo: `--a:${a};--b:${b};--ang:${ang}deg;--x:${x}%`, simbolo };
}
const estrelas = (n) => '★'.repeat(n) + `<span class="vazia">${'★'.repeat(5 - n)}</span>`;

function filtrados() {
  const t = norm(estado.busca);
  let l = filmes.filter((f) =>
    (estado.status === 'todos' || (estado.status === 'visto' ? f.visto : !f.visto)) &&
    (!estado.genero || f.generos.includes(estado.genero)) &&
    (!t || norm(f.titulo).includes(t) || norm(f.dir || '').includes(t)));
  const por = {
    recentes: (a, b) => b.id - a.id,
    nota: (a, b) => b.nota - a.nota || b.visto - a.visto || a.titulo.localeCompare(b.titulo),
    ano: (a, b) => (b.ano || 0) - (a.ano || 0),
    titulo: (a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR')
  };
  return l.sort(por[estado.ordem]);
}

function desenhar() {
  const vistos = filmes.filter((f) => f.visto), comNota = vistos.filter((f) => f.nota);
  $('#n-total').textContent = filmes.length;
  $('#n-vistos').textContent = vistos.length;
  $('#n-media').textContent = comNota.length ? (comNota.reduce((s, f) => s + f.nota, 0) / comNota.length).toFixed(1).replace('.', ',') + ' ★' : '—';

  // Só mostra gêneros que existem na lista
  const cont = {};
  filmes.forEach((f) => f.generos.forEach((g) => { cont[g] = (cont[g] || 0) + 1; }));
  if (estado.genero && !cont[estado.genero]) estado.genero = null;
  $('#generos').innerHTML = `<button data-genero="" aria-pressed="${!estado.genero}">Todos os gêneros</button>` +
    GENEROS.filter((g) => cont[g]).map((g) => `<button data-genero="${g}" aria-pressed="${estado.genero === g}">${g} <small>${cont[g]}</small></button>`).join('');

  const l = filtrados();
  const minutos = l.filter((f) => !f.visto).reduce((s, f) => s + (f.dur || 0), 0);
  $('#resumo').textContent = `${l.length} ${l.length === 1 ? 'filme' : 'filmes'}${estado.genero ? ` de ${estado.genero.toLowerCase()}` : ''}` +
    (minutos && estado.status !== 'visto' ? ` · ${Math.floor(minutos / 60)}h${String(minutos % 60).padStart(2, '0')} de filmes para assistir` : '');

  $('#filmes').innerHTML = l.length ? l.map((f) => {
    const c = cartaz(f);
    return `<li class="filme">
      <button class="cartaz" style="${c.estilo}" data-editar="${f.id}" aria-label="Editar ${escapar(f.titulo)}">
        <span class="cartaz__simbolo" aria-hidden="true">${escapar(c.simbolo)}</span>
        <span class="selo ${f.visto ? 'visto' : ''}">${f.visto ? '✓ Assistido' : 'Para assistir'}</span>
        <span class="cartaz__titulo">${escapar(f.titulo)}</span>
        <span class="cartaz__ano">${f.ano || ''}${f.dur ? ` · ${f.dur} min` : ''}</span>
      </button>
      <div class="filme__info">
        <div class="filme__gen">${f.generos.join(' · ')}${f.dir ? ` — ${escapar(f.dir)}` : ''}</div>
        ${f.visto ? `<div class="estrelas-mini" aria-label="Nota ${f.nota} de 5">${f.nota ? estrelas(f.nota) : '<span class="vazia">sem nota</span>'}</div>` : ''}
        ${f.visto && f.coment ? `<p class="comentario">“${escapar(f.coment)}”</p>` : ''}
        <div class="filme__acoes">
          <button class="marcar" data-marcar="${f.id}" aria-pressed="${f.visto}">${f.visto ? '✓ Assistido' : 'Marcar assistido'}</button>
        </div>
      </div>
    </li>`;
  }).join('') : `<li class="vazio">${filmes.length ? 'Nenhum filme com esses filtros.' : 'Sua lista está vazia. Adicione o primeiro filme!'}</li>`;
}

/* Formulário */
const dlg = $('#dlg');
let editando = null, notaForm = 0;
$('#f-generos').innerHTML = GENEROS.map((g) => `<label><input type="checkbox" value="${g}"><span>${g}</span></label>`).join('');
$('#f-nota').innerHTML = [1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" role="radio" aria-checked="false" aria-label="${n} ${n === 1 ? 'estrela' : 'estrelas'}">★</button>`).join('');
function marcarNota(n) {
  notaForm = n;
  $$('#f-nota button').forEach((b) => { const v = +b.dataset.n; b.classList.toggle('acesa', v <= n); b.setAttribute('aria-checked', v === n); });
}
$('#f-nota').addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) marcarNota(+b.dataset.n === notaForm ? 0 : +b.dataset.n); });
function previaCartaz() {
  const f = { titulo: $('#f-titulo').value.trim() || 'Novo filme', generos: $$('#f-generos input:checked').map((x) => x.value), ano: $('#f-ano').value };
  if (!f.generos.length) f.generos = ['Drama'];
  const c = cartaz(f);
  $('#f-cartaz').innerHTML = `<div class="cartaz" style="${c.estilo}"><span class="cartaz__simbolo">${escapar(c.simbolo)}</span><span class="cartaz__titulo">${escapar(f.titulo)}</span><span class="cartaz__ano">${escapar(f.ano)}</span></div>`;
}
function alternarVisto() { $('#form').classList.toggle('sem-visto', !$('#f-visto').checked); }
$('#form').addEventListener('input', previaCartaz);
$('#f-visto').addEventListener('change', alternarVisto);

function abrir(f = null) {
  editando = f;
  $('#dlg-titulo').textContent = f ? 'Editar filme' : 'Adicionar filme';
  $('#f-titulo').value = f?.titulo || ''; $('#f-ano').value = f?.ano || ''; $('#f-dur').value = f?.dur || ''; $('#f-dir').value = f?.dir || '';
  $$('#f-generos input').forEach((x) => { x.checked = !!f?.generos.includes(x.value); });
  $('#f-visto').checked = !!f?.visto; $('#f-coment').value = f?.coment || '';
  marcarNota(f?.nota || 0); alternarVisto(); previaCartaz();
  $('#f-excluir').hidden = !f; $('#f-excluir').textContent = 'Excluir'; confirmar = false;
  dlg.showModal();
}
$('#novo').addEventListener('click', () => abrir());
dlg.addEventListener('close', () => {
  if (dlg.returnValue !== 'salvar') return;
  const generos = $$('#f-generos input:checked').map((x) => x.value);
  const dados = {
    titulo: $('#f-titulo').value.trim(), ano: +$('#f-ano').value || null, dur: +$('#f-dur').value || null, dir: $('#f-dir').value.trim(),
    generos: generos.length ? generos : ['Drama'], visto: $('#f-visto').checked, nota: $('#f-visto').checked ? notaForm : 0, coment: $('#f-visto').checked ? $('#f-coment').value.trim() : ''
  };
  if (!dados.titulo) return;
  if (editando) Object.assign(editando, dados);
  else {
    if (filmes.some((f) => norm(f.titulo) === norm(dados.titulo))) { toast('Esse filme já está na lista'); return; }
    filmes.push({ id: Date.now(), ...dados });
  }
  salvar(); desenhar(); toast(editando ? 'Filme atualizado' : `“${dados.titulo}” adicionado`);
});
let confirmar = false;
$('#f-excluir').addEventListener('click', (e) => {
  if (!confirmar) { confirmar = true; e.target.textContent = 'Confirmar exclusão'; return; }
  filmes = filmes.filter((f) => f !== editando);
  salvar(); dlg.close(); desenhar(); toast('Filme removido');
});
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

/* Lista */
$('#filmes').addEventListener('click', (e) => {
  const ed = e.target.closest('[data-editar]');
  if (ed) { abrir(filmes.find((f) => f.id === +ed.dataset.editar)); return; }
  const m = e.target.closest('[data-marcar]');
  if (m) {
    const f = filmes.find((x) => x.id === +m.dataset.marcar);
    f.visto = !f.visto;
    salvar(); desenhar();
    if (f.visto) { toast('Marcado como assistido. Que nota você dá?'); abrir(f); }
  }
});
$$('[data-status]').forEach((b) => b.addEventListener('click', () => {
  estado.status = b.dataset.status;
  $$('[data-status]').forEach((x) => x.setAttribute('aria-pressed', x === b));
  desenhar();
}));
$('#generos').addEventListener('click', (e) => { const b = e.target.closest('[data-genero]'); if (b) { estado.genero = b.dataset.genero || null; desenhar(); } });
$('#busca').addEventListener('input', (e) => { estado.busca = e.target.value.trim(); desenhar(); });
$('#ordem').addEventListener('change', (e) => { estado.ordem = e.target.value; desenhar(); });

let timerToast;
function toast(msg) {
  const t = $('#toast'); (document.querySelector('dialog[open]') || document.body).append(t);
  t.textContent = msg; t.hidden = false; clearTimeout(timerToast); timerToast = setTimeout(() => { t.hidden = true; }, 2400);
}

desenhar();
