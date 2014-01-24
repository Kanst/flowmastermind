
var prefixes = ['б', 'кб', 'Мб', 'Гб', 'Тб', 'Пб'],
    gb = 1024 * 1024 * 1024;


function prefixBytes(bytes) {
    var res = bytes;
    for (var i in prefixes) {
        if (res < 1024) {
            return res.toFixed(2) + ' ' + prefixes[i];
        }
        res = res / 1024;
    }
    return res.toFixed(2) + ' ' + prefixes[prefixes.length - 1];
}

function SortByAlphanum(a, b){
    var aName = a.toLowerCase(),
        bName = b.toLowerCase();
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

function iterItems(obj) {
    var keys = [],
        items = [];
    for (key in obj) {
        keys.push(key);
    }

    keys.sort(SortByAlphanum);

    for (idx in keys) {
        items.push([keys[idx], obj[keys[idx]]]);
    }

    return items;
}

function transpose(source) {

    var result = [],
        length = source[0].length;

    while (length--) {
        result.push([]);
    }

    source.forEach(function (inner) {
        inner.forEach(function (item, index) {
            result[index].push(item);
        });
    });

    return result;
}

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}