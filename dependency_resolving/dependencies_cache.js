exports.id = 'dependency_resolving/dependencies_cache';

const util = require('util')

class DependenciesCache {
    constructor(packagesInfoClient) {
        this.cache = []
        this.packagesInfoClient = packagesInfoClient;
    }
    async get(name, version) {
        // If package info is in cache, return it
        if (name in this.cache && version in this.cache[name]) {
            console.log(util.format("Cache hit - Package %s-%s was found in cache.", name, version))
            return this.cache[name][version]
        }
        // Otherwise, get the package info from the package info client and return it
        console.log(util.format("Cache miss - Retrieving package %s-%s dependencies from npm.", name, version))

        let packageInfo = await this.packagesInfoClient.getPackageInformation(name, version)
        let dependencies = packageInfo['dependencies']
        // TODO: Maybe I need this just because I don't have the package / version not found exception yet?
        if (dependencies === undefined) {
            dependencies = []
        }

        // Update the package dict
        // TODO: There's probably a better way to do it in nodejs (Sort of like defaultdict)
        let packageDict = this.cache[name]
        if (packageDict === undefined) {
            packageDict = []
        }
        packageDict[version] = dependencies
        this.cache[name] = packageDict

        // If version is latest, save the resolved dependencies also with the actual version
        // TODO: Can probably be removed now that I'm sending a specific version. Can keep it if I want to support latest.
        if (version === 'latest') {
            let updatedVersion = packageInfo['version']
            if (updatedVersion === undefined) {
                updatedVersion = version;
            }

            this.cache[name][updatedVersion] = dependencies
        }

        return dependencies
    }
}

module.exports = {
    DependenciesCache: DependenciesCache
}
