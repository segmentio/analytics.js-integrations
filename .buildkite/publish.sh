#!/usr/bin/env bash

# This script gets AWS credentials for accessing the assets S3 buckets and then executes the upload scripts
# This script only works in buildkite

set -e

source "${SEGMENT_LIB_PATH}/aws.bash"

run-with-role "arn:aws:iam::812113486725:role/ajs_next_destinations_upload-production" make build-and-publish