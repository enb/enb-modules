/**
 * prepend-modules
 * =================
 *
 * Добавляет js-код для работы модульной системы
 *
 * **Опции**
 *
 * * *String* **source** – Исходный source. Обязательная опция.
 * * *String* **target** — Результирующий target. По умолчанию — `?.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb-modules/techs/prepend-modules'), {
 *   target: '?.{lang}.js',
 *   source: '?.{lang}.pre.js'
 * } ]);
 * ```
 */

var vowFs = require('enb/lib/fs/async-fs'),
    path = require('path');

module.exports = require('enb/lib/build-flow').create()
    .name('prepend-modules')
    .target('target', '?.js')
    .defineRequiredOption('source')
    .useSourceText('source', '?')
    .needRebuild(function(cache) {
        return cache.needRebuildFile(
            'modules-file',
            this._modulesFile = path.join(__dirname, '..', '..', 'ym', 'modules.js'));
    })
    .saveCache(function(cache) {
        cache.cacheFileInfo('modules-file', this._modulesFile);
    })
    .builder(function(preTargetSource) {
        return vowFs.read(this._modulesFile, 'utf8').then(function(modulesRes) {
            return modulesRes + preTargetSource;
        }, function () {
            throw new Error('Module system was not found. Please install `ym` npm module: npm install ym');
        });
    })
    .createTech();
