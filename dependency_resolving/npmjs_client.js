exports.id = 'dependency_resolving/npmjs_client';

const request = require('request');
const util = require('util');


class NPMJSClient {
    PACKAGE_INFO_URL = "https://registry.npmjs.org/%s/%s"

    getPackageInformation(name, version) {
        return new Promise((resolve, reject) => {
            console.log(util.format("Querying NPMJS for information on package %s-%s...", name, version));
            let url = util.format(this.PACKAGE_INFO_URL, name, version)

            request.get(url, { json: true }, function (err, res, body) {
                if (err) {
                    reject(err);
                }

                let responseText = body
                // TODO: response_text can return as json object if the request is good or 
                // as string if the request is bad - so if it's a good request, includes will not work.
                // Need to fix that
                // if (response_text.includes('package not found')) {
                //     // TODO: Maybe reject(new PackageNotFound())
                //     throw new PackageNotFound()
                // }

                console.log(util.format("Done querying NPMJS for information on package %s-%s.", name, version))

                resolve(responseText)
            });
        })

        // TODO: I assume that only root packages can be missing. If not, need to handle that
        // TODO: Need to handle a scenario where a the package exist but a specific version is not found
        //  and 'version not found' is returned
    }
}


module.exports = {
    NPMJSClient: NPMJSClient
}
