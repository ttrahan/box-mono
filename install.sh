#!/bin/bash -e

detect_changed_languages() {
  echo "detecting changes for this build"
  languages=`git diff --name-only $SHIPPABLE_COMMIT_RANGE | sort -u | awk 'BEGIN {FS="/"} {print $1}' | uniq`

  echo $SHIPPABLE_COMMIT_RANGE

  for language in $languages
  do
    if [ "$language" != 'shippable' ]; then
      unset changed_components
      detect_changed_folders $language
      run_install
    fi
  done
}

detect_changed_folders() {
  folders=`git diff --name-only $SHIPPABLE_COMMIT_RANGE | sort -u | grep $1 | awk 'BEGIN {FS="/"} {print $2}' | uniq`

  process_all_components=false
  for folder in $folders
  do
    if [ "$folder" == '_global' ]; then
      echo "processing all components"
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
  echo $changed_components
}

run_install() {
  for component in $changed_components
  do
    if [ "$component" != '_global' ] && [ "$component" != 'node_modules' ]; then
      execute_install $component
    fi
  done
}

execute_install() {
  if [[ -z "$1" ]]; then
    return 0
  else
    echo "installing dependencies for $1"
    cd $SHIPPABLE_BUILD_DIR/$language/$1
    npm install
  fi
}

if [ "$IS_PULL_REQUEST" != true ]; then
  detect_changed_languages
  # tag_and_push_changed_components
else
  echo "skipping because it's a PR"
fi
