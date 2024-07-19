const { Command, flags } = require('@oclif/command');
const createResourceTree = require('../lib/createResourceTree');

class InitCommand extends Command {
  async run() {
    await createResourceTree();
  }
}

InitCommand.description = `Mirror ECS state to current directory`;

module.exports = InitCommand;
