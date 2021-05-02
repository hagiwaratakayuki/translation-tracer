# translation-tracer
check and trace git base translation

## Install

### Use as cli tool

```bash
npm install --global translation-tracer
```

## Usage

### CLI

#### before start

1. create and cd directory
1. clone base content repository. dirname 'content' is default
1. clone translate content repository. dirname 'translated-content' is default

#### command
```bash
translation-tracer
```

#### command options

Option Key | CLI Alias | Description | Type | Default
---|---|---|---|---
--contentRepository || Base content Repository for trancelation.| `string` | `./content`
--trancelatedRepository ||  trancelated content Repository. | `string`| `./trancelated-content`
--contentPath ||  target path in base content repository. | `string` |  `en-US`
--nocontentPath || flag for contentPath make void. | `boolean` | `false`
--translatedPath ||  target path in trancelated content repository. | `string` | `files/ja`
--notranslatedPath || flag for translatedPath make void. | `boolean` | `false`
--resultFile || filepath for log. templated by [day.js format](https://day.js.org/docs/en/display/format).  | `string` | `[./trancelate-status-]YYYY-MM-DD-HH-mm-ssZZ[.csv]`
--exts | --e | target file extention(eg. html, htm). if you want set multiple, type like '-e html --e htm --e txt' | `string list` | `[html, htm]`
--verbose | --v |  verbose flag | `boolean` | `true`

#### Log File

Translation-tracer makes log file as csv with headers. because it assumed use in spreadsheet application. ex. filter status.


Column Number | Column Name | Mean
---| --- | ---
0 | file | target file name
1 | status | translation status. ex. `out of date`
2 | score | time or simirality parsentage
3 | extra | extra data if need. likly  rename base and renamed filename

##### Translation Status

Name | Description | Score | Extra
---| --- | --- | ---
not translated | this file did not translated. | latest update or create time
not delete | base file deleted but translation file did not delete | delete time
rename mistake | rename mistake at translation file. | base file similarity | translated file name after renamed
out of date | this file is translated but out of date | base file's last modified time
rename mistake | translated file miss renamed  | base file similality percentage |  translated file name "after and before" renamed.
not renamed | base file renamed, but translated file did not rename | base file similality percentage | translated file name when base file renamed
translated filename mistake or base file deleted | translated file exist. but base file does not exist | if this file was renamed,  file similality percentage  | if this file was renamed, filename before renamed
