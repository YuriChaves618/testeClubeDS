/**
 * Recebe as inscrições do site e grava em uma Planilha Google (o "banco de dados").
 *
 * Como configurar:
 * 1. Crie uma Planilha Google e, na linha 1, escreva: Data | Nome | E-mail | Telefone | Curso
 * 2. Na planilha: Extensões > Apps Script. Cole este código e salve.
 * 3. Implantar > Nova implantação > tipo "App da Web".
 *    - Executar como: Eu
 *    - Quem pode acessar: Qualquer pessoa
 * 4. Copie a URL gerada e coloque em VITE_FORM_ENDPOINT (no .env e na Vercel).
 */
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var aba = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  aba.appendRow([new Date(), d.nome, d.email, d.telefone, d.curso]);
  return ContentService.createTextOutput('ok');
}
