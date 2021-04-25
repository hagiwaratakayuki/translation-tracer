#!/usr/bin/env node
'use strict';
const meow = require('meow');
const trancelationTracer = require('.');

const cli = meow(`
	Usage
	  $trancelation-tracer

	Options
	  --contentRepository,  Base content Repository for trancelation. default ./content
		--trancelatedRepository   trancelated content Repository. default ./trancelated-content
		--contentPath  target path in base content Repository. default en-US
		--nocontentPath  flag for contentPath make void. defalut false
    --translatedPath   target path in trancelated content Repository. default files/ja
		--notranslatedPath  flag for translatedPath make void.
		--resultFile  filepath for log default ./trancelate-status.csv
		--exts -e target file extention(eg. html, htm). if you want set multiple, type like '-e html -e htm -e txt' default html htm.
		--verbose --v verbose flag
	Examples
	  $ trancelation-tracer

`, {
	flags: {
		contentRepository: {
			type: 'string'
		},
		trancelatedRepository: {
			type: 'string'
		},
		trancelatedRepository:{
			type:'string'
		},
		contentPath:{
			type:'string',

		},
	 	nocontentPath:{
			type:'boolean',
			default:false

		},
		translatedPath:{
			type: 'string',

		},
	  notranslatedPath:{
			type:'boolean',
			default:false
		},
		resultFile:{
			type:'string',

		},
		exts:{
			type:'string',
			isMultiple:true,
			alias:'e'
		},
		verbose:{
			type:'boolean',
			alias:'v',
			default:true
		}
	}
});

const options = cli.flags;

if(options.exts && options.exts.length === 0){
	delete options.exts;


}


if(options.nocontentPath === true){
	options.contentPath = '';

}
if(options.notranslatedPath == true){
	options.translatedPath = ''
}
trancelationTracer.logstat(options).then(()=>{
	console.log('done');
})
