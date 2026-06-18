#!/usr/bin/env bash

# Builds the assets and publishes them to the production S3 bucket.
# This script only works in buildkite.
#
# On the Twilio locked-down agents (queue general-039) the old Segment helpers
# (${SEGMENT_LIB_PATH}/aws.bash + run-with-role) don't exist, and node/yarn are
# not installed on the agent. So we:
#   1. assume the publish role with the AWS CLI on the agent, exporting
#      temporary credentials (same mechanism the deploy steps use)
#   2. run the build + publish inside the CI image (which has node/yarn/make),
#      passing the temporary credentials through to scripts/upload-assets.js

set -euo pipefail

ROLE_ARN="arn:aws:iam::812113486725:role/ajs_next_destinations_upload-production"

echo "--- Assume publish role"
CREDS=$(aws sts assume-role \
  --role-arn "$ROLE_ARN" \
  --role-session-name "buildkite-${BUILDKITE_PIPELINE_SLUG:-publish}-${BUILDKITE_BUILD_NUMBER:-0}" \
  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
  --output text)
export AWS_ACCESS_KEY_ID=$(echo "$CREDS" | awk '{print $1}')
export AWS_SECRET_ACCESS_KEY=$(echo "$CREDS" | awk '{print $2}')
export AWS_SESSION_TOKEN=$(echo "$CREDS" | awk '{print $3}')

echo "--- Build and publish assets inside the CI image"
docker compose -f docker-compose-ci.yml run --rm \
  --volume "$PWD:/workdir" --workdir /workdir \
  -e NPM_TOKEN -e NODE_ENV \
  -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_SESSION_TOKEN \
  app sh -e -c '
    npm config set "//npmjs.artifacts.twilio.com/artifactory/api/npm/virtual-npm-twilio/:_authToken" "${NPM_TOKEN}"
    yarn install --frozen-lockfile
    make build-and-publish
  '