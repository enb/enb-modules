module.exports = {
    extractDependencies: function(fileContent) {
        var result = [];
        var modulesDefinition = fileContent.match(
            /modules\.define\([\s\n\r]*['"][^"']+["'][\s\n\r]*,[\s\n\r]*\[([^\]]+)\]/
        );
        if (modulesDefinition) {
            var depList = modulesDefinition[1]
                .split(',')
                .map(function(s) { return s.trim().replace(/^['"]|['"]$/g, ''); });
            depList.forEach(function(dep) {
                var decl = {}, modParts;
                if (~dep.indexOf('__')) {
                    var blockElemParts = dep.split('__');
                    decl.name = blockElemParts[0];
                    var elemParts = blockElemParts[1].split('_');
                    decl.elem = elemParts[0];
                    modParts = elemParts.slice(1);
                } else {
                    var blockParts = dep.split('_');
                    decl.name = blockParts[0];
                    modParts = blockParts.slice(1);
                }
                if (modParts.length) {
                    decl.modName = modParts[0];
                    decl.modVal = modParts[1] || '';
                }
                result.push(decl);
            });
        }
        return result;
    }
};
