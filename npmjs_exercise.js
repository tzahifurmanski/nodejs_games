const express = require('express');
const { param, validationResult } = require('express-validator');

const { DependenciesCache } = require('./dependency_resolving/dependencies_cache');
const { DependencyMapper } = require('./dependency_resolving/dependency_mapper');
const { NPMJSClient, PackageNotFound } = require('./dependency_resolving/npmjs_client');

const util = require('util')


const app = express();
const router = express.Router();

const dependencies_resolver_validators = [
  param('name').isLength({ min: 1, max: undefined }),
  param('version').isLength({ min: 3, max: undefined })
]

const cache = new DependenciesCache(new NPMJSClient());
const mapper = new DependencyMapper(cache)

async function dependencies_resolver(req, res) {
  // If there are errors, return them
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let package_name = req.params.name;
  let package_version = req.params.version;

  result = await mapper.get_dependencies_tree_for_package(package_name, package_version);
  if (result.length == 0) {
    res.send(util.format("No dependencies were found for package %s and version %s", package_name, package_version));
  }
  else {
    res.send(JSON.stringify(result));
  }

}


router.get("/package/:name/:version/dependencies", dependencies_resolver, dependencies_resolver);


app.use('/npmjs', router);

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("NPMJS app listening at http://%s:%s", host, port);
});
