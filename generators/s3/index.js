const terraformGenerator = require('terraform-generator');
const path = require('path');

const awsVersionGenerators = {
  's3': {
    '5.0': require('./generate_s3_5_0'),
    // '4.0': generateConfigForS3_4_0
  }
}

/**
 * Generate Terraform config for S3
 * @param {string} awsVersion The AWS Provider Version
 * @param {string} targetRegion The AWS Region to use when applying the config
 * @param {string} targetProfile The AWS Profile to use when applying the config
 */
function generateConfigForS3(awsVersion, targetRegion, targetProfile) {
  if (!awsVersionGenerators['s3'][awsVersion]) {
    throw new Error(`Unsupported AWS version: ${awsVersion}, available versions: ${Object.keys(awsVersionGenerators['s3'])}`);
  }
  const generator = awsVersionGenerators['s3'][awsVersion];

  const outputDir = path.join('./output', 's3');
  const tfg = new terraformGenerator.TerraformGenerator({
    required_version: '>= 0.13'
  });
  tfg.provider('aws', {
    region: targetRegion,
    profile: targetProfile,
    version: `~> ${awsVersion}`
  });
  generator(tfg).then(() => {
    tfg.write({ dir: outputDir, format: true });
  });
}

module.exports = generateConfigForS3;
