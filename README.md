# Minimal Client Demo

Simple project with minimal http client functionality to add files to an existing local thread

# Getting started

Should be as easy as

```
yarn
```

Assumes you have a locally running Textile Daemon:

```
RELEASE=1.0.0-rc42 # For example
wget https://github.com/textileio/textile-go/releases/download/"$RELEASE"/textile-go_"$RELEASE"_linux-amd64.tar.gz
tar xvfz textile-go_"$RELEASE"_linux-amd64.tar.gz
rm textile-go_"$RELEASE"_linux-amd64.tar.gz
sudo ./install.sh
textile init -s $(textile wallet init | tail -n1)
textile threads add --type open --sharing shared --media test-media
textile config API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
textile daemon
```
