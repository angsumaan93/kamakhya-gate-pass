const { Command, flags } = require('@oclif/command');
const fs = require('fs-extra');
const path = require('path');
const { ecs } = require('../lib/aws');
const describeCluster = require('../lib/describeCluster');
const describeService = require('../lib/describeService');
const readMetadataJson = require('../lib/readMetadataJson');

class DescribeCommand extends Command {
  async run() {
    const currentMetadata = await readMetadataJson('.');

    let output;
    if (currentMetadata.type === 'cluster') {
      output = await describeCluster(currentMetadata.clusterArn);
    } else if (currentMetadata.type === 'service') {
      output = await describeService(
        currentMetadata.clusterArn,
        currentMetadata.serviceArn
      );
    }

    this.log(output);
  }
}

DescribeCommand.description = 'Describe current resource';

module.exports = DescribeCommand;
