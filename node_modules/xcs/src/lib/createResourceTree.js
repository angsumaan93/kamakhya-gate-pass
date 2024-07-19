const fs = require('fs-extra');
const path = require('path');
const { ecs } = require('./aws');
const createMetadataJson = require('./createMetadataJson');

const createResourceTree = async () => {
  const res = await ecs.listClusters().promise();

  await createMetadataJson('.', { profile: process.env.AWS_PROFILE });
  await Promise.all(res.clusterArns.map(createClusterResourceTree));

  await makeFsReadOnly('.');
};

const createClusterResourceTree = async clusterArn => {
  const clusterDirPath = getNameFromArn(clusterArn);
  await fs.mkdir(clusterDirPath);
  await createMetadataJson(clusterDirPath, {
    type: 'cluster',
    clusterArn
  });

  const res = await ecs.listServices({ cluster: clusterArn }).promise();

  await Promise.all(
    res.serviceArns.map(createServiceResourceTree.bind(null, clusterArn))
  );
};

const createServiceResourceTree = async (clusterArn, serviceArn) => {
  const servicePath = path.join(
    getNameFromArn(clusterArn),
    getNameFromArn(serviceArn)
  );
  await fs.mkdir(servicePath);
  await createMetadataJson(servicePath, {
    type: 'service',
    clusterArn,
    serviceArn
  });
};

const getNameFromArn = arn => arn.split('/')[1];

const makeFsReadOnly = async fullpath => {
  const mod =
    fs.constants.S_IRUSR |
    fs.constants.S_IXUSR |
    fs.constants.S_IRGRP |
    fs.constants.S_IXGRP;

  await recursiveChmod(fullpath, mod);
};

const recursiveChmod = async (fullpath, mod) => {
  const isDir = (await fs.lstat(fullpath)).isDirectory();
  const childDirs = isDir ? await fs.readdir(fullpath) : [];
  const isTopDir = fullpath === '.';
  if (childDirs.length === 0 && !isTopDir) {
    await fs.chmod(fullpath, mod);
  } else {
    await Promise.all(
      childDirs.map(
        async childDir =>
          await recursiveChmod(path.join(fullpath, childDir), mod)
      )
    );

    if (!isTopDir) {
      await fs.chmod(fullpath, mod);
    }
  }
};

module.exports = createResourceTree;
