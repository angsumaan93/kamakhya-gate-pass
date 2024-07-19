const { Command, flags } = require('@oclif/command');
const readMetadataJson = require('../lib/readMetadataJson');
const updateService = require('../lib/updateService');

class UpdateCommand extends Command {
  async run() {
    const currentMetadata = await readMetadataJson('.');

    if (currentMetadata.type !== 'service') {
      throw new Error('Update command only applies to services');
    }

    const { clusterArn, serviceArn } = currentMetadata;
    const { flags } = this.parse(UpdateCommand);
    await updateService(clusterArn, serviceArn, flags);
  }
}

UpdateCommand.description = `Update service`;

UpdateCommand.flags = {
  'force-new-deployment': flags.boolean({
    char: 'f',
    description: 'force new service deployment',
    default: false
  }),
  'desired-count': flags.string({
    char: 'c',
    description: 'Change desired count of service tasks',
    parse: input => parseInt(input, 10)
  })
};

module.exports = UpdateCommand;
