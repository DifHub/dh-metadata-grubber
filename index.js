var path = require('path');
var fs = require('fs');
var childProcess = require('child_process');
var args = require('args');
var rimraf = require('rimraf');

args.option('repo', 'Absolute path to local repository with project metadata', '');
args.option('targetDir', 'Relative path to directory where resulting js file should be put', '');
args.option('include', 'Relative path to file describing subset of metadata to be included in result (optional)', '');
args.option('pretty', 'Pretty-print output json (bigger file but human readable)', false);
args.option('json', 'Generate json files instead of metadata.js', false);

var flags = args.parse(process.argv);

if (!flags.repo) {
    throw "Provide path to local metadata repository";
}
if (flags.json && flags.repo == flags.targetDir) {
	throw "Target directory should be different from source directory";
}

var metadataPathFilter = false;

var metadata = {};

function cloneRepo () {
    try {
        childProcess.execSync('git clone --local ' + flags.repo + ' .mdtmp');
		childProcess.execSync('cd .mdtmp && git checkout master && cd ..');
        return true;
    } catch (err) {
        return false;
    }
}

function deleteRepo () {
    try {
        //childProcess.execSync('rm -rf ./.mdtmp');
		rimraf('.mdtmp', (err)=>{
			if (err)
				console.log(err);
		});
        return true;
    } catch (err) {
		console.log(err);
        return false;
    }
}

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

function getFiles(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return !fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

function getFullUri(obj) {
    if (!obj.object)
        return "";
    if (!obj.object.parent) {
        return '/organizations/' + obj.identity.name;
    }

    //console.log('parent',obj.object.parent.name,'parts',parts,'res=',parentUri);

    if (!obj.object.type) {
        //console.log(obj.object);
    }

    return obj.object.parent.name + '/' + obj.object.type + 's/' + obj.identity.name;
}

/**
 * Recursively goes through md project and imports JSON objects
 * @param {string} dir
 * @returns {{}}
 */
function scanDirectory (dir, metapath) {
    // console.log(dir);

    var dirs = getDirectories(dir).filter(function (dirName) {
        return dirName.charAt(0) !== '.';
    });
    var obj = {};

    var files = getFiles(dir).filter(function (fileName) {
        return fileName.indexOf('.json') >= 1;
    });

    for (var j = 0; j < files.length; j++) {
        var f = files[j];
        var objName = f.replace(/.json/, '').replace(/\./g, '_').replace(/-/g, '[v]');

        if (objName.indexOf('[v]') > -1)
            continue;
		
		if (metadataPathFilter && metadataPathFilter.length > 0)
		{
			//console.log("Looking for ", (metapath + '/' + objName).toLowerCase(), " in ", metadataPathFilter);
			var found = false;
			for (var fi = 0; fi < metadataPathFilter.length; fi++)
			{
				if ((metapath + '/' + objName).toLowerCase().indexOf(metadataPathFilter[fi].toLowerCase()) !== -1)
				{
					found = true;
					break;
				}
			}
			if (!found)
				continue;
		}

        obj[objName.toLowerCase()] = require(path.join(dir, f));
		obj[objName.toLowerCase()]._path = getFullUri(obj[objName.toLowerCase()]);
		
		if (flags.json)
		{
			const filePath = path.join((flags.targetDir ? flags.targetDir : ''), obj[objName.toLowerCase()]._path) + '.json';
			fs.mkdirSync(path.dirname(filePath), { recursive: true });
			fs.writeFile(filePath, (flags.pretty !== false ? JSON.stringify(obj[objName.toLowerCase()], null, 2) :JSON.stringify(obj[objName.toLowerCase()])), () => {
				
			});
		}
    }

    if (dirs.length === 0) {
        return obj;
    }

    for (var i = 0; i < dirs.length; i++) {
        var d = dirs[i];

        obj[d.toLowerCase()] = scanDirectory(dir + '/' + d, metapath + '/' + d);
    }

    // console.log(rootObj, typeof rootObj);

    return obj;
}

function findByPath(path) {
    if (!path)
        return null;

    // remove versions from path
    const clearedPath = path.replace(/\/versions\/\d\.\d\.\d/g, '').replace(/:/g,"%");

    let splitPath = clearedPath.split('/').map(el => el.toLowerCase());
    let res;

    while (splitPath.length) {
        var step = splitPath.shift();

        if (!res)
            res = metadata[step];
        else
            res = res[step];
    }

    return res;
}

const metadata_apdax = require('./metadata_apdax.js').metadata;
const metadataApi = require('./metadataApi.js');

console.log("metadata_apdax", metadata_apdax);
console.log("metadataApi", metadataApi);

let metadataApiString = "";
//
let exportsString = "module.exports = {metadata: metadata, findByPath: findByPath, metadata_apdax:metadata_apdax";
for (let item in metadataApi)
{
	console.log("item", item, metadataApi[item]);
	if (typeof(metadataApi[item]) === 'function')
		metadataApiString += "var " + item + " = " + (metadataApi[item].toString()) + "; ";
	else
		metadataApiString += "var " + item + " = " + JSON.stringify(metadataApi[item]) + "; ";
	exportsString += ", " + item + ":" + item;
}
exportsString += "}; ";

if (cloneRepo()) {
    // path to temp repo
    var p = path.join(process.cwd(), '.mdtmp/organizations');

	if (flags.include)
	{
		var include_str = fs.readFileSync(flags.include, "utf-8");
		metadataPathFilter = include_str.split("\n").map(s => s.trim());
	}

    var obj = scanDirectory(p, '');
	
	var outputFilename = path.join((flags.targetDir ? flags.targetDir : ''), 'metadata.js');
	
	if (!flags.json)
		fs.writeFile(
			outputFilename,
			"var metadata_apdax = " + JSON.stringify(metadata_apdax, null, 2) + ";" + 
			"var metadata = " + (flags.pretty !== false ? JSON.stringify(obj, null, 2) :JSON.stringify(obj)) + ";" +
			findByPath.toString() +
			metadataApiString + 
			exportsString,		//"module.exports = {metadata: metadata, findByPath: findByPath};",
			() => {
				console.log("Metadata saved to", outputFilename);
			}
		);
}

deleteRepo();
