# Correntes: The Game

Demo web de **Correntes: Fragmentos de Vontade**, construida em React + Vite e preparada para deploy no GitHub + Vercel.

Repositorio remoto:
`https://github.com/DiogoJP202/Correntes_The_Game.git`

## Scripts

`npm install`
Instala as dependencias.

`npm run dev`
Sobe o ambiente local de desenvolvimento.

`npm run build`
Gera o build de producao em `dist/`.

## Vercel

O projeto ja inclui [vercel.json](./vercel.json) com:
- `installCommand: npm install`
- `buildCommand: npm run build`
- `outputDirectory: dist`

Para apps Vite, o Vercel tambem aceita funcoes serverless em uma pasta raiz `api/`.

## AI Gateway

Esta demo agora inclui a rota serverless [api/ai.ts](./api/ai.ts), usada para gerar um **Eco do Vinculo** na tela final.

Fluxo implementado:
1. O frontend envia o resultado final da run para `/api/ai`
2. A funcao chama o Vercel AI Gateway
3. O modelo devolve um bloco curto de narrativa estruturada
4. A tela final renderiza esse eco como extensao diegetica do desfecho

### Envs

Use o arquivo [.env.example](./.env.example) como referencia.

Opcao 1, mais simples:
- criar `AI_GATEWAY_API_KEY` no projeto da Vercel

Opcao 2, sem chave persistente:
- habilitar OIDC Federation no projeto da Vercel
- a funcao tambem aceita o token enviado pela Vercel no header `x-vercel-oidc-token`

Env opcional:
- `AI_GATEWAY_MODEL` para trocar o modelo

Padrao atual:
- `openai/gpt-5.4`

## GitHub + Deploy

Fluxo esperado:
1. Fazer push para `main`
2. O Vercel criar um novo deploy a partir do GitHub
3. Testar a rota `/api/ai` a partir da tela de consequencia

## Observacoes locais

Arquivos e pastas locais como `node_modules/`, `.tools/`, `.vercel/` e `.env.local` ficam fora do Git.
