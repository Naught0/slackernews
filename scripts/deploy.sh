#!/usr/bin/env bash

set -eo pipefail

transferApp() {
  scp slackernews.tar.gz franc:~/slackernews && rm slackernews.tar.gz
}

loadApp() {
  ssh franc "cd ~/slackernews && docker tag slackernews:latest slackernews:rollback && docker load < slackernews.tar.gz && docker compose up app -d"
}

main() {
  echo "Deploying app"
  transferApp &&
    loadApp &&
    echo "🎉 App deployed!" || echo "❌ App deployment failed"
}

main "$@"
