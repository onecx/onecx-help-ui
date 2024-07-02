const { ModifyEntryPlugin } = require('@angular-architects/module-federation/src/utils/modify-entry-plugin')
const { share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack')

const config = withModuleFederationPlugin({
  name: 'onecx-help-ui',
  filename: 'remoteEntry.js',
  exposes: {
    './OneCXHelpModule': 'src/bootstrap.ts',
    './OneCXShowHelpComponent': 'src/app/remotes/show-help/show-help.component.ts',
    './OneCXHelpItemEditorComponent': 'src/app/remotes/help-item-editor/help-item-editor.component.ts'
  },
  shared: share({
    '@angular/core': { requiredVersion: 'auto', includeSecondaries: true },
    '@angular/forms': {
      singleton: true,
      requiredVersion: 'auto',
      includeSecondaries: true,
      eager: false
    },
    '@angular/common': {
      singleton: true,
      requiredVersion: 'auto',
      includeSecondaries: {
        skip: ['@angular/common/http/testing']
      }
    },
    '@angular/common/http': {
      singleton: true,
      requiredVersion: 'auto',
      includeSecondaries: true
    },
    '@angular/router': { singleton: true, requiredVersion: 'auto', includeSecondaries: true },
    rxjs: { requiredVersion: 'auto', includeSecondaries: true }
  }),
  sharedMappings: ['@onecx/portal-integration-angular']
})
config.devServer = {
  allowedHosts: 'all'
}

const plugins = config.plugins.filter((plugin) => !(plugin instanceof ModifyEntryPlugin))

module.exports = {
  ...config,
  plugins,
  output: {
    uniqueName: 'onecx-help-ui',
    publicPath: 'auto'
  },
  experiments: {
    ...config.experiments,
    topLevelAwait: true
  },
  optimization: {
    runtimeChunk: false,
    splitChunks: false
  }
}
