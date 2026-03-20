 .github/workflows/jekyll.yml   |     6 +-
 CLAUDE.md                      |    27 +-
 Dockerfile                     |    10 +-
 Tests/CiCleanup.test.js        |    81 +
 Tests/EsmValidation.test.js    |    71 +-
 create_tests.sh                |   108 -
 jest.config.js                 |   191 -
 jest.setup.js                  |     4 -
 package-lock.json              | 10497 +++++++++------------------------------
 package.json                   |    20 +-
 run_tests.sh                   |    30 -
 scripts/build.mjs              |   249 -
 scripts/check-esm-coverage.mjs |    74 -
 scripts/validate-esm.mjs       |    89 -
 14 files changed, 2487 insertions(+), 8970 deletions(-)
