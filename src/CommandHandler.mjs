class CommandHandler {
    static commands = []

    /**
     * Registers new slash command handler.
     * 
     * @param {string} name 
     * @param {callable} handler 
     */
    static addCommand (name, handler) {
        this.commands.push({
            name,
            handler: handler
        })
    }


    static handle (name, interaction, player = null) {
        if (! this.commands.filter(command => command.name === name).length) {
            throw new Error(`Command '${name}' is not registered. Make sure to set it up in CommandRegistrar.mjs file.`)
        }
        
        const commandHandler = this.commands.filter(command => command.name === name)[0]

        commandHandler.handler(interaction, player)
    }
}

export { CommandHandler }