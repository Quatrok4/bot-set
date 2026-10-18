require('dotenv').config();

module.exports = {
  // ---- Credenciais (vêm do .env) ----
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  // ---- Identidade da família ----
  familia: {
    nome: 'Nome da Familia', // aparece no painel do bot
    logo: 'https://i.imgur.com/suafoto.png',     // aparece pequena no canto do painel
    banner: 'https://i.imgur.com/suafoto.png', // imagem grande no final do painel
  },

  // ---- Cores dos embeds (hexadecimal) ----
  cores: {
    principal: 0x9b59b6,
    pendente: 0xf1c40f,
    aprovado: 0x2ecc71,
    recusado: 0xe74c3c,
  },

  // ---- IDs do servidor ----
  canais: {
    analise: '9999999999999999999',
  },
  cargos: {
    aprovado: '9999999999999999999',
    staff: '9999999999999999999',
  },

  // ---- Quem pode editar as perguntas (além do dono do servidor) ----
  donos: ['9999999999999999999'],

  // Limite do Discord para campos em um modal
  maxPerguntas: 5,
};