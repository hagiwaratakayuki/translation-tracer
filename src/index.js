
const fs = require('fs');
const path = require('path');


const tracer = require('./logtracer');
const stringify = require('csv-stringify');
const dayjs = require('dayjs');




async function logstat(options){


  const defaultOptions = {
                            contentRepository:'./content',
                            trancelatedRepository:'./translated-content',
                            contentPath:'files/en-us',
                            translatedPath:'files/ja',
                            resultFile:"./trancelate-status.csv",
                            exts:['html', 'htm'],
                            verbose:true
                          }

  const {contentRepository, trancelatedRepository, contentPath, translatedPath, resultFile, verbose, exts} = Object.assign({}, defaultOptions, options);
  const contentStamps = await tracer(contentRepository);
  const translatedStamps = await tracer(trancelatedRepository);

  let headers = ['file', 'status', 'score', 'extra'];
  let statuses = {};


  for (let contentFile in contentStamps) {

      if((contentPath && contentFile.indexOf(contentPath) !== 0) || exts.indexOf(contentFile.split('.').pop()) === -1) {

        continue
      }
      let contentStamp = contentStamps[contentFile];
      let translatedFile = replacePath(contentPath, translatedPath, contentFile);


      let status = '';
      let score = '';
      let extra = '';
      let translatedStamp = translatedStamps[translatedFile];
      if(contentStamp['delete'] && !translatedStamp){
        continue;
      }
      if(contentStamp['delete'] && !translatedStamp['delete']){
        status = 'not delete';
        score = contentStamp['delete']
      }
      else if(contentStamp.renameTo ){


        let toTranslatedFile = replacePath(contentPath, translatedPath,  contentStamp.renameTo.file);
        let toTranslatedStamp = translatedStamps[toTranslatedFile];
        let toContentStamp = contentStamps[contentStamp.renameTo.file];

        if(toContentStamp && toTranslatedStamp){

            continue


        }


        if(translatedStamp){
          if (translatedStamp.renameTo){
              if(translatedStamp.renameTo.file === toTranslatedFile){


                continue
              }

              score = contentStamp.renameTo.similarity;
              extra =  translatedStamp.renameTo.file
              contentFile = contentStamp.renameTo.file;
              status = 'rename mistake';



          }
          else{

            score = contentStamp.renameTo.similarity;
            extra = translatedFile
            contentFile = contentStamp.renameTo.file;
            status = 'not renamed';
          }



        }
        else if(!toTranslatedStamp ){
          if(toContentStamp){
              continue;
          }
          status = 'not translated';
          extra = '';
          score = contentStamp.lastModified || contentStamp.create;
          contentFile = contentStamp.renameTo.file;

        }
        else{
          continue;
        }

      }
      else if(!translatedStamp){
        if(statuses[contentFile]){
          continue;
        }
        status = 'not translated';
        score =  contentStamp.lastModified || contentStamp.create

      }
      else if(!contentStamp['delete'] && translatedStamp['delete']){
        status = 'miss delete';
        score = translatedStamp['delete']
      }
      else if(contentStamp.lastModified){


        if(!translatedStamp.lastModified){
          status = 'out of date';
          score = contentStamp.lastModified;
        }
        else{
          let contentModified = dayjs(contentStamp.lastModified);
          let translatedModified = dayjs(translatedStamp.lastModified);
          if(contentModified.isAfter(translatedModified) === true) {
            status = 'out of date';
            score = contentStamp.lastModified;
          }
          else{
            continue;
          }


        }
      }
      else{
        continue;
      }
      if(verbose === true){
        console.log(contentFile, status, score, extra);
      }

      statuses[contentFile] = {file:contentFile,status:status,score:score, extra:extra}

  }

  for (let translatedFile in translatedStamps) {
    let translatedStamp = translatedStamps[translatedFile];
    let contentFile = replacePath(translatedPath, contentPath, translatedFile);
    let contentStamp = contentStamps[contentFile];
    let score = '';
    let status;

    if ((translatedPath && translatedFile.indexOf(translatedPath) !== 0) || contentStamp ||  statuses[contentFile] || exts.indexOf(translatedFile.split('.').pop()) === -1 || translatedStamp['delete']) {
      continue;
    }
    if(translatedStamp.renameTo){
      if(translatedStamps[translatedStamp.renameTo.file] || contentStamps[replacePath(translatedPath, contentPath, translatedStamp.renameTo.file)]){
        continue;
      }

      status = 'translated filename mistake or base file deleted';
      score = translatedStamp.renameTo.similarity
      extra = translatedFile
      translatedFile = translatedStamp.renameTo.file;


    }
    else {
      status = 'translated filename mistake or base file deleted';

      if(translatedStamp.renameFrom){
        let fromContentFile = replacePath(translatedPath, contentPath, translatedStamp.renameFrom.file);
        if(contentStamps[fromContentFile] ){
          continue;
        }

        extra = translatedStamp.renameFrom.file;
        score = translatedStamp.renameFrom.similarity;
      }




    }
    else{
      continue;
    }
    if(verbose === true){
      console.log(translatedFile, status, score,extra);
    }

    statuses[translatedFile] = {file:translatedFile,status:status,score:score, extra:extra}

  }
  let records = [headers];

  for (let file in statuses) {
    if (statuses.hasOwnProperty(file)) {
      let row = [];
      let status = statuses[file];
      for (var header of headers) {
        row.push(status[header])
      }
      records.push(row)
    }
  }

  return new Promise(function(resolve, reject) {
    stringify(records, (err, output)=>{
      if(err){
        reject(err)
        return;
      }
      fs.writeFileSync(resultFile, output);
      resolve()
    })
  });

}
function replacePath(basePath, targetPath, filePath){

  if(basePath){
    return filePath.replace(basePath, targetPath).replace('/^\//', '');
  }

  return path.join([targetPath, filePath])

}
module.exports.logstat = logstat;
