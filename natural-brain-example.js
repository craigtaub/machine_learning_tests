
var fs = require('fs');
var path = require('path');
const Entities = require('html-entities').XmlEntities
var striptags = require('striptags');
var removeNewline = require('newline-remove');
var BrainJSClassifier = require('natural-brain');

const entities = new Entities();
var classifier = new BrainJSClassifier();
 
function app(files) {
  let data = {};
  files.forEach( (item) => {
    if (item.filename === 'webdev.json' || 
        item.filename === 'philosophy.json') {

      console.log('file', item.filename)
      item.contents.data.children.forEach( (child) => {
        const string = decode(child.data.selftext_html);
        if (string) {
          console.log('child: ');//, string);
          classifier.addDocument(string, item.filename);
        }
      });
    }
  });

  classifier.train();
  const output1 = classifier.classify('i love this browser');
  const output2 = classifier.classify('conciousness is the marrow of life');
  console.log('output', output1, output2);
}

function decode(string) {
  return striptags(removeNewline(entities.decode(string)));
}

function promiseAllP(items, block) {
  var promises = [];
  items.forEach(function(item,index) {
      promises.push( function(item,i) {
          return new Promise(function(resolve, reject) {
              return block.apply(this,[item,index,resolve,reject]);
          });
      }(item,index))
  });
  return Promise.all(promises);
}

function readFiles(dirname) {
  return new Promise((resolve, reject) => {
      fs.readdir(dirname, function(err, filenames) {
          if (err) return reject(err);
          promiseAllP(filenames,
          (filename,index,resolve,reject) =>  {
              fs.readFile(path.resolve(dirname, filename), 'utf-8', function(err, content) {
                  if (err) return reject(err);
                  return resolve({filename: filename, contents: JSON.parse(content)});
              });
          })
          .then(results => {
              return resolve(results);
          })
          .catch(error => {
              return reject(error);
          });
      });
  });
}

let data;
readFiles('./subreddits')
.then(app)
.catch( error => {
    console.log( error );
});
