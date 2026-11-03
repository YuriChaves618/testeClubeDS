export const CURSOS = ['Informática para Internet', 'Desenvolvimento de Sistemas', 'Redes de Computadores'];

// Para trocar nome, cargo ou foto, edite aqui. As fotos ficam em public/professores/
export const PROFESSORES = [
  {
    nome: 'Celso Barreto da Silva',
    papel: 'Professor e pesquisador',
    areas: ['Computação e IA', 'Ciência de Dados'],
    foto: '/professores/celso.jpg',
    alt: 'Ilustração do professor Celso Barreto da Silva cercado de elementos de computação, IA e ciência de dados',
  },
  {
    nome: 'Professor de Banco de Dados',
    papel: 'Professor',
    areas: ['SQL', 'MySQL', 'Administração de BD'],
    foto: '/professores/professor-bd.jpg',
    alt: 'Ilustração de um professor explicando SQL em um quadro para os alunos',
  },
];

// Presidência do clube.
// A ordem segue a foto: presidente primeiro, vice-presidente depois.
export const LIDERES = [
  {
    nome: 'Ronyel Borges',
    cargo: 'Presidente',
    texto: 'Lidera o clube, conduz as decisões da equipe e representa os alunos.',
  },
  {
    nome: 'Marcos Matheus',
    cargo: 'Vice-presidente',
    texto: 'Apoia a liderança e ajuda a organizar as atividades do clube.',
  },
];

// Projetos criados no Power Tech Hackathon. Enquanto a lista estiver vazia, a grade de projetos não aparece.
// Para adicionar, siga o modelo:
// { nome: 'Nome do projeto', texto: 'Uma ou duas frases sobre o que ele resolve.', equipe: 'Nome do time (opcional)' }
export const PROJETOS_HACKATHON = [];

// Troque para true quando os Desafios de lógica puderem ser abertos ao público.
// export const DESAFIOS_LIBERADO = false; // (aviso "Em breve" ativo: botão só mostra o aviso)
export const DESAFIOS_LIBERADO = true;
