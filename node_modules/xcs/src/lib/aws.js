process.env.AWS_SDK_LOAD_CONFIG = 1;
const AWS = require('aws-sdk');
var ecs = new AWS.ECS({ apiVersion: '2014-11-13' });

module.exports = { ecs };
