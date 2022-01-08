#!/usr/bin/env bash

curl -k "https://puarts.com/?pid=1469" > source.html

grep "^var heroInfos" source.html > Sources/SampleHeroInfos.js
grep "^const .*Infos" source.html > Sources/SampleSkillInfos.js

rm source.html
