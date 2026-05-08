
  # Correntes: The Game

  Demo web de **Correntes: Fragmentos de Vontade**, construída em React + Vite e preparada para publicação via GitHub e Vercel.

  O bundle original nasceu no Figma Make, mas este projeto já foi adaptado para funcionar como repositório normal, com configuração de deploy para Vercel e estrutura pronta para evolução.

  Repositório remoto:
  `https://github.com/DiogoJP202/Correntes_The_Game.git`

  ## Scripts

  `npm install`
  Instala dependências.

  `npm run dev`
  Sobe o ambiente local de desenvolvimento.

  `npm run build`
  Gera o build de produção em `dist/`.

  ## Vercel

  O projeto já inclui [vercel.json](./vercel.json) com:
  - `installCommand: npm install`
  - `buildCommand: npm run build`
  - `outputDirectory: dist`

  Isso deixa o deploy compatível com o fluxo padrão do Vercel para apps Vite.

  ## GitHub + Deploy

  Fluxo esperado:
  1. Subir este diretório para o repositório `DiogoJP202/Correntes_The_Game`
  2. Importar o repositório no Vercel
  3. Deixar o Vercel instalar dependências e gerar o build remotamente

  ## Observações locais

  Arquivos e pastas locais como `node_modules/`, `.tools/` e `.vercel/` já estão ignorados no Git.
  
