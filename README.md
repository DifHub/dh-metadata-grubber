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

```
Options:
     
       -h, --help       Output usage information
       -r, --repo       Absolute path to local repository with project metadata (defaults to "")
       -t, --targetDir  Relative path to directory where resulting js file should be put (defaults to "")
	   -i, --include	Relative path to file describing subset of metadata to be included in result (optional) (defaults to "")
	   -p, --pretty		Pretty-print output file (by default it is minified)
	   -j, --json		Produce json files in target directory instead ot metadata.js file (defaults to false)
```

Format of include file:
Each line of the file is partial path that will be included. For example if the file has two lines:

>/TestOrg/systems/TestSystem/applications/App1

>/TestOrg/systems/System2

Resulting file will contain only objects from App1 and System2 of TestOrg