
const brain = require('brain.js');
var fs = require('fs');
var path = require('path');
const Entities = require('html-entities').XmlEntities
var striptags = require('striptags');
var removeNewline = require('newline-remove');

const entities = new Entities();
var net = new brain.NeuralNetwork();

function app(files) {
  let data = {};
  files.forEach( (item) => {
    // data[item.filename] = item.contents;
    // console.log('item.filename', item.filename)
    if (item.filename === 'node.json') {
      console.log('file')
      item.contents.data.children.forEach( (child) => {
        const string = decode(child.data.selftext_html);
        if (string) {
          console.log('child: ', string);
          net.train([{input: item.filename, output: string}]);
        }
      });
    }
  });

  var output = net.run('node.json');
  console.log('output', output);
  // OBJECT NOT READABLE

  // console.log(decode(data['dccomics.json'].data.children[0].data.selftext_html));
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
