
const fs = require('fs');
const path = require('path');


const tracer = require('./logtracer');
const stringify = require('csv-stringify');
const dayjs = require('dayjs');




async function logstat(options){


  const defaulfromptions = {
                            contentReposifromry:'./content',
                            trancelatedReposifromry:'./translated-content',
                            contentPath:'files/en-us',
                            translatedPath:'files/ja',
                            resultFile:"./trancelate-status.csv",
                            exts:['html', 'htm'],
                            verbose:true
                          }

  const {contentReposifromry, trancelatedReposifromry, contentPath, translatedPath, resultFile, verbose, exts} = Object.assign({}, defaulfromptions, options);
  const contentStamps = await tracer(contentReposifromry);
  const translatedStamps = await tracer(trancelatedReposifromry);

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
      else if (contentStamp.renameTo){
        continue;
      }
      else if(!translatedStamp){
        if(!contentStamp.renameFrom){

          status = 'not translated';
          score =  contentStamp.lastModified || contentStamp.create

        }
        else{
          let fromContentFile = contentStamp.renameFrom.file
          let fromContentStamp = contentStamps[fromContentFile];
          let fromContentFiles = [fromContentFile];


          while(fromContentStamp.renameFrom){
            fromContentFile = contentStamp.renameFrom.file;
            rootContentFile = fromContentFile;
            fromContentStamp = contentStamps[fromContentFile];
            fromContentFiles.push(fromContentFile);
          }
          let fromTranslatedFile, fromTranslatedStamp, nodeContentStamp;
          for (let fromContentFile of fromContentFiles) {
            nodeContentStamp = contentStamps[fromContentFile];
            fromTranslatedFile = replacePath(contentPath, translatedPath,  fromContentFile);
            fromTranslatedStamp = translatedStamps[fromTranslatedFile];
            if(fromTranslatedStamp){
              break;
            }

          }
          if(!fromTranslatedStamp){
            status = 'not translated';
            score =  contentStamp.lastModified || contentStamp.create;
          }
          else if(!fromTranslatedStamp.renameTo){
            status = 'not renamed';
            score = nodeContentStamp.renameTo.similarity;
            extra = fromTranslatedFile;
          }
          else{
            status = 'rename mistake';
            score = nodeContentStamp.renameTo.similarity

            let startTranslatedFile = fromTranslatedFile;
            let toTranslateFile = fromTranslatedStamp.renameTo.file;
            let toTranslateStamp = translatedStamps[toTranslateFile];
            while(toTranslateStamp.renameTo){
              toTranslateFile = toTranslateStamp.renameTo.file
              toTranslateStamp = translatedStamps[toTranslateFile];
            }
            extra = [toTranslateFile, startTranslatedFile].join(' ')

          }
        }
      }
      else if(!contentStamp['delete'] && translatedStamp['delete']){
        status = 'miss delete';
        score = translatedStamp['delete'];
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
      continue;

    }




    if(translatedStamp.renameFrom){
      let fromTranslatedFile = translatedStamp.renameFrom.file;
      let fromTranslatedStamp= translatedStamps[fromTranslatedFile];
      
      while(fromTranslatedStamp.renameFrom){
        fromTranslatedFile = fromTranslatedStamp.renameFrom.file;
        fromTranslatedStamp= translatedStamps[fromTranslatedFile]
      }
      let fromContentFile = replacePath(translatedPath, contentPath, fromTranslatedFile);
      if(contentStamps[fromContentFile] ){
        continue;
      }


      extra = fromTranslatedFile;
      score = fromTranslatedStamp.renameTo.similarity;
    }
    else{
      score = translatedStamp.lastModified || translatedStamp.create
    }
    status = 'translated filename mistake or base file deleted';






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
      resolve();
    })
  });

}
function replacePath(basePath, targetPath, filePath){

  if(basePath){
    return filePath.replace(basePath, targetPath).replace('/^\//', '');
  }
  if(!basePath && !targetPath){
    return filePath;
  }

  return path.join([targetPath, filePath])

}
module.exports.logstat = logstat;
