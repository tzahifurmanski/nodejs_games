exports.id = 'dependency_resolving/dependency_mapper';

const util = require('util')


class DependencyMapper {
    SUMMARY_LOG_MESSAGE = "Dependencies tree for package %s-%s retrieved.%s dependencies were found."
    constructor(cache) {
        this.cache = cache;
    }
    _create_package_dict(name, version) {
        return {
            'name': name,
            'version': version
        }
    }
    _get_explicit_version(package_version) {
        /* TODO: Better handle semantic versioning and conditions - ^, ~, ||.
        #  and things like:
        #  {
            #       "name": "safer-buffer",
            #       "version": ">= 2.1.2 < 3"
            #
        }
        #  For now I'm only extracting the first version number I find */
        let version = package_version.replace('~', '').replace('^', '')

        // Remove leading and trailing regex
        return version.replace(/^(>|<|=| |\.|\||&)|(>|<|=| |\.|\||&)$/g, '').split(' ')[0];
    }

    async get_dependencies_tree_for_package(name, version) {
        console.log(util.format("Retrieving dependencies tree for package %s-%s...", name, version));

        let dependencies_queue = []
        let total_num_of_dependencies = 0

        let root_package = this._create_package_dict(name, this._get_explicit_version(version))
        dependencies_queue.push(root_package)

        while (dependencies_queue.length > 0) {
            let curr_package = dependencies_queue.pop()
            let package_dependencies = await this.cache.get(curr_package['name'], curr_package['version'])

            let sub_dependencies = []

            for (const [dep_name, dep_version] of Object.entries(package_dependencies)) {
                let actual_version = this._get_explicit_version(dep_version);

                let child = this._create_package_dict(dep_name, actual_version);
                dependencies_queue.push(child);
                sub_dependencies.push(child);
            }

            // If the package has dependencies, add them to the package object
            if (sub_dependencies.length > 0) {
                curr_package['dependencies'] = sub_dependencies
                total_num_of_dependencies += sub_dependencies.length
            }
        }

        console.log(util.format(this.SUMMARY_LOG_MESSAGE, name, version, total_num_of_dependencies))

        // Return just the dependencies, or an empty list
        let dependencies_tree = root_package['dependencies']
        if (dependencies_tree === undefined) {
            dependencies_tree = []
        }
        return dependencies_tree
    }
}

module.exports = {
    DependencyMapper: DependencyMapper
}
