const { metadata, findByPath } = require('./example_metadata.js');
const { metadata_apdax } = require('./metadata_apdax.js');


const defaultLocale = 'en-us';
exports.defaultLocale = defaultLocale;

exports.changeLang = function (newLocale) {
  localStorage.locale = newLocale;
}

/**
 * Non case sensitive string compare
 * @param {String} str1
 * @param {String} str2
 */
const nonCSCompare = function (str1, str2) {
  if (!str1 && !str2) {
    // This is two empty strings case, we consider it equal
    return true;
  } else if ( (str1 && !(typeof str1 === 'string')) || (str2  && !(typeof str2 === 'string'))) {
    // We compare null or different types
    console.warn("nonCSCompare one of arguments is falsy", str1, str2);
    return false;
  } else if (!str1 || !str2) {
      // We are compare null with string
      return false;
  } else {
    // Let's compare strings
    return str1.toLowerCase() === str2.toLowerCase();
  }
}
exports.nonCSCompare = nonCSCompare;

/**
 * Get value from object by path
 * @param object - this is actual object to navigate
 * @param path - this is path in format a.b.c[0].d
 * @returns - object found in the location.
 */
exports.deepGet = function (object, path) {
  try {
    const elements = path.charAt(0) === '/' ? path.substring(1).replace(/\[/g,"/").replace(/\]/g,'').split('/')
                                            : path.replace(/\[/g,".").replace(/\]/g,'').split('.');
    
    return elements.reduce(function (obj, property) {return obj[property];}, object);
  } catch (err) {
    return undefined;
  }   
}

/**
 * Set value into object by path
 * @param o - this is actual object to navigate
 * @param path - this is path in format a.b.c[0].d
 * @param value - this is value to set
 * @returns - object new state.
 */
exports.deepSet = function (object, path, value) {
  try {
    const elements = path.charAt(0) === '/' ? path.substring(1).replace(/\[/g,"/[").replace(/\]/g,'').split('/')
                                            : path.replace(/\[/g,".[").replace(/\]/g,'').split('.');

    let prev_obj = object;
    let prev_name = undefined;

    for (var element of elements) {
      let isArray = element.charAt(0) === '[';
      let name = isArray ? element.substring(1) : element; 

      if (prev_name !== undefined) {
        // Parent object undefined.
        if (prev_obj[prev_name] === undefined || prev_obj[prev_name] === null) {
          prev_obj[prev_name] = isArray ? [] : {};
        }
        prev_obj = prev_obj[prev_name];
      } 
      prev_name = name; 
    }

    if (prev_name === undefined) {
      // Current object can change value 
      prev_obj = value;
    } else {
      // Previous object can change value 
      prev_obj[prev_name] = value;
    }    
    return object;
  } catch (err) {
    return undefined;
  }
}

/**
 * Copy object by all levels of the object
 * @param o - this is actual object to copy
 * @returns - complete copy of the object.
 */
exports.deepCopy = function (o, nonEmpty = false) {
  var copy = o, k;
  if (o && typeof o === 'object') {
    copy = Object.prototype.toString.call(o) === '[object Array]' ? [] : {};
    for (k in o) {
      if( !nonEmpty || ( o[k] !== null && Object.keys(o[k]).length !== 0 ) ) {
        copy[k] = deepCopy(o[k], nonEmpty);
      }
    }
  }
  return copy;
}

/**
 * Merge object properties into existing object.
 * @param b - object to merge data into
 * @param o - object to copy data from
 * @returns - complete merge of base object with source object.
 */
exports.deepMerge = function (b, o) {
  var copy = {}, k;
  
  // Merge of two arrays complex. For now we add one to another
  if ((b && Object.prototype.toString.call(b) === '[object Array]') ||
      (o && Object.prototype.toString.call(o) === '[object Array]' )) {
    return (b ? b : []).concat(o ? o : []);
  }

  if (b !== 'undefined' && b !== null ) { 
    if (typeof b === 'object') {
      for (k in b) {
        if (o && (o[k] !== undefined && o[k] !== null)) {
          // We have this property in source.
          if (typeof o[k] === 'object') {
            copy[k] = deepMerge(b[k], o[k]);
          } else {
            copy[k] = (o[k]) ? o[k] : deepCopy(b[k]);
          }
        } else {
          copy[k] = deepCopy(b[k]);
        }
      }
    } else {
      if (o) {
        copy = deepCopy(o);
      } else {
        copy = b;
      }
    }
  }

  if (o) { 
    if (typeof o === 'object') {
      for (k in o) {
        if (b && (b[k] !== undefined && b[k] !== null)) {
          // This case must be already processed in b branch.
        } else {
          copy[k] = deepCopy(o[k]);
        }
      }
    } else {
      if (b !== undefined && b !== null) {
        // This case must be already processed in b branch.
      } else {
        copy = o;
      }
    }
  }
  return copy;
}


/**
 * Find locale id by locale code. Use enumerator of locales from organization.
 * @param {string} localeCode - code of locale w need id for
 * @returns {string} locale code.
 */
 
function localeIdByCode(localeCode)
{
	const locales = datasetToObjectArray(metadata_apdax.metadata.apdax.systems.difhub.applications.organization.datasets.locale);
	let ret = locales.reduce((found, cur) => cur["Locale Code"] === localeCode ? cur["Locale id"] : found, false);
	return ret;
}


/**
 * Return Dataset metadata by path of the dataset
 * @param {string} path to the object
 * @returns {object} object metadata, or null
 */
const getDatasetMetadata = (path) => {
  try 
  {
    if (!path) return null;
    const dspath = path.replace(/:/g,"%");

    let ds = findByPath(dspath);
    if (!ds || ds.object.type.toLowerCase() !== 'dataset') return null;

    return ds;
  }
  catch (e) {
    console.warn("Error in getDatasetMetadata: " + path);
  }
  return null;
};
exports.getDatasetMetadata = getDatasetMetadata;

/**
 * Return veiw metadata by path of the view
 * @param {string} path to the object
 * @returns {object} object metadata, or null
 */
exports.getViewMetadata = (path) => {
  try 
  {
    if (!path) return null;
    const vipath = path.replace(/:/g,"%");

    let view = findByPath(vipath);
    if (!view || view.object.type.toLowerCase() !== 'view') return null;

    return view;
  }
  catch (e) {
    console.warn("Error in getViewMetadata: " + path);
  }
  return null;
};

/**
 * Return field of the dataset
 * @param {object} dataset - metadata for dataset
 * @param {string} path - this is path in format a.b.c[0].d or /a/b/c[0]/d
 * @returns {object} object - metadata for field of the dataset or null 
 */
exports.getFieldMetadata = (dataset, path) => {
  try 
  {
    if (!dataset || !path || dataset.object.type.toLowerCase() !== 'dataset') return null;

    const elements = path.charAt(0) === '/' ? path.substring(1).replace(/\[.*?\]/g,"").split('/')
                                            : path.replace(/\[.*?\]/g,"").split('.');

    let ds = dataset;

    // Iterate path and find field we looking for.
    for (var i = 0; i < elements.length; i++) {
      let field = ds.structure.fields.find(f => nonCSCompare(f.identity.name, elements[i]));
      if (i + 1 === elements.length ) {
        return field;
      } else if (!field || field.type.toLowerCase() !== 'structure') {
        return null;
      } else {
        ds = getDatasetMetadata(field.reference);
        if (!ds) return null
      }
    }
  }
  catch (e) {
    console.warn("Error in getFieldMetadata: " + path, dataset);
  }
  return null;
};

/**
 * Return element of the view
 * @param {object} view - metadata for view
 * @param {string} element - name of the element
 * @param {string} locale - locale in which return element data. When not specified use view default.
 * @returns {object} object - metadata for element of the view
 */
exports.getElementMetadata = (view, element, locale) => {
  try 
  {
    if (!view || !element || view.object.type.toLowerCase() !== 'view') return null;

    // Base locale of the view and locale for requested element 
    let view_locale = (view.locale) ? view.locale : defaultLocale; 
    let data_locale = (locale) ? locale : localStorage.locale || defaultLocale; 

    // Definision of requested locale and base definision
    let data_definision = view.definitions.find(def => (def.locale === data_locale || data_locale === localeIdByCode(def.locale)));
    let base_definision = (view_locale === data_locale) ? null :   
      view.definitions.find(def => (def.locale === view_locale || view_locale === localeIdByCode(def.locale)));

    // Element by name from base and locale definision. 
    let data_element = (!data_definision) ? null : data_definision.elements.find(elem => nonCSCompare(elem.identity.name, element));
    let base_element = (!base_definision) ? null : base_definision.elements.find(elem => nonCSCompare(elem.identity.name, element));

    if (!data_element && !base_element) {
      // We don't find element with provided name.
      return null;
    } else if (data_element && !base_element) {
      // We have element only for requested locale.
      return data_element;
    } else if (!data_element && base_element) {
      // We have element only for view default locale.
      return base_element;
    } else {
      // We have both elements and need to merge it.
      return deepMerge(base_element, data_element);
    }
  }
  catch (e) {
    console.warn("Error in getElementMetadata: " + element + 'for locale:' + locale, view, e);
  }
  return null;
};

/**
 * Return label from element of the view
 * @param {object} element - metadata for element
 * @returns {string} label text
 */
exports.getElementLabel = (element) => {
  return !element || !element.text ? '' : element.text;
};

/**
 * Return property from element of the view
 * @param {object} element - metadata for element
 * @param {string} name of the property
 * @returns {string} property value
 */
exports.getElementProperty = (element, name) => {
  if (!element || !element.properties)
    return '';

  let property = element.properties.find(prop => nonCSCompare(prop.identity.name, name));
  if (!property) 
    return '';

  return property.value; 
};


/**
 * Return array of data records from dataset with data
 * @param {object} dataset - metadata for dataset
 * @param {string} locale - locale in which to return record when translations exist in records. When not specified use one from local store.
 * @param {string} usage - return value by unique usage without translations
 * @returns {array} array of records
 */
exports.getDatasetData = (dataset, locale, usage) => {
  if (!dataset) return [];
  if (!locale) {
    locale = localStorage.locale || defaultLocale;  
  }

  let sorted = dataset.data.records.slice();
  sorted.sort((a, b) => a.index > b.index ? 1 : (a.index < b.index ? -1 : 0));

  let ret = sorted.map(row => {
    let obj = {};
    if (locale) { 
      let indexTranslations = dataset.structure.fields.findIndex((field) => nonCSCompare(field.identity.name, 'translations') || nonCSCompare(field.usage, 'translations')); 
      let translation = (indexTranslations < 0 || !row.values[indexTranslations]) ? null : JSON.parse(row.values[indexTranslations]).find((tr) => nonCSCompare(locale, tr.Locale)); 
      dataset.structure.fields.map((field, index) => {
        if (index != indexTranslations) {
          if (usage) {
            if (!obj[field.identity.name] && !nonCSCompare(field.usage, 'translations')) obj[field.usage] = translation && translation[field.usage] ? translation[field.usage] : row.values[index];
          } else {
            obj[field.identity.name] = translation && translation[field.usage] ? translation[field.usage] : row.values[index];
          }
        }
      });
    } else {
      dataset.structure.fields.map((field, index) => {
        if (usage) {
          if (!obj[field.identity.name] && !nonCSCompare(field.usage, 'translations')) obj[field.usage] = row.values[index];
        } else {
          obj[field.identity.name] = row.values[index];
        }
      });
    }
    return obj;
  });
  return ret;
};

/**
 * Return array of options for enumerator
 * @param {object} field - field we are looking for options from
 * @param {string} locale - locale in which to return options if translation exist.
 * @returns {array} array of enumerator options
 */
exports.getEnumOptions = (field, locale) => {
  if (!field || !nonCSCompare(field.type,'Enum') || !field.reference)  return [];

  const dataset = getDatasetMetadata(field.reference);
  if (!dataset) return [];
    
  return getDatasetData(dataset, locale, true);
};












