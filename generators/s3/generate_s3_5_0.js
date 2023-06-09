const AWS = require('aws-sdk');

module.exports = generateConfigForS3_5_0;

/**
 * 
 * @param {terraformGenerator.TerraformGenerator} tfg 
 * @see https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/listbucketscommand.html
 */
function generateConfigForS3_5_0(tfg) {
  return new Promise((resolve, reject) => {
    const s3client = new AWS.S3();
    s3client.listBuckets((err, data) => {
      if (err) {
        reject(err);
        return;
      }
      let promisesLeftToResolve = data.Buckets.length;
      data.Buckets.forEach(bucket => {
        const identifier = bucket.Name.replace(/\./g, '_');
        tfg.resource('aws_s3_bucket', identifier, {
          bucket: bucket.Name,
          tags: {
            generated_by_aws_terraform_generator: true
          }
        });
        s3client.getBucketWebsite({ Bucket: bucket.Name }, (err, data) => {
          if (err) {
            if (err.code === 'NoSuchWebsiteConfiguration') {
              promisesLeftToResolve -= 1;
              if (promisesLeftToResolve === 0) {
                resolve();
              }
              return;
            }
            reject(err);
            return;
          }
          const config = {
            bucket: bucket.Name,
            tags: {
              generated_by_aws_terraform_generator: true
            }
          };
          if (data.ErrorDocument) {
            config.error_document = {
              key: data.ErrorDocument.Key,
            };
          }
          if (data.IndexDocument) {
            config.index_document = {
              suffix: data.IndexDocument.Suffix,
            };
          }
          if (data.RedirectAllRequestsTo) {
            config.redirect_all_requests_to = {
              host_name: data.RedirectAllRequestsTo.HostName,
              protocol: data.RedirectAllRequestsTo.Protocol,
            };
          }
          if (data.RoutingRules) {
            config.routing_rules = data.RoutingRules.map(rule => {
              const routingRule = {};
              if (rule.Condition) {
                routingRule.condition = {
                  http_error_code_returned_equals: rule.Condition.HttpErrorCodeReturnedEquals,
                  key_prefix_equals: rule.Condition.KeyPrefixEquals,
                };
              }
              if (rule.Redirect) {
                routingRule.redirect = {
                  host_name: rule.Redirect.HostName,
                  http_redirect_code: rule.Redirect.HttpRedirectCode,
                  protocol: rule.Redirect.Protocol,
                  replace_key_prefix_with: rule.Redirect.ReplaceKeyPrefixWith,
                  replace_key_with: rule.Redirect.ReplaceKeyWith,
                };
              }
              return routingRule;
            });
          }
          tfg.resource('aws_s3_bucket_website_configuration', identifier, config);
          promisesLeftToResolve -= 1;
          if (promisesLeftToResolve === 0) {
            resolve();
          }
        });
      });
    });
  });
}
