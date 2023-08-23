const {
    override,
    removeModuleScopePlugin,
    addExternalBabelPlugins
} = require('customize-cra');
const rewireYAML = require('react-app-rewire-yaml');


function overrides(config, env) {
    config = rewireYAML(config, env);
    return config;
}

module.exports = override(
    overrides,
    removeModuleScopePlugin(),
    ...addExternalBabelPlugins(
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator'
    )
);
