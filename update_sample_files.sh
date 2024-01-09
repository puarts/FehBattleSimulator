#!/usr/bin/env bash

curl -k "https://feh.puarts.com/?pid=1762" > source.html

grep -E "(var|const)\s+heroInfos\s*=" source.html > Sources/SampleHeroInfos.js
grep -E "(var|const)\s+(weapon|support|special|passiveA|passiveB|passiveC|passiveS|passiveX|captain)Infos\s*=" source.html > Sources/SampleSkillInfos.js

rm source.html
