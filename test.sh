#!/bin/bash -e

detect_changed_languages() {
  echo "detecting changes for this build"
  languages=`git diff --name-only $SHIPPABLE_COMMIT_RANGE | sort -u | awk 'BEGIN {FS="/"} {print $1}' | uniq`

  echo $SHIPPABLE_COMMIT_RANGE

  for language in $languages
  do
    unset changed_components
    detect_changed_folders $language
    run_tests
  done
}

detect_changed_folders() {
  folders=`git diff --name-only $SHIPPABLE_COMMIT_RANGE | sort -u | grep $1 | awk 'BEGIN {FS="/"} {print $2}' | uniq`

  process_all_components=false
  for folder in $folders
  do
    if [ "$folder" == '_global' ]; then
      echo "pushing all images"
      process_all_components=true
      break
    fi
  done

  if [ "$process_all_components" == true ]; then
    cd $1
    export changed_components+=`ls -d */ | sed 's/.$//'`
    cd ..
  else
    export changed_components+=$folders
  fi
}

run_tests() {
  for component in $changed_components
  do
    if [ "$component" != '_global' ] && [ "$component" != 'node_modules' ]; then
      if [ -f ./$language/$component/Gruntfile.js ]; then
        execute_unit_tests $component
        execute_code_coverage $component
      fi
    fi
  done
}

execute_unit_tests() {
  if [[ -z "$1" ]]; then
    return 0
  else
    echo "running unit tests on $1"
    cd $SHIPPABLE_BUILD_DIR/$language/$1
    grunt --force
  fi
}

execute_code_coverage() {
  if [[ -z "$1" ]]; then
    return 0
  else
    echo "running code coverage on $1"
    base=/root/src/github.com/ttrahan/micro-mono
    cd $SHIPPABLE_BUILD_DIR/$language/$1
    ./node_modules/.bin/istanbul cover grunt --force --dir $SHIPPABLE_BUILD_DIR/shippable/codecoverage
    ./node_modules/.bin/istanbul report cobertura --dir  $SHIPPABLE_BUILD_DIR/shippable/codecoverage/
    cd $SHIPPABLE_BUILD_DIR
    fi
}

if [ "$IS_PULL_REQUEST" != true ]; then
  detect_changed_languages
  # tag_and_push_changed_components
else
  echo "skipping because it's a PR"
fi
