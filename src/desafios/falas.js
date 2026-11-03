// Falas do Buddy. `perto`: ele se aproxima da tela a partir desta fala.
// `animado`: a partir desta fala ele fala muito animado.
export const FALAS = [
  { t: 'Eeeeei! Olha só quem apareceu por aqui!' },
  { t: 'Seja muito bem-vindo ao desafio de lógica computacional do Clube DS!' },
  { t: 'Ah! Que falta de educação a minha! Nem me apresentei!' },
  { t: 'Eu sou o Buddy! Seu novo parceiro nessa aventura pelo mundo da lógica computacional!', perto: true },
  { t: 'E pode acreditar... preparei alguns desafios que vão fazer seus neurônios trabalharem!' },
  { t: 'Aqui, você vai encontrar três níveis de desafios para colocar seu raciocínio à prova!' },
  { t: 'Temos o Fácil, para quem quer começar aquecendo os circuitos!' },
  { t: 'O Médio, para quem já gosta de quebrar um pouquinho a cabeça!' },
  { t: 'E o Difícil... Bom, esse é para quem realmente gosta de um desafio!' },
  { t: 'E o melhor? Você escolhe por onde começar!' },
  { t: 'Mas não se engane! Até os desafios mais simples podem te surpreender!' },
  { t: 'E se quiser mais emoção, chame um amigo para um duelo! Mesmos desafios para os dois, e vence quem fizer mais estrelas!' },
  { t: 'AAAAAH! Só de pensar já fico com os circuitos a mil!', animado: true },
  { t: 'Eu quero ver até onde você consegue chegar!', animado: true },
  { t: 'Então chega de conversa! Os desafios estão esperando!', animado: true },
];

export const NIVEIS = [
  { id: 'facil', nome: 'Fácil', desc: 'Aquecendo os circuitos', cor: 'bl', pronto: true },
  { id: 'medio', nome: 'Médio', desc: 'Para quebrar a cabeça', cor: 'or', pronto: true },
  { id: 'dificil', nome: 'Difícil', desc: 'Só para quem gosta de desafio', cor: 'rs', pronto: true },
];
