#!/bin/sh
pattern=$1
output=$2

if [ -z "$pattern" -o -z "$output" ]; then
    echo Usage $0 pattern output
    echo Example: $u \'j\?.png\' jeep.png
    exit;
fi

set -x
convert $pattern +append f1.png
convert f1.png -flop f2.png
convert f1.png f2.png +append $output
rm f1.png f2.png
