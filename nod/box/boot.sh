#!/bin/bash

checkEnvironmentVariables() {
  echo 'Checking for required environment variables....'
  if [[ -z $DB_USERNAME ]]; then
    echo 'DB_USERNAME not found. Exiting.'
    exit 1;
  elif [[ -z $DB_PASSWORD ]]; then
    echo 'DB_PASSWORD not found. Exiting.'
    exit 1;
  elif [[ -z $DB_HOST ]]; then
    echo 'DB_HOST not found. Exiting.'
    exit 1;
  elif [[ -z $DB_PORT ]]; then
    echo 'DB_PORT not found. Exiting.'
    exit 1;
  elif [[ -z $DB_NAME ]]; then
    echo 'DB_NAME not found. Exiting.'
    exit 1;
  fi
  echo 'All variables are present.'
}
exportVariables() {
  export readonly RANDOM_NUMBER=$(date +%s-%N)
  export readonly DB_URL="mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
}
startCron() {
  cd /home/demo/box
  echo 'cron running without forever'
  node cron.js
}
main() {
  checkEnvironmentVariables
  exportVariables
  startCron
}

main
