@andrew.trautmann/sfdx-deploy-tools
=====================



[![Version](https://img.shields.io/npm/v/@andrew.trautmann/sfdx-deploy-tools.svg)](https://npmjs.org/package/@andrew.trautmann/sfdx-deploy-tools)
[![CircleCI](https://circleci.com/gh/atraut93/sfdx-deploy-tools/tree/master.svg?style=shield)](https://circleci.com/gh/atraut93/sfdx-deploy-tools/tree/master)
[![Codecov](https://codecov.io/gh/atraut93/sfdx-deploy-tools/branch/master/graph/badge.svg)](https://codecov.io/gh/atraut93/sfdx-deploy-tools)
[![Known Vulnerabilities](https://snyk.io/test/github/atraut93/sfdx-deploy-tools/badge.svg)](https://snyk.io/test/github/atraut93/sfdx-deploy-tools)
[![Downloads/week](https://img.shields.io/npm/dw/@andrew.trautmann/sfdx-deploy-tools.svg)](https://npmjs.org/package/@andrew.trautmann/sfdx-deploy-tools)
[![License](https://img.shields.io/npm/l/@andrew.trautmann/sfdx-deploy-tools.svg)](https://github.com/andrew.trautmann/sfdx-deploy-tools/blob/master/package.json)

<!-- toc -->

<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g @andrew.trautmann/sfdx-deploy-tools
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
@andrew.trautmann/sfdx-deploy-tools/0.1.0-beta darwin-x64 node-v13.8.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx deploytools:deploy:delta -f <string> [-c] [-g] [-l NoTestRun|RunSpecifiedTests|RunLocalTests|RunAllTestsInOrg] [-o] [-r <array>] [-w <integer>] [-u <string>] [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-deploytoolsdeploydelta--f-string--c--g--l-notestrunrunspecifiedtestsrunlocaltestsrunalltestsinorg--o--r-array--w-integer--u-string---apiversion-string---quiet---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx deploytools:test:coverage [-f lcov-text] [-d <directory>] [-u <string>] [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-deploytoolstestcoverage--f-lcov-text--d-directory--u-string---apiversion-string---quiet---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx deploytools:test:report [-f xunit|xunitnet] [-i <string> | -l] [-s] [-d <directory>] [-u <string>] [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-deploytoolstestreport--f-xunitxunitnet--i-string---l--s--d-directory--u-string---apiversion-string---quiet---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx deploytools:deploy:delta -f <string> [-c] [-g] [-l NoTestRun|RunSpecifiedTests|RunLocalTests|RunAllTestsInOrg] [-o] [-r <array>] [-w <integer>] [-u <string>] [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

deploy only changed files from a given commit/branch

```
USAGE
  $ sfdx deploytools:deploy:delta -f <string> [-c] [-g] [-l NoTestRun|RunSpecifiedTests|RunLocalTests|RunAllTestsInOrg] 
  [-o] [-r <array>] [-w <integer>] [-u <string>] [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --checkonly                                                                   same as force:source:deploy command

  -f, --from=from                                                                   (required) the commit/branch to
                                                                                    deploy from

  -g, --ignorewarnings                                                              same as force:source:deploy command

  -l, --testlevel=(NoTestRun|RunSpecifiedTests|RunLocalTests|RunAllTestsInOrg)      same as force:source:deploy command

  -o, --ignoreerrors                                                                same as force:source:deploy command

  -r, --runtests=runtests                                                           same as force:source:deploy command

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  -w, --wait=wait                                                                   same as force:source:deploy command

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --quiet                                                                           nothing emitted stdout

  --verbose                                                                         emit additional command output to
                                                                                    stdout

EXAMPLE
  sfdx deploytools:deploy:delta -u <org alias>
```

_See code: [src/commands/deploytools/deploy/delta.ts](https://github.com/atraut93/sfdx-deploy-tools/blob/v0.1.0-beta/src/commands/deploytools/deploy/delta.ts)_

## `sfdx deploytools:test:coverage [-f lcov-text] [-d <directory>] [-u <string>] [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

retrieve code coverage data in a specified format

```
USAGE
  $ sfdx deploytools:test:coverage [-f lcov-text] [-d <directory>] [-u <string>] [--apiversion <string>] [--quiet] 
  [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --outputdir=outputdir                                                         the directory to store the generated
                                                                                    code coverage report in

  -f, --format=(lcov-text)                                                          [default: lcov-text] the format to
                                                                                    save the coverage in

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --quiet                                                                           nothing emitted stdout

  --verbose                                                                         emit additional command output to
                                                                                    stdout

EXAMPLES
  sfdx deploytools:test:coverage -u <org alias>
  sfdx deploytools:test:coverage -u <org alias> -f lcov-text
```

_See code: [src/commands/deploytools/test/coverage.ts](https://github.com/atraut93/sfdx-deploy-tools/blob/v0.1.0-beta/src/commands/deploytools/test/coverage.ts)_

## `sfdx deploytools:test:report [-f xunit|xunitnet] [-i <string> | -l] [-s] [-d <directory>] [-u <string>] [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

display the test results for a given deployment

```
USAGE
  $ sfdx deploytools:test:report [-f xunit|xunitnet] [-i <string> | -l] [-s] [-d <directory>] [-u <string>] 
  [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --outputdir=outputdir                                                         the directory to store the generated
                                                                                    report in

  -f, --format=(xunit|xunitnet)                                                     [default: xunit] the format to save
                                                                                    create the test results in

  -i, --deployid=deployid                                                           the deployment id to get test
                                                                                    results for

  -l, --latest                                                                      use the latest deploy information

  -s, --source                                                                      use the source deploy command rather
                                                                                    than mdapi

  -u, --targetusername=targetusername                                               username or alias for the target
                                                                                    org; overrides default target org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

  --quiet                                                                           nothing emitted stdout

  --verbose                                                                         emit additional command output to
                                                                                    stdout

EXAMPLES
  sfdx deploytools:test:report -u <org alias> -l
  sfdx deploytools:test:report -u <org alias> -l -d test-results
  sfdx deploytools:test:report -u <org alias> -i <deploy id>
  sfdx deploytools:test:report -u <org alias> -i <deploy id> -d test-results
  sfdx deploytools:test:report -u <org alias> -i <deploy id> -d test-results -f xunit
```

_See code: [src/commands/deploytools/test/report.ts](https://github.com/atraut93/sfdx-deploy-tools/blob/v0.1.0-beta/src/commands/deploytools/test/report.ts)_
<!-- commandsstop -->
