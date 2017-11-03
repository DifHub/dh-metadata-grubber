# dh-metadata-grubber
This is alpha version of npm-module that grubs selected metadata from DifHub project and compiles it to js module

## Installation
```npm install --save git://github.com/DifHub/dh-metadata-grubber```

## Usage
Alpha version of this module works only with local repositories. So you have to clone metadata repository to your local 
machine.

To use module run this command:
```node node_modules/dh-metadata-grubber/index.js -r [path to local metadata repository]```

This will create `metadata.js` file which exports compiled object tree of metadata project.
To get access to some object you can just take it as object property (ex. `org.sys.myApp`) or
by calling exported function `findByPath` which takes path in form `organizations/Org/systems/Sys`
and returns object.
