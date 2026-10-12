<p align="center"><img src="quadrymon-logo.png" alt="Quadrymon" width="600"></p>

<p align="center"><a href="README.md">Português</a> · <strong>English</strong> · <a href="README.es.md">Español</a></p>
<p align="center">Multi-account hub for Poke Idle World · Windows x64 · Version 1.0.0</p>
<p align="center"><a href="https://github.com/Diego-ops501/Quadrymon/releases/download/v1.0.0/Quadrymon-1.0.0-x64.exe"><strong>Download Quadrymon 1.0.0</strong></a> · <a href="https://github.com/Diego-ops501/Quadrymon/releases/latest">Latest release</a></p>

![Quadrymon — four adventures in one hub](docs/art/quadrymon-banner.png)

**Four accounts, the global market, inventory and hunt analysis in one application.** Quadrymon brings together tools to monitor accounts, compare opportunities and choose where to train your Pokémon.

The promotional illustration was inspired by the Quadrymon visual reference. The screenshots below show the actual Portuguese application interface with demonstration accounts, inventories and values; they do not represent guaranteed farming results.

## Installation and first steps

1. Download **Quadrymon-1.0.0-x64.exe** using the link above.
2. Run the installer and choose its language and installation directory.
3. Open **Settings → Accounts** (Ajustes → Contas), add up to four accounts and save.
4. The app fills each account's email or username and password and logs in automatically when the form is ready. Account names come from the in-game character. Complete CAPTCHA and additional authentication in the game; **Log in to accounts** lets you retry manually.
5. Choose **Grid**, **Focus** or **Summary**. Select the interface language under **Settings → Appearance and game**.

Windows x64 and internet access are required. The installer includes the application runtime; Node.js is not required to use the app.

## Multiple accounts and controls

Accounts use separate sessions. The top bar lets you select an account, switch views and reload all pages using the circular arrow next to the accounts.

| Control | Purpose |
| --- | --- |
| **Grid** | Watch game panels side by side. |
| **Focus** | Expand one account while keeping other sessions open. |
| **Summary** | View hunt, leader, HP, XP/h, $/h, captures and kills/h. |
| **− / +** | Adjust an account's zoom. |
| **⟳ inside a panel** | Reload that account only. |
| **⟳ next to accounts** | Reload all configured accounts. |
| **Power button** | Turn an account panel off or back on. |

![Four-account summary](docs/images/resumo.png)

Switching views preserves sessions. Choose the number of panels under **Settings → Accounts**.

**Summary** includes supplies and estimated duration, daily totals, balance and capture goals, trends, teams and important catches. Daily totals use differences between readings, retain negative expenses and reuse existing local history.

## Analysis and capture history

Open **Analysis** to monitor account indicators in the side panel. Summary and analysis show observed session data; missing data does not mean zero performance.

Select an account with the tabs to inspect its session, balance, loot, bag, pinned items, shiny target and team. Arrows reorder sections; **✕** hides a section, which can be restored under **Hidden sections**. Use the star in Bag to pin an item.

![Analysis panel](docs/images/analise.png)

**Capture history** lists Pokémon recorded by the app. Filter by account, name, rarity, minimum IV and shiny status. Export CSV to review the history in a spreadsheet. **Reset session** resets session indicators.

![Capture history](docs/images/capturas.png)

## Global market

The top **Market** button opens integrated price browsing without leaving a hunt. Select an account, category and **Cards** or **Rows** view. Pokémon filters include shiny status, IV, level, quality, type and rarity. Purchases, sales and trades are performed in the game's own market.

![Global market and filters](docs/images/mercado.png)

### Suggestions and evolutions

As you type, the Pokémon and item catalog supplies names and images. Once cached, suggestions do not need to wait for shop listings to load.

Suggestions group variants and levels under a species name, avoiding repeated choices such as “Dratini Lv.1” and “Nightmare Dratini”. With **Include evolutions** checked, a Pupitar search also considers Larvitar and Tyranitar while retaining the other filters.

![Suggestions while typing](docs/images/sugestoes.png)

### Market tools

| Tab | Purpose |
| --- | --- |
| **Buy** | Browse offers and sort results. |
| **Compare with market** | Select an inventory item or Pokémon and consult similar listings. |
| **Alerts** | Configure price conditions and market notifications. |
| **My Listings** | Monitor listings available for the selected account. |
| **Requests** | Browse buy requests. |
| **History** | Review records returned by the game. |

Comparisons use available conditions such as species, shiny status, rarity, level, IV and quality. Currency conversion requires an active diamond exchange rate; without it, the app explains that prices cannot be compared across currencies.

### Travel to the market and return to a hunt

**Go to market** in an account panel travels inside the game. It differs from the top button that opens price browsing. When an account is outside a hunt and a previous hunt has been recorded, the shortcut can return to that hunt even from another location.

## Inventory and IVs

Open **Inventory** to browse Pokémon, items and Poké Balls in separate account columns. Use category buttons and name, account, rarity and IV-range filters. **Refresh** requests a new inventory reading.

![Account inventories](docs/images/inventario.png)

With the IV tool enabled, hover over, select or use Tab to reach a Pokémon. Its card shows level, quality, types, stats and individual IVs; **Simulate level** projects stats at another level.

The detailed card includes six stat bars, total-IV potential, physical/special aptitude and available or level-locked moves. Simulate level and quality without changing observed game stats. Individual IV ranges show uncertainty in the calculation.

![IV card and simulation](docs/images/ivs.png)

**Total IV** is reported by the game. **Individual IVs** are inferred from available stats and may be estimates. The calculation requires the game to supply the necessary data.

## Hunt recommendations

Open the hunt icon or **Recommend hunt** in Summary. Choose an account, XP or profit objective, potion option and HP threshold. Analysis considers the leader's level, stats, available moves, effectiveness, hunt data and account measurements.

![Hunt recommendations](docs/images/hunts.png)

Results distinguish **measured** values from **estimated** ones. Samples require at least five clean minutes of observation; changing the leader, leveling up or resetting counters changes the measurement baseline.

The complete recommendation simulates **256 scenarios per available move**, uses map productivity and prioritizes real measurements. It shows hit ranges, risk, XP/h, kills/h and the estimate's source. Profit mode includes loot, expected capture sales, balls and potions. Capture probability is modeled when no real sample is available; it is not guaranteed. [Model origin and limitations](NOTICE.md).

Progression limits the options: below level 150, the Pokémon's level limits the tier; levels 150–599 use level-150 hunts; level 600 and above considers the Orre 500–600 tier when available. A recommendation for today's type appears when the game reports an active event and a suitable option exists.

XP per kill and base sale value come from the game catalog. Missing components, such as capture probability, can prevent a complete profit projection. Estimated XP/h, hits and risk should be checked in actual combat; they are not performance guarantees.

## Alerts, sound and overlay

Under **Settings → Farm notifications**, select alerts, speech, shiny sound and shiny screenshots. An optional webhook can forward notifications to your Discord.

![Notification settings](docs/images/alertas.png)

Under **Appearance and game**, enable the **Overlay** to monitor a compact account summary in a floating window. Notifications depend on connected accounts and the app receiving game events.

![Overlay](docs/images/overlay.png)

## Settings and tools

![Performance settings](docs/images/configuracoes.png)

- **Eco:** reduces panel frame rates according to the active view.
- **Appearance and game:** language, game aspect ratio, chat, game menu, HUD and sound.
- **Arrangement:** grid, column or row; original aspect ratio also works in Focus.
- **Chat and HUD:** hide chat or the game menu; Hide HUD removes capture popups and reveals trainer, Auto-Helper and menu on hover.
- **Analysis settings:** show, hide and reorder sections; manage pinned items and protected sale items. Drag the panel edge to resize it.
- **Prevent sleep:** keeps the computer awake while enabled.
- **Tray and startup:** minimize to the tray and choose whether to start with Windows.
- **Protected selling:** adds confirmation to selling actions intercepted by the app.
- **Tier list and Ditto:** review learned moves and projected stats. Sorting by move power does not replace hunt recommendations.
- **Backup and support:** export or import settings, open the manual and review the error report.

The operating system encrypts credentials in the local profile. Settings exports exclude passwords, game sessions and the webhook. Quadrymon remains compatible with the app's existing local profile.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| **Ctrl + 1 / 2 / 3 / 4** | Focus the corresponding account. |
| **Ctrl + M** | Toggle account sound. |
| **F2** | Toggle the menu for the focused game account; from the app interface, toggle account menus. |

## Updates

Releases are available on the [release page](https://github.com/Diego-ops501/Quadrymon/releases). Use **Settings → Backup and support → Check updates**. The app asks for confirmation before downloading and before installing an update.

## Run and build from source

For development, use Node.js 24 and npm:

    npm ci
    npm start

To check the codebase and build the installer:

    npm test
    npm run dist

The Windows installer is generated in <code>dist/</code>. <code>npm run docs:screenshots</code> recreates documentation images in a temporary profile using demonstration data, without accessing real accounts.

Development and maintenance: **Diego-ops501**. Quadrymon's original code is distributed under the [MIT license](LICENSE). Dependencies and third-party assets retain their own terms and notices.
