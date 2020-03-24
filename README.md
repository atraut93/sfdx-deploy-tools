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
@andrew.trautmann/sfdx-deploy-tools/0.0.5 darwin-x64 node-v13.8.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx deploytools:test:report [-f xunit] [-i <string> | -l] [-s] [-d <directory>] [-u <string>] [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-deploytoolstestreport--f-xunit--i-string---l--s--d-directory--u-string---apiversion-string---quiet---verbose---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx deploytools:test:report [-f xunit] [-i <string> | -l] [-s] [-d <directory>] [-u <string>] [--apiversion <string>] [--quiet] [--verbose] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

display the test results for a given deployment

```
USAGE
  $ sfdx deploytools:test:report [-f xunit] [-i <string> | -l] [-s] [-d <directory>] [-u <string>] [--apiversion 
  <string>] [--quiet] [--verbose] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --outputdir=outputdir                                                         the directory to store the generated
                                                                                    report in

  -f, --format=(xunit)                                                              [default: xunit] the format to save
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

_See code: [lib/commands/deploytools/test/report.js](https://github.com/atraut93/sfdx-deploy-tools/blob/v0.0.5/lib/commands/deploytools/test/report.js)_
<!-- commandsstop -->
