const { spawn } = require('child_process');


function tracer(rootPath){

  return new Promise((resolve, reject) => {

    let gitLog = spawn('git log --name-status --date=iso-local',[],{cwd:rootPath,'shell': true});

    let results = '';
    let errors = '';
    gitLog.stdout.on('data', data => {

      if(typeof data !== 'string'){
        data = data.toString();
      }
      results += data;
    })
    gitLog.stderr.on('data', data=>{
      if(typeof data !== 'string'){
        data = data.toString();
      }
      errors += data;
    })
    gitLog.on('error', err=>{
      if(errors){
        reject(errors);
        return;
      }
      if(err.code ==='ENOENT' ){
        reject(`${rootPath} does not exist`);
      }

    })
    gitLog.on('exit', code => {

      if(`${code}` !== '0' || errors){

        reject(errors);
        return;
      }
      let traceResult = _parse(results);
      resolve(traceResult);
    })

  });

}


function _parse(results){
  let logs = {};
  let ignoreFiles = {};

  let lines = results.split(/\r\n|\r|\n/);



  let date = '';
  let filePattern = /^[A-Z]/;
  let spacesPattern = /\s+/;
  let renamePattern = /^R\d+/;
  for (let line  of lines) {
    if(line.indexOf('Date:') === 0){

      date = line.replace('Date:','').trim();
      continue;
    }
    if(filePattern.test(line) === false){
      continue;
    }
    let splited = line.split(spacesPattern);
    let updateType = splited[0];

    let fileName;

    if(updateType.length > 1 && renamePattern.test(updateType) === false){
      continue;
    }
    if(updateType.indexOf('R') !== 0){

      fileName = splited[1];


      let log = logs[fileName] || {};

      if(updateType === 'M'){

        if(ignoreFiles[fileName] === true){
          continue;
        }

        ignoreFiles[fileName] = true;
        log.lastModified = date;


      }
      if(updateType === 'A' && !log.create){
        log.create = date;
      }

      if(updateType === 'D'){

        log['delete'] = date;
      }

      logs[fileName] = log;

    }

    else{
      let similarity = parseInt(updateType.replace('R', ''))
      let fromFile = splited[1];
      let toFile = splited[2];
      let fromLog = logs[fromFile] || {};
      fromLog.renameTo = {date:date, file:toFile, similarity:similarity};

      logs[fromFile] = fromLog;
      let toLog = logs[toFile] || {};
      toLog.renameFrom = {date:date, file:fromFile, similarity:similarity}
      if(!toLog.lastModified){
        toLog.lastModified = fromLog.lastModified;
      }
      if(!toLog.create){
        toLog.create = fromLog.create;
      }
      logs[toFile] = toLog;


    }

  }
  return logs;
}

module.exports = tracer;
