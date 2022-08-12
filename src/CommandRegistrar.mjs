import { QueryType } from 'discord-player'

export default [
    {
        name: 'play',
        handler: async function (interaction, player) {
            if (interaction.commandName === 'play') {
                const query = interaction.options.getString('query')
        
                const searchResult = await player
                    .search(query, {
                        requestedBy: interaction.user,
                        searchEngine: QueryType.AUTO,
                    })
        
                if (! searchResult || ! searchResult.tracks.length) {
                    return void interaction.followUp({ content: 'No results were found!' })
                }
        
                const queue = player.createQueue(interaction.guild, {
                    metadata: interaction.channel,
                })
        
                try {
                    if (! queue.connection) {
                        await queue.connect(interaction.member.voice.channel)
                    }
                } catch {
                    void player.deleteQueue(interaction.guildId)
        
                    return void interaction.followUp({ content: 'Could not join your voice channel!' })
                }
        
                await interaction.followUp({ content: `⏱ | Loading your ${searchResult.playlist ? 'playlist' : 'track'}...` })

                searchResult.playlist 
                    ? queue.addTracks(searchResult.tracks) 
                    : queue.addTrack(searchResult.tracks[0])
        
                if (! queue.playing) {
                    return await queue.play()
                }
            }
        }
    },

    {
        name: 'skip',
        handler: function (interaction, player) {
            const queue = player.getQueue(interaction.guildId)

            if (! queue || ! queue.playing) {
                interaction.followUp({ content: '❌ | No music is being played!' })
            }
    
            const currentTrack = queue.current
            const success = queue.skip()
    
            interaction.followUp({
                content: success ? `✅ | Skipped **${currentTrack}**!` : '❌ | Something went wrong!',
            })
        }
    },

    {
        name: 'stop',
        handler: async function (interaction, player) {
            const queue = player.getQueue(interaction.guildId)
    
            if (! queue || ! queue.playing) {
                interaction.followUp({ content: '❌ | No music is being played!' })
            }
    
            queue.destroy()
    
            interaction.followUp({ content: '🛑 | Stopped the player!' })
        }
    },

    {
        name: 'pause',
        handler: async function (interaction, player) {
            const queue = player.getQueue(interaction.guildId)

            if (! queue || ! queue.playing) {
                interaction.followUp({ content: '❌ | No music is being played!' })
            }

            queue.setPaused(true)

            interaction.followUp({ content: 'Song paused!' })
        }
    },

    {
        name: 'resume',
        handler: async function (interaction, player) {
            const queue = player.getQueue(interaction.guildId)

            queue.setPaused(false)

            interaction.followUp({ content: 'Continuing to play the song!' })
        }
    },

    {
        name: 'tracks',
        handler: async function (interaction, player) {
            const queue = player.getQueue(interaction.guildId)

            if (! (queue.playing && queue.tracks.length)) {
                return interaction.followUp({ content: 'Nothing in the queue!' })
            }

            let counter = 1

            const tracksInQueue = queue.tracks.map(song => {
                return `${counter++}: ${song.title} (${song.duration}) requested by: '${song.requestedBy.username}'`
            })

            interaction.followUp({
                content: tracksInQueue.join('\n')
            })
        }
    }
]