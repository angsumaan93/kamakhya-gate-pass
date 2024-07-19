const { ecs } = require('./aws');
const prettyJson = require('prettyjson');

const describeCluster = async clsuterArn => {
  output = await ecs
    .describeClusters({
      clusters: [clsuterArn]
    })
    .promise();

  return prettyJson.render(serializeCluster(output));
};

const serializeCluster = awsOutput => {
  const cluster = awsOutput.clusters[0];

  if (!cluster) {
    throw new Error('Cluster not found');
  }

  return Object.assign(
    {},
    {
      clusterArn: cluster.clusterArn,
      clusterName: cluster.clusterName,
      status: cluster.status,
      registeredContainerInstancesCount:
        cluster.registeredContainerInstancesCount,
      runningTasksCount: cluster.runningTasksCount,
      pendingTasksCount: cluster.pendingTasksCount,
      activeServicesCount: cluster.activeServicesCount
    },
    cluster.statistics.length > 0 ? { statistics: cluster.statistics } : {}
  );
};

module.exports = describeCluster;
