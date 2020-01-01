const express = require('express');
const { param, validationResult } = require('express-validator');

const { DependenciesCache } = require('./dependency_resolving/dependencies_cache');
const { DependencyMapper } = require('./dependency_resolving/dependency_mapper');
const { NPMJSClient } = require('./dependency_resolving/npmjs_client');

const util = require('util')

const app = express();
const router = express.Router();

const dependenciesResolverValidators = [
  param('name').isLength({ min: 1, max: undefined }),
  param('version').isLength({ min: 3, max: undefined })
]

const cache = new DependenciesCache(new NPMJSClient());
const mapper = new DependencyMapper(cache)

async function dependenciesResolver(req, res) {
  try {
    // If there are errors, return them
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let packageName = req.params.name;
    let packageVersion = req.params.version;

    result = await mapper.getDependenciesTreeForPackage(packageName, packageVersion);
    if (result.length == 0) {
      res.send(util.format("No dependencies were found for package %s and version %s", packageName, packageVersion));
    }
    else {
      res.send(JSON.stringify(result));
    }
  }
  catch (err) {
    // TODO: What's the right thing to return to the user in case of a generic error?
    return res.status(500).send({ errors: err.message });
  }

}


router.get("/package/:name/:version/dependencies", dependenciesResolver, dependenciesResolverValidators);


app.use('/npmjs', router);

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("NPMJS app listening at http://%s:%s", host, port);
});
