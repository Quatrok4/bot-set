const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const config = require('../../config');
const db = require('../utils/database');

// ================= PERMISSÃO =================
function isOwner(interaction) {
  return config.donos.includes(interaction.user.id) || interaction.guild.ownerId === interaction.user.id;
}

// ================= VISUAL =================
function embedLista() {
  const perguntas = db.getQuestions();

  const texto = perguntas.length
    ? perguntas
        .map((q, i) => {
          const estilo = q.style === 'paragraph' ? 'resposta longa' : 'resposta curta';
          const obrig = q.required ? 'obrigatória' : 'opcional';
          const exemplo = q.placeholder ? `\n└ Exemplo: *${q.placeholder}*` : '';
          return `**${i + 1}.** ${q.label}\n└ ${estilo} • ${obrig}${exemplo}`;
        })
        .join('\n\n')
    : '*Nenhuma pergunta cadastrada.*';

  return new EmbedBuilder()
    .setColor(config.cores.principal)
    .setTitle('📝 Editor do formulário')
    .setDescription(texto)
    .setFooter({ text: `${perguntas.length}/${config.maxPerguntas} perguntas • As mudanças valem na hora` });
}

// Tela principal. "aviso" é uma mensagem curta mostrada acima (ex: "✅ Pergunta adicionada!")
function painel(aviso = '') {
  const total = db.getQuestions().length;

  const botoes = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('form_add')
      .setLabel('Adicionar')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Success)
      .setDisabled(total >= config.maxPerguntas),
    new ButtonBuilder()
      .setCustomId('form_edit')
      .setLabel('Editar')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(total === 0),
    new ButtonBuilder()
      .setCustomId('form_remove')
      .setLabel('Remover')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(total <= 1) // sempre sobra pelo menos 1 pergunta
  );

  return { content: aviso, embeds: [embedLista()], components: [botoes] };
}

// Menu para escolher uma pergunta + botão de voltar
function telaSelecao(customId, texto, placeholder) {
  const perguntas = db.getQuestions();

  const select = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(
      perguntas.map((q, i) => ({
        label: `${i + 1}. ${q.label}`.slice(0, 100),
        description: `${q.style === 'paragraph' ? 'Longa' : 'Curta'} • ${q.required ? 'Obrigatória' : 'Opcional'}`,
        value: q.id,
      }))
    );

  const voltar = new ButtonBuilder().setCustomId('form_back').setLabel('Voltar').setEmoji('↩️').setStyle(ButtonStyle.Secondary);

  return {
    content: texto,
    embeds: [embedLista()],
    components: [new ActionRowBuilder().addComponents(select), new ActionRowBuilder().addComponents(voltar)],
  };
}

// ================= MODAL (usado para adicionar E editar) =================
// Se "pergunta" for passada, os campos já vêm preenchidos (modo edição)
function criarModal(customId, titulo, pergunta) {
  const label = new TextInputBuilder()
    .setCustomId('label')
    .setLabel('Pergunta (máx. 45 caracteres)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(45);

  const exemplo = new TextInputBuilder()
    .setCustomId('placeholder')
    .setLabel('Exemplo dentro da caixa (opcional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(100);

  const tamanho = new TextInputBuilder()
    .setCustomId('style')
    .setLabel('Tamanho da resposta (curta ou longa)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(10)
    .setPlaceholder('curta');

  const obrigatoria = new TextInputBuilder()
    .setCustomId('required')
    .setLabel('Obrigatória? (sim ou não)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(5)
    .setPlaceholder('sim');

  if (pergunta) {
    label.setValue(pergunta.label);
    if (pergunta.placeholder) exemplo.setValue(pergunta.placeholder);
    tamanho.setValue(pergunta.style === 'paragraph' ? 'longa' : 'curta');
    obrigatoria.setValue(pergunta.required ? 'sim' : 'não');
  }

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(titulo)
    .addComponents(
      new ActionRowBuilder().addComponents(label),
      new ActionRowBuilder().addComponents(exemplo),
      new ActionRowBuilder().addComponents(tamanho),
      new ActionRowBuilder().addComponents(obrigatoria)
    );
}

// Lê os 4 campos do modal e converte para o formato da pergunta
function lerCamposDoModal(interaction) {
  const tamanho = interaction.fields.getTextInputValue('style').trim().toLowerCase();
  const obrigatoria = interaction.fields.getTextInputValue('required').trim().toLowerCase();

  return {
    label: interaction.fields.getTextInputValue('label').trim(),
    placeholder: interaction.fields.getTextInputValue('placeholder').trim(),
    // "longa", "paragrafo", "parágrafo"... tudo que começa com l ou p vira parágrafo
    style: tamanho.startsWith('l') || tamanho.startsWith('p') ? 'paragraph' : 'short',
    // só é opcional se o dono escreveu "não", "nao" ou "n"
    required: !obrigatoria.startsWith('n'),
  };
}

// ================= ROTEADOR =================
async function handle(interaction) {
  if (!isOwner(interaction)) {
    return interaction.reply({ content: '❌ Apenas o dono pode editar o formulário.', flags: MessageFlags.Ephemeral });
  }

  // Ex: "form_edit_modal:q_123" → acao = "form_edit_modal", id = "q_123"
  const [acao, id] = interaction.customId.split(':');

  switch (acao) {
    // ---------- Voltar ao painel ----------
    case 'form_back':
      return interaction.update(painel());

    // ---------- ADICIONAR ----------
    case 'form_add':
      if (db.getQuestions().length >= config.maxPerguntas) {
        return interaction.update(painel(`❌ Limite de ${config.maxPerguntas} perguntas atingido.`));
      }
      return interaction.showModal(criarModal('form_add_modal', 'Nova pergunta'));

    case 'form_add_modal': {
      if (db.getQuestions().length >= config.maxPerguntas) {
        return interaction.update(painel(`❌ Limite de ${config.maxPerguntas} perguntas atingido.`));
      }
      db.addQuestion(lerCamposDoModal(interaction));
      return interaction.update(painel('✅ Pergunta adicionada!'));
    }

    // ---------- EDITAR ----------
    case 'form_edit':
      return interaction.update(telaSelecao('form_edit_select', '✏️ Qual pergunta você quer editar?', 'Escolha uma pergunta'));

    case 'form_edit_select': {
      const pergunta = db.getQuestion(interaction.values[0]);
      if (!pergunta) return interaction.update(painel('❌ Pergunta não encontrada.'));
      return interaction.showModal(criarModal(`form_edit_modal:${pergunta.id}`, 'Editar pergunta', pergunta));
    }

    case 'form_edit_modal': {
      if (!db.getQuestion(id)) return interaction.update(painel('❌ Pergunta não encontrada.'));
      db.updateQuestion(id, lerCamposDoModal(interaction));
      return interaction.update(painel('✅ Pergunta atualizada!'));
    }

    // ---------- REMOVER ----------
    case 'form_remove':
      return interaction.update(telaSelecao('form_remove_select', '🗑️ Qual pergunta você quer remover?', 'Escolha uma pergunta'));

    case 'form_remove_select': {
      const pergunta = db.getQuestion(interaction.values[0]);
      if (!pergunta) return interaction.update(painel('❌ Pergunta não encontrada.'));

      const confirmar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`form_remove_confirm:${pergunta.id}`).setLabel('Sim, remover').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('form_back').setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
      );
      return interaction.update({
        content: `⚠️ Tem certeza que quer remover **${pergunta.label}**?`,
        embeds: [embedLista()],
        components: [confirmar],
      });
    }

    case 'form_remove_confirm': {
      if (db.getQuestions().length <= 1) return interaction.update(painel('❌ O formulário precisa ter pelo menos 1 pergunta.'));
      db.removeQuestion(id);
      return interaction.update(painel('🗑️ Pergunta removida!'));
    }
  }
}

module.exports = { handle, painel, isOwner };