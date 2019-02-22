# Minimal Client Demo

Simple project with minimal http client functionality to add files to an existing local thread

# Getting started

Should be as easy as

```
yarn
```

Assumes you have a locally running Textile Daemon, and that you have already created a thread named 'test-media' with the default media schema. The following set of commands should get you from zero to the required daemon setup, at which point `yarn` should 'just work'. Note that you may want to update/change the release version.

```
RELEASE=1.0.0-rc42 # For example
wget https://github.com/textileio/textile-go/releases/download/"$RELEASE"/textile-go_"$RELEASE"_linux-amd64.tar.gz
tar xvfz textile-go_"$RELEASE"_linux-amd64.tar.gz
rm textile-go_"$RELEASE"_linux-amd64.tar.gz # Or darwin or windows... see https://github.com/textileio/textile-go/releases
sudo ./install.sh
textile init -s $(textile wallet init | tail -n1)
textile threads add --type open --sharing shared --media test-media
textile config API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
textile daemon
```
