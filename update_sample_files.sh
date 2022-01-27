#!/usr/bin/env bash

curl -k "https://puarts.com/?pid=1469" > source.html

grep -E "(var|const)\s+heroInfos\s*=" source.html > Sources/SampleHeroInfos.js
grep -E "(var|const)\s+(weapon|support|special|passiveA|passiveB|passiveC|passiveS)Infos\s*=" source.html > Sources/SampleSkillInfos.js

rm source.html
