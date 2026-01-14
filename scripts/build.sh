#!/usr/bin/env bash

set -eo pipefail

buildApp() {
  docker buildx build --platform linux/amd64 . -t slackernews:latest
}

compressApp() {
  rm -f slackernews.tar.gz
  docker save slackernews:latest | gzip >slackernews.tar.gz
}

main() {
  buildApp
  compressApp
}

main "$@"
