var vowFs = require('vow-fs'),
    path = require('path');

module.exports = require('enb/lib/build-flow').create()
    .name('prepend-modules')
    .target('target', '?.js')
    .defineRequiredOption('source')
    .useSourceText('source', '?')
    .needRebuild(function(cache) {
        return cache.needRebuildFile(
            'modules-file',
            this._modulesFile = path.join(__dirname, '..', 'node_modules', 'ym', 'modules.js'));
    })
    .saveCache(function(cache) {
        cache.cacheFileInfo('modules-file', this._modulesFile);
    })
    .builder(function(preTargetSource) {
        return vowFs.read(this._modulesFile, 'utf8').then(function(modulesRes) {
            return modulesRes + preTargetSource;
        });
    })
    .createTech();