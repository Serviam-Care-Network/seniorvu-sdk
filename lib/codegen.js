const fs = require('fs');
const path = require('path');
const _ = require('lodash');
// const handlebars = require('handlebars');

const file = path.join(__dirname, '..', '/src/swagger.json');
const swagger = JSON.parse(fs.readFileSync(file, 'UTF-8'));

let paths = Object.keys(swagger.paths).map(path => {
  return path.replace(/^\/api\//, '').replace(/\/$/, '').split(/\//);
});

paths = _.flatten(paths).filter(path => !/[{}]/.test(path));
paths = _.uniq(paths);

console.log(paths);

// const tmplFile = path.join(__dirname, '..', '/lib/func.tmpl');
// const tmplSource = fs.readFileSync(tmplFile, 'UTF-8');
// const template = handlebars.compile(tmplSource);

// _.each(swagger.paths, (value, key) => generatePath(value, key));
// const paths = [];

// const modules = _.transform(swagger.paths, (result, opts, p) => {
//   p = p.replace(/^\/api\//, '').replace(/\/$/, '');
//
//   const firstSegment = p.split(/\//)[0];
//   result[firstSegment] = result[firstSegment] || {};
//   result[firstSegment][p] = opts;
// }, {});
//
// _.each(modules, (module, moduleName) => generateModule(module, moduleName));
//
// function generateModule(module, moduleName) {
//   _.each(module, (methods, path) => {
//     _.each(methods, () => {
//
//     });
//   });

// segments = _.transform(segments, (result, segment) => {
//   if (segment[0] === '{' && segment[segment.length - 1] === '}') {
//     lastSegment.params.push(segment.replace(/[{}]/g, ''));
//   } else {
//     lastSegment = {
//       path: segment,
//       params: {},
//     };
//
//     // paths.push(lastSegment);
//   }
// });

// const func = template(opts);

//   const funcFile = path.join('../generated/', func);
//   fs.writeFileSync(funcFile, func);
// }
