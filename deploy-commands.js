const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const config = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  commands.push(require(path.join(commandsPath, file)).data.toJSON());
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    console.log(`🔄 Registrando ${commands.length} comandos...`);
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
      body: commands,
    });
    console.log('✅ Comandos registrados com sucesso!');
  } catch (err) {
    console.error(err);
  }
})();