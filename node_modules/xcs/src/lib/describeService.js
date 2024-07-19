const { ecs } = require('./aws');
const prettyJson = require('prettyjson');

const describeService = async (clusterArn, serviceArn) => {
  output = await ecs
    .describeServices({
      cluster: clusterArn,
      services: [serviceArn]
    })
    .promise();

  return prettyJson.render(serializeService(output));
};

const serializeService = awsOutput => {
  const service = awsOutput.services[0];

  if (!service) {
    throw new Error(`Service does not exists`);
  }

  return Object.assign(
    {},
    {
      serviceArn: service.serviceArn,
      serviceName: service.serviceName,
      clusterArn: service.clusterArn,
      taskDefinition: service.taskDefinition,
      status: service.status,
      launchType: service.launchType,
      desiredCount: service.desiredCount,
      runningCount: service.runningCount,
      pendingCount: service.pendingCount,
      loadBalancers: service.loadBalancers
    },
    service.serviceRegistries.length > 0
      ? {
          serviceRegistries: service.serviceRegistries
        }
      : {},
    {
      deploymentConfiguration: service.deploymentConfiguration,
      deployments: service.deployments,
      roleArn: service.roleArn,
      events: service.events.slice(0, 5),
      createdAt: service.createdAt,
      placementConstraints: service.placementConstraints,
      placementStrategy: service.placementStrategy,
      healthCheckGracePeriodSeconds: service.healthCheckGracePeriodSeconds,
      schedulingStrategy: service.schedulingStrategy
    }
  );
};

module.exports = describeService;
