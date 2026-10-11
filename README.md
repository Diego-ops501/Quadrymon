<p align="center"><img src="quadrymon-logo.png" alt="Quadrymon" width="600"></p>

<p align="center"><strong>Português</strong> · <a href="README.en.md">English</a> · <a href="README.es.md">Español</a></p>
<p align="center">Central multitela para Poke Idle World · Windows x64 · Versão 1.0.0</p>
<p align="center"><a href="https://github.com/Diego-ops501/Quadrymon/releases/download/v1.0.0/Quadrymon-1.0.0-x64.exe"><strong>Baixar Quadrymon 1.0.0</strong></a> · <a href="https://github.com/Diego-ops501/Quadrymon/releases/latest">Última versão</a></p>

![Quadrymon — quatro aventuras em uma central](docs/art/quadrymon-banner.png)

**Quatro contas, mercado global, inventário e análise de hunts em um único aplicativo.** O Quadrymon reúne ferramentas para acompanhar suas contas, comparar oportunidades e escolher onde evoluir seu Pokémon.

A ilustração de apresentação foi criada a partir da referência visual do Quadrymon. As capturas abaixo mostram a interface real do aplicativo com contas, inventários e valores demonstrativos; não representam resultados garantidos de farm.

## Instalação e primeiros passos

1. Baixe **Quadrymon-1.0.0-x64.exe** pelo link acima.
2. Execute o instalador e escolha o idioma e a pasta de instalação.
3. Abra **Ajustes → Contas**, cadastre até quatro contas e salve.
4. O app preenche o e-mail ou usuário e a senha ao carregar cada conta. Clique em **Entrar nas contas** para enviar os formulários. CAPTCHA e autenticação adicional são resolvidos por você no jogo.
5. Escolha **Grade**, **Foco** ou **Resumo**. O idioma da interface fica em **Ajustes → Visual e jogo**.

É necessário Windows x64 e acesso à internet. O instalador inclui o ambiente de execução; não é preciso instalar Node.js para usar o aplicativo.

## Multitela e controle das contas

As contas possuem sessões separadas. A barra superior permite selecionar uma conta, alternar a visualização e recarregar todas as páginas pela seta circular ao lado das contas.

| Controle | Função |
| --- | --- |
| **Grade** | Acompanhar os painéis do jogo lado a lado. |
| **Foco** | Ampliar uma conta mantendo as outras sessões abertas. |
| **Resumo** | Consultar hunt, líder, HP, XP/h, $/h, capturas e abates/h. |
| **− / +** | Ajustar o zoom de uma conta. |
| **⟳ no painel** | Recarregar apenas aquela conta. |
| **⟳ ao lado das contas** | Recarregar todas as contas configuradas. |
| **Botão de energia** | Desligar ou religar o painel da conta. |

![Resumo das quatro contas](docs/images/resumo.png)

Alternar os modos preserva as sessões. Em **Ajustes → Contas**, escolha também quantos painéis utilizar.

## Análise e histórico de capturas

Abra **Análise** para acompanhar os indicadores das contas no painel lateral. O resumo e a análise exibem os dados observados na sessão; dados ausentes não significam rendimento zero.

![Painel de análise](docs/images/analise.png)

O **Histórico de capturas** reúne os Pokémon registrados pelo aplicativo. Filtre por conta, nome, raridade, IV mínimo e shiny. Exporte CSV para consultar o histórico em uma planilha. **Zerar sessão** reinicia os indicadores da sessão.

![Histórico de capturas](docs/images/capturas.png)

## Mercado global

O botão superior **Mercado** abre a consulta integrada de preços sem sair da hunt. Escolha conta, categoria e visualização em **Cards** ou **Linhas**. Para Pokémon, filtre por shiny, IV, nível, qualidade, tipo e raridade. Compras, vendas e negociações são realizadas no mercado do próprio jogo.

![Mercado global e filtros](docs/images/mercado.png)

### Sugestões de busca e evoluções

Enquanto você digita, o catálogo de Pokémon e itens fornece sugestões com nome e imagem. Quando o catálogo já está em cache, a busca não precisa esperar o carregamento dos anúncios.

As sugestões agrupam variantes e níveis sob o nome da espécie, evitando opções repetidas como “Dratini Lv.1” e “Nightmare Dratini”. Com **Incluir evoluções** marcado, a busca por Pupitar também considera Larvitar e Tyranitar, mantendo os demais filtros.

![Sugestões ao digitar](docs/images/sugestoes.png)

### Ferramentas do mercado

| Aba | Função |
| --- | --- |
| **Comprar** | Consultar ofertas e ordenar resultados. |
| **Comparar com o mercado** | Escolher um item ou Pokémon do inventário e consultar anúncios semelhantes. |
| **Alertas** | Configurar condições de preço e notificações de mercado. |
| **Meus Anúncios** | Acompanhar anúncios disponíveis para a conta selecionada. |
| **Solicitações** | Consultar solicitações de compra. |
| **Histórico** | Consultar registros retornados pelo jogo. |

As comparações usam as condições disponíveis, como espécie, shiny, raridade, nível, IV e qualidade. A conversão entre moedas depende de uma cotação ativa do diamante; sem ela, o aplicativo informa que não é possível comparar preços entre moedas.

### Ir ao mercado e voltar à hunt

**Ir ao mercado**, no painel de uma conta, realiza a viagem dentro do jogo. É diferente do botão superior que abre a consulta de preços. Quando a conta está fora da hunt e há uma hunt anterior registrada, o atalho permite retornar àquela hunt, mesmo a partir de outro local.

## Inventário e IVs

Abra **Inventário** para consultar Pokémon, itens e Poké Balls em colunas separadas por conta. Use as categorias e os filtros de nome, conta, raridade e faixa de IV. **Atualizar** solicita uma nova leitura do inventário.

![Inventário das contas](docs/images/inventario.png)

Com a ferramenta de IV ativada, passe o mouse, selecione ou use Tab para chegar até um Pokémon. O cartão mostra nível, qualidade, tipos, atributos e IVs individuais; **Simular nível** projeta os atributos em outro nível.

![Cartão de IV e simulação](docs/images/ivs.png)

O **IV total** é informado pelo jogo. Os **IVs individuais** são inferidos dos atributos disponíveis e podem ser estimados. O cálculo depende de o jogo fornecer os dados necessários.

## Recomendação de hunt

Abra o ícone de hunt ou **Recomendar hunt** no resumo. Escolha conta, foco em XP ou lucro, opção de poção e limiar de HP. A análise considera nível do líder, atributos, golpes disponíveis, efetividade, dados das hunts e medições da conta.

![Recomendações de hunt](docs/images/hunts.png)

Os resultados distinguem valores **medidos** de **estimados**. Uma amostra utiliza pelo menos cinco minutos limpos de observação; trocar o líder, subir de nível ou reiniciar os contadores altera a referência da medição.

A progressão limita as opções: abaixo de nível 150, respeita o nível do Pokémon; de 150 a 599, utiliza hunts da faixa 150; a partir de 600, considera a faixa Orre 500–600 quando disponível. A hunt do tipo do dia aparece quando há um evento ativo informado pelo jogo e uma opção adequada.

XP por abate e valor base de venda vêm do catálogo do jogo. Componentes indisponíveis, como probabilidade de captura, podem impedir uma projeção completa de lucro. XP/h, golpes e risco estimados devem ser conferidos em combate real; não são garantias de desempenho.

## Alertas, som e overlay

Em **Ajustes → Notificações do farm**, selecione os alertas, voz, som de shiny e print de shiny. Um webhook opcional permite encaminhar notificações ao seu Discord.

![Configuração de notificações](docs/images/alertas.png)

Em **Visual e jogo**, ative o **Overlay** para acompanhar um resumo compacto das contas em uma janela flutuante. As notificações dependem da conexão da conta e do recebimento de eventos do jogo.

![Overlay](docs/images/overlay.png)

## Configurações e ferramentas

![Ajustes de desempenho](docs/images/configuracoes.png)

- **Eco:** reduz a frequência de quadros dos painéis conforme a visualização.
- **Visual e jogo:** idioma, proporção do jogo, chat, menu do jogo, HUD e som.
- **Impedir suspensão:** mantém o computador ativo enquanto a opção estiver ligada.
- **Bandeja e inicialização:** minimize na bandeja e escolha iniciar com Windows.
- **Venda protegida:** acrescenta confirmação às ações de venda interceptadas pelo aplicativo.
- **Tierlist e Ditto:** consulte golpes aprendidos e projeções de atributos. Ordenar por potência de golpe não substitui a recomendação de hunt.
- **Backup e suporte:** exporte ou importe configurações, abra o manual e consulte o relatório de erros.

As credenciais ficam cifradas pelo sistema operacional no perfil local. A exportação de configurações exclui senhas, sessões do jogo e webhook. O Quadrymon preserva a compatibilidade com o perfil local já utilizado pelo aplicativo.

## Atalhos

| Atalho | Ação |
| --- | --- |
| **Ctrl + 1 / 2 / 3 / 4** | Colocar a conta correspondente em foco. |
| **Ctrl + M** | Alternar o som das contas. |

## Atualizações

As publicações ficam na [página de versões](https://github.com/Diego-ops501/Quadrymon/releases). Use **Ajustes → Backup e suporte → Verificar atualização**. O aplicativo solicita confirmação antes de baixar e antes de instalar uma atualização.

## Executar e gerar o instalador a partir do código

Para desenvolvimento, utilize Node.js 24 e npm:

    npm ci
    npm start

Para verificar a base e gerar o instalador:

    npm test
    npm run dist

O instalador Windows é gerado em <code>dist/</code>. <code>npm run docs:screenshots</code> recria as imagens da documentação em um perfil temporário, com dados demonstrativos e sem acessar contas reais.

Desenvolvimento e manutenção: **Diego-ops501**. Código próprio com direitos reservados, sem concessão de licença de código aberto. As dependências mantêm suas próprias condições.
