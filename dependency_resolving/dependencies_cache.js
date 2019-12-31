exports.id = 'dependency_resolving/dependencies_cache';

const util = require('util')

class DependenciesCache {
    constructor(packages_info_client) {
        this.cache = []
        this.packages_info_client = packages_info_client;
    }
    async get(name, version) {
        // If package info is in cache, return it
        if (name in this.cache && version in this.cache[name]) {
            console.log(util.format("Cache hit - Package %s-%s was found in cache.", name, version))
            return this.cache[name][version]
        }
        // Otherwise, get the package info from the package info client and return it
        console.log(util.format("Cache miss - Retrieving package %s-%s dependencies from npm.", name, version))

        let package_info = await this.packages_info_client.get_package_information(name, version)
        let dependencies = package_info['dependencies']
        // TODO: Maybe I need this just because I don't have the package / version not found exception yet?
        if (dependencies === undefined) {
            dependencies = []
        }

        // Update the package dict
        // TODO: There's probably a better way to do it in nodejs (Sort of like defaultdict)
        let package_dict = this.cache[name]
        if (package_dict === undefined) {
            package_dict = []
        }
        package_dict[version] = dependencies
        this.cache[name] = package_dict

        // If version is latest, save the resolved dependencies also with the actual version
        // TODO: Can probably be removed now that I'm sending a specific version. Can keep it if I want to support latest.
        if (version === 'latest') {
            let updated_version = package_info['version']
            if (updated_version === undefined) {
                updated_version = version;
            }

            this.cache[name][updated_version] = dependencies
        }

        return dependencies
    }
}

module.exports = {
    DependenciesCache: DependenciesCache
}
