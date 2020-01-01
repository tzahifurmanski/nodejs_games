exports.id = 'dependency_resolving/dependency_mapper';

const util = require('util')


class DependencyMapper {
    SUMMARY_LOG_MESSAGE = "Dependencies tree for package %s-%s retrieved.%s dependencies were found."
    constructor(cache) {
        this.cache = cache;
    }
    __createPackageDict(name, version) {
        return {
            'name': name,
            'version': version
        }
    }
    __getExplicitVersion(packageVersion) {
        /* TODO: Better handle semantic versioning and conditions - ^, ~, ||.
        #  and things like:
        #  {
            #       "name": "safer-buffer",
            #       "version": ">= 2.1.2 < 3"
            #
        }
        #  For now I'm only extracting the first version number I find */
        let version = packageVersion.replace('~', '').replace('^', '')

        // Remove leading and trailing regex
        return version.replace(/^(>|<|=| |\.|\||&)|(>|<|=| |\.|\||&)$/g, '').split(' ')[0];
    }

    async getDependenciesTreeForPackage(name, version) {
        console.log(util.format("Retrieving dependencies tree for package %s-%s...", name, version));

        let dependenciesQueue = []
        let totalNumOfDependencies = 0

        let rootPackage = this.__createPackageDict(name, this.__getExplicitVersion(version))
        dependenciesQueue.push(rootPackage)

        while (dependenciesQueue.length > 0) {
            let currPackage = dependenciesQueue.pop()
            let packageDependencies = await this.cache.get(currPackage['name'], currPackage['version'])

            let subDependencies = []

            for (const [dependencyName, dependencyVersion] of Object.entries(packageDependencies)) {
                let actualVersion = this.__getExplicitVersion(dependencyVersion);

                let child = this.__createPackageDict(dependencyName, actualVersion);
                dependenciesQueue.push(child);
                subDependencies.push(child);
            }

            // If the package has dependencies, add them to the package object
            if (subDependencies.length > 0) {
                currPackage['dependencies'] = subDependencies
                totalNumOfDependencies += subDependencies.length
            }
        }

        console.log(util.format(this.SUMMARY_LOG_MESSAGE, name, version, totalNumOfDependencies))

        // Return just the dependencies, or an empty list
        let dependenciesTree = rootPackage['dependencies']
        if (dependenciesTree === undefined) {
            dependenciesTree = []
        }
        return dependenciesTree
    }
}

module.exports = {
    DependencyMapper: DependencyMapper
}
