enb-modules
===========

Предоставляет технологию `deps-with-modules`.

deps-with-modules
=================

Быстро собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости.
При раскрытии зависимостей, использует и modules.define-декларации.
Сохраняет в виде `?.deps.js`.
Следует использовать с осторожностью: в bem-bl не хватает зависимостей, потому проект может собраться иначе, чем с помощью bem-tools.

**Опции**
* *String* **sourceSuffixes** – Суффиксы исходных файлов, дополняющих deps'ы. По умолчанию — `['vanilla.js', 'js']`.
* *String* **bemdeclTarget** — Исходный bemdecl. По умолчанию — `?.bemdecl.js`.
* *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
* *String* **depsTarget** — Результирующий deps. По умолчанию — `?.deps.js`.

**Пример**

Обычное использование:
```javascript
nodeConfig.addTech(require('enb-modules/techs/deps-with-modules'));
```

Сборка специфического deps:
```javascript
nodeConfig.addTech([ require('enb-modules/techs/deps-with-modules'), {
  bemdeclTarget: 'search.bemdecl.js',
  depsTarget: 'search.deps.js'
} ]);
```

prepend-modules
===============

Добавляет js-код для работы модульной системы

**Опции**
* *String* **source** – Исходный source. Обязательная опция.
* *String* **target** — Результирующий target. По умолчанию — `?.js`.

**Пример**

```javascript
nodeConfig.addTech([ require('enb-modules/techs/prepend-modules'), {
  target: '?.{lang}.js',
  source: '?.{lang}.pre.js'
} ]);
```
