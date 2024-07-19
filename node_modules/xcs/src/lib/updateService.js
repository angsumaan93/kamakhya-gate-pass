const { ecs } = require('./aws');

const updateService = async (clusterArn, serviceArn, flags) => {
  const params = Object.assign(
    {},
    {
      cluster: clusterArn,
      service: serviceArn
    },
    flags['force-new-deployment']
      ? { forceNewDeployment: flags['force-new-deployment'] }
      : {},
    flags['desired-count'] ? { desiredCount: flags['desired-count'] } : {}
  );

  try {
    await ecs.updateService(params).promise();
  } catch (e) {
    console.error(`Udpate action failed with AWS error: ${e.code}`);
  }
};

module.exports = updateService;
