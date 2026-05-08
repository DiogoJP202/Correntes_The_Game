Você é um desenvolvedor sênior de jogos em Unity/C# e vai criar uma DEMO jogável baseada no GDD do jogo “Correntes: Fragmentos de Vontade”.

OBJETIVO GERAL
Crie uma vertical slice/demo de 10 a 20 minutos de um jogo narrativo de ação em terceira pessoa, com atmosfera sombria, foco em vínculos emocionais, combate com fios/correntes de energia e uma pequena sequência narrativa envolvendo o protagonista e Aiko.

O jogo deve ser feito em Unity usando C#.

IMPORTANTE
Não use personagens, nomes, músicas ou propriedades intelectuais de Hunter x Hunter, Silent Hill ou qualquer outra obra existente. A inspiração é apenas conceitual: sistema de poder com regras, tragédia psicológica, vínculos emocionais e redenção. Tudo deve ser original.

TÍTULO DO JOGO
Correntes: Fragmentos de Vontade

GÊNERO
Ação narrativa em terceira pessoa / RPG psicológico leve / aventura sombria.

TOM
Melancólico, trágico, emocional, sombrio, cinematográfico e introspectivo.

VISÃO DA DEMO
A demo deve apresentar o início do arco sombrio do protagonista: ele encontra Aiko em um beco chuvoso, cria um vínculo forçado com ela, enfrenta inimigos chamados “Caídos” e passa por uma primeira consequência emocional do uso incorreto da habilidade.

A demo não precisa contar a história inteira, mas precisa deixar claro:
1. O protagonista possui uma habilidade baseada em vínculos.
2. Vínculos verdadeiros fortalecem de forma estável.
3. Vínculos forçados geram poder imediato, mas causam dependência e instabilidade.
4. Aiko não é apenas um recurso mecânico; ela é uma personagem com presença narrativa.
5. O sistema de correntes é visual, mecânico e emocional.

ENGINE
Unity 3D.

LINGUAGEM
C#.

ESTILO VISUAL DA DEMO
Use primitives/placeholders se necessário, mas organize tudo para ser substituível por assets reais depois.

Visual desejado:
- Cidade/beco chuvoso.
- Neon sutil.
- Paleta escura.
- Luzes frias.
- Chão molhado.
- Atmosfera melancólica.
- Fios/correntes representados com LineRenderer.
- Partículas simples para aura.

Se não for possível criar chuva realista, implemente partículas simples de chuva.

ESTRUTURA DA DEMO
A demo deve ter 4 momentos principais:

1. CENA INICIAL — BECO DA CHUVA
O jogador controla o protagonista em um beco escuro.
Há uma narração curta ou texto na tela:
“Depois da perda, ele prometeu nunca mais depender de um vínculo verdadeiro.”

O jogador anda até encontrar Aiko sentada no chão, vulnerável.

2. ENCONTRO COM AIKO
Ao interagir com Aiko, aparece um diálogo simples.
Aiko diz algo como:
“Você vai ficar aí só olhando?”
O protagonista pode escolher:
- “Eu posso te ajudar.”
- “Você precisa de mim.”

A segunda opção deve ser claramente mais sombria.

Após o diálogo, o jogador desbloqueia a habilidade “Corrente Forçada”.

3. COMBATE CONTRA OS CAÍDOS
Inimigos aparecem no beco.
O jogador pode lutar usando:
- ataque leve;
- ataque pesado;
- esquiva;
- fio de vínculo;
- corrente forçada.

Aiko deve ficar próxima do jogador. Ela não precisa lutar muito, mas deve reagir:
- medo;
- chamar o protagonista;
- sofrer efeitos se o jogador usar demais a corrente forçada.

4. CONSEQUÊNCIA
Após o combate, se o jogador usou muitas vezes a Corrente Forçada, Aiko fica mais dependente e instável.
Mostrar texto:
“Ela está segura. Mas algo nela ficou preso.”

Se o jogador usou pouco ou usou abordagem mais estável:
“Ela ainda está assustada. Mas seus olhos ainda pertencem a ela.”

SISTEMAS OBRIGATÓRIOS

1. PLAYER CONTROLLER
Criar um controlador em terceira pessoa com:
- movimento WASD;
- rotação baseada na câmera;
- corrida;
- esquiva/dash;
- ataque leve;
- ataque pesado;
- interação;
- uso de habilidade.

O personagem pode ser representado por uma cápsula inicialmente.

Scripts sugeridos:
- PlayerController.cs
- PlayerCombat.cs
- PlayerStats.cs
- PlayerInteraction.cs

2. CÂMERA
Criar câmera em terceira pessoa seguindo o jogador.
Pode ser uma câmera simples ou Cinemachine, se disponível.
Caso use Cinemachine, configure automaticamente ou deixe instruções claras.

Script sugerido:
- ThirdPersonCamera.cs

3. SISTEMA DE VIDA E ESTABILIDADE
O jogador deve ter:
- Health;
- EloEnergy;
- Stability.

Health = vida física.
EloEnergy = energia usada nas habilidades.
Stability = estabilidade emocional.

Usar Corrente Forçada deve:
- consumir EloEnergy;
- reduzir Stability;
- aumentar Dependency de Aiko.

Usar Fio de Vínculo deve:
- consumir menos energia;
- não reduzir tanto a estabilidade;
- ter menor dano ou efeito.

Script sugerido:
- PlayerStats.cs

4. SISTEMA DE VÍNCULO
Criar um sistema de vínculo para NPCs importantes.

Cada NPC importante deve ter:
- Trust;
- Dependency;
- Autonomy;

Para Aiko:
Trust começa baixo.
Dependency começa em 0.
Autonomy começa média.

Quando o jogador usa Corrente Forçada perto dela:
- Dependency aumenta;
- Autonomy diminui;
- Stability do jogador diminui.

Quando o jogador interage de forma saudável:
- Trust aumenta;
- Autonomy aumenta ou se mantém;
- Dependency não aumenta.

Scripts sugeridos:
- BondSystem.cs
- BondTarget.cs
- AikoCompanion.cs

5. HABILIDADE: FIO DE VÍNCULO
Nome: Fio de Vínculo

Função:
- Dispara um fio de energia do protagonista até um inimigo ou ponto.
- Causa pequeno dano ou lentidão.
- Visual com LineRenderer.
- Cor visual suave, por exemplo azul claro ou branco.

Uso:
- tecla Q.

Efeito:
- dano leve;
- reduz velocidade do inimigo por alguns segundos;
- custo baixo de EloEnergy.

Script sugerido:
- BondThreadAbility.cs

6. HABILIDADE: CORRENTE FORÇADA
Nome: Corrente Forçada

Função:
- Dispara uma corrente agressiva no inimigo.
- Prende o inimigo por curto tempo.
- Causa dano maior.
- Pode puxar o inimigo ou interromper ataque.
- Visual com LineRenderer mais rígido/agressivo.

Uso:
- tecla E.

Efeito:
- dano médio;
- stun temporário;
- custo médio de EloEnergy;
- reduz Stability;
- aumenta Dependency de Aiko se ela estiver próxima.

Script sugerido:
- ForcedChainAbility.cs

7. SISTEMA DE INIMIGOS
Criar inimigos chamados “Caídos”.

Comportamento:
- patrulham ou ficam parados até detectar jogador;
- perseguem jogador;
- atacam de perto;
- recebem dano;
- podem ficar lentos pelo Fio de Vínculo;
- podem ficar presos pela Corrente Forçada.

Scripts sugeridos:
- EnemyAI.cs
- EnemyHealth.cs
- EnemyAttack.cs

Tipos para a demo:
- Caído comum: fraco, anda até o jogador e ataca.
- Caído pesado: mais vida, mais lento, mais dano.

8. COMPANHEIRA AIKO
Aiko deve ser uma NPC companion simples.

Comportamento:
- segue o jogador com distância;
- para durante diálogos;
- reage ao combate;
- se afasta levemente dos inimigos;
- possui estado emocional baseado em Dependency e Autonomy.

Estados:
- Assustada;
- Dependente;
- Instável;
- Consciente.

Se Dependency > 70:
Aiko deve ficar muito próxima do jogador e dizer frases como:
“Não me deixa para trás.”
“Eu não consigo ficar longe.”

Se Autonomy estiver maior:
“Eu consigo andar.”
“Não precisa me puxar.”

Script sugerido:
- AikoCompanion.cs

9. DIÁLOGO SIMPLES
Criar sistema simples de diálogo com UI.

Requisitos:
- caixa de texto;
- nome do personagem;
- botão para avançar;
- escolhas simples;
- escolhas alteram Trust/Dependency/Autonomy.

Scripts sugeridos:
- DialogueManager.cs
- DialogueNode.cs
- DialogueChoice.cs

10. UI
Criar HUD com:
- barra de vida;
- barra de EloEnergy;
- barra de Stability;
- indicador simples de estado de Aiko;
- texto contextual para interação;
- tela de consequência final.

Scripts sugeridos:
- UIManager.cs

11. GAME MANAGER
Controlar fluxo da demo:
- início;
- encontro com Aiko;
- desbloqueio de habilidades;
- spawn de inimigos;
- fim do combate;
- consequência final.

Script sugerido:
- DemoGameManager.cs

12. CENÁRIO
Criar uma cena chamada Demo_BecoDaChuva.

Elementos:
- chão;
- paredes laterais;
- luzes de neon;
- caixas/objetos simples;
- área onde Aiko fica sentada;
- área de spawn de inimigos;
- ponto final da demo.

Use prefabs simples.

PASTA DO PROJETO
Organize o projeto assim:

Assets/
  Scripts/
    Player/
    Combat/
    Bonds/
    NPCs/
    Enemies/
    UI/
    Managers/
  Prefabs/
    Player/
    NPCs/
    Enemies/
    VFX/
    Environment/
  Scenes/
    Demo_BecoDaChuva.unity
  Materials/
  Audio/
  ScriptableObjects/

ARQUITETURA DE CÓDIGO
Use código limpo, componentizado e fácil de expandir.
Evite colocar tudo em um único script.
Use eventos C# quando fizer sentido.
Comente partes importantes.

REQUISITOS DE GAMEPLAY DETALHADOS

PLAYER
- Movimento fluido.
- Pode atacar com clique esquerdo ou tecla J.
- Ataque pesado com clique direito ou tecla K.
- Esquiva com Space.
- Interação com F.
- Fio de Vínculo com Q.
- Corrente Forçada com E.

COMBATE
- Ataque leve: rápido, pouco dano.
- Ataque pesado: lento, mais dano.
- Esquiva: curta invulnerabilidade opcional.
- Inimigos atacam se estiverem perto.
- Feedback visual ao tomar dano.

FIO DE VÍNCULO
- Alcance médio.
- Dano baixo.
- Aplica slow.
- Visual suave.
- Não aumenta dependência de Aiko.

CORRENTE FORÇADA
- Alcance médio.
- Dano maior.
- Aplica stun.
- Reduz estabilidade.
- Aumenta dependência de Aiko.
- Se usado repetidamente, a UI deve indicar instabilidade.

AIKO
- Deve ter um pequeno painel ou indicador:
  Estado de Aiko: Assustada / Dependente / Instável / Consciente.
- A mudança de estado deve depender dos valores internos.
- No fim da demo, mostrar consequência baseada nesses valores.

NARRATIVA DA DEMO

Texto inicial:
“Depois que o último fio se rompeu, ele aprendeu a temer qualquer laço verdadeiro.”

Ao encontrar Aiko:
Aiko: “Você vai ficar aí só olhando?”
Protagonista: “Você quer ajuda?”
Aiko: “Querer... eu não sei mais.”

Escolhas:
1. “Então caminha comigo.”
   Efeito: +Trust, mantém Autonomy.
2. “Você precisa de mim.”
   Efeito: +Dependency, -Autonomy, desbloqueia Corrente Forçada com tom sombrio.

Antes do combate:
Aiko: “Tem alguma coisa vindo...”
Protagonista: “Fica atrás de mim.”

Depois do combate, se Dependency alta:
Aiko: “Quando você puxa essa corrente... eu sinto como se uma parte minha ficasse com você.”
Texto final:
“Ela estava viva. Mas algo nela já não era completamente dela.”

Depois do combate, se Trust/Autonomy melhores:
Aiko: “Eu ainda estou com medo... mas consigo andar.”
Texto final:
“Ele ainda não sabia proteger sem prender. Mas, por um instante, tentou.”

FINAL DA DEMO
Mostrar tela:
“Fim da Demo — Correntes: Fragmentos de Vontade”
E abaixo:
“Vínculos não são feitos para prender. São feitos para continuar.”

ENTREGÁVEIS
Gere:
1. Todos os scripts C# necessários.
2. Instruções de como criar/configurar a cena no Unity.
3. Lista de GameObjects necessários e componentes.
4. Prefabs sugeridos.
5. Valores iniciais recomendados.
6. Explicação curta de como testar a demo.
7. Código organizado por arquivos.
8. Se não puder gerar a cena Unity diretamente, gere um SceneSetup script em C# para criar objetos básicos automaticamente no editor ou em runtime.

SCRIPT DE SETUP OPCIONAL
Crie um script chamado DemoSceneBootstrap.cs que, ao rodar em uma cena vazia, cria:
- chão;
- paredes;
- player;
- câmera;
- Aiko;
- spawners de inimigos;
- luzes;
- UI básica;
- GameManager.

Isso é importante para que a demo possa ser testada rapidamente mesmo sem assets.

QUALIDADE ESPERADA
A demo deve ser jogável, mesmo com placeholders.
Priorize:
1. Mecânica de vínculo funcionando.
2. Combate básico funcionando.
3. Aiko reagindo ao uso das habilidades.
4. Consequência final mudando conforme comportamento do jogador.
5. Código organizado e expansível.

NÃO FAZER
- Não usar assets pagos.
- Não depender de plugins externos obrigatórios.
- Não usar nomes de Hunter x Hunter.
- Não transformar Aiko em simples “barra de recurso”.
- Não criar um escopo gigantesco impossível.
- Não fazer multiplayer.
- Não implementar a história completa; apenas a vertical slice.

EXPLIQUE AO FINAL
Ao terminar, explique:
- quais scripts foram criados;
- como configurar a cena;
- como testar o fluxo completo;
- quais partes são placeholders;
- próximos passos para evoluir a demo.