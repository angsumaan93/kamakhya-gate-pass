const fs = require('fs-extra');
const path = require('path');
const { METADATA_FILE_NAME } = require('./consts');

const createMetadataJson = (filepath, metadata) => {
  return fs.writeJson(path.join(filepath, METADATA_FILE_NAME), metadata);
};

module.exports = createMetadataJson;
