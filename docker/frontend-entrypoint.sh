#!/bin/sh
set -eu

# Publica o dist do build no volume compartilhado com o nginx e encerra.
mkdir -p /out
rsync -a --delete /assets/ /out/
echo "Frontend assets published to /out ($(find /out -type f | wc -l) files)."
