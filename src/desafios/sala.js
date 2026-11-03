// Comunicação do duelo online entre dois aparelhos.
// Usa o Supabase Realtime (Broadcast + Presence). NÃO usa tabelas: nada é gravado em banco.
// Basta ter um projeto Supabase e colocar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.

const URL = import.meta.env.VITE_SUPABASE_URL;
const CHAVE = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const onlineDisponivel = Boolean(URL && CHAVE);

let clientePromessa = null;
function cliente() {
  // carregado só quando alguém abre uma sala: quem joga sozinho não baixa a biblioteca
  if (!clientePromessa) {
    clientePromessa = import('@supabase/supabase-js').then(({ createClient }) => createClient(URL, CHAVE, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 10 } },
    }));
  }
  return clientePromessa;
}

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I, O, 0 e 1 para não confundir
export function gerarCodigo() {
  const bytes = new Uint32Array(5);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('');
}
export const limparCodigo = (txt) => String(txt || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
export const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

/**
 * Entra na sala `codigo`.
 *   eu: { id, nome, host, nivel } (vai para a presença; é assim que um jogador vê o outro)
 *   cb: { onPresenca(lista), onMsg({ tipo, ... }), onStatus(status) }
 * Retorna { enviar(tipo, dados), sair() }.
 */
export async function abrirSala(codigo, eu, cb) {
  const sb = await cliente();
  let meta = eu;
  const canal = sb.channel('duelo-' + codigo, { config: { broadcast: { self: false }, presence: { key: eu.id } } });

  canal.on('presence', { event: 'sync' }, () => {
    const estado = canal.presenceState();
    const vistos = new Map();
    Object.values(estado).flat().forEach((m) => { if (m && m.id) vistos.set(m.id, m); });
    cb.onPresenca([...vistos.values()]);
  });
  canal.on('broadcast', { event: 'msg' }, ({ payload }) => cb.onMsg(payload));
  canal.subscribe(async (status) => {
    cb.onStatus(status);
    // a cada (re)conexão, anuncia a presença de novo
    if (status === 'SUBSCRIBED') { try { await canal.track(meta); } catch { /* tenta de novo na próxima reconexão */ } }
  });

  return {
    enviar: (tipo, dados = {}) => { canal.send({ type: 'broadcast', event: 'msg', payload: { tipo, ...dados } }); },
    atualizar: (novo) => { meta = { ...meta, ...novo }; canal.track(meta).catch(() => {}); },
    sair: () => { try { sb.removeChannel(canal); } catch { /* já fechado */ } },
  };
}
