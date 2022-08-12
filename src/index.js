import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, GuildMember } from 'discord.js'
import { Player } from 'discord-player'
import dotenv from 'dotenv'

import { CommandHandler } from './CommandHandler.mjs'
import slashCommands from './CommandRegistrar.mjs'

dotenv.config()

const client = new Client({
    intents: [
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
    ],
})

const player = new Player(client)

// Register all available slash commands
slashCommands.map(command => CommandHandler.addCommand(command.name, command.handler))

player.on('error', (queue, error) => {
    console.error(`There has been an error: ${error.message}`)
})

player.on('connectionError', (queue, error) => {
    console.log(`Connection lost during connect attempts. Message: ${error.message}`)
})

player.on('trackStart', (queue, track) => {
    queue.metadata.send(`🎶 | Started playing: **${track.title}** in **${queue.connection.channel.name}**!`)
})

player.on('trackAdd', (queue, track) => {
    queue.metadata.send(`🎶 | Track **${track.title}** queued!`)
})

player.on('botDisconnect', (queue) => {
    queue.metadata.send('❌ | I was manually disconnected from the voice channel, clearing queue!')
})

player.on('channelEmpty', (queue) => {
    queue.metadata.send('❌ | Nobody is in the voice channel, leaving...')
})

player.on('queueEnd', (queue) => {
    queue.metadata.send('✅ | Queue finished!')
})

const commands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play music from YouTube, Spotify or SoundCloud')
        .addStringOption((option) => option.setName('query')
            .setDescription('URL or search query for the music clip')
            .setRequired(true)),

    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the listening session'),

    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips to the next song'),

    new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the song'),

    new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes the song'),

    new SlashCommandBuilder()
        .setName('tracks')
        .setDescription('Shows the current queue'),
].map((command) => command.toJSON())

const allowedCommands = commands.flatMap((command) => command.name)

// Registering slash commands
client.on('messageCreate', async (message) => {
    if (isMessageAuthorOwner(message)) {
        const restClient = new REST({ version: '10' }).setToken(process.env.TOKEN)
        registerSlashCommands(restClient, commands)
    }

    if (message.content === '!pidor') {
        message.reply('Sam ti pidor')
    }

    if (message.author.bot || ! message.guild) {
        return
    }

    if (! client.application?.owner) {
        return await client.application?.fetch()
    }
})

// Handle incoming slash commands
client.on('interactionCreate', async interaction => {
    await interaction.deferReply()

    if (! interaction.isCommand() || ! interaction.guildId) {
        return
    }

    if (! (interaction.member instanceof GuildMember) || ! interaction.member.voice.channel) {
        return void interaction.reply({ content: 'You are not in a voice channel!', ephemeral: true })
    }

    CommandHandler.handle(interaction.commandName, interaction, player)
})

client.login(process.env.TOKEN)

client.once('ready', () => console.log('Bot started, time to fuck some bitches'))

client.on('error', console.error)

function isMessageAuthorOwner(message) {
    return message.content === '!deploy'
}

function registerSlashCommands(restClient, commandCollection) {
    console.log('Starting to deploy commands!')

    const promise = restClient.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID,
        ),
        { body: commandCollection },
    )

    promise
        .then(() => console.log('Commands have been registered!'))
        .catch(console.error)
}
