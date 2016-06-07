#!/bin/bash -e
export IMAGE_NAME=ttrahan/box-mono

detect_changed_languages() {
  echo "detecting changes for this build"
  languages=`git diff --name-only $SHIPPABLE_COMMIT_RANGE | LANG=C sort -u | awk 'BEGIN {FS="/"} {print $1}' | uniq`

  for language in $languages
  do
    unset changed_components
    detect_changed_folders $language
    tag_and_push_changed_components
  done
}

detect_changed_folders() {
  folders=`git diff $SHIPPABLE_COMMIT_RANGE | sort -u | grep $1 | awk 'BEGIN {FS="/"} {print $2}' | uniq`

  echo $folders

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

tag_and_push_changed_components() {
  for component in $changed_components
  do
    if [ "$component" != 'node_modules' ]; then
      tag_and_push_image $component
    fi
  done
}

tag_and_push_image() {
  if [[ -z "$1" ]]; then
    return 0
  elif [[ $1 == '_global' ]]; then
    echo "building image $1"
    sudo docker build -t $IMAGE_NAME:$1.$BRANCH.latest ./$language/$1
    echo "pushing image $1"
    sudo docker push $IMAGE_NAME:$1.$BRANCH.latest
  else
    echo "building image $1"
    sudo docker build -t $IMAGE_NAME:$1.$BRANCH.$SHIPPABLE_BUILD_NUMBER ./$language/$1
    echo "pushing image $1"
    sudo docker push $IMAGE_NAME:$1.$BRANCH.$SHIPPABLE_BUILD_NUMBER
  fi
}

if [ "$IS_PULL_REQUEST" != true ]; then
  detect_changed_languages
  # tag_and_push_changed_components
else
  echo "skipping because it's a PR"
fi
