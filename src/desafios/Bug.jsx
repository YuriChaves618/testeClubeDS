import { useState } from 'react';
import { Moldura, Dica, FaseOk, Resultado, estrelasPorPenalidade, salvarEstrelas } from './comum.jsx';

// `cod`: linhas do código; `bug`: índice da linha com erro; `certo`: como a linha deveria ficar
const FASES = [
  { lang: 'Pseudocódigo', obj: 'Somar os números de 1 a 5 (resultado esperado: 15).',
    cod: ['soma ← 0', 'para i de 1 até 5:', '    soma ← soma - i', 'mostrar soma'],
    bug: 2, certo: '    soma ← soma + i',
    exp: 'O programa subtrai em vez de somar. Com "-", o resultado seria -15. O operador correto é "+".',
    dica: 'Compare a operação da linha com o que o objetivo pede.' },
  { lang: 'Pseudocódigo', obj: 'Dizer se a pessoa pode votar (16 anos ou mais).',
    cod: ['leia idade', 'se idade < 16:', '    mostrar "Pode votar"', 'senão:', '    mostrar "Ainda não pode votar"'],
    bug: 1, certo: 'se idade >= 16:',
    exp: 'A condição está invertida: quem tem menos de 16 anos veria "Pode votar". O teste correto é idade >= 16.',
    dica: 'Teste com a idade 10: qual mensagem aparece?' },
  { lang: 'Pseudocódigo', obj: 'Contar quantos números da lista são pares.',
    cod: ['para cada n em lista:', '    se n resto 2 = 0:', '        contador ← contador + 1', 'mostrar contador'],
    bug: 2, certo: '(falta "contador ← 0" antes do laço)',
    exp: 'A variável contador é usada sem nunca ter recebido um valor inicial. Falta a linha "contador ← 0" antes do laço.',
    dica: 'Qual é o valor de contador na primeira volta do laço?' },
  { lang: 'Python', obj: 'Imprimir os números de 1 a 10.',
    cod: ['# conta de 1 a 10', 'for i in range(1, 10):', '    print(i)'],
    bug: 1, certo: 'for i in range(1, 11):',
    exp: 'Erro clássico de "off-by-one": o range termina um antes do limite, então só imprime até 9. Para chegar ao 10, o limite deve ser 11.',
    dica: 'Qual é o último número que o range(1, 10) produz?' },
  { lang: 'Python', obj: 'Mostrar todos os itens de uma lista.',
    cod: ['frutas = ["maçã", "uva", "pera"]', 'i = 0', 'while i <= len(frutas):', '    print(frutas[i])', '    i = i + 1'],
    bug: 2, certo: 'while i < len(frutas):',
    exp: 'A lista tem 3 itens, com índices 0, 1 e 2. Com "<=", o laço tenta acessar frutas[3] e dá IndexError. A condição correta é i < len(frutas).',
    dica: 'Quais são os índices válidos de uma lista com 3 itens?' },
  { lang: 'Python', obj: 'Somar os números de 1 até n.',
    cod: ['def soma_ate(n):', '    total = 0', '    i = 1', '    while i <= n:', '        total = total + i', '    i = i + 1', '    return total'],
    bug: 5, certo: '        i = i + 1',
    exp: 'O incremento está fora do laço (indentação errada). Dentro do while, i nunca muda e o programa fica preso para sempre. A linha precisa ficar dentro do laço.',
    dica: 'Pergunte-se: a condição do while pode algum dia deixar de ser verdadeira?' },
  { lang: 'Python', obj: 'Aprovar o aluno apenas se nota >= 7 E frequência >= 75.',
    cod: ['def aprovado(nota, freq):', '    if nota >= 7 or freq >= 75:', '        return True', '    return False'],
    bug: 1, certo: '    if nota >= 7 and freq >= 75:',
    exp: 'Com "or", basta cumprir uma condição para ser aprovado. O enunciado exige as duas ao mesmo tempo, então o operador correto é "and".',
    dica: 'Teste com nota 10 e frequência 20. Ele deveria ser aprovado?' },
  { lang: 'Python', obj: 'Achar o maior valor de uma lista (qualquer lista, inclusive só com negativos).',
    cod: ['def maior(lista):', '    m = 0', '    for x in lista:', '        if x > m:', '            m = x', '    return m'],
    bug: 1, certo: '    m = lista[0]',
    exp: 'Começar em 0 funciona para números positivos, mas numa lista como [-5, -2, -9] ninguém é maior que 0 e a função devolve 0, que nem está na lista. O certo é começar com o primeiro elemento.',
    dica: 'O que a função devolve para a lista [-5, -2, -9]?' },
];

const CONCEITO = {
  nome: 'Depuração e leitura de código',
  paragrafos: [
    'Achar um bug é simular a execução na cabeça: escolher valores de teste, acompanhar cada variável linha a linha e comparar com o resultado esperado. Quem lê código com atenção descobre onde a realidade começa a divergir da intenção.',
    'Você viu erros muito comuns: operador trocado, condição invertida, variável sem valor inicial, off-by-one (limites de laço e índices), instrução no lugar errado, condição composta com and/or e valor inicial inadequado. Testar casos de borda, como a lista vazia, só com negativos ou o primeiro e o último item, é a melhor forma de pegar esses erros.',
  ],
  codigo: 'def maior(lista):\n    m = lista[0]          # começa pelo 1º item, não por 0\n    for x in lista:\n        if x > m:\n            m = x\n    return m\n\nprint(maior([-5, -2, -9]))   # -2',
};

export default function Bug({ onSair }) {
  const [i, setI] = useState(0);
  const [erros, setErros] = useState(0);
  const [dica, setDica] = useState(false);
  const [ok, setOk] = useState(false);
  const [ruins, setRuins] = useState([]);
  const [msg, setMsg] = useState('');
  const [pts, setPts] = useState(0);
  const [tot, setTot] = useState(0);
  const [fim, setFim] = useState(false);

  const f = FASES[i];
  const estr = estrelasPorPenalidade(erros + (dica ? 1 : 0));

  function clicar(k) {
    if (ok) return;
    if (k === f.bug) {
      setOk(true); setMsg('');
      salvarEstrelas('bug', i, estr);
      setPts((p) => p + estr * 100); setTot((t) => t + estr);
    } else {
      if (!ruins.includes(k)) { setErros((e) => e + 1); setRuins((r) => [...r, k]); }
      setMsg('Essa linha está correta. Simule o código com um exemplo e veja onde o resultado foge do esperado.');
    }
  }
  function proxima() {
    if (i === FASES.length - 1) { setFim(true); return; }
    setI(i + 1); setErros(0); setDica(false); setOk(false); setRuins([]); setMsg('');
  }
  function reiniciar() { setI(0); setPts(0); setTot(0); setErros(0); setDica(false); setOk(false); setRuins([]); setMsg(''); setFim(false); }

  return (
    <Moldura titulo="Caça ao Bug" conceito="Depuração e leitura de código" fase={fim ? FASES.length : i} total={FASES.length} pontos={pts} onSair={onSair}>
      {fim ? (
        <Resultado pontos={pts} estrelas={tot} max={FASES.length * 3} conceito={CONCEITO} onRepetir={reiniciar} onSair={onSair} />
      ) : (
        <div className="jg-corpo">
          <p className="enun">Clique na linha que contém o bug.</p>
          <div className="objetivo"><span className="tag2">OBJETIVO · {f.lang.toUpperCase()}</span><p>{f.obj}</p></div>

          <div className="codigo" role="group" aria-label="Código com um bug">
            {f.cod.map((l, k) => (
              <button
                key={k} type="button" onClick={() => clicar(k)}
                className={'linha' + (ruins.includes(k) ? ' ruim' : '') + (ok && k === f.bug ? ' bug' : '') + (l.trim().startsWith('#') || l.trim().startsWith('//') ? ' com' : '')}
                aria-label={`Linha ${k + 1}: ${l.trim()}`}
              >
                <i>{k + 1}</i><code>{l || ' '}</code>
              </button>
            ))}
          </div>

          <div className="msgs" aria-live="polite">{msg && !ok && <p className="erro">{msg}</p>}</div>
          {!ok && <Dica texto={f.dica} usada={dica} onUsar={() => setDica(true)} />}

          {ok && (
            <FaseOk estrelas={estr} pontos={estr * 100} ultima={i === FASES.length - 1} onProxima={proxima} titulo="Bug encontrado!">
              <span className="tag2">O QUE ESTAVA ERRADO</span>
              <p>{f.exp}</p>
              <div className="conserto"><small>Como ficaria:</small><code>{f.certo}</code></div>
            </FaseOk>
          )}
        </div>
      )}
    </Moldura>
  );
}
