/**
 * deps-with-modules
 * =================
 *
 * Быстро собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости.
 * При раскрытии зависимостей, использует и modules.define-декларации.
 * Сохраняет в виде `?.deps.js`.
 * Следует использовать с осторожностью: в bem-bl не хватает зависимостей, потому проект может собраться иначе, чем с помощью bem-tools.
 *
 * **Опции**
 * * *String* **sourceSuffixes** – Суффиксы исходных файлов, дополняющих deps'ы. По умолчанию — `['vanilla.js', 'js']`.
 * * *String* **bemdeclTarget** — Исходный bemdecl. По умолчанию — `?.bemdecl.js`.
 * * *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
 * * *String* **depsTarget** — Результирующий deps. По умолчанию — `?.deps.js`.
 *
 * **Пример**
 *
 * Обычное использование:
 * ```javascript
 * nodeConfig.addTech(require('enb-modules/techs/deps-with-modules'));
 * ```
 *
 * Сборка специфического deps:
 * ```javascript
 * nodeConfig.addTech([ require('enb-modules/techs/deps-with-modules'), {
 *   bemdeclTarget: 'search.bemdecl.js',
 *   depsTarget: 'search.deps.js'
 * } ]);
 * ```
 */
var Vow = require('vow'),
    fs = require('graceful-fs'),
    vm = require('vm'),
    vowFs = require('vow-fs'),
    DepsResolver = require('enb/lib/deps/deps-resolver'),
    inherit = require('inherit'),
    modules = require('../lib/modules');

module.exports = inherit(require('enb/lib/tech/base-tech'), {

    getName: function() {
        return 'deps-with-modules';
    },

    configure: function() {
        this._sourceSuffixes = this.getOption('sourceSuffixes', ['vanilla.js', 'js']);
        this._target = this.node.unmaskTargetName(
            this.getOption('depsTarget', this.node.getTargetName('deps.js')));
        this._bemdeclTarget = this.node.unmaskTargetName(
            this.getOption('bemdeclTarget', this.node.getTargetName('bemdecl.js')));
        this._levelsTarget = this.node.unmaskTargetName(
            this.getOption('levelsTarget', this.node.getTargetName('levels')));
    },

    getTargets: function() {
        return [this._target];
    },

    build: function() {
        var _this = this,
            depsTarget = this._target,
            depsTargetPath = this.node.resolvePath(depsTarget),
            cache = this.node.getNodeCache(depsTarget),
            bemdeclSource = this._bemdeclTarget,
            bemdeclSourcePath = this.node.resolvePath(bemdeclSource);
        return this.node.requireSources([this._levelsTarget, bemdeclSource]).spread(function(levels) {
            var depFiles = levels.getFilesBySuffix('deps.js');
            _this._sourceSuffixes.forEach(function(suffix) {
                depFiles = depFiles.concat(levels.getFilesBySuffix(suffix));
            });
            if (cache.needRebuildFile('deps-file', depsTargetPath)
                    || cache.needRebuildFile('bemdecl-file', bemdeclSourcePath)
                    || cache.needRebuildFileList('deps-file-list', depFiles)) {
                delete require.cache[bemdeclSourcePath];
                var bemdecl = require(bemdeclSourcePath),
                    dep = new ModulesDepsResolver(levels, _this._sourceSuffixes);

                bemdecl.blocks && bemdecl.blocks.forEach(function(block) {
                    dep.addBlock(block.name);
                    if (block.mods) {
                        block.mods.forEach(function(mod) {
                            if (mod.vals) {
                                mod.vals.forEach(function(val) {
                                    dep.addBlock(block.name, mod.name, val.name);
                                });
                            }
                        });
                    }
                    if (block.elems) {
                        block.elems.forEach(function(elem){
                            dep.addElem(block.name, elem.name);
                            if (elem.mods) {
                                elem.mods.forEach(function(mod) {
                                    if (mod.vals) {
                                        mod.vals.forEach(function(val) {
                                            dep.addElem(block.name, elem.name, mod.name, val.name);
                                        });
                                    }
                                });
                            }
                        });
                    }
                });

                bemdecl.deps && dep.normalizeDeps(bemdecl.deps).forEach(function(decl) {
                    dep.addDecl(decl);
                });

                var resolvedDeps = dep.resolve();
                return vowFs.write(depsTargetPath, 'exports.deps = ' + JSON.stringify(resolvedDeps, null, 4) + ';', 'utf8').then(function() {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    cache.cacheFileInfo('bemdecl-file', bemdeclSourcePath);
                    cache.cacheFileList('deps-file-list', depFiles);
                    _this.node.resolveTarget(depsTarget, resolvedDeps);
                });
            } else {
                _this.node.getLogger().isValid(depsTarget);
                delete require.cache[depsTargetPath];
                _this.node.resolveTarget(depsTarget, require(depsTargetPath).deps);
                return null;
            }
        });
    }
});

var ModulesDepsResolver = inherit(DepsResolver, {
    __constructor: function(levels, suffixes) {
        this.__base(levels);
        var suffixesIndex = {};
        suffixes.forEach(function(suffix) {
            suffixesIndex[suffix] = true;
        });
        this._suffixesIndex = suffixesIndex;
    },
    getDeps: function(decl) {
        var result = this.__base(decl), files, suffixesIndex = this._suffixesIndex;
        if (decl.elem) {
            files = this.levels.getElemFiles(decl.name, decl.elem, decl.modName, decl.modVal);
        } else {
            files = this.levels.getBlockFiles(decl.name, decl.modName, decl.modVal);
        }
        files = files.filter(function(file) {
            return !!suffixesIndex[file.suffix];
        });
        var shouldDepsIndex = {};
        result.shouldDeps.forEach(function(decl) {
            shouldDepsIndex[declKey(decl)] = true;
        });
        files.forEach(function(file) {
            var fileContent = fs.readFileSync(file.fullname, 'utf-8');
            var extractedDeps = modules.extractDependencies(fileContent);
            extractedDeps.forEach(function(decl) {
                var key = declKey(decl);
                if (!shouldDepsIndex[key]) {
                    shouldDepsIndex[key] = true;
                    result.shouldDeps.push(decl);
                }
            });
        });
        return result;
    }
});

function declKey(decl) {
   return decl.name + (decl.elem ? '__' + decl.elem : '')
       + (decl.modName ? '_' + decl.modName + (decl.modVal ? '_' + decl.modVal : '') : '');
}
