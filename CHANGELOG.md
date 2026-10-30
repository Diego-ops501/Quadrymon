# Alterações

## 1.2.0 — 30/10/2026

- Removida a função **Comparar com o mercado** do Mercado Global, incluindo sugestões de venda e consultas específicas de comparação.

- Novo módulo **Projetos de Breeding** com cadastro de projetos, seleção de Pokémon por conta com IV/qualidade, origem por ID e custo de aquisição ajustável.
- Continuidade automática pelo ID dos pais e do filhote, reconhecimento imediato de nascimentos pelo inventário, exibição dos IDs e custos desconhecidos apresentados como “a apurar”.
- Acompanhamento passivo de breeds e nascimentos confirmados pelo jogo, associação não bloqueante ao projeto, recuperação dos ovos em incubação, qualidade final e comparação do bônus de IV.
- Custos acumulados da linhagem sem duplicar pais, materiais avaliados pelo mercado, nascimento instantâneo, totais em dólares/diamantes, custos incompletos explícitos, ajustes e exportação local.

- Mercado consulta dados novos ao abrir e atualiza a cada minuto enquanto estiver aberto, sem varreduras recorrentes da loja com a janela fechada.
- Atualização dos anúncios preserva filtros, foco, página e rolagem. Filtros aproveitam o cache completo atualizado e mantêm os resultados visíveis durante consultas adicionais.
- Consultas travadas deixam de bloquear a fila; fechamento, reabertura e respostas antigas respeitam a sessão atual. Varreduras completas possuem limite de duração e só publicam resultados completos.
- Alertas continuam ativos com o mercado fechado e consultam páginas novas, sem reutilizar o cache de cinco minutos das buscas visíveis.

## 1.1.0 — 17/10/2026

- Foco com conta principal à esquerda e miniaturas ao vivo à direita, sem recriar as sessões. Botão central permite ocultar e restaurar miniaturas e salva a preferência.
- Miniaturas exibem somente o cenário e o combate; menus, HUD e canvases dos retratos da equipe ficam ocultos. A configuração normal, incluindo F2, volta ao ampliar a conta ou retornar à Grade.
- Cabeçalhos reúnem diamantes, dólares, total de Pokébolas e total de curas. A imagem do líder acompanha o nome da conta, com nome e nível no tooltip. Valores compactos em painéis menores mostram o total exato ao passar o mouse.
- Painel lateral de Análise e faixa separada de recursos removidos para ampliar a área útil do jogo. Abates/h incluídos na borda inferior.
- Notificações por personagem para capturas importantes, shinies, Strange Pheromone e Boss Token, com contador, destaque pulsante e histórico local. Abrir a lista marca os avisos como lidos. Itens monitorados configuráveis; proteção de venda e histórico preservados.
- Resumo com capturas abaixo de cada card, rolagem própria e modo Importantes/Todas independente e persistido. Filtros gerais e histórico completo preservados.
- Inclui correções recentes de atualização do mercado, recuperação após falhas, proteção de controle manual e leitura precisa de IVs no inventário nativo.

## 1.0.0 — 11/10/2026

Primeira publicação do Quadrymon para Windows x64.

### Pacote atualizado em 12/10/2026, mantendo a versão 1.0.0

- Alertas das contas aguardam 60 segundos após a conexão; problemas precisam persistir por 30 segundos.
- Histórico completo de capturas com rolagem e limpeza dos filtros herdados.
- Critérios de capturas importantes configuráveis em Ajustes → Resumo: por padrão, IV superior a 170 ou raridade Lendária.
- Capturas com nome e cor da raridade do jogo, horário e data completa no tooltip.
- Acumulado e histórico de shinies recuperados, com encontrados / capturados e contagem da sessão corrigida.
- Filtros de capturas atualizam apenas sua lista, com digitação agrupada e preservação do foco e da rolagem.
- Ícones originais do Inventário e Mercado Global; removido o atalho redundante de hunt da barra superior.

### Recursos da versão

- Identidade Quadrymon com logo, ícones e paleta azul escuro, ciano, azul elétrico e âmbar.
- Instalador corrigido para sugerir a pasta Quadrymon, sem reutilizar a pasta antiga PokeMux.
- Cadastro de contas aceita e-mail ou nome de usuário como login.
- Preenchimento e entrada automáticos nas contas ativas; aguarda o formulário e CAPTCHA pendente, sem repetir envios concluídos.
- Nome da conta identificado pelo personagem, separado do login e não editável.
- Grade, coluna e linha com proporção original do jogo; Foco preserva sessões; chat, menu/F2 e limpeza do HUD corrigidos para os elementos atuais do jogo.
- Ocultar avisos do jogo vem ativado por padrão: fecha a promoção inicial e oculta painel de captura e cartões de Pokémon derrotado, preservando captura automática e registros do aplicativo.
- Ajustes de seções da análise, largura do painel e lista de itens protegidos na venda recuperados.
- Até quatro contas, modos Grade/Foco/Resumo, sessões separadas e recarga conjunta.
- Foco com as outras contas na faixa inferior; nomes de Pokémon e hunts formatados sem sublinhados; imagens básicas e IV/qualidade ao lado do nome no Resumo, com a conta alinhada à direita nas capturas.
- Mercado com sugestões em cache, filtros, evoluções, comparação e alertas.
- Viagem ao mercado e retorno à hunt anterior.
- Inventário, IVs, análise, histórico, overlay e notificações.
- Resumo com a organização original de ritmo, contas, acumulado diário, metas e capturas; blocos configuráveis, arrastáveis e redimensionáveis, filtros completos e exportação CSV.
- Todas as capturas mostra o histórico registrado sem corte de 30 entradas, em ordem recente e com rolagem lateral; Importantes restringe a lista às capturas importantes, mantendo os demais filtros.
- Análise compacta com cabeçalho do treinador, sessão, saldo, Bag, alvo shiny, equipe e aba Σ para os totais das contas; cartão de IV com potencial, aptidão, faixas e simulação.
- Recomendação de hunt por nível, golpes, catálogo do jogo e medições da conta.
- Recomendação completa recuperada com produtividade por mapa, 256 cenários, golpes medidos/estimados, abates/h, custos de captura/poção, bônus do dia com expiração e proteção contra trocar de conta ou Pokémon antes de viajar.
- README em português, inglês e espanhol, com arte de apresentação e onze capturas demonstrativas.
- Atualizações pelo feed Quadrymon, com confirmação para download e instalação.
