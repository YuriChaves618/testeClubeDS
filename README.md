# Clube D/S — React

```
npm install
cp .env.example .env     # coloque o link do WhatsApp (e, se quiser, os dominios de e-mail)
npm run dev              # http://localhost:5173
```
Requer Node 18 ou superior. Para publicar (Vercel), adicione as variaveis `VITE_*` do `.env` nas configuracoes do projeto; o `vercel.json` ja trata as rotas.

Fluxo: botao "Quero participar" -> pagina `/participar` -> formulario -> dados gravados na Planilha Google -> caixa perguntando se a pessoa quer entrar na comunidade do WhatsApp -> mensagem de sucesso + secao da comunidade.
Banco de dados: siga `docs/google-apps-script.gs` para criar a planilha e coloque a URL gerada em `VITE_FORM_ENDPOINT`. Sem ela, nada e gravado.
Documento oficial: `public/documentos/ClubeDS-Documento-Oficial.pdf` (botao ao lado de "Quero participar" no fim da home).

Professores: edite `src/dados.js` (nome, cargo, areas e foto em `public/professores/`). Cursos do formulario tambem ficam la.

Equipe e hackathon: em `src/dados.js`, troque os nomes do presidente e do vice em `LIDERES` e, quando quiser, liste os projetos do Power Tech Hackathon em `PROJETOS_HACKATHON` (a grade so aparece quando a lista tem itens). As fotos ficam em `public/equipe/`.

## Desafios de lógica (`/desafios`)
Os botões "Desafios de lógica" da home abrem `/desafios` em uma nova aba. Fluxo: tela de carregamento (robô voando) -> Buddy chega e conversa -> escolha do nível. Prontos: nível **Fácil** (Decifre o Padrão, Adivinhe o Número, Ordene a Fila) e nível **Médio** (Lâmpadas Apagadas, Caça ao Bug, Robô no Labirinto). Nível **Difícil**: Torre de Hanói e Portas Lógicas. Os três níveis estão liberados.
- Liberação: `DESAFIOS_LIBERADO` em `src/dados.js` (true = botão abre os desafios; false = mostra o aviso "Em breve").
- Falas do Buddy: `src/desafios/falas.js` (marque `perto`/`animado` para mudar o comportamento dele).
- Imagens: `public/buddy/` (expressões) e `public/buddy/voando/` (23 frames do voo).
- Sons: `public/audio/carregamento.mp3` (toca durante o carregamento) e `public/audio/tema.mp3` (loop até sair da página). Lógica em `src/desafios/audio.js`.
- A página abre com um botão de play (`public/buddy/play.webp`): o clique nele inicia o carregamento e libera o áudio no navegador.
- Jogos: `src/desafios/Padrao.jsx`, `Numero.jsx`, `Fila.jsx`. A pontuação e as estrelas ficam salvas só no navegador (localStorage). Ranking compartilhado exigiria um banco (ex.: Supabase).

## Modo duelo
Depois da conversa com o Buddy, o jogador escolhe **Jogar sozinho** (fluxo de sempre) ou **Duelo**, e só então o nível.
- **Regras:** os dois jogam todos os jogos do nível escolhido, com as mesmas fases e os mesmos sorteios. Vence quem somar mais estrelas; empate em estrelas, vence o menor tempo total (cada jogo é cronometrado do começo da 1ª fase até o fim da última, sem contar a leitura da tela de conceito). Quem abandona ou desconecta por mais de 10 s perde.
- **Online:** um cria a sala (código de 5 letras), o outro entra com o código. Placar do adversário ao vivo no topo. Usa **Supabase Realtime** (Broadcast + Presence): **não há tabelas nem SQL**. Crie um projeto grátis em supabase.com e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (no `.env` e na Vercel). Rode `npm install` (nova dependência `@supabase/supabase-js`, que só é baixada quando alguém abre uma sala).
- **No mesmo aparelho:** um joga, passa o aparelho, o outro joga. Não precisa de nada além do site.
- **Código:** `src/desafios/Duelo.jsx` (fluxo e placar), `src/desafios/sala.js` (conexão), `comum.jsx` (`DueloCtx`, sorteio com semente). Os 8 jogos quase não mudaram: `Moldura` e `Resultado` avisam o duelo sozinhos; só Fila, Luzes e Número trocaram `Math.random` por `aleatorio()` para os sorteios serem iguais.
- **Limite conhecido:** as estrelas e o tempo são calculados no navegador de cada jogador, então um usuário técnico poderia forjá-los. Para um clube é aceitável; para prêmios, valide no servidor (Edge Function).
