const fs = require('fs-extra');
const path = require('path');

const { METADATA_FILE_NAME } = require('./consts');

const readMetadataJson = filepath => {
  return fs.readJson(path.join(filepath, METADATA_FILE_NAME));
};

module.exports = readMetadataJson;
