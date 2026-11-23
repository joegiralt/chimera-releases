(function(scope){
'use strict';

function F(arity, fun, wrapper) {
  wrapper.a = arity;
  wrapper.f = fun;
  return wrapper;
}

function F2(fun) {
  return F(2, fun, function(a) { return function(b) { return fun(a,b); }; })
}
function F3(fun) {
  return F(3, fun, function(a) {
    return function(b) { return function(c) { return fun(a, b, c); }; };
  });
}
function F4(fun) {
  return F(4, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return fun(a, b, c, d); }; }; };
  });
}
function F5(fun) {
  return F(5, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return fun(a, b, c, d, e); }; }; }; };
  });
}
function F6(fun) {
  return F(6, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return fun(a, b, c, d, e, f); }; }; }; }; };
  });
}
function F7(fun) {
  return F(7, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return fun(a, b, c, d, e, f, g); }; }; }; }; }; };
  });
}
function F8(fun) {
  return F(8, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) {
    return fun(a, b, c, d, e, f, g, h); }; }; }; }; }; }; };
  });
}
function F9(fun) {
  return F(9, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) { return function(i) {
    return fun(a, b, c, d, e, f, g, h, i); }; }; }; }; }; }; }; };
  });
}

function A2(fun, a, b) {
  return fun.a === 2 ? fun.f(a, b) : fun(a)(b);
}
function A3(fun, a, b, c) {
  return fun.a === 3 ? fun.f(a, b, c) : fun(a)(b)(c);
}
function A4(fun, a, b, c, d) {
  return fun.a === 4 ? fun.f(a, b, c, d) : fun(a)(b)(c)(d);
}
function A5(fun, a, b, c, d, e) {
  return fun.a === 5 ? fun.f(a, b, c, d, e) : fun(a)(b)(c)(d)(e);
}
function A6(fun, a, b, c, d, e, f) {
  return fun.a === 6 ? fun.f(a, b, c, d, e, f) : fun(a)(b)(c)(d)(e)(f);
}
function A7(fun, a, b, c, d, e, f, g) {
  return fun.a === 7 ? fun.f(a, b, c, d, e, f, g) : fun(a)(b)(c)(d)(e)(f)(g);
}
function A8(fun, a, b, c, d, e, f, g, h) {
  return fun.a === 8 ? fun.f(a, b, c, d, e, f, g, h) : fun(a)(b)(c)(d)(e)(f)(g)(h);
}
function A9(fun, a, b, c, d, e, f, g, h, i) {
  return fun.a === 9 ? fun.f(a, b, c, d, e, f, g, h, i) : fun(a)(b)(c)(d)(e)(f)(g)(h)(i);
}




var _JsArray_empty = [];

function _JsArray_singleton(value)
{
    return [value];
}

function _JsArray_length(array)
{
    return array.length;
}

var _JsArray_initialize = F3(function(size, offset, func)
{
    var result = new Array(size);

    for (var i = 0; i < size; i++)
    {
        result[i] = func(offset + i);
    }

    return result;
});

var _JsArray_initializeFromList = F2(function (max, ls)
{
    var result = new Array(max);

    for (var i = 0; i < max && ls.b; i++)
    {
        result[i] = ls.a;
        ls = ls.b;
    }

    result.length = i;
    return _Utils_Tuple2(result, ls);
});

var _JsArray_unsafeGet = F2(function(index, array)
{
    return array[index];
});

var _JsArray_unsafeSet = F3(function(index, value, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[index] = value;
    return result;
});

var _JsArray_push = F2(function(value, array)
{
    var length = array.length;
    var result = new Array(length + 1);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[length] = value;
    return result;
});

var _JsArray_foldl = F3(function(func, acc, array)
{
    var length = array.length;

    for (var i = 0; i < length; i++)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_foldr = F3(function(func, acc, array)
{
    for (var i = array.length - 1; i >= 0; i--)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_map = F2(function(func, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = func(array[i]);
    }

    return result;
});

var _JsArray_indexedMap = F3(function(func, offset, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = A2(func, offset + i, array[i]);
    }

    return result;
});

var _JsArray_slice = F3(function(from, to, array)
{
    return array.slice(from, to);
});

var _JsArray_appendN = F3(function(n, dest, source)
{
    var destLen = dest.length;
    var itemsToCopy = n - destLen;

    if (itemsToCopy > source.length)
    {
        itemsToCopy = source.length;
    }

    var size = destLen + itemsToCopy;
    var result = new Array(size);

    for (var i = 0; i < destLen; i++)
    {
        result[i] = dest[i];
    }

    for (var i = 0; i < itemsToCopy; i++)
    {
        result[i + destLen] = source[i];
    }

    return result;
});



// LOG

var _Debug_log = F2(function(tag, value)
{
	return value;
});

var _Debug_log_UNUSED = F2(function(tag, value)
{
	console.log(tag + ': ' + _Debug_toString(value));
	return value;
});


// TODOS

function _Debug_todo(moduleName, region)
{
	return function(message) {
		_Debug_crash(8, moduleName, region, message);
	};
}

function _Debug_todoCase(moduleName, region, value)
{
	return function(message) {
		_Debug_crash(9, moduleName, region, value, message);
	};
}


// TO STRING

function _Debug_toString(value)
{
	return '<internals>';
}

function _Debug_toString_UNUSED(value)
{
	return _Debug_toAnsiString(false, value);
}

function _Debug_toAnsiString(ansi, value)
{
	if (typeof value === 'function')
	{
		return _Debug_internalColor(ansi, '<function>');
	}

	if (typeof value === 'boolean')
	{
		return _Debug_ctorColor(ansi, value ? 'True' : 'False');
	}

	if (typeof value === 'number')
	{
		return _Debug_numberColor(ansi, value + '');
	}

	if (value instanceof String)
	{
		return _Debug_charColor(ansi, "'" + _Debug_addSlashes(value, true) + "'");
	}

	if (typeof value === 'string')
	{
		return _Debug_stringColor(ansi, '"' + _Debug_addSlashes(value, false) + '"');
	}

	if (typeof value === 'object' && '$' in value)
	{
		var tag = value.$;

		if (typeof tag === 'number')
		{
			return _Debug_internalColor(ansi, '<internals>');
		}

		if (tag[0] === '#')
		{
			var output = [];
			for (var k in value)
			{
				if (k === '$') continue;
				output.push(_Debug_toAnsiString(ansi, value[k]));
			}
			return '(' + output.join(',') + ')';
		}

		if (tag === 'Set_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Set')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Set$toList(value));
		}

		if (tag === 'RBNode_elm_builtin' || tag === 'RBEmpty_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Dict')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Dict$toList(value));
		}

		if (tag === 'Array_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Array')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Array$toList(value));
		}

		if (tag === '::' || tag === '[]')
		{
			var output = '[';

			value.b && (output += _Debug_toAnsiString(ansi, value.a), value = value.b)

			for (; value.b; value = value.b) // WHILE_CONS
			{
				output += ',' + _Debug_toAnsiString(ansi, value.a);
			}
			return output + ']';
		}

		var output = '';
		for (var i in value)
		{
			if (i === '$') continue;
			var str = _Debug_toAnsiString(ansi, value[i]);
			var c0 = str[0];
			var parenless = c0 === '{' || c0 === '(' || c0 === '[' || c0 === '<' || c0 === '"' || str.indexOf(' ') < 0;
			output += ' ' + (parenless ? str : '(' + str + ')');
		}
		return _Debug_ctorColor(ansi, tag) + output;
	}

	if (typeof DataView === 'function' && value instanceof DataView)
	{
		return _Debug_stringColor(ansi, '<' + value.byteLength + ' bytes>');
	}

	if (typeof File !== 'undefined' && value instanceof File)
	{
		return _Debug_internalColor(ansi, '<' + value.name + '>');
	}

	if (typeof value === 'object')
	{
		var output = [];
		for (var key in value)
		{
			var field = key[0] === '_' ? key.slice(1) : key;
			output.push(_Debug_fadeColor(ansi, field) + ' = ' + _Debug_toAnsiString(ansi, value[key]));
		}
		if (output.length === 0)
		{
			return '{}';
		}
		return '{ ' + output.join(', ') + ' }';
	}

	return _Debug_internalColor(ansi, '<internals>');
}

function _Debug_addSlashes(str, isChar)
{
	var s = str
		.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		.replace(/\r/g, '\\r')
		.replace(/\v/g, '\\v')
		.replace(/\0/g, '\\0');

	if (isChar)
	{
		return s.replace(/\'/g, '\\\'');
	}
	else
	{
		return s.replace(/\"/g, '\\"');
	}
}

function _Debug_ctorColor(ansi, string)
{
	return ansi ? '\x1b[96m' + string + '\x1b[0m' : string;
}

function _Debug_numberColor(ansi, string)
{
	return ansi ? '\x1b[95m' + string + '\x1b[0m' : string;
}

function _Debug_stringColor(ansi, string)
{
	return ansi ? '\x1b[93m' + string + '\x1b[0m' : string;
}

function _Debug_charColor(ansi, string)
{
	return ansi ? '\x1b[92m' + string + '\x1b[0m' : string;
}

function _Debug_fadeColor(ansi, string)
{
	return ansi ? '\x1b[37m' + string + '\x1b[0m' : string;
}

function _Debug_internalColor(ansi, string)
{
	return ansi ? '\x1b[36m' + string + '\x1b[0m' : string;
}

function _Debug_toHexDigit(n)
{
	return String.fromCharCode(n < 10 ? 48 + n : 55 + n);
}


// CRASH


function _Debug_crash(identifier)
{
	throw new Error('https://github.com/elm/core/blob/1.0.0/hints/' + identifier + '.md');
}


function _Debug_crash_UNUSED(identifier, fact1, fact2, fact3, fact4)
{
	switch(identifier)
	{
		case 0:
			throw new Error('What node should I take over? In JavaScript I need something like:\n\n    Elm.Main.init({\n        node: document.getElementById("elm-node")\n    })\n\nYou need to do this with any Browser.sandbox or Browser.element program.');

		case 1:
			throw new Error('Browser.application programs cannot handle URLs like this:\n\n    ' + document.location.href + '\n\nWhat is the root? The root of your file system? Try looking at this program with `elm reactor` or some other server.');

		case 2:
			var jsonErrorString = fact1;
			throw new Error('Problem with the flags given to your Elm program on initialization.\n\n' + jsonErrorString);

		case 3:
			var portName = fact1;
			throw new Error('There can only be one port named `' + portName + '`, but your program has multiple.');

		case 4:
			var portName = fact1;
			var problem = fact2;
			throw new Error('Trying to send an unexpected type of value through port `' + portName + '`:\n' + problem);

		case 5:
			throw new Error('Trying to use `(==)` on functions.\nThere is no way to know if functions are "the same" in the Elm sense.\nRead more about this at https://package.elm-lang.org/packages/elm/core/latest/Basics#== which describes why it is this way and what the better version will look like.');

		case 6:
			var moduleName = fact1;
			throw new Error('Your page is loading multiple Elm scripts with a module named ' + moduleName + '. Maybe a duplicate script is getting loaded accidentally? If not, rename one of them so I know which is which!');

		case 8:
			var moduleName = fact1;
			var region = fact2;
			var message = fact3;
			throw new Error('TODO in module `' + moduleName + '` ' + _Debug_regionToString(region) + '\n\n' + message);

		case 9:
			var moduleName = fact1;
			var region = fact2;
			var value = fact3;
			var message = fact4;
			throw new Error(
				'TODO in module `' + moduleName + '` from the `case` expression '
				+ _Debug_regionToString(region) + '\n\nIt received the following value:\n\n    '
				+ _Debug_toString(value).replace('\n', '\n    ')
				+ '\n\nBut the branch that handles it says:\n\n    ' + message.replace('\n', '\n    ')
			);

		case 10:
			throw new Error('Bug in https://github.com/elm/virtual-dom/issues');

		case 11:
			throw new Error('Cannot perform mod 0. Division by zero error.');
	}
}

function _Debug_regionToString(region)
{
	if (region.cT.bb === region.da.bb)
	{
		return 'on line ' + region.cT.bb;
	}
	return 'on lines ' + region.cT.bb + ' through ' + region.da.bb;
}



// EQUALITY

function _Utils_eq(x, y)
{
	for (
		var pair, stack = [], isEqual = _Utils_eqHelp(x, y, 0, stack);
		isEqual && (pair = stack.pop());
		isEqual = _Utils_eqHelp(pair.a, pair.b, 0, stack)
		)
	{}

	return isEqual;
}

function _Utils_eqHelp(x, y, depth, stack)
{
	if (x === y)
	{
		return true;
	}

	if (typeof x !== 'object' || x === null || y === null)
	{
		typeof x === 'function' && _Debug_crash(5);
		return false;
	}

	if (depth > 100)
	{
		stack.push(_Utils_Tuple2(x,y));
		return true;
	}

	/**_UNUSED/
	if (x.$ === 'Set_elm_builtin')
	{
		x = $elm$core$Set$toList(x);
		y = $elm$core$Set$toList(y);
	}
	if (x.$ === 'RBNode_elm_builtin' || x.$ === 'RBEmpty_elm_builtin')
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	/**/
	if (x.$ < 0)
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	for (var key in x)
	{
		if (!_Utils_eqHelp(x[key], y[key], depth + 1, stack))
		{
			return false;
		}
	}
	return true;
}

var _Utils_equal = F2(_Utils_eq);
var _Utils_notEqual = F2(function(a, b) { return !_Utils_eq(a,b); });



// COMPARISONS

// Code in Generate/JavaScript.hs, Basics.js, and List.js depends on
// the particular integer values assigned to LT, EQ, and GT.

function _Utils_cmp(x, y, ord)
{
	if (typeof x !== 'object')
	{
		return x === y ? /*EQ*/ 0 : x < y ? /*LT*/ -1 : /*GT*/ 1;
	}

	/**_UNUSED/
	if (x instanceof String)
	{
		var a = x.valueOf();
		var b = y.valueOf();
		return a === b ? 0 : a < b ? -1 : 1;
	}
	//*/

	/**/
	if (typeof x.$ === 'undefined')
	//*/
	/**_UNUSED/
	if (x.$[0] === '#')
	//*/
	{
		return (ord = _Utils_cmp(x.a, y.a))
			? ord
			: (ord = _Utils_cmp(x.b, y.b))
				? ord
				: _Utils_cmp(x.c, y.c);
	}

	// traverse conses until end of a list or a mismatch
	for (; x.b && y.b && !(ord = _Utils_cmp(x.a, y.a)); x = x.b, y = y.b) {} // WHILE_CONSES
	return ord || (x.b ? /*GT*/ 1 : y.b ? /*LT*/ -1 : /*EQ*/ 0);
}

var _Utils_lt = F2(function(a, b) { return _Utils_cmp(a, b) < 0; });
var _Utils_le = F2(function(a, b) { return _Utils_cmp(a, b) < 1; });
var _Utils_gt = F2(function(a, b) { return _Utils_cmp(a, b) > 0; });
var _Utils_ge = F2(function(a, b) { return _Utils_cmp(a, b) >= 0; });

var _Utils_compare = F2(function(x, y)
{
	var n = _Utils_cmp(x, y);
	return n < 0 ? $elm$core$Basics$LT : n ? $elm$core$Basics$GT : $elm$core$Basics$EQ;
});


// COMMON VALUES

var _Utils_Tuple0 = 0;
var _Utils_Tuple0_UNUSED = { $: '#0' };

function _Utils_Tuple2(a, b) { return { a: a, b: b }; }
function _Utils_Tuple2_UNUSED(a, b) { return { $: '#2', a: a, b: b }; }

function _Utils_Tuple3(a, b, c) { return { a: a, b: b, c: c }; }
function _Utils_Tuple3_UNUSED(a, b, c) { return { $: '#3', a: a, b: b, c: c }; }

function _Utils_chr(c) { return c; }
function _Utils_chr_UNUSED(c) { return new String(c); }


// RECORDS

function _Utils_update(oldRecord, updatedFields)
{
	var newRecord = {};

	for (var key in oldRecord)
	{
		newRecord[key] = oldRecord[key];
	}

	for (var key in updatedFields)
	{
		newRecord[key] = updatedFields[key];
	}

	return newRecord;
}


// APPEND

var _Utils_append = F2(_Utils_ap);

function _Utils_ap(xs, ys)
{
	// append Strings
	if (typeof xs === 'string')
	{
		return xs + ys;
	}

	// append Lists
	if (!xs.b)
	{
		return ys;
	}
	var root = _List_Cons(xs.a, ys);
	xs = xs.b
	for (var curr = root; xs.b; xs = xs.b) // WHILE_CONS
	{
		curr = curr.b = _List_Cons(xs.a, ys);
	}
	return root;
}



var _List_Nil = { $: 0 };
var _List_Nil_UNUSED = { $: '[]' };

function _List_Cons(hd, tl) { return { $: 1, a: hd, b: tl }; }
function _List_Cons_UNUSED(hd, tl) { return { $: '::', a: hd, b: tl }; }


var _List_cons = F2(_List_Cons);

function _List_fromArray(arr)
{
	var out = _List_Nil;
	for (var i = arr.length; i--; )
	{
		out = _List_Cons(arr[i], out);
	}
	return out;
}

function _List_toArray(xs)
{
	for (var out = []; xs.b; xs = xs.b) // WHILE_CONS
	{
		out.push(xs.a);
	}
	return out;
}

var _List_map2 = F3(function(f, xs, ys)
{
	for (var arr = []; xs.b && ys.b; xs = xs.b, ys = ys.b) // WHILE_CONSES
	{
		arr.push(A2(f, xs.a, ys.a));
	}
	return _List_fromArray(arr);
});

var _List_map3 = F4(function(f, xs, ys, zs)
{
	for (var arr = []; xs.b && ys.b && zs.b; xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A3(f, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map4 = F5(function(f, ws, xs, ys, zs)
{
	for (var arr = []; ws.b && xs.b && ys.b && zs.b; ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A4(f, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map5 = F6(function(f, vs, ws, xs, ys, zs)
{
	for (var arr = []; vs.b && ws.b && xs.b && ys.b && zs.b; vs = vs.b, ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A5(f, vs.a, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_sortBy = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		return _Utils_cmp(f(a), f(b));
	}));
});

var _List_sortWith = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		var ord = A2(f, a, b);
		return ord === $elm$core$Basics$EQ ? 0 : ord === $elm$core$Basics$LT ? -1 : 1;
	}));
});



// MATH

var _Basics_add = F2(function(a, b) { return a + b; });
var _Basics_sub = F2(function(a, b) { return a - b; });
var _Basics_mul = F2(function(a, b) { return a * b; });
var _Basics_fdiv = F2(function(a, b) { return a / b; });
var _Basics_idiv = F2(function(a, b) { return (a / b) | 0; });
var _Basics_pow = F2(Math.pow);

var _Basics_remainderBy = F2(function(b, a) { return a % b; });

// https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/divmodnote-letter.pdf
var _Basics_modBy = F2(function(modulus, x)
{
	var answer = x % modulus;
	return modulus === 0
		? _Debug_crash(11)
		:
	((answer > 0 && modulus < 0) || (answer < 0 && modulus > 0))
		? answer + modulus
		: answer;
});


// TRIGONOMETRY

var _Basics_pi = Math.PI;
var _Basics_e = Math.E;
var _Basics_cos = Math.cos;
var _Basics_sin = Math.sin;
var _Basics_tan = Math.tan;
var _Basics_acos = Math.acos;
var _Basics_asin = Math.asin;
var _Basics_atan = Math.atan;
var _Basics_atan2 = F2(Math.atan2);


// MORE MATH

function _Basics_toFloat(x) { return x; }
function _Basics_truncate(n) { return n | 0; }
function _Basics_isInfinite(n) { return n === Infinity || n === -Infinity; }

var _Basics_ceiling = Math.ceil;
var _Basics_floor = Math.floor;
var _Basics_round = Math.round;
var _Basics_sqrt = Math.sqrt;
var _Basics_log = Math.log;
var _Basics_isNaN = isNaN;


// BOOLEANS

function _Basics_not(bool) { return !bool; }
var _Basics_and = F2(function(a, b) { return a && b; });
var _Basics_or  = F2(function(a, b) { return a || b; });
var _Basics_xor = F2(function(a, b) { return a !== b; });



var _String_cons = F2(function(chr, str)
{
	return chr + str;
});

function _String_uncons(string)
{
	var word = string.charCodeAt(0);
	return !isNaN(word)
		? $elm$core$Maybe$Just(
			0xD800 <= word && word <= 0xDBFF
				? _Utils_Tuple2(_Utils_chr(string[0] + string[1]), string.slice(2))
				: _Utils_Tuple2(_Utils_chr(string[0]), string.slice(1))
		)
		: $elm$core$Maybe$Nothing;
}

var _String_append = F2(function(a, b)
{
	return a + b;
});

function _String_length(str)
{
	return str.length;
}

var _String_map = F2(function(func, string)
{
	var len = string.length;
	var array = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = string.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			array[i] = func(_Utils_chr(string[i] + string[i+1]));
			i += 2;
			continue;
		}
		array[i] = func(_Utils_chr(string[i]));
		i++;
	}
	return array.join('');
});

var _String_filter = F2(function(isGood, str)
{
	var arr = [];
	var len = str.length;
	var i = 0;
	while (i < len)
	{
		var char = str[i];
		var word = str.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += str[i];
			i++;
		}

		if (isGood(_Utils_chr(char)))
		{
			arr.push(char);
		}
	}
	return arr.join('');
});

function _String_reverse(str)
{
	var len = str.length;
	var arr = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = str.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			arr[len - i] = str[i + 1];
			i++;
			arr[len - i] = str[i - 1];
			i++;
		}
		else
		{
			arr[len - i] = str[i];
			i++;
		}
	}
	return arr.join('');
}

var _String_foldl = F3(function(func, state, string)
{
	var len = string.length;
	var i = 0;
	while (i < len)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += string[i];
			i++;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_foldr = F3(function(func, state, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_split = F2(function(sep, str)
{
	return str.split(sep);
});

var _String_join = F2(function(sep, strs)
{
	return strs.join(sep);
});

var _String_slice = F3(function(start, end, str) {
	return str.slice(start, end);
});

function _String_trim(str)
{
	return str.trim();
}

function _String_trimLeft(str)
{
	return str.replace(/^\s+/, '');
}

function _String_trimRight(str)
{
	return str.replace(/\s+$/, '');
}

function _String_words(str)
{
	return _List_fromArray(str.trim().split(/\s+/g));
}

function _String_lines(str)
{
	return _List_fromArray(str.split(/\r\n|\r|\n/g));
}

function _String_toUpper(str)
{
	return str.toUpperCase();
}

function _String_toLower(str)
{
	return str.toLowerCase();
}

var _String_any = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (isGood(_Utils_chr(char)))
		{
			return true;
		}
	}
	return false;
});

var _String_all = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (!isGood(_Utils_chr(char)))
		{
			return false;
		}
	}
	return true;
});

var _String_contains = F2(function(sub, str)
{
	return str.indexOf(sub) > -1;
});

var _String_startsWith = F2(function(sub, str)
{
	return str.indexOf(sub) === 0;
});

var _String_endsWith = F2(function(sub, str)
{
	return str.length >= sub.length &&
		str.lastIndexOf(sub) === str.length - sub.length;
});

var _String_indexes = F2(function(sub, str)
{
	var subLen = sub.length;

	if (subLen < 1)
	{
		return _List_Nil;
	}

	var i = 0;
	var is = [];

	while ((i = str.indexOf(sub, i)) > -1)
	{
		is.push(i);
		i = i + subLen;
	}

	return _List_fromArray(is);
});


// TO STRING

function _String_fromNumber(number)
{
	return number + '';
}


// INT CONVERSIONS

function _String_toInt(str)
{
	var total = 0;
	var code0 = str.charCodeAt(0);
	var start = code0 == 0x2B /* + */ || code0 == 0x2D /* - */ ? 1 : 0;

	for (var i = start; i < str.length; ++i)
	{
		var code = str.charCodeAt(i);
		if (code < 0x30 || 0x39 < code)
		{
			return $elm$core$Maybe$Nothing;
		}
		total = 10 * total + code - 0x30;
	}

	return i == start
		? $elm$core$Maybe$Nothing
		: $elm$core$Maybe$Just(code0 == 0x2D ? -total : total);
}


// FLOAT CONVERSIONS

function _String_toFloat(s)
{
	// check if it is a hex, octal, or binary number
	if (s.length === 0 || /[\sxbo]/.test(s))
	{
		return $elm$core$Maybe$Nothing;
	}
	var n = +s;
	// faster isNaN check
	return n === n ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
}

function _String_fromList(chars)
{
	return _List_toArray(chars).join('');
}




function _Char_toCode(char)
{
	var code = char.charCodeAt(0);
	if (0xD800 <= code && code <= 0xDBFF)
	{
		return (code - 0xD800) * 0x400 + char.charCodeAt(1) - 0xDC00 + 0x10000
	}
	return code;
}

function _Char_fromCode(code)
{
	return _Utils_chr(
		(code < 0 || 0x10FFFF < code)
			? '\uFFFD'
			:
		(code <= 0xFFFF)
			? String.fromCharCode(code)
			:
		(code -= 0x10000,
			String.fromCharCode(Math.floor(code / 0x400) + 0xD800, code % 0x400 + 0xDC00)
		)
	);
}

function _Char_toUpper(char)
{
	return _Utils_chr(char.toUpperCase());
}

function _Char_toLower(char)
{
	return _Utils_chr(char.toLowerCase());
}

function _Char_toLocaleUpper(char)
{
	return _Utils_chr(char.toLocaleUpperCase());
}

function _Char_toLocaleLower(char)
{
	return _Utils_chr(char.toLocaleLowerCase());
}



/**_UNUSED/
function _Json_errorToString(error)
{
	return $elm$json$Json$Decode$errorToString(error);
}
//*/


// CORE DECODERS

function _Json_succeed(msg)
{
	return {
		$: 0,
		a: msg
	};
}

function _Json_fail(msg)
{
	return {
		$: 1,
		a: msg
	};
}

function _Json_decodePrim(decoder)
{
	return { $: 2, b: decoder };
}

var _Json_decodeInt = _Json_decodePrim(function(value) {
	return (typeof value !== 'number')
		? _Json_expecting('an INT', value)
		:
	(-2147483647 < value && value < 2147483647 && (value | 0) === value)
		? $elm$core$Result$Ok(value)
		:
	(isFinite(value) && !(value % 1))
		? $elm$core$Result$Ok(value)
		: _Json_expecting('an INT', value);
});

var _Json_decodeBool = _Json_decodePrim(function(value) {
	return (typeof value === 'boolean')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a BOOL', value);
});

var _Json_decodeFloat = _Json_decodePrim(function(value) {
	return (typeof value === 'number')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a FLOAT', value);
});

var _Json_decodeValue = _Json_decodePrim(function(value) {
	return $elm$core$Result$Ok(_Json_wrap(value));
});

var _Json_decodeString = _Json_decodePrim(function(value) {
	return (typeof value === 'string')
		? $elm$core$Result$Ok(value)
		: (value instanceof String)
			? $elm$core$Result$Ok(value + '')
			: _Json_expecting('a STRING', value);
});

function _Json_decodeList(decoder) { return { $: 3, b: decoder }; }
function _Json_decodeArray(decoder) { return { $: 4, b: decoder }; }

function _Json_decodeNull(value) { return { $: 5, c: value }; }

var _Json_decodeField = F2(function(field, decoder)
{
	return {
		$: 6,
		d: field,
		b: decoder
	};
});

var _Json_decodeIndex = F2(function(index, decoder)
{
	return {
		$: 7,
		e: index,
		b: decoder
	};
});

function _Json_decodeKeyValuePairs(decoder)
{
	return {
		$: 8,
		b: decoder
	};
}

function _Json_mapMany(f, decoders)
{
	return {
		$: 9,
		f: f,
		g: decoders
	};
}

var _Json_andThen = F2(function(callback, decoder)
{
	return {
		$: 10,
		b: decoder,
		h: callback
	};
});

function _Json_oneOf(decoders)
{
	return {
		$: 11,
		g: decoders
	};
}


// DECODING OBJECTS

var _Json_map1 = F2(function(f, d1)
{
	return _Json_mapMany(f, [d1]);
});

var _Json_map2 = F3(function(f, d1, d2)
{
	return _Json_mapMany(f, [d1, d2]);
});

var _Json_map3 = F4(function(f, d1, d2, d3)
{
	return _Json_mapMany(f, [d1, d2, d3]);
});

var _Json_map4 = F5(function(f, d1, d2, d3, d4)
{
	return _Json_mapMany(f, [d1, d2, d3, d4]);
});

var _Json_map5 = F6(function(f, d1, d2, d3, d4, d5)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5]);
});

var _Json_map6 = F7(function(f, d1, d2, d3, d4, d5, d6)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6]);
});

var _Json_map7 = F8(function(f, d1, d2, d3, d4, d5, d6, d7)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7]);
});

var _Json_map8 = F9(function(f, d1, d2, d3, d4, d5, d6, d7, d8)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7, d8]);
});


// DECODE

var _Json_runOnString = F2(function(decoder, string)
{
	try
	{
		var value = JSON.parse(string);
		return _Json_runHelp(decoder, value);
	}
	catch (e)
	{
		return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'This is not valid JSON! ' + e.message, _Json_wrap(string)));
	}
});

var _Json_run = F2(function(decoder, value)
{
	return _Json_runHelp(decoder, _Json_unwrap(value));
});

function _Json_runHelp(decoder, value)
{
	switch (decoder.$)
	{
		case 2:
			return decoder.b(value);

		case 5:
			return (value === null)
				? $elm$core$Result$Ok(decoder.c)
				: _Json_expecting('null', value);

		case 3:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('a LIST', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _List_fromArray);

		case 4:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _Json_toElmArray);

		case 6:
			var field = decoder.d;
			if (typeof value !== 'object' || value === null || !(field in value))
			{
				return _Json_expecting('an OBJECT with a field named `' + field + '`', value);
			}
			var result = _Json_runHelp(decoder.b, value[field]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, field, result.a));

		case 7:
			var index = decoder.e;
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			if (index >= value.length)
			{
				return _Json_expecting('a LONGER array. Need index ' + index + ' but only see ' + value.length + ' entries', value);
			}
			var result = _Json_runHelp(decoder.b, value[index]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, index, result.a));

		case 8:
			if (typeof value !== 'object' || value === null || _Json_isArray(value))
			{
				return _Json_expecting('an OBJECT', value);
			}

			var keyValuePairs = _List_Nil;
			// TODO test perf of Object.keys and switch when support is good enough
			for (var key in value)
			{
				if (value.hasOwnProperty(key))
				{
					var result = _Json_runHelp(decoder.b, value[key]);
					if (!$elm$core$Result$isOk(result))
					{
						return $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, key, result.a));
					}
					keyValuePairs = _List_Cons(_Utils_Tuple2(key, result.a), keyValuePairs);
				}
			}
			return $elm$core$Result$Ok($elm$core$List$reverse(keyValuePairs));

		case 9:
			var answer = decoder.f;
			var decoders = decoder.g;
			for (var i = 0; i < decoders.length; i++)
			{
				var result = _Json_runHelp(decoders[i], value);
				if (!$elm$core$Result$isOk(result))
				{
					return result;
				}
				answer = answer(result.a);
			}
			return $elm$core$Result$Ok(answer);

		case 10:
			var result = _Json_runHelp(decoder.b, value);
			return (!$elm$core$Result$isOk(result))
				? result
				: _Json_runHelp(decoder.h(result.a), value);

		case 11:
			var errors = _List_Nil;
			for (var temp = decoder.g; temp.b; temp = temp.b) // WHILE_CONS
			{
				var result = _Json_runHelp(temp.a, value);
				if ($elm$core$Result$isOk(result))
				{
					return result;
				}
				errors = _List_Cons(result.a, errors);
			}
			return $elm$core$Result$Err($elm$json$Json$Decode$OneOf($elm$core$List$reverse(errors)));

		case 1:
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, decoder.a, _Json_wrap(value)));

		case 0:
			return $elm$core$Result$Ok(decoder.a);
	}
}

function _Json_runArrayDecoder(decoder, value, toElmValue)
{
	var len = value.length;
	var array = new Array(len);
	for (var i = 0; i < len; i++)
	{
		var result = _Json_runHelp(decoder, value[i]);
		if (!$elm$core$Result$isOk(result))
		{
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, i, result.a));
		}
		array[i] = result.a;
	}
	return $elm$core$Result$Ok(toElmValue(array));
}

function _Json_isArray(value)
{
	return Array.isArray(value) || (typeof FileList !== 'undefined' && value instanceof FileList);
}

function _Json_toElmArray(array)
{
	return A2($elm$core$Array$initialize, array.length, function(i) { return array[i]; });
}

function _Json_expecting(type, value)
{
	return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'Expecting ' + type, _Json_wrap(value)));
}


// EQUALITY

function _Json_equality(x, y)
{
	if (x === y)
	{
		return true;
	}

	if (x.$ !== y.$)
	{
		return false;
	}

	switch (x.$)
	{
		case 0:
		case 1:
			return x.a === y.a;

		case 2:
			return x.b === y.b;

		case 5:
			return x.c === y.c;

		case 3:
		case 4:
		case 8:
			return _Json_equality(x.b, y.b);

		case 6:
			return x.d === y.d && _Json_equality(x.b, y.b);

		case 7:
			return x.e === y.e && _Json_equality(x.b, y.b);

		case 9:
			return x.f === y.f && _Json_listEquality(x.g, y.g);

		case 10:
			return x.h === y.h && _Json_equality(x.b, y.b);

		case 11:
			return _Json_listEquality(x.g, y.g);
	}
}

function _Json_listEquality(aDecoders, bDecoders)
{
	var len = aDecoders.length;
	if (len !== bDecoders.length)
	{
		return false;
	}
	for (var i = 0; i < len; i++)
	{
		if (!_Json_equality(aDecoders[i], bDecoders[i]))
		{
			return false;
		}
	}
	return true;
}


// ENCODE

var _Json_encode = F2(function(indentLevel, value)
{
	return JSON.stringify(_Json_unwrap(value), null, indentLevel) + '';
});

function _Json_wrap_UNUSED(value) { return { $: 0, a: value }; }
function _Json_unwrap_UNUSED(value) { return value.a; }

function _Json_wrap(value) { return value; }
function _Json_unwrap(value) { return value; }

function _Json_emptyArray() { return []; }
function _Json_emptyObject() { return {}; }

var _Json_addField = F3(function(key, value, object)
{
	object[key] = _Json_unwrap(value);
	return object;
});

function _Json_addEntry(func)
{
	return F2(function(entry, array)
	{
		array.push(_Json_unwrap(func(entry)));
		return array;
	});
}

var _Json_encodeNull = _Json_wrap(null);



// TASKS

function _Scheduler_succeed(value)
{
	return {
		$: 0,
		a: value
	};
}

function _Scheduler_fail(error)
{
	return {
		$: 1,
		a: error
	};
}

function _Scheduler_binding(callback)
{
	return {
		$: 2,
		b: callback,
		c: null
	};
}

var _Scheduler_andThen = F2(function(callback, task)
{
	return {
		$: 3,
		b: callback,
		d: task
	};
});

var _Scheduler_onError = F2(function(callback, task)
{
	return {
		$: 4,
		b: callback,
		d: task
	};
});

function _Scheduler_receive(callback)
{
	return {
		$: 5,
		b: callback
	};
}


// PROCESSES

var _Scheduler_guid = 0;

function _Scheduler_rawSpawn(task)
{
	var proc = {
		$: 0,
		e: _Scheduler_guid++,
		f: task,
		g: null,
		h: []
	};

	_Scheduler_enqueue(proc);

	return proc;
}

function _Scheduler_spawn(task)
{
	return _Scheduler_binding(function(callback) {
		callback(_Scheduler_succeed(_Scheduler_rawSpawn(task)));
	});
}

function _Scheduler_rawSend(proc, msg)
{
	proc.h.push(msg);
	_Scheduler_enqueue(proc);
}

var _Scheduler_send = F2(function(proc, msg)
{
	return _Scheduler_binding(function(callback) {
		_Scheduler_rawSend(proc, msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});

function _Scheduler_kill(proc)
{
	return _Scheduler_binding(function(callback) {
		var task = proc.f;
		if (task.$ === 2 && task.c)
		{
			task.c();
		}

		proc.f = null;

		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
}


/* STEP PROCESSES

type alias Process =
  { $ : tag
  , id : unique_id
  , root : Task
  , stack : null | { $: SUCCEED | FAIL, a: callback, b: stack }
  , mailbox : [msg]
  }

*/


var _Scheduler_working = false;
var _Scheduler_queue = [];


function _Scheduler_enqueue(proc)
{
	_Scheduler_queue.push(proc);
	if (_Scheduler_working)
	{
		return;
	}
	_Scheduler_working = true;
	while (proc = _Scheduler_queue.shift())
	{
		_Scheduler_step(proc);
	}
	_Scheduler_working = false;
}


function _Scheduler_step(proc)
{
	while (proc.f)
	{
		var rootTag = proc.f.$;
		if (rootTag === 0 || rootTag === 1)
		{
			while (proc.g && proc.g.$ !== rootTag)
			{
				proc.g = proc.g.i;
			}
			if (!proc.g)
			{
				return;
			}
			proc.f = proc.g.b(proc.f.a);
			proc.g = proc.g.i;
		}
		else if (rootTag === 2)
		{
			proc.f.c = proc.f.b(function(newRoot) {
				proc.f = newRoot;
				_Scheduler_enqueue(proc);
			});
			return;
		}
		else if (rootTag === 5)
		{
			if (proc.h.length === 0)
			{
				return;
			}
			proc.f = proc.f.b(proc.h.shift());
		}
		else // if (rootTag === 3 || rootTag === 4)
		{
			proc.g = {
				$: rootTag === 3 ? 0 : 1,
				b: proc.f.b,
				i: proc.g
			};
			proc.f = proc.f.d;
		}
	}
}



function _Process_sleep(time)
{
	return _Scheduler_binding(function(callback) {
		var id = setTimeout(function() {
			callback(_Scheduler_succeed(_Utils_Tuple0));
		}, time);

		return function() { clearTimeout(id); };
	});
}




// PROGRAMS


var _Platform_worker = F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.et,
		impl.e5,
		impl.eZ,
		function() { return function() {} }
	);
});



// INITIALIZE A PROGRAM


function _Platform_initialize(flagDecoder, args, init, update, subscriptions, stepperBuilder)
{
	var result = A2(_Json_run, flagDecoder, _Json_wrap(args ? args['flags'] : undefined));
	$elm$core$Result$isOk(result) || _Debug_crash(2 /**_UNUSED/, _Json_errorToString(result.a) /**/);
	var managers = {};
	var initPair = init(result.a);
	var model = initPair.a;
	var stepper = stepperBuilder(sendToApp, model);
	var ports = _Platform_setupEffects(managers, sendToApp);

	function sendToApp(msg, viewMetadata)
	{
		var pair = A2(update, msg, model);
		stepper(model = pair.a, viewMetadata);
		_Platform_enqueueEffects(managers, pair.b, subscriptions(model));
	}

	_Platform_enqueueEffects(managers, initPair.b, subscriptions(model));

	return ports ? { ports: ports } : {};
}



// TRACK PRELOADS
//
// This is used by code in elm/browser and elm/http
// to register any HTTP requests that are triggered by init.
//


var _Platform_preload;


function _Platform_registerPreload(url)
{
	_Platform_preload.add(url);
}



// EFFECT MANAGERS


var _Platform_effectManagers = {};


function _Platform_setupEffects(managers, sendToApp)
{
	var ports;

	// setup all necessary effect managers
	for (var key in _Platform_effectManagers)
	{
		var manager = _Platform_effectManagers[key];

		if (manager.a)
		{
			ports = ports || {};
			ports[key] = manager.a(key, sendToApp);
		}

		managers[key] = _Platform_instantiateManager(manager, sendToApp);
	}

	return ports;
}


function _Platform_createManager(init, onEffects, onSelfMsg, cmdMap, subMap)
{
	return {
		b: init,
		c: onEffects,
		d: onSelfMsg,
		e: cmdMap,
		f: subMap
	};
}


function _Platform_instantiateManager(info, sendToApp)
{
	var router = {
		g: sendToApp,
		h: undefined
	};

	var onEffects = info.c;
	var onSelfMsg = info.d;
	var cmdMap = info.e;
	var subMap = info.f;

	function loop(state)
	{
		return A2(_Scheduler_andThen, loop, _Scheduler_receive(function(msg)
		{
			var value = msg.a;

			if (msg.$ === 0)
			{
				return A3(onSelfMsg, router, value, state);
			}

			return cmdMap && subMap
				? A4(onEffects, router, value.i, value.j, state)
				: A3(onEffects, router, cmdMap ? value.i : value.j, state);
		}));
	}

	return router.h = _Scheduler_rawSpawn(A2(_Scheduler_andThen, loop, info.b));
}



// ROUTING


var _Platform_sendToApp = F2(function(router, msg)
{
	return _Scheduler_binding(function(callback)
	{
		router.g(msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});


var _Platform_sendToSelf = F2(function(router, msg)
{
	return A2(_Scheduler_send, router.h, {
		$: 0,
		a: msg
	});
});



// BAGS


function _Platform_leaf(home)
{
	return function(value)
	{
		return {
			$: 1,
			k: home,
			l: value
		};
	};
}


function _Platform_batch(list)
{
	return {
		$: 2,
		m: list
	};
}


var _Platform_map = F2(function(tagger, bag)
{
	return {
		$: 3,
		n: tagger,
		o: bag
	}
});



// PIPE BAGS INTO EFFECT MANAGERS
//
// Effects must be queued!
//
// Say your init contains a synchronous command, like Time.now or Time.here
//
//   - This will produce a batch of effects (FX_1)
//   - The synchronous task triggers the subsequent `update` call
//   - This will produce a batch of effects (FX_2)
//
// If we just start dispatching FX_2, subscriptions from FX_2 can be processed
// before subscriptions from FX_1. No good! Earlier versions of this code had
// this problem, leading to these reports:
//
//   https://github.com/elm/core/issues/980
//   https://github.com/elm/core/pull/981
//   https://github.com/elm/compiler/issues/1776
//
// The queue is necessary to avoid ordering issues for synchronous commands.


// Why use true/false here? Why not just check the length of the queue?
// The goal is to detect "are we currently dispatching effects?" If we
// are, we need to bail and let the ongoing while loop handle things.
//
// Now say the queue has 1 element. When we dequeue the final element,
// the queue will be empty, but we are still actively dispatching effects.
// So you could get queue jumping in a really tricky category of cases.
//
var _Platform_effectsQueue = [];
var _Platform_effectsActive = false;


function _Platform_enqueueEffects(managers, cmdBag, subBag)
{
	_Platform_effectsQueue.push({ p: managers, q: cmdBag, r: subBag });

	if (_Platform_effectsActive) return;

	_Platform_effectsActive = true;
	for (var fx; fx = _Platform_effectsQueue.shift(); )
	{
		_Platform_dispatchEffects(fx.p, fx.q, fx.r);
	}
	_Platform_effectsActive = false;
}


function _Platform_dispatchEffects(managers, cmdBag, subBag)
{
	var effectsDict = {};
	_Platform_gatherEffects(true, cmdBag, effectsDict, null);
	_Platform_gatherEffects(false, subBag, effectsDict, null);

	for (var home in managers)
	{
		_Scheduler_rawSend(managers[home], {
			$: 'fx',
			a: effectsDict[home] || { i: _List_Nil, j: _List_Nil }
		});
	}
}


function _Platform_gatherEffects(isCmd, bag, effectsDict, taggers)
{
	switch (bag.$)
	{
		case 1:
			var home = bag.k;
			var effect = _Platform_toEffect(isCmd, home, taggers, bag.l);
			effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
			return;

		case 2:
			for (var list = bag.m; list.b; list = list.b) // WHILE_CONS
			{
				_Platform_gatherEffects(isCmd, list.a, effectsDict, taggers);
			}
			return;

		case 3:
			_Platform_gatherEffects(isCmd, bag.o, effectsDict, {
				s: bag.n,
				t: taggers
			});
			return;
	}
}


function _Platform_toEffect(isCmd, home, taggers, value)
{
	function applyTaggers(x)
	{
		for (var temp = taggers; temp; temp = temp.t)
		{
			x = temp.s(x);
		}
		return x;
	}

	var map = isCmd
		? _Platform_effectManagers[home].e
		: _Platform_effectManagers[home].f;

	return A2(map, applyTaggers, value)
}


function _Platform_insert(isCmd, newEffect, effects)
{
	effects = effects || { i: _List_Nil, j: _List_Nil };

	isCmd
		? (effects.i = _List_Cons(newEffect, effects.i))
		: (effects.j = _List_Cons(newEffect, effects.j));

	return effects;
}



// PORTS


function _Platform_checkPortName(name)
{
	if (_Platform_effectManagers[name])
	{
		_Debug_crash(3, name)
	}
}



// OUTGOING PORTS


function _Platform_outgoingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		e: _Platform_outgoingPortMap,
		u: converter,
		a: _Platform_setupOutgoingPort
	};
	return _Platform_leaf(name);
}


var _Platform_outgoingPortMap = F2(function(tagger, value) { return value; });


function _Platform_setupOutgoingPort(name)
{
	var subs = [];
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Process_sleep(0);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, cmdList, state)
	{
		for ( ; cmdList.b; cmdList = cmdList.b) // WHILE_CONS
		{
			// grab a separate reference to subs in case unsubscribe is called
			var currentSubs = subs;
			var value = _Json_unwrap(converter(cmdList.a));
			for (var i = 0; i < currentSubs.length; i++)
			{
				currentSubs[i](value);
			}
		}
		return init;
	});

	// PUBLIC API

	function subscribe(callback)
	{
		subs.push(callback);
	}

	function unsubscribe(callback)
	{
		// copy subs into a new array in case unsubscribe is called within a
		// subscribed callback
		subs = subs.slice();
		var index = subs.indexOf(callback);
		if (index >= 0)
		{
			subs.splice(index, 1);
		}
	}

	return {
		subscribe: subscribe,
		unsubscribe: unsubscribe
	};
}



// INCOMING PORTS


function _Platform_incomingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		f: _Platform_incomingPortMap,
		u: converter,
		a: _Platform_setupIncomingPort
	};
	return _Platform_leaf(name);
}


var _Platform_incomingPortMap = F2(function(tagger, finalTagger)
{
	return function(value)
	{
		return tagger(finalTagger(value));
	};
});


function _Platform_setupIncomingPort(name, sendToApp)
{
	var subs = _List_Nil;
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Scheduler_succeed(null);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, subList, state)
	{
		subs = subList;
		return init;
	});

	// PUBLIC API

	function send(incomingValue)
	{
		var result = A2(_Json_run, converter, _Json_wrap(incomingValue));

		$elm$core$Result$isOk(result) || _Debug_crash(4, name, result.a);

		var value = result.a;
		for (var temp = subs; temp.b; temp = temp.b) // WHILE_CONS
		{
			sendToApp(temp.a(value));
		}
	}

	return { send: send };
}



// EXPORT ELM MODULES
//
// Have DEBUG and PROD versions so that we can (1) give nicer errors in
// debug mode and (2) not pay for the bits needed for that in prod mode.
//


function _Platform_export(exports)
{
	scope['Elm']
		? _Platform_mergeExportsProd(scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsProd(obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6)
				: _Platform_mergeExportsProd(obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}


function _Platform_export_UNUSED(exports)
{
	scope['Elm']
		? _Platform_mergeExportsDebug('Elm', scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsDebug(moduleName, obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6, moduleName)
				: _Platform_mergeExportsDebug(moduleName + '.' + name, obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}




// HELPERS


var _VirtualDom_divertHrefToApp;

var _VirtualDom_doc = typeof document !== 'undefined' ? document : {};


function _VirtualDom_appendChild(parent, child)
{
	parent.appendChild(child);
}

var _VirtualDom_init = F4(function(virtualNode, flagDecoder, debugMetadata, args)
{
	// NOTE: this function needs _Platform_export available to work

	/**/
	var node = args['node'];
	//*/
	/**_UNUSED/
	var node = args && args['node'] ? args['node'] : _Debug_crash(0);
	//*/

	node.parentNode.replaceChild(
		_VirtualDom_render(virtualNode, function() {}),
		node
	);

	return {};
});



// TEXT


function _VirtualDom_text(string)
{
	return {
		$: 0,
		a: string
	};
}



// NODE


var _VirtualDom_nodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 1,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_node = _VirtualDom_nodeNS(undefined);



// KEYED NODE


var _VirtualDom_keyedNodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 2,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_keyedNode = _VirtualDom_keyedNodeNS(undefined);



// CUSTOM


function _VirtualDom_custom(factList, model, render, diff)
{
	return {
		$: 3,
		d: _VirtualDom_organizeFacts(factList),
		g: model,
		h: render,
		i: diff
	};
}



// MAP


var _VirtualDom_map = F2(function(tagger, node)
{
	return {
		$: 4,
		j: tagger,
		k: node,
		b: 1 + (node.b || 0)
	};
});



// LAZY


function _VirtualDom_thunk(refs, thunk)
{
	return {
		$: 5,
		l: refs,
		m: thunk,
		k: undefined
	};
}

var _VirtualDom_lazy = F2(function(func, a)
{
	return _VirtualDom_thunk([func, a], function() {
		return func(a);
	});
});

var _VirtualDom_lazy2 = F3(function(func, a, b)
{
	return _VirtualDom_thunk([func, a, b], function() {
		return A2(func, a, b);
	});
});

var _VirtualDom_lazy3 = F4(function(func, a, b, c)
{
	return _VirtualDom_thunk([func, a, b, c], function() {
		return A3(func, a, b, c);
	});
});

var _VirtualDom_lazy4 = F5(function(func, a, b, c, d)
{
	return _VirtualDom_thunk([func, a, b, c, d], function() {
		return A4(func, a, b, c, d);
	});
});

var _VirtualDom_lazy5 = F6(function(func, a, b, c, d, e)
{
	return _VirtualDom_thunk([func, a, b, c, d, e], function() {
		return A5(func, a, b, c, d, e);
	});
});

var _VirtualDom_lazy6 = F7(function(func, a, b, c, d, e, f)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f], function() {
		return A6(func, a, b, c, d, e, f);
	});
});

var _VirtualDom_lazy7 = F8(function(func, a, b, c, d, e, f, g)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g], function() {
		return A7(func, a, b, c, d, e, f, g);
	});
});

var _VirtualDom_lazy8 = F9(function(func, a, b, c, d, e, f, g, h)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g, h], function() {
		return A8(func, a, b, c, d, e, f, g, h);
	});
});



// FACTS


var _VirtualDom_on = F2(function(key, handler)
{
	return {
		$: 'a0',
		n: key,
		o: handler
	};
});
var _VirtualDom_style = F2(function(key, value)
{
	return {
		$: 'a1',
		n: key,
		o: value
	};
});
var _VirtualDom_property = F2(function(key, value)
{
	return {
		$: 'a2',
		n: key,
		o: value
	};
});
var _VirtualDom_attribute = F2(function(key, value)
{
	return {
		$: 'a3',
		n: key,
		o: value
	};
});
var _VirtualDom_attributeNS = F3(function(namespace, key, value)
{
	return {
		$: 'a4',
		n: key,
		o: { f: namespace, o: value }
	};
});



// XSS ATTACK VECTOR CHECKS
//
// For some reason, tabs can appear in href protocols and it still works.
// So '\tjava\tSCRIPT:alert("!!!")' and 'javascript:alert("!!!")' are the same
// in practice. That is why _VirtualDom_RE_js and _VirtualDom_RE_js_html look
// so freaky.
//
// Pulling the regular expressions out to the top level gives a slight speed
// boost in small benchmarks (4-10%) but hoisting values to reduce allocation
// can be unpredictable in large programs where JIT may have a harder time with
// functions are not fully self-contained. The benefit is more that the js and
// js_html ones are so weird that I prefer to see them near each other.


var _VirtualDom_RE_script = /^script$/i;
var _VirtualDom_RE_on_formAction = /^(on|formAction$)/i;
var _VirtualDom_RE_js = /^\s*j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i;
var _VirtualDom_RE_js_html = /^\s*(j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:|d\s*a\s*t\s*a\s*:\s*t\s*e\s*x\s*t\s*\/\s*h\s*t\s*m\s*l\s*(,|;))/i;


function _VirtualDom_noScript(tag)
{
	return _VirtualDom_RE_script.test(tag) ? 'p' : tag;
}

function _VirtualDom_noOnOrFormAction(key)
{
	return _VirtualDom_RE_on_formAction.test(key) ? 'data-' + key : key;
}

function _VirtualDom_noInnerHtmlOrFormAction(key)
{
	return key == 'innerHTML' || key == 'formAction' ? 'data-' + key : key;
}

function _VirtualDom_noJavaScriptUri(value)
{
	return _VirtualDom_RE_js.test(value)
		? /**/''//*//**_UNUSED/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlUri(value)
{
	return _VirtualDom_RE_js_html.test(value)
		? /**/''//*//**_UNUSED/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlJson(value)
{
	return (typeof _Json_unwrap(value) === 'string' && _VirtualDom_RE_js_html.test(_Json_unwrap(value)))
		? _Json_wrap(
			/**/''//*//**_UNUSED/'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'//*/
		) : value;
}



// MAP FACTS


var _VirtualDom_mapAttribute = F2(function(func, attr)
{
	return (attr.$ === 'a0')
		? A2(_VirtualDom_on, attr.n, _VirtualDom_mapHandler(func, attr.o))
		: attr;
});

function _VirtualDom_mapHandler(func, handler)
{
	var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

	// 0 = Normal
	// 1 = MayStopPropagation
	// 2 = MayPreventDefault
	// 3 = Custom

	return {
		$: handler.$,
		a:
			!tag
				? A2($elm$json$Json$Decode$map, func, handler.a)
				:
			A3($elm$json$Json$Decode$map2,
				tag < 3
					? _VirtualDom_mapEventTuple
					: _VirtualDom_mapEventRecord,
				$elm$json$Json$Decode$succeed(func),
				handler.a
			)
	};
}

var _VirtualDom_mapEventTuple = F2(function(func, tuple)
{
	return _Utils_Tuple2(func(tuple.a), tuple.b);
});

var _VirtualDom_mapEventRecord = F2(function(func, record)
{
	return {
		ah: func(record.ah),
		cV: record.cV,
		cL: record.cL
	}
});



// ORGANIZE FACTS


function _VirtualDom_organizeFacts(factList)
{
	for (var facts = {}; factList.b; factList = factList.b) // WHILE_CONS
	{
		var entry = factList.a;

		var tag = entry.$;
		var key = entry.n;
		var value = entry.o;

		if (tag === 'a2')
		{
			(key === 'className')
				? _VirtualDom_addClass(facts, key, _Json_unwrap(value))
				: facts[key] = _Json_unwrap(value);

			continue;
		}

		var subFacts = facts[tag] || (facts[tag] = {});
		(tag === 'a3' && key === 'class')
			? _VirtualDom_addClass(subFacts, key, value)
			: subFacts[key] = value;
	}

	return facts;
}

function _VirtualDom_addClass(object, key, newClass)
{
	var classes = object[key];
	object[key] = classes ? classes + ' ' + newClass : newClass;
}



// RENDER


function _VirtualDom_render(vNode, eventNode)
{
	var tag = vNode.$;

	if (tag === 5)
	{
		return _VirtualDom_render(vNode.k || (vNode.k = vNode.m()), eventNode);
	}

	if (tag === 0)
	{
		return _VirtualDom_doc.createTextNode(vNode.a);
	}

	if (tag === 4)
	{
		var subNode = vNode.k;
		var tagger = vNode.j;

		while (subNode.$ === 4)
		{
			typeof tagger !== 'object'
				? tagger = [tagger, subNode.j]
				: tagger.push(subNode.j);

			subNode = subNode.k;
		}

		var subEventRoot = { j: tagger, p: eventNode };
		var domNode = _VirtualDom_render(subNode, subEventRoot);
		domNode.elm_event_node_ref = subEventRoot;
		return domNode;
	}

	if (tag === 3)
	{
		var domNode = vNode.h(vNode.g);
		_VirtualDom_applyFacts(domNode, eventNode, vNode.d);
		return domNode;
	}

	// at this point `tag` must be 1 or 2

	var domNode = vNode.f
		? _VirtualDom_doc.createElementNS(vNode.f, vNode.c)
		: _VirtualDom_doc.createElement(vNode.c);

	if (_VirtualDom_divertHrefToApp && vNode.c == 'a')
	{
		domNode.addEventListener('click', _VirtualDom_divertHrefToApp(domNode));
	}

	_VirtualDom_applyFacts(domNode, eventNode, vNode.d);

	for (var kids = vNode.e, i = 0; i < kids.length; i++)
	{
		_VirtualDom_appendChild(domNode, _VirtualDom_render(tag === 1 ? kids[i] : kids[i].b, eventNode));
	}

	return domNode;
}



// APPLY FACTS


function _VirtualDom_applyFacts(domNode, eventNode, facts)
{
	for (var key in facts)
	{
		var value = facts[key];

		key === 'a1'
			? _VirtualDom_applyStyles(domNode, value)
			:
		key === 'a0'
			? _VirtualDom_applyEvents(domNode, eventNode, value)
			:
		key === 'a3'
			? _VirtualDom_applyAttrs(domNode, value)
			:
		key === 'a4'
			? _VirtualDom_applyAttrsNS(domNode, value)
			:
		((key !== 'value' && key !== 'checked') || domNode[key] !== value) && (domNode[key] = value);
	}
}



// APPLY STYLES


function _VirtualDom_applyStyles(domNode, styles)
{
	var domNodeStyle = domNode.style;

	for (var key in styles)
	{
		domNodeStyle[key] = styles[key];
	}
}



// APPLY ATTRS


function _VirtualDom_applyAttrs(domNode, attrs)
{
	for (var key in attrs)
	{
		var value = attrs[key];
		typeof value !== 'undefined'
			? domNode.setAttribute(key, value)
			: domNode.removeAttribute(key);
	}
}



// APPLY NAMESPACED ATTRS


function _VirtualDom_applyAttrsNS(domNode, nsAttrs)
{
	for (var key in nsAttrs)
	{
		var pair = nsAttrs[key];
		var namespace = pair.f;
		var value = pair.o;

		typeof value !== 'undefined'
			? domNode.setAttributeNS(namespace, key, value)
			: domNode.removeAttributeNS(namespace, key);
	}
}



// APPLY EVENTS


function _VirtualDom_applyEvents(domNode, eventNode, events)
{
	var allCallbacks = domNode.elmFs || (domNode.elmFs = {});

	for (var key in events)
	{
		var newHandler = events[key];
		var oldCallback = allCallbacks[key];

		if (!newHandler)
		{
			domNode.removeEventListener(key, oldCallback);
			allCallbacks[key] = undefined;
			continue;
		}

		if (oldCallback)
		{
			var oldHandler = oldCallback.q;
			if (oldHandler.$ === newHandler.$)
			{
				oldCallback.q = newHandler;
				continue;
			}
			domNode.removeEventListener(key, oldCallback);
		}

		oldCallback = _VirtualDom_makeCallback(eventNode, newHandler);
		domNode.addEventListener(key, oldCallback,
			_VirtualDom_passiveSupported
			&& { passive: $elm$virtual_dom$VirtualDom$toHandlerInt(newHandler) < 2 }
		);
		allCallbacks[key] = oldCallback;
	}
}



// PASSIVE EVENTS


var _VirtualDom_passiveSupported;

try
{
	window.addEventListener('t', null, Object.defineProperty({}, 'passive', {
		get: function() { _VirtualDom_passiveSupported = true; }
	}));
}
catch(e) {}



// EVENT HANDLERS


function _VirtualDom_makeCallback(eventNode, initialHandler)
{
	function callback(event)
	{
		var handler = callback.q;
		var result = _Json_runHelp(handler.a, event);

		if (!$elm$core$Result$isOk(result))
		{
			return;
		}

		var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

		// 0 = Normal
		// 1 = MayStopPropagation
		// 2 = MayPreventDefault
		// 3 = Custom

		var value = result.a;
		var message = !tag ? value : tag < 3 ? value.a : value.ah;
		var stopPropagation = tag == 1 ? value.b : tag == 3 && value.cV;
		var currentEventNode = (
			stopPropagation && event.stopPropagation(),
			(tag == 2 ? value.b : tag == 3 && value.cL) && event.preventDefault(),
			eventNode
		);
		var tagger;
		var i;
		while (tagger = currentEventNode.j)
		{
			if (typeof tagger == 'function')
			{
				message = tagger(message);
			}
			else
			{
				for (var i = tagger.length; i--; )
				{
					message = tagger[i](message);
				}
			}
			currentEventNode = currentEventNode.p;
		}
		currentEventNode(message, stopPropagation); // stopPropagation implies isSync
	}

	callback.q = initialHandler;

	return callback;
}

function _VirtualDom_equalEvents(x, y)
{
	return x.$ == y.$ && _Json_equality(x.a, y.a);
}



// DIFF


// TODO: Should we do patches like in iOS?
//
// type Patch
//   = At Int Patch
//   | Batch (List Patch)
//   | Change ...
//
// How could it not be better?
//
function _VirtualDom_diff(x, y)
{
	var patches = [];
	_VirtualDom_diffHelp(x, y, patches, 0);
	return patches;
}


function _VirtualDom_pushPatch(patches, type, index, data)
{
	var patch = {
		$: type,
		r: index,
		s: data,
		t: undefined,
		u: undefined
	};
	patches.push(patch);
	return patch;
}


function _VirtualDom_diffHelp(x, y, patches, index)
{
	if (x === y)
	{
		return;
	}

	var xType = x.$;
	var yType = y.$;

	// Bail if you run into different types of nodes. Implies that the
	// structure has changed significantly and it's not worth a diff.
	if (xType !== yType)
	{
		if (xType === 1 && yType === 2)
		{
			y = _VirtualDom_dekey(y);
			yType = 1;
		}
		else
		{
			_VirtualDom_pushPatch(patches, 0, index, y);
			return;
		}
	}

	// Now we know that both nodes are the same $.
	switch (yType)
	{
		case 5:
			var xRefs = x.l;
			var yRefs = y.l;
			var i = xRefs.length;
			var same = i === yRefs.length;
			while (same && i--)
			{
				same = xRefs[i] === yRefs[i];
			}
			if (same)
			{
				y.k = x.k;
				return;
			}
			y.k = y.m();
			var subPatches = [];
			_VirtualDom_diffHelp(x.k, y.k, subPatches, 0);
			subPatches.length > 0 && _VirtualDom_pushPatch(patches, 1, index, subPatches);
			return;

		case 4:
			// gather nested taggers
			var xTaggers = x.j;
			var yTaggers = y.j;
			var nesting = false;

			var xSubNode = x.k;
			while (xSubNode.$ === 4)
			{
				nesting = true;

				typeof xTaggers !== 'object'
					? xTaggers = [xTaggers, xSubNode.j]
					: xTaggers.push(xSubNode.j);

				xSubNode = xSubNode.k;
			}

			var ySubNode = y.k;
			while (ySubNode.$ === 4)
			{
				nesting = true;

				typeof yTaggers !== 'object'
					? yTaggers = [yTaggers, ySubNode.j]
					: yTaggers.push(ySubNode.j);

				ySubNode = ySubNode.k;
			}

			// Just bail if different numbers of taggers. This implies the
			// structure of the virtual DOM has changed.
			if (nesting && xTaggers.length !== yTaggers.length)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			// check if taggers are "the same"
			if (nesting ? !_VirtualDom_pairwiseRefEqual(xTaggers, yTaggers) : xTaggers !== yTaggers)
			{
				_VirtualDom_pushPatch(patches, 2, index, yTaggers);
			}

			// diff everything below the taggers
			_VirtualDom_diffHelp(xSubNode, ySubNode, patches, index + 1);
			return;

		case 0:
			if (x.a !== y.a)
			{
				_VirtualDom_pushPatch(patches, 3, index, y.a);
			}
			return;

		case 1:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKids);
			return;

		case 2:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKeyedKids);
			return;

		case 3:
			if (x.h !== y.h)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
			factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

			var patch = y.i(x.g, y.g);
			patch && _VirtualDom_pushPatch(patches, 5, index, patch);

			return;
	}
}

// assumes the incoming arrays are the same length
function _VirtualDom_pairwiseRefEqual(as, bs)
{
	for (var i = 0; i < as.length; i++)
	{
		if (as[i] !== bs[i])
		{
			return false;
		}
	}

	return true;
}

function _VirtualDom_diffNodes(x, y, patches, index, diffKids)
{
	// Bail if obvious indicators have changed. Implies more serious
	// structural changes such that it's not worth it to diff.
	if (x.c !== y.c || x.f !== y.f)
	{
		_VirtualDom_pushPatch(patches, 0, index, y);
		return;
	}

	var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
	factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

	diffKids(x, y, patches, index);
}



// DIFF FACTS


// TODO Instead of creating a new diff object, it's possible to just test if
// there *is* a diff. During the actual patch, do the diff again and make the
// modifications directly. This way, there's no new allocations. Worth it?
function _VirtualDom_diffFacts(x, y, category)
{
	var diff;

	// look for changes and removals
	for (var xKey in x)
	{
		if (xKey === 'a1' || xKey === 'a0' || xKey === 'a3' || xKey === 'a4')
		{
			var subDiff = _VirtualDom_diffFacts(x[xKey], y[xKey] || {}, xKey);
			if (subDiff)
			{
				diff = diff || {};
				diff[xKey] = subDiff;
			}
			continue;
		}

		// remove if not in the new facts
		if (!(xKey in y))
		{
			diff = diff || {};
			diff[xKey] =
				!category
					? (typeof x[xKey] === 'string' ? '' : null)
					:
				(category === 'a1')
					? ''
					:
				(category === 'a0' || category === 'a3')
					? undefined
					:
				{ f: x[xKey].f, o: undefined };

			continue;
		}

		var xValue = x[xKey];
		var yValue = y[xKey];

		// reference equal, so don't worry about it
		if (xValue === yValue && xKey !== 'value' && xKey !== 'checked'
			|| category === 'a0' && _VirtualDom_equalEvents(xValue, yValue))
		{
			continue;
		}

		diff = diff || {};
		diff[xKey] = yValue;
	}

	// add new stuff
	for (var yKey in y)
	{
		if (!(yKey in x))
		{
			diff = diff || {};
			diff[yKey] = y[yKey];
		}
	}

	return diff;
}



// DIFF KIDS


function _VirtualDom_diffKids(xParent, yParent, patches, index)
{
	var xKids = xParent.e;
	var yKids = yParent.e;

	var xLen = xKids.length;
	var yLen = yKids.length;

	// FIGURE OUT IF THERE ARE INSERTS OR REMOVALS

	if (xLen > yLen)
	{
		_VirtualDom_pushPatch(patches, 6, index, {
			v: yLen,
			i: xLen - yLen
		});
	}
	else if (xLen < yLen)
	{
		_VirtualDom_pushPatch(patches, 7, index, {
			v: xLen,
			e: yKids
		});
	}

	// PAIRWISE DIFF EVERYTHING ELSE

	for (var minLen = xLen < yLen ? xLen : yLen, i = 0; i < minLen; i++)
	{
		var xKid = xKids[i];
		_VirtualDom_diffHelp(xKid, yKids[i], patches, ++index);
		index += xKid.b || 0;
	}
}



// KEYED DIFF


function _VirtualDom_diffKeyedKids(xParent, yParent, patches, rootIndex)
{
	var localPatches = [];

	var changes = {}; // Dict String Entry
	var inserts = []; // Array { index : Int, entry : Entry }
	// type Entry = { tag : String, vnode : VNode, index : Int, data : _ }

	var xKids = xParent.e;
	var yKids = yParent.e;
	var xLen = xKids.length;
	var yLen = yKids.length;
	var xIndex = 0;
	var yIndex = 0;

	var index = rootIndex;

	while (xIndex < xLen && yIndex < yLen)
	{
		var x = xKids[xIndex];
		var y = yKids[yIndex];

		var xKey = x.a;
		var yKey = y.a;
		var xNode = x.b;
		var yNode = y.b;

		var newMatch = undefined;
		var oldMatch = undefined;

		// check if keys match

		if (xKey === yKey)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNode, localPatches, index);
			index += xNode.b || 0;

			xIndex++;
			yIndex++;
			continue;
		}

		// look ahead 1 to detect insertions and removals.

		var xNext = xKids[xIndex + 1];
		var yNext = yKids[yIndex + 1];

		if (xNext)
		{
			var xNextKey = xNext.a;
			var xNextNode = xNext.b;
			oldMatch = yKey === xNextKey;
		}

		if (yNext)
		{
			var yNextKey = yNext.a;
			var yNextNode = yNext.b;
			newMatch = xKey === yNextKey;
		}


		// swap x and y
		if (newMatch && oldMatch)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			_VirtualDom_insertNode(changes, localPatches, xKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNextNode, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		// insert y
		if (newMatch)
		{
			index++;
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			index += xNode.b || 0;

			xIndex += 1;
			yIndex += 2;
			continue;
		}

		// remove x
		if (oldMatch)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 1;
			continue;
		}

		// remove x, insert y
		if (xNext && xNextKey === yNextKey)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNextNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		break;
	}

	// eat up any remaining nodes with removeNode and insertNode

	while (xIndex < xLen)
	{
		index++;
		var x = xKids[xIndex];
		var xNode = x.b;
		_VirtualDom_removeNode(changes, localPatches, x.a, xNode, index);
		index += xNode.b || 0;
		xIndex++;
	}

	while (yIndex < yLen)
	{
		var endInserts = endInserts || [];
		var y = yKids[yIndex];
		_VirtualDom_insertNode(changes, localPatches, y.a, y.b, undefined, endInserts);
		yIndex++;
	}

	if (localPatches.length > 0 || inserts.length > 0 || endInserts)
	{
		_VirtualDom_pushPatch(patches, 8, rootIndex, {
			w: localPatches,
			x: inserts,
			y: endInserts
		});
	}
}



// CHANGES FROM KEYED DIFF


var _VirtualDom_POSTFIX = '_elmW6BL';


function _VirtualDom_insertNode(changes, localPatches, key, vnode, yIndex, inserts)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		entry = {
			c: 0,
			z: vnode,
			r: yIndex,
			s: undefined
		};

		inserts.push({ r: yIndex, A: entry });
		changes[key] = entry;

		return;
	}

	// this key was removed earlier, a match!
	if (entry.c === 1)
	{
		inserts.push({ r: yIndex, A: entry });

		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(entry.z, vnode, subPatches, entry.r);
		entry.r = yIndex;
		entry.s.s = {
			w: subPatches,
			A: entry
		};

		return;
	}

	// this key has already been inserted or moved, a duplicate!
	_VirtualDom_insertNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, yIndex, inserts);
}


function _VirtualDom_removeNode(changes, localPatches, key, vnode, index)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		var patch = _VirtualDom_pushPatch(localPatches, 9, index, undefined);

		changes[key] = {
			c: 1,
			z: vnode,
			r: index,
			s: patch
		};

		return;
	}

	// this key was inserted earlier, a match!
	if (entry.c === 0)
	{
		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(vnode, entry.z, subPatches, index);

		_VirtualDom_pushPatch(localPatches, 9, index, {
			w: subPatches,
			A: entry
		});

		return;
	}

	// this key has already been removed or moved, a duplicate!
	_VirtualDom_removeNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, index);
}



// ADD DOM NODES
//
// Each DOM node has an "index" assigned in order of traversal. It is important
// to minimize our crawl over the actual DOM, so these indexes (along with the
// descendantsCount of virtual nodes) let us skip touching entire subtrees of
// the DOM if we know there are no patches there.


function _VirtualDom_addDomNodes(domNode, vNode, patches, eventNode)
{
	_VirtualDom_addDomNodesHelp(domNode, vNode, patches, 0, 0, vNode.b, eventNode);
}


// assumes `patches` is non-empty and indexes increase monotonically.
function _VirtualDom_addDomNodesHelp(domNode, vNode, patches, i, low, high, eventNode)
{
	var patch = patches[i];
	var index = patch.r;

	while (index === low)
	{
		var patchType = patch.$;

		if (patchType === 1)
		{
			_VirtualDom_addDomNodes(domNode, vNode.k, patch.s, eventNode);
		}
		else if (patchType === 8)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var subPatches = patch.s.w;
			if (subPatches.length > 0)
			{
				_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
			}
		}
		else if (patchType === 9)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var data = patch.s;
			if (data)
			{
				data.A.s = domNode;
				var subPatches = data.w;
				if (subPatches.length > 0)
				{
					_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
				}
			}
		}
		else
		{
			patch.t = domNode;
			patch.u = eventNode;
		}

		i++;

		if (!(patch = patches[i]) || (index = patch.r) > high)
		{
			return i;
		}
	}

	var tag = vNode.$;

	if (tag === 4)
	{
		var subNode = vNode.k;

		while (subNode.$ === 4)
		{
			subNode = subNode.k;
		}

		return _VirtualDom_addDomNodesHelp(domNode, subNode, patches, i, low + 1, high, domNode.elm_event_node_ref);
	}

	// tag must be 1 or 2 at this point

	var vKids = vNode.e;
	var childNodes = domNode.childNodes;
	for (var j = 0; j < vKids.length; j++)
	{
		low++;
		var vKid = tag === 1 ? vKids[j] : vKids[j].b;
		var nextLow = low + (vKid.b || 0);
		if (low <= index && index <= nextLow)
		{
			i = _VirtualDom_addDomNodesHelp(childNodes[j], vKid, patches, i, low, nextLow, eventNode);
			if (!(patch = patches[i]) || (index = patch.r) > high)
			{
				return i;
			}
		}
		low = nextLow;
	}
	return i;
}



// APPLY PATCHES


function _VirtualDom_applyPatches(rootDomNode, oldVirtualNode, patches, eventNode)
{
	if (patches.length === 0)
	{
		return rootDomNode;
	}

	_VirtualDom_addDomNodes(rootDomNode, oldVirtualNode, patches, eventNode);
	return _VirtualDom_applyPatchesHelp(rootDomNode, patches);
}

function _VirtualDom_applyPatchesHelp(rootDomNode, patches)
{
	for (var i = 0; i < patches.length; i++)
	{
		var patch = patches[i];
		var localDomNode = patch.t
		var newNode = _VirtualDom_applyPatch(localDomNode, patch);
		if (localDomNode === rootDomNode)
		{
			rootDomNode = newNode;
		}
	}
	return rootDomNode;
}

function _VirtualDom_applyPatch(domNode, patch)
{
	switch (patch.$)
	{
		case 0:
			return _VirtualDom_applyPatchRedraw(domNode, patch.s, patch.u);

		case 4:
			_VirtualDom_applyFacts(domNode, patch.u, patch.s);
			return domNode;

		case 3:
			domNode.replaceData(0, domNode.length, patch.s);
			return domNode;

		case 1:
			return _VirtualDom_applyPatchesHelp(domNode, patch.s);

		case 2:
			if (domNode.elm_event_node_ref)
			{
				domNode.elm_event_node_ref.j = patch.s;
			}
			else
			{
				domNode.elm_event_node_ref = { j: patch.s, p: patch.u };
			}
			return domNode;

		case 6:
			var data = patch.s;
			for (var i = 0; i < data.i; i++)
			{
				domNode.removeChild(domNode.childNodes[data.v]);
			}
			return domNode;

		case 7:
			var data = patch.s;
			var kids = data.e;
			var i = data.v;
			var theEnd = domNode.childNodes[i];
			for (; i < kids.length; i++)
			{
				domNode.insertBefore(_VirtualDom_render(kids[i], patch.u), theEnd);
			}
			return domNode;

		case 9:
			var data = patch.s;
			if (!data)
			{
				domNode.parentNode.removeChild(domNode);
				return domNode;
			}
			var entry = data.A;
			if (typeof entry.r !== 'undefined')
			{
				domNode.parentNode.removeChild(domNode);
			}
			entry.s = _VirtualDom_applyPatchesHelp(domNode, data.w);
			return domNode;

		case 8:
			return _VirtualDom_applyPatchReorder(domNode, patch);

		case 5:
			return patch.s(domNode);

		default:
			_Debug_crash(10); // 'Ran into an unknown patch!'
	}
}


function _VirtualDom_applyPatchRedraw(domNode, vNode, eventNode)
{
	var parentNode = domNode.parentNode;
	var newNode = _VirtualDom_render(vNode, eventNode);

	if (!newNode.elm_event_node_ref)
	{
		newNode.elm_event_node_ref = domNode.elm_event_node_ref;
	}

	if (parentNode && newNode !== domNode)
	{
		parentNode.replaceChild(newNode, domNode);
	}
	return newNode;
}


function _VirtualDom_applyPatchReorder(domNode, patch)
{
	var data = patch.s;

	// remove end inserts
	var frag = _VirtualDom_applyPatchReorderEndInsertsHelp(data.y, patch);

	// removals
	domNode = _VirtualDom_applyPatchesHelp(domNode, data.w);

	// inserts
	var inserts = data.x;
	for (var i = 0; i < inserts.length; i++)
	{
		var insert = inserts[i];
		var entry = insert.A;
		var node = entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u);
		domNode.insertBefore(node, domNode.childNodes[insert.r]);
	}

	// add end inserts
	if (frag)
	{
		_VirtualDom_appendChild(domNode, frag);
	}

	return domNode;
}


function _VirtualDom_applyPatchReorderEndInsertsHelp(endInserts, patch)
{
	if (!endInserts)
	{
		return;
	}

	var frag = _VirtualDom_doc.createDocumentFragment();
	for (var i = 0; i < endInserts.length; i++)
	{
		var insert = endInserts[i];
		var entry = insert.A;
		_VirtualDom_appendChild(frag, entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u)
		);
	}
	return frag;
}


function _VirtualDom_virtualize(node)
{
	// TEXT NODES

	if (node.nodeType === 3)
	{
		return _VirtualDom_text(node.textContent);
	}


	// WEIRD NODES

	if (node.nodeType !== 1)
	{
		return _VirtualDom_text('');
	}


	// ELEMENT NODES

	var attrList = _List_Nil;
	var attrs = node.attributes;
	for (var i = attrs.length; i--; )
	{
		var attr = attrs[i];
		var name = attr.name;
		var value = attr.value;
		attrList = _List_Cons( A2(_VirtualDom_attribute, name, value), attrList );
	}

	var tag = node.tagName.toLowerCase();
	var kidList = _List_Nil;
	var kids = node.childNodes;

	for (var i = kids.length; i--; )
	{
		kidList = _List_Cons(_VirtualDom_virtualize(kids[i]), kidList);
	}
	return A3(_VirtualDom_node, tag, attrList, kidList);
}

function _VirtualDom_dekey(keyedNode)
{
	var keyedKids = keyedNode.e;
	var len = keyedKids.length;
	var kids = new Array(len);
	for (var i = 0; i < len; i++)
	{
		kids[i] = keyedKids[i].b;
	}

	return {
		$: 1,
		c: keyedNode.c,
		d: keyedNode.d,
		e: kids,
		f: keyedNode.f,
		b: keyedNode.b
	};
}




// ELEMENT


var _Debugger_element;

var _Browser_element = _Debugger_element || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.et,
		impl.e5,
		impl.eZ,
		function(sendToApp, initialModel) {
			var view = impl.e6;
			/**/
			var domNode = args['node'];
			//*/
			/**_UNUSED/
			var domNode = args && args['node'] ? args['node'] : _Debug_crash(0);
			//*/
			var currNode = _VirtualDom_virtualize(domNode);

			return _Browser_makeAnimator(initialModel, function(model)
			{
				var nextNode = view(model);
				var patches = _VirtualDom_diff(currNode, nextNode);
				domNode = _VirtualDom_applyPatches(domNode, currNode, patches, sendToApp);
				currNode = nextNode;
			});
		}
	);
});



// DOCUMENT


var _Debugger_document;

var _Browser_document = _Debugger_document || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.et,
		impl.e5,
		impl.eZ,
		function(sendToApp, initialModel) {
			var divertHrefToApp = impl.cP && impl.cP(sendToApp)
			var view = impl.e6;
			var title = _VirtualDom_doc.title;
			var bodyNode = _VirtualDom_doc.body;
			var currNode = _VirtualDom_virtualize(bodyNode);
			return _Browser_makeAnimator(initialModel, function(model)
			{
				_VirtualDom_divertHrefToApp = divertHrefToApp;
				var doc = view(model);
				var nextNode = _VirtualDom_node('body')(_List_Nil)(doc.ce);
				var patches = _VirtualDom_diff(currNode, nextNode);
				bodyNode = _VirtualDom_applyPatches(bodyNode, currNode, patches, sendToApp);
				currNode = nextNode;
				_VirtualDom_divertHrefToApp = 0;
				(title !== doc.b7) && (_VirtualDom_doc.title = title = doc.b7);
			});
		}
	);
});



// ANIMATION


var _Browser_cancelAnimationFrame =
	typeof cancelAnimationFrame !== 'undefined'
		? cancelAnimationFrame
		: function(id) { clearTimeout(id); };

var _Browser_requestAnimationFrame =
	typeof requestAnimationFrame !== 'undefined'
		? requestAnimationFrame
		: function(callback) { return setTimeout(callback, 1000 / 60); };


function _Browser_makeAnimator(model, draw)
{
	draw(model);

	var state = 0;

	function updateIfNeeded()
	{
		state = state === 1
			? 0
			: ( _Browser_requestAnimationFrame(updateIfNeeded), draw(model), 1 );
	}

	return function(nextModel, isSync)
	{
		model = nextModel;

		isSync
			? ( draw(model),
				state === 2 && (state = 1)
				)
			: ( state === 0 && _Browser_requestAnimationFrame(updateIfNeeded),
				state = 2
				);
	};
}



// APPLICATION


function _Browser_application(impl)
{
	var onUrlChange = impl.eL;
	var onUrlRequest = impl.eM;
	var key = function() { key.a(onUrlChange(_Browser_getUrl())); };

	return _Browser_document({
		cP: function(sendToApp)
		{
			key.a = sendToApp;
			_Browser_window.addEventListener('popstate', key);
			_Browser_window.navigator.userAgent.indexOf('Trident') < 0 || _Browser_window.addEventListener('hashchange', key);

			return F2(function(domNode, event)
			{
				if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button < 1 && !domNode.target && !domNode.hasAttribute('download'))
				{
					event.preventDefault();
					var href = domNode.href;
					var curr = _Browser_getUrl();
					var next = $elm$url$Url$fromString(href).a;
					sendToApp(onUrlRequest(
						(next
							&& curr.dC === next.dC
							&& curr.di === next.di
							&& curr.dz.a === next.dz.a
						)
							? $elm$browser$Browser$Internal(next)
							: $elm$browser$Browser$External(href)
					));
				}
			});
		},
		et: function(flags)
		{
			return A3(impl.et, flags, _Browser_getUrl(), key);
		},
		e6: impl.e6,
		e5: impl.e5,
		eZ: impl.eZ
	});
}

function _Browser_getUrl()
{
	return $elm$url$Url$fromString(_VirtualDom_doc.location.href).a || _Debug_crash(1);
}

var _Browser_go = F2(function(key, n)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		n && history.go(n);
		key();
	}));
});

var _Browser_pushUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.pushState({}, '', url);
		key();
	}));
});

var _Browser_replaceUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.replaceState({}, '', url);
		key();
	}));
});



// GLOBAL EVENTS


var _Browser_fakeNode = { addEventListener: function() {}, removeEventListener: function() {} };
var _Browser_doc = typeof document !== 'undefined' ? document : _Browser_fakeNode;
var _Browser_window = typeof window !== 'undefined' ? window : _Browser_fakeNode;

var _Browser_on = F3(function(node, eventName, sendToSelf)
{
	return _Scheduler_spawn(_Scheduler_binding(function(callback)
	{
		function handler(event)	{ _Scheduler_rawSpawn(sendToSelf(event)); }
		node.addEventListener(eventName, handler, _VirtualDom_passiveSupported && { passive: true });
		return function() { node.removeEventListener(eventName, handler); };
	}));
});

var _Browser_decodeEvent = F2(function(decoder, event)
{
	var result = _Json_runHelp(decoder, event);
	return $elm$core$Result$isOk(result) ? $elm$core$Maybe$Just(result.a) : $elm$core$Maybe$Nothing;
});



// PAGE VISIBILITY


function _Browser_visibilityInfo()
{
	return (typeof _VirtualDom_doc.hidden !== 'undefined')
		? { aN: 'hidden', d5: 'visibilitychange' }
		:
	(typeof _VirtualDom_doc.mozHidden !== 'undefined')
		? { aN: 'mozHidden', d5: 'mozvisibilitychange' }
		:
	(typeof _VirtualDom_doc.msHidden !== 'undefined')
		? { aN: 'msHidden', d5: 'msvisibilitychange' }
		:
	(typeof _VirtualDom_doc.webkitHidden !== 'undefined')
		? { aN: 'webkitHidden', d5: 'webkitvisibilitychange' }
		: { aN: 'hidden', d5: 'visibilitychange' };
}



// ANIMATION FRAMES


function _Browser_rAF()
{
	return _Scheduler_binding(function(callback)
	{
		var id = _Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(Date.now()));
		});

		return function() {
			_Browser_cancelAnimationFrame(id);
		};
	});
}


function _Browser_now()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(Date.now()));
	});
}



// DOM STUFF


function _Browser_withNode(id, doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			var node = document.getElementById(id);
			callback(node
				? _Scheduler_succeed(doStuff(node))
				: _Scheduler_fail($elm$browser$Browser$Dom$NotFound(id))
			);
		});
	});
}


function _Browser_withWindow(doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(doStuff()));
		});
	});
}


// FOCUS and BLUR


var _Browser_call = F2(function(functionName, id)
{
	return _Browser_withNode(id, function(node) {
		node[functionName]();
		return _Utils_Tuple0;
	});
});



// WINDOW VIEWPORT


function _Browser_getViewport()
{
	return {
		dJ: _Browser_getScene(),
		dU: {
			dX: _Browser_window.pageXOffset,
			dY: _Browser_window.pageYOffset,
			dW: _Browser_doc.documentElement.clientWidth,
			dh: _Browser_doc.documentElement.clientHeight
		}
	};
}

function _Browser_getScene()
{
	var body = _Browser_doc.body;
	var elem = _Browser_doc.documentElement;
	return {
		dW: Math.max(body.scrollWidth, body.offsetWidth, elem.scrollWidth, elem.offsetWidth, elem.clientWidth),
		dh: Math.max(body.scrollHeight, body.offsetHeight, elem.scrollHeight, elem.offsetHeight, elem.clientHeight)
	};
}

var _Browser_setViewport = F2(function(x, y)
{
	return _Browser_withWindow(function()
	{
		_Browser_window.scroll(x, y);
		return _Utils_Tuple0;
	});
});



// ELEMENT VIEWPORT


function _Browser_getViewportOf(id)
{
	return _Browser_withNode(id, function(node)
	{
		return {
			dJ: {
				dW: node.scrollWidth,
				dh: node.scrollHeight
			},
			dU: {
				dX: node.scrollLeft,
				dY: node.scrollTop,
				dW: node.clientWidth,
				dh: node.clientHeight
			}
		};
	});
}


var _Browser_setViewportOf = F3(function(id, x, y)
{
	return _Browser_withNode(id, function(node)
	{
		node.scrollLeft = x;
		node.scrollTop = y;
		return _Utils_Tuple0;
	});
});



// ELEMENT


function _Browser_getElement(id)
{
	return _Browser_withNode(id, function(node)
	{
		var rect = node.getBoundingClientRect();
		var x = _Browser_window.pageXOffset;
		var y = _Browser_window.pageYOffset;
		return {
			dJ: _Browser_getScene(),
			dU: {
				dX: x,
				dY: y,
				dW: _Browser_doc.documentElement.clientWidth,
				dh: _Browser_doc.documentElement.clientHeight
			},
			ec: {
				dX: x + rect.left,
				dY: y + rect.top,
				dW: rect.width,
				dh: rect.height
			}
		};
	});
}



// LOAD and RELOAD


function _Browser_reload(skipCache)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		_VirtualDom_doc.location.reload(skipCache);
	}));
}

function _Browser_load(url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		try
		{
			_Browser_window.location = url;
		}
		catch(err)
		{
			// Only Firefox can throw a NS_ERROR_MALFORMED_URI exception here.
			// Other browsers reload the page, so let's be consistent about that.
			_VirtualDom_doc.location.reload(false);
		}
	}));
}



function _Time_now(millisToPosix)
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(millisToPosix(Date.now())));
	});
}

var _Time_setInterval = F2(function(interval, task)
{
	return _Scheduler_binding(function(callback)
	{
		var id = setInterval(function() { _Scheduler_rawSpawn(task); }, interval);
		return function() { clearInterval(id); };
	});
});

function _Time_here()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(
			A2($elm$time$Time$customZone, -(new Date().getTimezoneOffset()), _List_Nil)
		));
	});
}


function _Time_getZoneName()
{
	return _Scheduler_binding(function(callback)
	{
		try
		{
			var name = $elm$time$Time$Name(Intl.DateTimeFormat().resolvedOptions().timeZone);
		}
		catch (e)
		{
			var name = $elm$time$Time$Offset(new Date().getTimezoneOffset());
		}
		callback(_Scheduler_succeed(name));
	});
}



var _Bitwise_and = F2(function(a, b)
{
	return a & b;
});

var _Bitwise_or = F2(function(a, b)
{
	return a | b;
});

var _Bitwise_xor = F2(function(a, b)
{
	return a ^ b;
});

function _Bitwise_complement(a)
{
	return ~a;
};

var _Bitwise_shiftLeftBy = F2(function(offset, a)
{
	return a << offset;
});

var _Bitwise_shiftRightBy = F2(function(offset, a)
{
	return a >> offset;
});

var _Bitwise_shiftRightZfBy = F2(function(offset, a)
{
	return a >>> offset;
});
var $elm$core$List$cons = _List_cons;
var $elm$core$Elm$JsArray$foldr = _JsArray_foldr;
var $elm$core$Array$foldr = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (!node.$) {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldr, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldr, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldr,
			helper,
			A3($elm$core$Elm$JsArray$foldr, func, baseCase, tail),
			tree);
	});
var $elm$core$Array$toList = function (array) {
	return A3($elm$core$Array$foldr, $elm$core$List$cons, _List_Nil, array);
};
var $elm$core$Dict$foldr = F3(
	function (func, acc, t) {
		foldr:
		while (true) {
			if (t.$ === -2) {
				return acc;
			} else {
				var key = t.b;
				var value = t.c;
				var left = t.d;
				var right = t.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldr, func, acc, right)),
					$temp$t = left;
				func = $temp$func;
				acc = $temp$acc;
				t = $temp$t;
				continue foldr;
			}
		}
	});
var $elm$core$Dict$toList = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, list) {
				return A2(
					$elm$core$List$cons,
					_Utils_Tuple2(key, value),
					list);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Dict$keys = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, keyList) {
				return A2($elm$core$List$cons, key, keyList);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Set$toList = function (_v0) {
	var dict = _v0;
	return $elm$core$Dict$keys(dict);
};
var $elm$core$Basics$EQ = 1;
var $elm$core$Basics$GT = 2;
var $elm$core$Basics$LT = 0;
var $author$project$Main$Page = function (a) {
	return {$: 1, a: a};
};
var $author$project$Main$Unit = function (a) {
	return {$: 0, a: a};
};
var $elm$core$Result$Err = function (a) {
	return {$: 1, a: a};
};
var $elm$json$Json$Decode$Failure = F2(
	function (a, b) {
		return {$: 3, a: a, b: b};
	});
var $elm$json$Json$Decode$Field = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $elm$json$Json$Decode$Index = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $elm$core$Result$Ok = function (a) {
	return {$: 0, a: a};
};
var $elm$json$Json$Decode$OneOf = function (a) {
	return {$: 2, a: a};
};
var $elm$core$Basics$False = 1;
var $elm$core$Basics$add = _Basics_add;
var $elm$core$Maybe$Just = function (a) {
	return {$: 0, a: a};
};
var $elm$core$Maybe$Nothing = {$: 1};
var $elm$core$String$all = _String_all;
var $elm$core$Basics$and = _Basics_and;
var $elm$core$Basics$append = _Utils_append;
var $elm$json$Json$Encode$encode = _Json_encode;
var $elm$core$String$fromInt = _String_fromNumber;
var $elm$core$String$join = F2(
	function (sep, chunks) {
		return A2(
			_String_join,
			sep,
			_List_toArray(chunks));
	});
var $elm$core$String$split = F2(
	function (sep, string) {
		return _List_fromArray(
			A2(_String_split, sep, string));
	});
var $elm$json$Json$Decode$indent = function (str) {
	return A2(
		$elm$core$String$join,
		'\n    ',
		A2($elm$core$String$split, '\n', str));
};
var $elm$core$List$foldl = F3(
	function (func, acc, list) {
		foldl:
		while (true) {
			if (!list.b) {
				return acc;
			} else {
				var x = list.a;
				var xs = list.b;
				var $temp$func = func,
					$temp$acc = A2(func, x, acc),
					$temp$list = xs;
				func = $temp$func;
				acc = $temp$acc;
				list = $temp$list;
				continue foldl;
			}
		}
	});
var $elm$core$List$length = function (xs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, i) {
				return i + 1;
			}),
		0,
		xs);
};
var $elm$core$List$map2 = _List_map2;
var $elm$core$Basics$le = _Utils_le;
var $elm$core$Basics$sub = _Basics_sub;
var $elm$core$List$rangeHelp = F3(
	function (lo, hi, list) {
		rangeHelp:
		while (true) {
			if (_Utils_cmp(lo, hi) < 1) {
				var $temp$lo = lo,
					$temp$hi = hi - 1,
					$temp$list = A2($elm$core$List$cons, hi, list);
				lo = $temp$lo;
				hi = $temp$hi;
				list = $temp$list;
				continue rangeHelp;
			} else {
				return list;
			}
		}
	});
var $elm$core$List$range = F2(
	function (lo, hi) {
		return A3($elm$core$List$rangeHelp, lo, hi, _List_Nil);
	});
var $elm$core$List$indexedMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$map2,
			f,
			A2(
				$elm$core$List$range,
				0,
				$elm$core$List$length(xs) - 1),
			xs);
	});
var $elm$core$Char$toCode = _Char_toCode;
var $elm$core$Char$isLower = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (97 <= code) && (code <= 122);
};
var $elm$core$Char$isUpper = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 90) && (65 <= code);
};
var $elm$core$Basics$or = _Basics_or;
var $elm$core$Char$isAlpha = function (_char) {
	return $elm$core$Char$isLower(_char) || $elm$core$Char$isUpper(_char);
};
var $elm$core$Char$isDigit = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 57) && (48 <= code);
};
var $elm$core$Char$isAlphaNum = function (_char) {
	return $elm$core$Char$isLower(_char) || ($elm$core$Char$isUpper(_char) || $elm$core$Char$isDigit(_char));
};
var $elm$core$List$reverse = function (list) {
	return A3($elm$core$List$foldl, $elm$core$List$cons, _List_Nil, list);
};
var $elm$core$String$uncons = _String_uncons;
var $elm$json$Json$Decode$errorOneOf = F2(
	function (i, error) {
		return '\n\n(' + ($elm$core$String$fromInt(i + 1) + (') ' + $elm$json$Json$Decode$indent(
			$elm$json$Json$Decode$errorToString(error))));
	});
var $elm$json$Json$Decode$errorToString = function (error) {
	return A2($elm$json$Json$Decode$errorToStringHelp, error, _List_Nil);
};
var $elm$json$Json$Decode$errorToStringHelp = F2(
	function (error, context) {
		errorToStringHelp:
		while (true) {
			switch (error.$) {
				case 0:
					var f = error.a;
					var err = error.b;
					var isSimple = function () {
						var _v1 = $elm$core$String$uncons(f);
						if (_v1.$ === 1) {
							return false;
						} else {
							var _v2 = _v1.a;
							var _char = _v2.a;
							var rest = _v2.b;
							return $elm$core$Char$isAlpha(_char) && A2($elm$core$String$all, $elm$core$Char$isAlphaNum, rest);
						}
					}();
					var fieldName = isSimple ? ('.' + f) : ('[\'' + (f + '\']'));
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, fieldName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 1:
					var i = error.a;
					var err = error.b;
					var indexName = '[' + ($elm$core$String$fromInt(i) + ']');
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, indexName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 2:
					var errors = error.a;
					if (!errors.b) {
						return 'Ran into a Json.Decode.oneOf with no possibilities' + function () {
							if (!context.b) {
								return '!';
							} else {
								return ' at json' + A2(
									$elm$core$String$join,
									'',
									$elm$core$List$reverse(context));
							}
						}();
					} else {
						if (!errors.b.b) {
							var err = errors.a;
							var $temp$error = err,
								$temp$context = context;
							error = $temp$error;
							context = $temp$context;
							continue errorToStringHelp;
						} else {
							var starter = function () {
								if (!context.b) {
									return 'Json.Decode.oneOf';
								} else {
									return 'The Json.Decode.oneOf at json' + A2(
										$elm$core$String$join,
										'',
										$elm$core$List$reverse(context));
								}
							}();
							var introduction = starter + (' failed in the following ' + ($elm$core$String$fromInt(
								$elm$core$List$length(errors)) + ' ways:'));
							return A2(
								$elm$core$String$join,
								'\n\n',
								A2(
									$elm$core$List$cons,
									introduction,
									A2($elm$core$List$indexedMap, $elm$json$Json$Decode$errorOneOf, errors)));
						}
					}
				default:
					var msg = error.a;
					var json = error.b;
					var introduction = function () {
						if (!context.b) {
							return 'Problem with the given value:\n\n';
						} else {
							return 'Problem with the value at json' + (A2(
								$elm$core$String$join,
								'',
								$elm$core$List$reverse(context)) + ':\n\n    ');
						}
					}();
					return introduction + ($elm$json$Json$Decode$indent(
						A2($elm$json$Json$Encode$encode, 4, json)) + ('\n\n' + msg));
			}
		}
	});
var $elm$core$Array$branchFactor = 32;
var $elm$core$Array$Array_elm_builtin = F4(
	function (a, b, c, d) {
		return {$: 0, a: a, b: b, c: c, d: d};
	});
var $elm$core$Elm$JsArray$empty = _JsArray_empty;
var $elm$core$Basics$ceiling = _Basics_ceiling;
var $elm$core$Basics$fdiv = _Basics_fdiv;
var $elm$core$Basics$logBase = F2(
	function (base, number) {
		return _Basics_log(number) / _Basics_log(base);
	});
var $elm$core$Basics$toFloat = _Basics_toFloat;
var $elm$core$Array$shiftStep = $elm$core$Basics$ceiling(
	A2($elm$core$Basics$logBase, 2, $elm$core$Array$branchFactor));
var $elm$core$Array$empty = A4($elm$core$Array$Array_elm_builtin, 0, $elm$core$Array$shiftStep, $elm$core$Elm$JsArray$empty, $elm$core$Elm$JsArray$empty);
var $elm$core$Elm$JsArray$initialize = _JsArray_initialize;
var $elm$core$Array$Leaf = function (a) {
	return {$: 1, a: a};
};
var $elm$core$Basics$apL = F2(
	function (f, x) {
		return f(x);
	});
var $elm$core$Basics$apR = F2(
	function (x, f) {
		return f(x);
	});
var $elm$core$Basics$eq = _Utils_equal;
var $elm$core$Basics$floor = _Basics_floor;
var $elm$core$Elm$JsArray$length = _JsArray_length;
var $elm$core$Basics$gt = _Utils_gt;
var $elm$core$Basics$max = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) > 0) ? x : y;
	});
var $elm$core$Basics$mul = _Basics_mul;
var $elm$core$Array$SubTree = function (a) {
	return {$: 0, a: a};
};
var $elm$core$Elm$JsArray$initializeFromList = _JsArray_initializeFromList;
var $elm$core$Array$compressNodes = F2(
	function (nodes, acc) {
		compressNodes:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodes);
			var node = _v0.a;
			var remainingNodes = _v0.b;
			var newAcc = A2(
				$elm$core$List$cons,
				$elm$core$Array$SubTree(node),
				acc);
			if (!remainingNodes.b) {
				return $elm$core$List$reverse(newAcc);
			} else {
				var $temp$nodes = remainingNodes,
					$temp$acc = newAcc;
				nodes = $temp$nodes;
				acc = $temp$acc;
				continue compressNodes;
			}
		}
	});
var $elm$core$Tuple$first = function (_v0) {
	var x = _v0.a;
	return x;
};
var $elm$core$Array$treeFromBuilder = F2(
	function (nodeList, nodeListSize) {
		treeFromBuilder:
		while (true) {
			var newNodeSize = $elm$core$Basics$ceiling(nodeListSize / $elm$core$Array$branchFactor);
			if (newNodeSize === 1) {
				return A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodeList).a;
			} else {
				var $temp$nodeList = A2($elm$core$Array$compressNodes, nodeList, _List_Nil),
					$temp$nodeListSize = newNodeSize;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue treeFromBuilder;
			}
		}
	});
var $elm$core$Array$builderToArray = F2(
	function (reverseNodeList, builder) {
		if (!builder.i) {
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.e1),
				$elm$core$Array$shiftStep,
				$elm$core$Elm$JsArray$empty,
				builder.e1);
		} else {
			var treeLen = builder.i * $elm$core$Array$branchFactor;
			var depth = $elm$core$Basics$floor(
				A2($elm$core$Basics$logBase, $elm$core$Array$branchFactor, treeLen - 1));
			var correctNodeList = reverseNodeList ? $elm$core$List$reverse(builder.m) : builder.m;
			var tree = A2($elm$core$Array$treeFromBuilder, correctNodeList, builder.i);
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.e1) + treeLen,
				A2($elm$core$Basics$max, 5, depth * $elm$core$Array$shiftStep),
				tree,
				builder.e1);
		}
	});
var $elm$core$Basics$idiv = _Basics_idiv;
var $elm$core$Basics$lt = _Utils_lt;
var $elm$core$Array$initializeHelp = F5(
	function (fn, fromIndex, len, nodeList, tail) {
		initializeHelp:
		while (true) {
			if (fromIndex < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					false,
					{m: nodeList, i: (len / $elm$core$Array$branchFactor) | 0, e1: tail});
			} else {
				var leaf = $elm$core$Array$Leaf(
					A3($elm$core$Elm$JsArray$initialize, $elm$core$Array$branchFactor, fromIndex, fn));
				var $temp$fn = fn,
					$temp$fromIndex = fromIndex - $elm$core$Array$branchFactor,
					$temp$len = len,
					$temp$nodeList = A2($elm$core$List$cons, leaf, nodeList),
					$temp$tail = tail;
				fn = $temp$fn;
				fromIndex = $temp$fromIndex;
				len = $temp$len;
				nodeList = $temp$nodeList;
				tail = $temp$tail;
				continue initializeHelp;
			}
		}
	});
var $elm$core$Basics$remainderBy = _Basics_remainderBy;
var $elm$core$Array$initialize = F2(
	function (len, fn) {
		if (len <= 0) {
			return $elm$core$Array$empty;
		} else {
			var tailLen = len % $elm$core$Array$branchFactor;
			var tail = A3($elm$core$Elm$JsArray$initialize, tailLen, len - tailLen, fn);
			var initialFromIndex = (len - tailLen) - $elm$core$Array$branchFactor;
			return A5($elm$core$Array$initializeHelp, fn, initialFromIndex, len, _List_Nil, tail);
		}
	});
var $elm$core$Basics$True = 0;
var $elm$core$Result$isOk = function (result) {
	if (!result.$) {
		return true;
	} else {
		return false;
	}
};
var $elm$core$Platform$Sub$batch = _Platform_batch;
var $elm$json$Json$Decode$map = _Json_map1;
var $elm$json$Json$Decode$map2 = _Json_map2;
var $elm$json$Json$Decode$succeed = _Json_succeed;
var $elm$virtual_dom$VirtualDom$toHandlerInt = function (handler) {
	switch (handler.$) {
		case 0:
			return 0;
		case 1:
			return 1;
		case 2:
			return 2;
		default:
			return 3;
	}
};
var $elm$browser$Browser$External = function (a) {
	return {$: 1, a: a};
};
var $elm$browser$Browser$Internal = function (a) {
	return {$: 0, a: a};
};
var $elm$core$Basics$identity = function (x) {
	return x;
};
var $elm$browser$Browser$Dom$NotFound = $elm$core$Basics$identity;
var $elm$url$Url$Http = 0;
var $elm$url$Url$Https = 1;
var $elm$url$Url$Url = F6(
	function (protocol, host, port_, path, query, fragment) {
		return {dc: fragment, di: host, dw: path, dz: port_, dC: protocol, dD: query};
	});
var $elm$core$String$contains = _String_contains;
var $elm$core$String$length = _String_length;
var $elm$core$String$slice = _String_slice;
var $elm$core$String$dropLeft = F2(
	function (n, string) {
		return (n < 1) ? string : A3(
			$elm$core$String$slice,
			n,
			$elm$core$String$length(string),
			string);
	});
var $elm$core$String$indexes = _String_indexes;
var $elm$core$String$isEmpty = function (string) {
	return string === '';
};
var $elm$core$String$left = F2(
	function (n, string) {
		return (n < 1) ? '' : A3($elm$core$String$slice, 0, n, string);
	});
var $elm$core$String$toInt = _String_toInt;
var $elm$url$Url$chompBeforePath = F5(
	function (protocol, path, params, frag, str) {
		if ($elm$core$String$isEmpty(str) || A2($elm$core$String$contains, '@', str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, ':', str);
			if (!_v0.b) {
				return $elm$core$Maybe$Just(
					A6($elm$url$Url$Url, protocol, str, $elm$core$Maybe$Nothing, path, params, frag));
			} else {
				if (!_v0.b.b) {
					var i = _v0.a;
					var _v1 = $elm$core$String$toInt(
						A2($elm$core$String$dropLeft, i + 1, str));
					if (_v1.$ === 1) {
						return $elm$core$Maybe$Nothing;
					} else {
						var port_ = _v1;
						return $elm$core$Maybe$Just(
							A6(
								$elm$url$Url$Url,
								protocol,
								A2($elm$core$String$left, i, str),
								port_,
								path,
								params,
								frag));
					}
				} else {
					return $elm$core$Maybe$Nothing;
				}
			}
		}
	});
var $elm$url$Url$chompBeforeQuery = F4(
	function (protocol, params, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '/', str);
			if (!_v0.b) {
				return A5($elm$url$Url$chompBeforePath, protocol, '/', params, frag, str);
			} else {
				var i = _v0.a;
				return A5(
					$elm$url$Url$chompBeforePath,
					protocol,
					A2($elm$core$String$dropLeft, i, str),
					params,
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompBeforeFragment = F3(
	function (protocol, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '?', str);
			if (!_v0.b) {
				return A4($elm$url$Url$chompBeforeQuery, protocol, $elm$core$Maybe$Nothing, frag, str);
			} else {
				var i = _v0.a;
				return A4(
					$elm$url$Url$chompBeforeQuery,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompAfterProtocol = F2(
	function (protocol, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '#', str);
			if (!_v0.b) {
				return A3($elm$url$Url$chompBeforeFragment, protocol, $elm$core$Maybe$Nothing, str);
			} else {
				var i = _v0.a;
				return A3(
					$elm$url$Url$chompBeforeFragment,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$core$String$startsWith = _String_startsWith;
var $elm$url$Url$fromString = function (str) {
	return A2($elm$core$String$startsWith, 'http://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		0,
		A2($elm$core$String$dropLeft, 7, str)) : (A2($elm$core$String$startsWith, 'https://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		1,
		A2($elm$core$String$dropLeft, 8, str)) : $elm$core$Maybe$Nothing);
};
var $elm$core$Basics$never = function (_v0) {
	never:
	while (true) {
		var nvr = _v0;
		var $temp$_v0 = nvr;
		_v0 = $temp$_v0;
		continue never;
	}
};
var $elm$core$Task$Perform = $elm$core$Basics$identity;
var $elm$core$Task$succeed = _Scheduler_succeed;
var $elm$core$Task$init = $elm$core$Task$succeed(0);
var $elm$core$List$foldrHelper = F4(
	function (fn, acc, ctr, ls) {
		if (!ls.b) {
			return acc;
		} else {
			var a = ls.a;
			var r1 = ls.b;
			if (!r1.b) {
				return A2(fn, a, acc);
			} else {
				var b = r1.a;
				var r2 = r1.b;
				if (!r2.b) {
					return A2(
						fn,
						a,
						A2(fn, b, acc));
				} else {
					var c = r2.a;
					var r3 = r2.b;
					if (!r3.b) {
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(fn, c, acc)));
					} else {
						var d = r3.a;
						var r4 = r3.b;
						var res = (ctr > 500) ? A3(
							$elm$core$List$foldl,
							fn,
							acc,
							$elm$core$List$reverse(r4)) : A4($elm$core$List$foldrHelper, fn, acc, ctr + 1, r4);
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(
									fn,
									c,
									A2(fn, d, res))));
					}
				}
			}
		}
	});
var $elm$core$List$foldr = F3(
	function (fn, acc, ls) {
		return A4($elm$core$List$foldrHelper, fn, acc, 0, ls);
	});
var $elm$core$List$map = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, acc) {
					return A2(
						$elm$core$List$cons,
						f(x),
						acc);
				}),
			_List_Nil,
			xs);
	});
var $elm$core$Task$andThen = _Scheduler_andThen;
var $elm$core$Task$map = F2(
	function (func, taskA) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return $elm$core$Task$succeed(
					func(a));
			},
			taskA);
	});
var $elm$core$Task$map2 = F3(
	function (func, taskA, taskB) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return A2(
					$elm$core$Task$andThen,
					function (b) {
						return $elm$core$Task$succeed(
							A2(func, a, b));
					},
					taskB);
			},
			taskA);
	});
var $elm$core$Task$sequence = function (tasks) {
	return A3(
		$elm$core$List$foldr,
		$elm$core$Task$map2($elm$core$List$cons),
		$elm$core$Task$succeed(_List_Nil),
		tasks);
};
var $elm$core$Platform$sendToApp = _Platform_sendToApp;
var $elm$core$Task$spawnCmd = F2(
	function (router, _v0) {
		var task = _v0;
		return _Scheduler_spawn(
			A2(
				$elm$core$Task$andThen,
				$elm$core$Platform$sendToApp(router),
				task));
	});
var $elm$core$Task$onEffects = F3(
	function (router, commands, state) {
		return A2(
			$elm$core$Task$map,
			function (_v0) {
				return 0;
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Task$spawnCmd(router),
					commands)));
	});
var $elm$core$Task$onSelfMsg = F3(
	function (_v0, _v1, _v2) {
		return $elm$core$Task$succeed(0);
	});
var $elm$core$Task$cmdMap = F2(
	function (tagger, _v0) {
		var task = _v0;
		return A2($elm$core$Task$map, tagger, task);
	});
_Platform_effectManagers['Task'] = _Platform_createManager($elm$core$Task$init, $elm$core$Task$onEffects, $elm$core$Task$onSelfMsg, $elm$core$Task$cmdMap);
var $elm$core$Task$command = _Platform_leaf('Task');
var $elm$core$Task$perform = F2(
	function (toMessage, task) {
		return $elm$core$Task$command(
			A2($elm$core$Task$map, toMessage, task));
	});
var $elm$browser$Browser$element = _Browser_element;
var $author$project$Ui$Tokens$Day = 0;
var $author$project$Ui$Tokens$Night = 1;
var $elm$core$Maybe$andThen = F2(
	function (callback, maybeValue) {
		if (!maybeValue.$) {
			var value = maybeValue.a;
			return callback(value);
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$Ui$Tokens$fromName = function (s) {
	switch (s) {
		case 'day':
			return $elm$core$Maybe$Just(0);
		case 'night':
			return $elm$core$Maybe$Just(1);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Ui$Tokens$fromPreference = function (p) {
	var _v0 = A2($elm$core$Maybe$andThen, $author$project$Ui$Tokens$fromName, p.cW);
	if (!_v0.$) {
		var t = _v0.a;
		return t;
	} else {
		var _v1 = p.bT;
		if (!_v1) {
			return 1;
		} else {
			return 0;
		}
	}
};
var $author$project$Model$Greeting = {$: 0};
var $author$project$Model$Seat = $elm$core$Basics$identity;
var $elm$core$Dict$RBEmpty_elm_builtin = {$: -2};
var $elm$core$Dict$empty = $elm$core$Dict$RBEmpty_elm_builtin;
var $author$project$Schema$Schema = $elm$core$Basics$identity;
var $author$project$Schema$empty = {
	ci: $elm$core$Maybe$Nothing,
	es: $elm$core$Dict$empty,
	bR: {bJ: _List_Nil, cm: $elm$core$Maybe$Nothing, cM: $elm$core$Maybe$Nothing, b5: _List_Nil},
	cB: {cg: _List_Nil, bO: _List_Nil, ew: _List_Nil, bd: $elm$core$Maybe$Nothing, cE: _List_Nil, cO: $elm$core$Maybe$Nothing, cS: $elm$core$Maybe$Nothing},
	aU: _List_Nil,
	aB: _List_Nil
};
var $author$project$Flow$Idle = {$: 0};
var $author$project$Flow$idle = $author$project$Flow$Idle;
var $elm$time$Time$Posix = $elm$core$Basics$identity;
var $elm$time$Time$millisToPosix = $elm$core$Basics$identity;
var $author$project$Model$init = {
	e: $elm$core$Maybe$Nothing,
	l: _List_Nil,
	a6: $elm$core$Dict$empty,
	aJ: $elm$core$Maybe$Nothing,
	t: $elm$core$Maybe$Nothing,
	u: $author$project$Flow$idle,
	ba: $elm$core$Maybe$Nothing,
	aw: $elm$core$Dict$empty,
	ay: $author$project$Schema$empty,
	az: _List_Nil,
	H: _List_Nil,
	T: $elm$core$Maybe$Nothing,
	aA: false,
	aP: $elm$core$Maybe$Nothing,
	aQ: $elm$core$Maybe$Nothing,
	af: 0,
	bc: _List_Nil,
	cw: $elm$core$Maybe$Nothing,
	bd: $elm$core$Dict$empty,
	bR: $author$project$Schema$empty,
	cB: $author$project$Schema$empty,
	ai: $author$project$Schema$empty,
	I: $elm$time$Time$millisToPosix(0),
	bj: $author$project$Schema$empty,
	s: 0,
	ak: $elm$core$Maybe$Nothing,
	bm: $elm$core$Dict$empty,
	bV: $elm$core$Maybe$Nothing,
	z: $elm$core$Dict$empty,
	W: $elm$core$Dict$empty,
	b$: $elm$core$Maybe$Nothing,
	g: $author$project$Schema$empty,
	aE: 0,
	bq: $author$project$Schema$empty,
	b3: $elm$core$Dict$empty,
	b4: $elm$core$Maybe$Nothing,
	br: $elm$core$Dict$empty,
	bs: $elm$core$Dict$empty,
	cR: $elm$core$Maybe$Nothing,
	b: $author$project$Model$Greeting,
	bu: $elm$core$Dict$empty,
	b8: $elm$core$Maybe$Nothing,
	K: $elm$core$Dict$empty,
	L: $elm$core$Dict$empty,
	a0: $elm$core$Maybe$Nothing,
	bA: false
};
var $author$project$Ui$PadStrip$Kit = {$: 0};
var $author$project$Ui$Control$Wanted = $elm$core$Basics$identity;
var $author$project$Ui$Control$empty = $elm$core$Dict$empty;
var $author$project$Ui$Control$Idle = {$: 0};
var $author$project$Ui$Control$idle = $author$project$Ui$Control$Idle;
var $author$project$Ui$Page$State = $elm$core$Basics$identity;
var $author$project$Ui$Module$Folds = $elm$core$Basics$identity;
var $elm$core$Set$Set_elm_builtin = $elm$core$Basics$identity;
var $elm$core$Set$empty = $elm$core$Dict$empty;
var $author$project$Ui$Module$noFolds = $elm$core$Set$empty;
var $author$project$Ui$Chip$Chips = $elm$core$Basics$identity;
var $author$project$Ui$Chip$none = $elm$core$Set$empty;
var $author$project$Ui$Page$init = function (t) {
	return {bM: $author$project$Ui$Module$noFolds, aN: $author$project$Ui$Chip$none, a_: t};
};
var $author$project$Ui$Menu$Shut = {$: 0};
var $author$project$Ui$Menu$shut = $author$project$Ui$Menu$Shut;
var $author$project$View$EnginePage$init = function (t) {
	return {
		aI: $elm$core$Dict$empty,
		aK: $author$project$Ui$Control$idle,
		bf: $author$project$Ui$Menu$shut,
		bk: $author$project$Ui$Page$init(t),
		ao: $elm$core$Dict$empty,
		aE: $elm$core$Maybe$Nothing,
		bv: $author$project$Ui$PadStrip$Kit,
		Z: $author$project$Ui$Control$empty
	};
};
var $elm$core$Platform$Cmd$batch = _Platform_batch;
var $elm$core$Platform$Cmd$none = $elm$core$Platform$Cmd$batch(_List_Nil);
var $author$project$Ui$Tokens$OsLight = 1;
var $elm$json$Json$Decode$decodeValue = _Json_run;
var $elm$json$Json$Decode$bool = _Json_decodeBool;
var $elm$json$Json$Decode$field = _Json_decodeField;
var $elm$json$Json$Decode$null = _Json_decodeNull;
var $elm$json$Json$Decode$oneOf = _Json_oneOf;
var $elm$json$Json$Decode$nullable = function (decoder) {
	return $elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				$elm$json$Json$Decode$null($elm$core$Maybe$Nothing),
				A2($elm$json$Json$Decode$map, $elm$core$Maybe$Just, decoder)
			]));
};
var $author$project$Ui$Tokens$OsDark = 0;
var $author$project$Ui$Tokens$osOf = function (dark) {
	return dark ? 0 : 1;
};
var $elm$json$Json$Decode$string = _Json_decodeString;
var $author$project$Ui$Tokens$preferenceDecoder = A3(
	$elm$json$Json$Decode$map2,
	F2(
		function (s, dark) {
			return {
				bT: $author$project$Ui$Tokens$osOf(dark),
				cW: s
			};
		}),
	A2(
		$elm$json$Json$Decode$field,
		'stored',
		$elm$json$Json$Decode$nullable($elm$json$Json$Decode$string)),
	A2($elm$json$Json$Decode$field, 'dark', $elm$json$Json$Decode$bool));
var $elm$core$Result$withDefault = F2(
	function (def, result) {
		if (!result.$) {
			var a = result.a;
			return a;
		} else {
			return def;
		}
	});
var $author$project$Ui$Tokens$preference = function (flags) {
	return A2(
		$elm$core$Result$withDefault,
		{bT: 1, cW: $elm$core$Maybe$Nothing},
		A2($elm$json$Json$Decode$decodeValue, $author$project$Ui$Tokens$preferenceDecoder, flags));
};
var $author$project$Main$init = function (flags) {
	return _Utils_Tuple2(
		{
			bk: $author$project$View$EnginePage$init(
				$author$project$Ui$Tokens$fromPreference(
					$author$project$Ui$Tokens$preference(flags))),
			ap: $author$project$Model$init
		},
		$elm$core$Platform$Cmd$none);
};
var $elm$core$Platform$Sub$map = _Platform_map;
var $author$project$Model$Line = function (a) {
	return {$: 1, a: a};
};
var $author$project$Model$LinkChanged = function (a) {
	return {$: 0, a: a};
};
var $author$project$Model$RecallGarbled = {$: 8};
var $author$project$Model$Recalled = function (a) {
	return {$: 7, a: a};
};
var $author$project$Model$Tick = function (a) {
	return {$: 2, a: a};
};
var $author$project$Model$WriteFailed = function (a) {
	return {$: 9, a: a};
};
var $elm$core$Basics$composeR = F3(
	function (f, g, x) {
		return g(
			f(x));
	});
var $author$project$Cache$Recalled = F2(
	function (key, lines) {
		return {dk: key, dp: lines};
	});
var $elm$json$Json$Decode$list = _Json_decodeList;
var $author$project$Cache$answer = A3(
	$elm$json$Json$Decode$map2,
	$author$project$Cache$Recalled,
	A2($elm$json$Json$Decode$field, 'key', $elm$json$Json$Decode$string),
	$elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2(
				$elm$json$Json$Decode$field,
				'lines',
				$elm$json$Json$Decode$nullable(
					$elm$json$Json$Decode$list($elm$json$Json$Decode$string))),
				$elm$json$Json$Decode$succeed($elm$core$Maybe$Nothing)
			])));
var $elm$core$Result$toMaybe = function (result) {
	if (!result.$) {
		var v = result.a;
		return $elm$core$Maybe$Just(v);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Cache$decode = function (v) {
	return $elm$core$Result$toMaybe(
		A2($elm$json$Json$Decode$decodeValue, $author$project$Cache$answer, v));
};
var $elm$time$Time$Every = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $elm$time$Time$State = F2(
	function (taggers, processes) {
		return {dB: processes, dQ: taggers};
	});
var $elm$time$Time$init = $elm$core$Task$succeed(
	A2($elm$time$Time$State, $elm$core$Dict$empty, $elm$core$Dict$empty));
var $elm$core$Basics$compare = _Utils_compare;
var $elm$core$Dict$get = F2(
	function (targetKey, dict) {
		get:
		while (true) {
			if (dict.$ === -2) {
				return $elm$core$Maybe$Nothing;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var _v1 = A2($elm$core$Basics$compare, targetKey, key);
				switch (_v1) {
					case 0:
						var $temp$targetKey = targetKey,
							$temp$dict = left;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
					case 1:
						return $elm$core$Maybe$Just(value);
					default:
						var $temp$targetKey = targetKey,
							$temp$dict = right;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
				}
			}
		}
	});
var $elm$core$Dict$Black = 1;
var $elm$core$Dict$RBNode_elm_builtin = F5(
	function (a, b, c, d, e) {
		return {$: -1, a: a, b: b, c: c, d: d, e: e};
	});
var $elm$core$Dict$Red = 0;
var $elm$core$Dict$balance = F5(
	function (color, key, value, left, right) {
		if ((right.$ === -1) && (!right.a)) {
			var _v1 = right.a;
			var rK = right.b;
			var rV = right.c;
			var rLeft = right.d;
			var rRight = right.e;
			if ((left.$ === -1) && (!left.a)) {
				var _v3 = left.a;
				var lK = left.b;
				var lV = left.c;
				var lLeft = left.d;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					0,
					key,
					value,
					A5($elm$core$Dict$RBNode_elm_builtin, 1, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 1, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					rK,
					rV,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, key, value, left, rLeft),
					rRight);
			}
		} else {
			if ((((left.$ === -1) && (!left.a)) && (left.d.$ === -1)) && (!left.d.a)) {
				var _v5 = left.a;
				var lK = left.b;
				var lV = left.c;
				var _v6 = left.d;
				var _v7 = _v6.a;
				var llK = _v6.b;
				var llV = _v6.c;
				var llLeft = _v6.d;
				var llRight = _v6.e;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					0,
					lK,
					lV,
					A5($elm$core$Dict$RBNode_elm_builtin, 1, llK, llV, llLeft, llRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 1, key, value, lRight, right));
			} else {
				return A5($elm$core$Dict$RBNode_elm_builtin, color, key, value, left, right);
			}
		}
	});
var $elm$core$Dict$insertHelp = F3(
	function (key, value, dict) {
		if (dict.$ === -2) {
			return A5($elm$core$Dict$RBNode_elm_builtin, 0, key, value, $elm$core$Dict$RBEmpty_elm_builtin, $elm$core$Dict$RBEmpty_elm_builtin);
		} else {
			var nColor = dict.a;
			var nKey = dict.b;
			var nValue = dict.c;
			var nLeft = dict.d;
			var nRight = dict.e;
			var _v1 = A2($elm$core$Basics$compare, key, nKey);
			switch (_v1) {
				case 0:
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						A3($elm$core$Dict$insertHelp, key, value, nLeft),
						nRight);
				case 1:
					return A5($elm$core$Dict$RBNode_elm_builtin, nColor, nKey, value, nLeft, nRight);
				default:
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						nLeft,
						A3($elm$core$Dict$insertHelp, key, value, nRight));
			}
		}
	});
var $elm$core$Dict$insert = F3(
	function (key, value, dict) {
		var _v0 = A3($elm$core$Dict$insertHelp, key, value, dict);
		if ((_v0.$ === -1) && (!_v0.a)) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, 1, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$time$Time$addMySub = F2(
	function (_v0, state) {
		var interval = _v0.a;
		var tagger = _v0.b;
		var _v1 = A2($elm$core$Dict$get, interval, state);
		if (_v1.$ === 1) {
			return A3(
				$elm$core$Dict$insert,
				interval,
				_List_fromArray(
					[tagger]),
				state);
		} else {
			var taggers = _v1.a;
			return A3(
				$elm$core$Dict$insert,
				interval,
				A2($elm$core$List$cons, tagger, taggers),
				state);
		}
	});
var $elm$core$Process$kill = _Scheduler_kill;
var $elm$core$Dict$foldl = F3(
	function (func, acc, dict) {
		foldl:
		while (true) {
			if (dict.$ === -2) {
				return acc;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldl, func, acc, left)),
					$temp$dict = right;
				func = $temp$func;
				acc = $temp$acc;
				dict = $temp$dict;
				continue foldl;
			}
		}
	});
var $elm$core$Dict$merge = F6(
	function (leftStep, bothStep, rightStep, leftDict, rightDict, initialResult) {
		var stepState = F3(
			function (rKey, rValue, _v0) {
				stepState:
				while (true) {
					var list = _v0.a;
					var result = _v0.b;
					if (!list.b) {
						return _Utils_Tuple2(
							list,
							A3(rightStep, rKey, rValue, result));
					} else {
						var _v2 = list.a;
						var lKey = _v2.a;
						var lValue = _v2.b;
						var rest = list.b;
						if (_Utils_cmp(lKey, rKey) < 0) {
							var $temp$rKey = rKey,
								$temp$rValue = rValue,
								$temp$_v0 = _Utils_Tuple2(
								rest,
								A3(leftStep, lKey, lValue, result));
							rKey = $temp$rKey;
							rValue = $temp$rValue;
							_v0 = $temp$_v0;
							continue stepState;
						} else {
							if (_Utils_cmp(lKey, rKey) > 0) {
								return _Utils_Tuple2(
									list,
									A3(rightStep, rKey, rValue, result));
							} else {
								return _Utils_Tuple2(
									rest,
									A4(bothStep, lKey, lValue, rValue, result));
							}
						}
					}
				}
			});
		var _v3 = A3(
			$elm$core$Dict$foldl,
			stepState,
			_Utils_Tuple2(
				$elm$core$Dict$toList(leftDict),
				initialResult),
			rightDict);
		var leftovers = _v3.a;
		var intermediateResult = _v3.b;
		return A3(
			$elm$core$List$foldl,
			F2(
				function (_v4, result) {
					var k = _v4.a;
					var v = _v4.b;
					return A3(leftStep, k, v, result);
				}),
			intermediateResult,
			leftovers);
	});
var $elm$core$Platform$sendToSelf = _Platform_sendToSelf;
var $elm$time$Time$Name = function (a) {
	return {$: 0, a: a};
};
var $elm$time$Time$Offset = function (a) {
	return {$: 1, a: a};
};
var $elm$time$Time$Zone = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $elm$time$Time$customZone = $elm$time$Time$Zone;
var $elm$time$Time$setInterval = _Time_setInterval;
var $elm$core$Process$spawn = _Scheduler_spawn;
var $elm$time$Time$spawnHelp = F3(
	function (router, intervals, processes) {
		if (!intervals.b) {
			return $elm$core$Task$succeed(processes);
		} else {
			var interval = intervals.a;
			var rest = intervals.b;
			var spawnTimer = $elm$core$Process$spawn(
				A2(
					$elm$time$Time$setInterval,
					interval,
					A2($elm$core$Platform$sendToSelf, router, interval)));
			var spawnRest = function (id) {
				return A3(
					$elm$time$Time$spawnHelp,
					router,
					rest,
					A3($elm$core$Dict$insert, interval, id, processes));
			};
			return A2($elm$core$Task$andThen, spawnRest, spawnTimer);
		}
	});
var $elm$time$Time$onEffects = F3(
	function (router, subs, _v0) {
		var processes = _v0.dB;
		var rightStep = F3(
			function (_v6, id, _v7) {
				var spawns = _v7.a;
				var existing = _v7.b;
				var kills = _v7.c;
				return _Utils_Tuple3(
					spawns,
					existing,
					A2(
						$elm$core$Task$andThen,
						function (_v5) {
							return kills;
						},
						$elm$core$Process$kill(id)));
			});
		var newTaggers = A3($elm$core$List$foldl, $elm$time$Time$addMySub, $elm$core$Dict$empty, subs);
		var leftStep = F3(
			function (interval, taggers, _v4) {
				var spawns = _v4.a;
				var existing = _v4.b;
				var kills = _v4.c;
				return _Utils_Tuple3(
					A2($elm$core$List$cons, interval, spawns),
					existing,
					kills);
			});
		var bothStep = F4(
			function (interval, taggers, id, _v3) {
				var spawns = _v3.a;
				var existing = _v3.b;
				var kills = _v3.c;
				return _Utils_Tuple3(
					spawns,
					A3($elm$core$Dict$insert, interval, id, existing),
					kills);
			});
		var _v1 = A6(
			$elm$core$Dict$merge,
			leftStep,
			bothStep,
			rightStep,
			newTaggers,
			processes,
			_Utils_Tuple3(
				_List_Nil,
				$elm$core$Dict$empty,
				$elm$core$Task$succeed(0)));
		var spawnList = _v1.a;
		var existingDict = _v1.b;
		var killTask = _v1.c;
		return A2(
			$elm$core$Task$andThen,
			function (newProcesses) {
				return $elm$core$Task$succeed(
					A2($elm$time$Time$State, newTaggers, newProcesses));
			},
			A2(
				$elm$core$Task$andThen,
				function (_v2) {
					return A3($elm$time$Time$spawnHelp, router, spawnList, existingDict);
				},
				killTask));
	});
var $elm$time$Time$now = _Time_now($elm$time$Time$millisToPosix);
var $elm$time$Time$onSelfMsg = F3(
	function (router, interval, state) {
		var _v0 = A2($elm$core$Dict$get, interval, state.dQ);
		if (_v0.$ === 1) {
			return $elm$core$Task$succeed(state);
		} else {
			var taggers = _v0.a;
			var tellTaggers = function (time) {
				return $elm$core$Task$sequence(
					A2(
						$elm$core$List$map,
						function (tagger) {
							return A2(
								$elm$core$Platform$sendToApp,
								router,
								tagger(time));
						},
						taggers));
			};
			return A2(
				$elm$core$Task$andThen,
				function (_v1) {
					return $elm$core$Task$succeed(state);
				},
				A2($elm$core$Task$andThen, tellTaggers, $elm$time$Time$now));
		}
	});
var $elm$core$Basics$composeL = F3(
	function (g, f, x) {
		return g(
			f(x));
	});
var $elm$time$Time$subMap = F2(
	function (f, _v0) {
		var interval = _v0.a;
		var tagger = _v0.b;
		return A2(
			$elm$time$Time$Every,
			interval,
			A2($elm$core$Basics$composeL, f, tagger));
	});
_Platform_effectManagers['Time'] = _Platform_createManager($elm$time$Time$init, $elm$time$Time$onEffects, $elm$time$Time$onSelfMsg, 0, $elm$time$Time$subMap);
var $elm$time$Time$subscription = _Platform_leaf('Time');
var $elm$time$Time$every = F2(
	function (interval, tagger) {
		return $elm$time$Time$subscription(
			A2($elm$time$Time$Every, interval, tagger));
	});
var $elm$json$Json$Decode$value = _Json_decodeValue;
var $author$project$Cache$got = _Platform_incomingPort('got', $elm$json$Json$Decode$value);
var $author$project$Transport$lineIn = _Platform_incomingPort('lineIn', $elm$json$Json$Decode$string);
var $author$project$Transport$linkState = _Platform_incomingPort('linkState', $elm$json$Json$Decode$string);
var $elm$core$Maybe$map = F2(
	function (f, maybe) {
		if (!maybe.$) {
			var value = maybe.a;
			return $elm$core$Maybe$Just(
				f(value));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$Transport$Absent = 2;
var $author$project$Transport$Busy = 1;
var $author$project$Transport$Lost = 3;
var $author$project$Transport$Open = 0;
var $author$project$Transport$Unsupported = 4;
var $author$project$Transport$parseLink = function (s) {
	switch (s) {
		case 'open':
			return 0;
		case 'busy':
			return 1;
		case 'absent':
			return 2;
		case 'unsupported':
			return 4;
		default:
			return 3;
	}
};
var $author$project$Model$pollMs = 33;
var $elm$core$Maybe$withDefault = F2(
	function (_default, maybe) {
		if (!maybe.$) {
			var value = maybe.a;
			return value;
		} else {
			return _default;
		}
	});
var $author$project$Transport$writeFailed = _Platform_incomingPort('writeFailed', $elm$json$Json$Decode$string);
var $author$project$Model$subscriptions = $elm$core$Platform$Sub$batch(
	_List_fromArray(
		[
			$author$project$Transport$lineIn($author$project$Model$Line),
			$author$project$Transport$linkState(
			A2($elm$core$Basics$composeR, $author$project$Transport$parseLink, $author$project$Model$LinkChanged)),
			$author$project$Cache$got(
			A2(
				$elm$core$Basics$composeR,
				$author$project$Cache$decode,
				A2(
					$elm$core$Basics$composeR,
					$elm$core$Maybe$map($author$project$Model$Recalled),
					$elm$core$Maybe$withDefault($author$project$Model$RecallGarbled)))),
			$author$project$Transport$writeFailed($author$project$Model$WriteFailed),
			A2($elm$time$Time$every, $author$project$Model$pollMs, $author$project$Model$Tick)
		]));
var $author$project$View$EnginePage$BayMsg = F2(
	function (a, b) {
		return {$: 3, a: a, b: b};
	});
var $author$project$View$EnginePage$Frame = {$: 5};
var $author$project$View$EnginePage$Hand = function (a) {
	return {$: 0, a: a};
};
var $elm$core$Dict$isEmpty = function (dict) {
	if (dict.$ === -2) {
		return true;
	} else {
		return false;
	}
};
var $author$project$Ui$Control$isEmpty = function (_v0) {
	var d = _v0;
	return $elm$core$Dict$isEmpty(d);
};
var $elm$core$Platform$Sub$none = $elm$core$Platform$Sub$batch(_List_Nil);
var $elm$browser$Browser$AnimationManager$Time = function (a) {
	return {$: 0, a: a};
};
var $elm$browser$Browser$AnimationManager$State = F3(
	function (subs, request, oldTime) {
		return {cI: oldTime, dG: request, dP: subs};
	});
var $elm$browser$Browser$AnimationManager$init = $elm$core$Task$succeed(
	A3($elm$browser$Browser$AnimationManager$State, _List_Nil, $elm$core$Maybe$Nothing, 0));
var $elm$browser$Browser$AnimationManager$now = _Browser_now(0);
var $elm$browser$Browser$AnimationManager$rAF = _Browser_rAF(0);
var $elm$browser$Browser$AnimationManager$onEffects = F3(
	function (router, subs, _v0) {
		var request = _v0.dG;
		var oldTime = _v0.cI;
		var _v1 = _Utils_Tuple2(request, subs);
		if (_v1.a.$ === 1) {
			if (!_v1.b.b) {
				var _v2 = _v1.a;
				return $elm$browser$Browser$AnimationManager$init;
			} else {
				var _v4 = _v1.a;
				return A2(
					$elm$core$Task$andThen,
					function (pid) {
						return A2(
							$elm$core$Task$andThen,
							function (time) {
								return $elm$core$Task$succeed(
									A3(
										$elm$browser$Browser$AnimationManager$State,
										subs,
										$elm$core$Maybe$Just(pid),
										time));
							},
							$elm$browser$Browser$AnimationManager$now);
					},
					$elm$core$Process$spawn(
						A2(
							$elm$core$Task$andThen,
							$elm$core$Platform$sendToSelf(router),
							$elm$browser$Browser$AnimationManager$rAF)));
			}
		} else {
			if (!_v1.b.b) {
				var pid = _v1.a.a;
				return A2(
					$elm$core$Task$andThen,
					function (_v3) {
						return $elm$browser$Browser$AnimationManager$init;
					},
					$elm$core$Process$kill(pid));
			} else {
				return $elm$core$Task$succeed(
					A3($elm$browser$Browser$AnimationManager$State, subs, request, oldTime));
			}
		}
	});
var $elm$browser$Browser$AnimationManager$onSelfMsg = F3(
	function (router, newTime, _v0) {
		var subs = _v0.dP;
		var oldTime = _v0.cI;
		var send = function (sub) {
			if (!sub.$) {
				var tagger = sub.a;
				return A2(
					$elm$core$Platform$sendToApp,
					router,
					tagger(
						$elm$time$Time$millisToPosix(newTime)));
			} else {
				var tagger = sub.a;
				return A2(
					$elm$core$Platform$sendToApp,
					router,
					tagger(newTime - oldTime));
			}
		};
		return A2(
			$elm$core$Task$andThen,
			function (pid) {
				return A2(
					$elm$core$Task$andThen,
					function (_v1) {
						return $elm$core$Task$succeed(
							A3(
								$elm$browser$Browser$AnimationManager$State,
								subs,
								$elm$core$Maybe$Just(pid),
								newTime));
					},
					$elm$core$Task$sequence(
						A2($elm$core$List$map, send, subs)));
			},
			$elm$core$Process$spawn(
				A2(
					$elm$core$Task$andThen,
					$elm$core$Platform$sendToSelf(router),
					$elm$browser$Browser$AnimationManager$rAF)));
	});
var $elm$browser$Browser$AnimationManager$Delta = function (a) {
	return {$: 1, a: a};
};
var $elm$browser$Browser$AnimationManager$subMap = F2(
	function (func, sub) {
		if (!sub.$) {
			var tagger = sub.a;
			return $elm$browser$Browser$AnimationManager$Time(
				A2($elm$core$Basics$composeL, func, tagger));
		} else {
			var tagger = sub.a;
			return $elm$browser$Browser$AnimationManager$Delta(
				A2($elm$core$Basics$composeL, func, tagger));
		}
	});
_Platform_effectManagers['Browser.AnimationManager'] = _Platform_createManager($elm$browser$Browser$AnimationManager$init, $elm$browser$Browser$AnimationManager$onEffects, $elm$browser$Browser$AnimationManager$onSelfMsg, 0, $elm$browser$Browser$AnimationManager$subMap);
var $elm$browser$Browser$AnimationManager$subscription = _Platform_leaf('Browser.AnimationManager');
var $elm$browser$Browser$AnimationManager$onAnimationFrame = function (tagger) {
	return $elm$browser$Browser$AnimationManager$subscription(
		$elm$browser$Browser$AnimationManager$Time(tagger));
};
var $elm$browser$Browser$Events$onAnimationFrame = $elm$browser$Browser$AnimationManager$onAnimationFrame;
var $author$project$Ui$Control$Moved = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$Control$Released = {$: 2};
var $elm$json$Json$Decode$float = _Json_decodeFloat;
var $elm$browser$Browser$Events$Document = 0;
var $elm$browser$Browser$Events$MySub = F3(
	function (a, b, c) {
		return {$: 0, a: a, b: b, c: c};
	});
var $elm$browser$Browser$Events$State = F2(
	function (subs, pids) {
		return {dx: pids, dP: subs};
	});
var $elm$browser$Browser$Events$init = $elm$core$Task$succeed(
	A2($elm$browser$Browser$Events$State, _List_Nil, $elm$core$Dict$empty));
var $elm$browser$Browser$Events$nodeToKey = function (node) {
	if (!node) {
		return 'd_';
	} else {
		return 'w_';
	}
};
var $elm$browser$Browser$Events$addKey = function (sub) {
	var node = sub.a;
	var name = sub.b;
	return _Utils_Tuple2(
		_Utils_ap(
			$elm$browser$Browser$Events$nodeToKey(node),
			name),
		sub);
};
var $elm$core$Dict$fromList = function (assocs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, dict) {
				var key = _v0.a;
				var value = _v0.b;
				return A3($elm$core$Dict$insert, key, value, dict);
			}),
		$elm$core$Dict$empty,
		assocs);
};
var $elm$browser$Browser$Events$Event = F2(
	function (key, event) {
		return {db: event, dk: key};
	});
var $elm$browser$Browser$Events$spawn = F3(
	function (router, key, _v0) {
		var node = _v0.a;
		var name = _v0.b;
		var actualNode = function () {
			if (!node) {
				return _Browser_doc;
			} else {
				return _Browser_window;
			}
		}();
		return A2(
			$elm$core$Task$map,
			function (value) {
				return _Utils_Tuple2(key, value);
			},
			A3(
				_Browser_on,
				actualNode,
				name,
				function (event) {
					return A2(
						$elm$core$Platform$sendToSelf,
						router,
						A2($elm$browser$Browser$Events$Event, key, event));
				}));
	});
var $elm$core$Dict$union = F2(
	function (t1, t2) {
		return A3($elm$core$Dict$foldl, $elm$core$Dict$insert, t2, t1);
	});
var $elm$browser$Browser$Events$onEffects = F3(
	function (router, subs, state) {
		var stepRight = F3(
			function (key, sub, _v6) {
				var deads = _v6.a;
				var lives = _v6.b;
				var news = _v6.c;
				return _Utils_Tuple3(
					deads,
					lives,
					A2(
						$elm$core$List$cons,
						A3($elm$browser$Browser$Events$spawn, router, key, sub),
						news));
			});
		var stepLeft = F3(
			function (_v4, pid, _v5) {
				var deads = _v5.a;
				var lives = _v5.b;
				var news = _v5.c;
				return _Utils_Tuple3(
					A2($elm$core$List$cons, pid, deads),
					lives,
					news);
			});
		var stepBoth = F4(
			function (key, pid, _v2, _v3) {
				var deads = _v3.a;
				var lives = _v3.b;
				var news = _v3.c;
				return _Utils_Tuple3(
					deads,
					A3($elm$core$Dict$insert, key, pid, lives),
					news);
			});
		var newSubs = A2($elm$core$List$map, $elm$browser$Browser$Events$addKey, subs);
		var _v0 = A6(
			$elm$core$Dict$merge,
			stepLeft,
			stepBoth,
			stepRight,
			state.dx,
			$elm$core$Dict$fromList(newSubs),
			_Utils_Tuple3(_List_Nil, $elm$core$Dict$empty, _List_Nil));
		var deadPids = _v0.a;
		var livePids = _v0.b;
		var makeNewPids = _v0.c;
		return A2(
			$elm$core$Task$andThen,
			function (pids) {
				return $elm$core$Task$succeed(
					A2(
						$elm$browser$Browser$Events$State,
						newSubs,
						A2(
							$elm$core$Dict$union,
							livePids,
							$elm$core$Dict$fromList(pids))));
			},
			A2(
				$elm$core$Task$andThen,
				function (_v1) {
					return $elm$core$Task$sequence(makeNewPids);
				},
				$elm$core$Task$sequence(
					A2($elm$core$List$map, $elm$core$Process$kill, deadPids))));
	});
var $elm$core$List$maybeCons = F3(
	function (f, mx, xs) {
		var _v0 = f(mx);
		if (!_v0.$) {
			var x = _v0.a;
			return A2($elm$core$List$cons, x, xs);
		} else {
			return xs;
		}
	});
var $elm$core$List$filterMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			$elm$core$List$maybeCons(f),
			_List_Nil,
			xs);
	});
var $elm$browser$Browser$Events$onSelfMsg = F3(
	function (router, _v0, state) {
		var key = _v0.dk;
		var event = _v0.db;
		var toMessage = function (_v2) {
			var subKey = _v2.a;
			var _v3 = _v2.b;
			var node = _v3.a;
			var name = _v3.b;
			var decoder = _v3.c;
			return _Utils_eq(subKey, key) ? A2(_Browser_decodeEvent, decoder, event) : $elm$core$Maybe$Nothing;
		};
		var messages = A2($elm$core$List$filterMap, toMessage, state.dP);
		return A2(
			$elm$core$Task$andThen,
			function (_v1) {
				return $elm$core$Task$succeed(state);
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Platform$sendToApp(router),
					messages)));
	});
var $elm$browser$Browser$Events$subMap = F2(
	function (func, _v0) {
		var node = _v0.a;
		var name = _v0.b;
		var decoder = _v0.c;
		return A3(
			$elm$browser$Browser$Events$MySub,
			node,
			name,
			A2($elm$json$Json$Decode$map, func, decoder));
	});
_Platform_effectManagers['Browser.Events'] = _Platform_createManager($elm$browser$Browser$Events$init, $elm$browser$Browser$Events$onEffects, $elm$browser$Browser$Events$onSelfMsg, 0, $elm$browser$Browser$Events$subMap);
var $elm$browser$Browser$Events$subscription = _Platform_leaf('Browser.Events');
var $elm$browser$Browser$Events$on = F3(
	function (node, name, decoder) {
		return $elm$browser$Browser$Events$subscription(
			A3($elm$browser$Browser$Events$MySub, node, name, decoder));
	});
var $elm$browser$Browser$Events$onMouseMove = A2($elm$browser$Browser$Events$on, 0, 'mousemove');
var $elm$browser$Browser$Events$onMouseUp = A2($elm$browser$Browser$Events$on, 0, 'mouseup');
var $author$project$Ui$Control$subscriptions = function (held) {
	if (held.$ === 1) {
		return $elm$core$Platform$Sub$batch(
			_List_fromArray(
				[
					$elm$browser$Browser$Events$onMouseMove(
					A2(
						$elm$json$Json$Decode$map,
						$author$project$Ui$Control$Moved,
						A2($elm$json$Json$Decode$field, 'clientY', $elm$json$Json$Decode$float))),
					$elm$browser$Browser$Events$onMouseUp(
					$elm$json$Json$Decode$succeed($author$project$Ui$Control$Released))
				]));
	} else {
		return $elm$core$Platform$Sub$none;
	}
};
var $author$project$Ui$PatchBay$Cancel = {$: 3};
var $author$project$Ui$PatchBay$subscriptions = function (_v0) {
	var b = _v0;
	var _v1 = b.aC;
	if (!_v1.$) {
		return $elm$browser$Browser$Events$onMouseUp(
			$elm$json$Json$Decode$succeed($author$project$Ui$PatchBay$Cancel));
	} else {
		return $elm$core$Platform$Sub$none;
	}
};
var $elm$core$Dict$values = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, valueList) {
				return A2($elm$core$List$cons, value, valueList);
			}),
		_List_Nil,
		dict);
};
var $author$project$View$EnginePage$subscriptions = function (s) {
	return $elm$core$Platform$Sub$batch(
		_List_fromArray(
			[
				A2(
				$elm$core$Platform$Sub$map,
				$author$project$View$EnginePage$Hand,
				$author$project$Ui$Control$subscriptions(s.aK)),
				$author$project$Ui$Control$isEmpty(s.Z) ? $elm$core$Platform$Sub$none : $elm$browser$Browser$Events$onAnimationFrame(
				function (_v0) {
					return $author$project$View$EnginePage$Frame;
				}),
				$elm$core$Platform$Sub$batch(
				A2(
					$elm$core$List$map,
					function (_v1) {
						var id = _v1.a;
						var bay = _v1.b;
						return A2(
							$elm$core$Platform$Sub$map,
							$author$project$View$EnginePage$BayMsg(id),
							$author$project$Ui$PatchBay$subscriptions(bay));
					},
					$elm$core$Dict$values(s.aI)))
			]));
};
var $author$project$Model$seat = function (m) {
	return m.aE;
};
var $author$project$View$EnginePage$follow = F2(
	function (m, s) {
		return _Utils_eq(
			s.aE,
			$elm$core$Maybe$Just(
				$author$project$Model$seat(m))) ? s : _Utils_update(
			s,
			{
				aK: $author$project$Ui$Control$idle,
				bf: $author$project$Ui$Menu$shut,
				ao: $elm$core$Dict$empty,
				aE: $elm$core$Maybe$Just(
					$author$project$Model$seat(m)),
				Z: $author$project$Ui$Control$empty
			});
	});
var $elm$core$Platform$Cmd$map = _Platform_map;
var $elm$core$Tuple$mapSecond = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			x,
			func(y));
	});
var $author$project$Ui$Tokens$name = function (t) {
	if (!t) {
		return 'day';
	} else {
		return 'night';
	}
};
var $elm$json$Json$Encode$string = _Json_wrap;
var $author$project$Main$storeTheme = _Platform_outgoingPort('storeTheme', $elm$json$Json$Encode$string);
var $elm$json$Json$Encode$null = _Json_encodeNull;
var $author$project$Transport$connectSerial = _Platform_outgoingPort(
	'connectSerial',
	function ($) {
		return $elm$json$Json$Encode$null;
	});
var $author$project$Transport$connectSocket = _Platform_outgoingPort('connectSocket', $elm$json$Json$Encode$string);
var $author$project$Model$opening = function (msg) {
	switch (msg.$) {
		case 6:
			if (!msg.a) {
				var _v1 = msg.a;
				return $author$project$Transport$connectSerial(0);
			} else {
				var _v2 = msg.a;
				return $author$project$Transport$connectSocket('ws://127.0.0.1:7342');
			}
		case 0:
			return $elm$core$Platform$Cmd$none;
		case 1:
			return $elm$core$Platform$Cmd$none;
		case 2:
			return $elm$core$Platform$Cmd$none;
		case 3:
			return $elm$core$Platform$Cmd$none;
		case 4:
			return $elm$core$Platform$Cmd$none;
		case 5:
			return $elm$core$Platform$Cmd$none;
		case 7:
			return $elm$core$Platform$Cmd$none;
		case 8:
			return $elm$core$Platform$Cmd$none;
		case 9:
			return $elm$core$Platform$Cmd$none;
		case 10:
			return $elm$core$Platform$Cmd$none;
		case 11:
			return $elm$core$Platform$Cmd$none;
		case 12:
			return $elm$core$Platform$Cmd$none;
		case 13:
			return $elm$core$Platform$Cmd$none;
		case 14:
			return $elm$core$Platform$Cmd$none;
		case 15:
			return $elm$core$Platform$Cmd$none;
		case 16:
			return $elm$core$Platform$Cmd$none;
		default:
			return $elm$core$Platform$Cmd$none;
	}
};
var $elm$json$Json$Encode$list = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$List$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(0),
				entries));
	});
var $elm$json$Json$Encode$object = function (pairs) {
	return _Json_wrap(
		A3(
			$elm$core$List$foldl,
			F2(
				function (_v0, obj) {
					var k = _v0.a;
					var v = _v0.b;
					return A3(_Json_addField, k, v, obj);
				}),
			_Json_emptyObject(0),
			pairs));
};
var $author$project$Cache$keep = _Platform_outgoingPort(
	'keep',
	function ($) {
		return $elm$json$Json$Encode$object(
			_List_fromArray(
				[
					_Utils_Tuple2(
					'key',
					$elm$json$Json$Encode$string($.dk)),
					_Utils_Tuple2(
					'lines',
					$elm$json$Json$Encode$list($elm$json$Json$Encode$string)($.dp))
				]));
	});
var $author$project$Protocol$outgoingLine = function (_v0) {
	var l = _v0.b;
	return l;
};
var $author$project$Cache$recall = _Platform_outgoingPort('recall', $elm$json$Json$Encode$string);
var $author$project$Transport$send = _Platform_outgoingPort('send', $elm$json$Json$Encode$string);
var $author$project$Model$run = function (e) {
	switch (e.$) {
		case 0:
			var o = e.a;
			return $author$project$Transport$send(
				$author$project$Protocol$outgoingLine(o));
		case 1:
			var key = e.a;
			return $author$project$Cache$recall(key);
		default:
			var key = e.a;
			var lines = e.b;
			return $author$project$Cache$keep(
				{dk: key, dp: lines});
	}
};
var $author$project$Model$Keep = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Model$Recall = function (a) {
	return {$: 1, a: a};
};
var $author$project$Model$Send = function (a) {
	return {$: 0, a: a};
};
var $author$project$Model$Unsendable = function (a) {
	return {$: 2, a: a};
};
var $elm$core$List$any = F2(
	function (isOkay, list) {
		any:
		while (true) {
			if (!list.b) {
				return false;
			} else {
				var x = list.a;
				var xs = list.b;
				if (isOkay(x)) {
					return true;
				} else {
					var $temp$isOkay = isOkay,
						$temp$list = xs;
					isOkay = $temp$isOkay;
					list = $temp$list;
					continue any;
				}
			}
		}
	});
var $elm$core$List$takeReverse = F3(
	function (n, list, kept) {
		takeReverse:
		while (true) {
			if (n <= 0) {
				return kept;
			} else {
				if (!list.b) {
					return kept;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs,
						$temp$kept = A2($elm$core$List$cons, x, kept);
					n = $temp$n;
					list = $temp$list;
					kept = $temp$kept;
					continue takeReverse;
				}
			}
		}
	});
var $elm$core$List$takeTailRec = F2(
	function (n, list) {
		return $elm$core$List$reverse(
			A3($elm$core$List$takeReverse, n, list, _List_Nil));
	});
var $elm$core$List$takeFast = F3(
	function (ctr, n, list) {
		if (n <= 0) {
			return _List_Nil;
		} else {
			var _v0 = _Utils_Tuple2(n, list);
			_v0$1:
			while (true) {
				_v0$5:
				while (true) {
					if (!_v0.b.b) {
						return list;
					} else {
						if (_v0.b.b.b) {
							switch (_v0.a) {
								case 1:
									break _v0$1;
								case 2:
									var _v2 = _v0.b;
									var x = _v2.a;
									var _v3 = _v2.b;
									var y = _v3.a;
									return _List_fromArray(
										[x, y]);
								case 3:
									if (_v0.b.b.b.b) {
										var _v4 = _v0.b;
										var x = _v4.a;
										var _v5 = _v4.b;
										var y = _v5.a;
										var _v6 = _v5.b;
										var z = _v6.a;
										return _List_fromArray(
											[x, y, z]);
									} else {
										break _v0$5;
									}
								default:
									if (_v0.b.b.b.b && _v0.b.b.b.b.b) {
										var _v7 = _v0.b;
										var x = _v7.a;
										var _v8 = _v7.b;
										var y = _v8.a;
										var _v9 = _v8.b;
										var z = _v9.a;
										var _v10 = _v9.b;
										var w = _v10.a;
										var tl = _v10.b;
										return (ctr > 1000) ? A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A2($elm$core$List$takeTailRec, n - 4, tl))))) : A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A3($elm$core$List$takeFast, ctr + 1, n - 4, tl)))));
									} else {
										break _v0$5;
									}
							}
						} else {
							if (_v0.a === 1) {
								break _v0$1;
							} else {
								break _v0$5;
							}
						}
					}
				}
				return list;
			}
			var _v1 = _v0.b;
			var x = _v1.a;
			return _List_fromArray(
				[x]);
		}
	});
var $elm$core$List$take = F2(
	function (n, list) {
		return A3($elm$core$List$takeFast, 0, n, list);
	});
var $author$project$Model$evict = function (all) {
	var isUnread = function (k) {
		var _v1 = k.aS;
		switch (_v1.$) {
			case 1:
				return true;
			case 2:
				return true;
			case 3:
				return true;
			case 4:
				return true;
			default:
				return false;
		}
	};
	var less = function (ks) {
		if (ks.b) {
			var k = ks.a;
			var rest = ks.b;
			return isUnread(k) ? rest : A2(
				$elm$core$List$cons,
				k,
				less(rest));
		} else {
			return _List_Nil;
		}
	};
	return A2($elm$core$List$any, isUnread, all) ? $elm$core$List$reverse(
		less(
			$elm$core$List$reverse(all))) : A2(
		$elm$core$List$take,
		$elm$core$List$length(all) - 1,
		all);
};
var $elm$core$List$filter = F2(
	function (isGood, list) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, xs) {
					return isGood(x) ? A2($elm$core$List$cons, x, xs) : xs;
				}),
			_List_Nil,
			list);
	});
var $elm$core$Basics$neq = _Utils_notEqual;
var $author$project$Model$noticesKept = 16;
var $elm$core$List$sum = function (numbers) {
	return A3($elm$core$List$foldl, $elm$core$Basics$add, 0, numbers);
};
var $author$project$Model$keep = F2(
	function (n, m) {
		var times = $elm$core$List$sum(
			A2(
				$elm$core$List$map,
				function ($) {
					return $.cZ;
				},
				A2(
					$elm$core$List$filter,
					function (k) {
						return _Utils_eq(k.aS, n);
					},
					m.H)));
		var all = A2(
			$elm$core$List$cons,
			{aS: n, cZ: times + 1},
			A2(
				$elm$core$List$filter,
				function (k) {
					return !_Utils_eq(k.aS, n);
				},
				m.H));
		return (_Utils_cmp(
			$elm$core$List$length(all),
			$author$project$Model$noticesKept) > 0) ? _Utils_update(
			m,
			{
				H: $author$project$Model$evict(all),
				af: m.af + 1
			}) : _Utils_update(
			m,
			{H: all});
	});
var $author$project$Protocol$Outgoing = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Protocol$InCc = function (a) {
	return {$: 0, a: a};
};
var $author$project$Protocol$InCc14 = function (a) {
	return {$: 1, a: a};
};
var $author$project$Protocol$InNrpn = function (a) {
	return {$: 2, a: a};
};
var $author$project$Protocol$InPress = {$: 3};
var $author$project$Protocol$addInput = function (input) {
	switch (input.$) {
		case 0:
			var n = input.a;
			return $author$project$Protocol$InCc(n);
		case 1:
			var m = input.a;
			return $author$project$Protocol$InCc14(m);
		case 2:
			var n = input.a;
			return $author$project$Protocol$InNrpn(n);
		default:
			return $author$project$Protocol$InPress;
	}
};
var $author$project$Protocol$inputText = function (input) {
	switch (input.$) {
		case 0:
			var n = input.a;
			return 'CC' + $elm$core$String$fromInt(n);
		case 1:
			var n = input.a;
			return 'CC14:' + $elm$core$String$fromInt(n);
		case 2:
			var n = input.a;
			return 'NRPN:' + $elm$core$String$fromInt(n);
		case 3:
			return 'PRESS';
		default:
			return 'SYSEX';
	}
};
var $author$project$Protocol$kindToken = function (k) {
	switch (k) {
		case 0:
			return 'JUMP';
		case 1:
			return 'PICKUP';
		case 2:
			return 'SCALE';
		case 3:
			return 'TWOS-COMP';
		case 4:
			return 'OFFSET';
		case 5:
			return 'SIGNED';
		case 6:
			return 'SIGNED-2';
		case 7:
			return 'INC-DEC';
		case 8:
			return 'MOMENTARY';
		default:
			return 'TOGGLE';
	}
};
var $elm$core$String$replace = F3(
	function (before, after, string) {
		return A2(
			$elm$core$String$join,
			after,
			A2($elm$core$String$split, before, string));
	});
var $author$project$Protocol$namedOnWire = A2($elm$core$String$replace, ' ', '_');
var $author$project$Protocol$onOffText = function (o) {
	if (!o) {
		return 'on';
	} else {
		return 'off';
	}
};
var $author$project$Protocol$rowText = function (r) {
	if (!r.$) {
		var i = r.a;
		return 'S' + $elm$core$String$fromInt(i);
	} else {
		var i = r.a;
		return 'M' + $elm$core$String$fromInt(i);
	}
};
var $author$project$Protocol$settingText = function (setting) {
	switch (setting.$) {
		case 0:
			var n = setting.a;
			return 'control ' + $elm$core$String$fromInt(n);
		case 1:
			var n = setting.a;
			return 'min ' + $elm$core$String$fromInt(n);
		case 2:
			var n = setting.a;
			return 'max ' + $elm$core$String$fromInt(n);
		case 3:
			var k = setting.a;
			return 'input ' + $author$project$Protocol$kindToken(k);
		default:
			var e = setting.a;
			return 'echo ' + $author$project$Protocol$onOffText(e);
	}
};
var $author$project$Addr$key = function (_v0) {
	var a = _v0;
	return a;
};
var $author$project$Addr$Addr = $elm$core$Basics$identity;
var $elm$core$String$endsWith = _String_endsWith;
var $elm$core$Basics$not = _Basics_not;
var $author$project$Addr$plain = function (c) {
	return ($elm$core$Char$toCode(c) > 32) && (($elm$core$Char$toCode(c) !== 127) && (c !== '\"'));
};
var $author$project$Addr$fromWire = function (s) {
	return (A2($elm$core$String$contains, '.', s) && ((!A2($elm$core$String$startsWith, '.', s)) && ((!A2($elm$core$String$endsWith, '.', s)) && A2($elm$core$String$all, $author$project$Addr$plain, s)))) ? $elm$core$Maybe$Just(s) : $elm$core$Maybe$Nothing;
};
var $author$project$Addr$onWire = function (_v0) {
	var a = _v0;
	return !_Utils_eq(
		$author$project$Addr$fromWire(a),
		$elm$core$Maybe$Nothing);
};
var $author$project$Protocol$wire = function (a) {
	return $author$project$Addr$onWire(a) ? $elm$core$Maybe$Just(
		$author$project$Addr$key(a)) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$encodeMap = function (c) {
	switch (c.$) {
		case 0:
			var _v1 = c.a;
			var input = _v1.a;
			var kind = _v1.b;
			var a = c.b;
			var span = c.c;
			return A2(
				$elm$core$Maybe$map,
				function (k) {
					return A2(
						$elm$core$String$join,
						' ',
						_Utils_ap(
							_List_fromArray(
								[
									'ed map add',
									$author$project$Protocol$inputText(
									$author$project$Protocol$addInput(input)),
									$author$project$Protocol$kindToken(kind),
									k
								]),
							function () {
								if (!span.$) {
									var _v3 = span.a;
									var lo = _v3.a;
									var hi = _v3.b;
									return _List_fromArray(
										[
											$elm$core$String$fromInt(lo),
											$elm$core$String$fromInt(hi)
										]);
								} else {
									return _List_Nil;
								}
							}()));
				},
				$author$project$Protocol$wire(a));
		case 1:
			var r = c.a;
			var setting = c.b;
			return $elm$core$Maybe$Just(
				A2(
					$elm$core$String$join,
					' ',
					_List_fromArray(
						[
							'ed map set',
							$author$project$Protocol$rowText(r),
							$author$project$Protocol$settingText(setting)
						])));
		case 2:
			var r = c.a;
			var input = c.b;
			var a = c.c;
			return A2(
				$elm$core$Maybe$map,
				function (k) {
					return A2(
						$elm$core$String$join,
						' ',
						_List_fromArray(
							[
								'ed map rm',
								$author$project$Protocol$rowText(r),
								$author$project$Protocol$inputText(input),
								k
							]));
				},
				function () {
					if (!a.$) {
						var x = a.a;
						return $author$project$Protocol$wire(x);
					} else {
						return $elm$core$Maybe$Just('-');
					}
				}());
		case 3:
			if (!c.a.$) {
				var n = c.a.a;
				return $elm$core$Maybe$Just(
					'ed map pick ' + $author$project$Protocol$namedOnWire(n));
			} else {
				var _v5 = c.a;
				return $elm$core$Maybe$Just('ed map pick none');
			}
		case 4:
			var k = c.a;
			return $elm$core$Maybe$Just(
				'ed map keep ' + $author$project$Protocol$onOffText(k));
		case 5:
			if (!c.a.$) {
				var n = c.a.a;
				return $elm$core$Maybe$Just(
					'ed map save ' + $author$project$Protocol$namedOnWire(n));
			} else {
				var _v6 = c.a;
				return $elm$core$Maybe$Just('ed map save');
			}
		case 6:
			var n = c.a;
			return $elm$core$Maybe$Just(
				'ed map rename ' + $author$project$Protocol$namedOnWire(n));
		case 7:
			return $elm$core$Maybe$Just('ed maps');
		case 8:
			var a = c.a;
			return A2(
				$elm$core$Maybe$map,
				function (k) {
					return 'ed learn ' + k;
				},
				$author$project$Protocol$wire(a));
		default:
			return $elm$core$Maybe$Just('ed learn off');
	}
};
var $author$project$Protocol$noteToInt = function (_v0) {
	var n = _v0;
	return n;
};
var $author$project$Protocol$poolNotes = function (_v0) {
	var first = _v0.a;
	var rest = _v0.b;
	return A2($elm$core$List$cons, first, rest);
};
var $author$project$Protocol$encodeOrbit = function (c) {
	var ints = F2(
		function (head, ns) {
			return A2(
				$elm$core$String$join,
				' ',
				A2(
					$elm$core$List$cons,
					head,
					A2($elm$core$List$map, $elm$core$String$fromInt, ns)));
		});
	switch (c.$) {
		case 0:
			return 'ed orbit play';
		case 1:
			return 'ed orbit stop';
		case 2:
			var n = c.a;
			return A2(
				ints,
				'ed scene queue',
				_List_fromArray(
					[n]));
		case 3:
			if (!c.b.$) {
				var n = c.a;
				var _v1 = c.b;
				return A2(
					ints,
					'ed scene save',
					_List_fromArray(
						[n]));
			} else {
				var n = c.a;
				var r = c.b.a;
				return A2(
					ints,
					'ed scene save',
					_List_fromArray(
						[n])) + (' over ' + $elm$core$String$fromInt(r));
			}
		case 4:
			var n = c.a;
			var r = c.b;
			return A2(
				ints,
				'ed scene clear',
				_List_fromArray(
					[n, r]));
		case 5:
			var n = c.a;
			var r = c.b;
			return A2(
				ints,
				'ed scene reload',
				_List_fromArray(
					[n, r]));
		case 6:
			var _v2 = c.a;
			var _v3 = _v2.a;
			var a = _v3.a;
			var ra = _v3.b;
			var _v4 = _v2.b;
			var b = _v4.a;
			var rb = _v4.b;
			return A2(
				ints,
				'ed scene move',
				_List_fromArray(
					[a, b, ra, rb]));
		case 7:
			var sg = c.a;
			var d = c.b;
			return A2(
				ints,
				'ed chord',
				_List_fromArray(
					[sg, d]));
		case 8:
			var m = c.a;
			return A2(
				ints,
				'ed scale',
				_List_fromArray(
					[m]));
		case 9:
			var r = c.a;
			var i = c.b;
			var n = c.c;
			return A2(
				ints,
				'ed step',
				_List_fromArray(
					[r, i, n]));
		default:
			var r = c.a;
			var pool = c.b;
			return A2(
				ints,
				'ed pool',
				A2(
					$elm$core$List$cons,
					r,
					A2(
						$elm$core$List$map,
						$author$project$Protocol$noteToInt,
						$author$project$Protocol$poolNotes(pool))));
	}
};
var $author$project$Unit$genToInt = function (_v0) {
	var n = _v0;
	return n;
};
var $author$project$Unit$partNumber = function (p) {
	switch (p) {
		case 0:
			return 1;
		case 1:
			return 2;
		case 2:
			return 3;
		case 3:
			return 4;
		case 4:
			return 5;
		default:
			return 6;
	}
};
var $author$project$Unit$engineName = function (e) {
	switch (e) {
		case 0:
			return 'ALGO';
		case 1:
			return 'MODAL';
		case 2:
			return 'VA';
		case 3:
			return 'TAPE';
		default:
			return 'DRUM';
	}
};
var $author$project$Protocol$schemaToken = function (s) {
	switch (s.$) {
		case 0:
			var e = s.a;
			return $author$project$Unit$engineName(e);
		case 1:
			return 'MIXER';
		case 2:
			var e = s.a;
			return 'MTX-' + $author$project$Unit$engineName(e);
		case 3:
			return 'SETTINGS';
		case 4:
			return 'MAP';
		default:
			return 'ORBIT';
	}
};
var $elm$core$String$fromFloat = _String_fromNumber;
var $elm$core$Basics$isInfinite = _Basics_isInfinite;
var $elm$core$Basics$isNaN = _Basics_isNaN;
var $author$project$Protocol$decimal = function (n) {
	var t = $elm$core$String$fromFloat(n);
	return ($elm$core$Basics$isNaN(n) || ($elm$core$Basics$isInfinite(n) || A2($elm$core$String$contains, 'e', t))) ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(t);
};
var $author$project$Protocol$word = function (w) {
	return ((w !== '') && A2(
		$elm$core$String$all,
		function (ch) {
			return ($elm$core$Char$toCode(ch) > 32) && ($elm$core$Char$toCode(ch) !== 127);
		},
		w)) ? $elm$core$Maybe$Just(w) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$setValue = function (v) {
	switch (v.$) {
		case 0:
			var n = v.a;
			return $author$project$Protocol$decimal(n);
		case 1:
			var n = v.a;
			return $author$project$Protocol$word(n);
		default:
			var i = v.a;
			return $elm$core$Maybe$Just(
				'#' + $elm$core$String$fromInt(i));
	}
};
var $author$project$Protocol$encode = function (c) {
	switch (c.$) {
		case 0:
			return $elm$core$Maybe$Just('ed hello');
		case 1:
			var s = c.a;
			return $elm$core$Maybe$Just(
				'ed schema ' + $author$project$Protocol$schemaToken(s));
		case 2:
			var s = c.a;
			var page = c.b;
			return $elm$core$Maybe$Just(
				'ed describe ' + ($author$project$Protocol$schemaToken(s) + (' ' + $elm$core$String$fromInt(page))));
		case 3:
			var a = c.a;
			return A2(
				$elm$core$Maybe$map,
				function (k) {
					return 'ed get ' + k;
				},
				$author$project$Protocol$wire(a));
		case 4:
			var a = c.a;
			var v = c.b;
			return A2(
				$elm$core$Maybe$andThen,
				function (k) {
					return A2(
						$elm$core$Maybe$map,
						function (x) {
							return 'ed set ' + (k + (' ' + x));
						},
						$author$project$Protocol$setValue(v));
				},
				$author$project$Protocol$wire(a));
		case 5:
			var held = c.a;
			return $elm$core$Maybe$Just(
				'ed since ' + $elm$core$String$fromInt(
					A2(
						$elm$core$Maybe$withDefault,
						0,
						A2($elm$core$Maybe$map, $author$project$Unit$genToInt, held))));
		case 6:
			var p = c.a;
			return $elm$core$Maybe$Just(
				'ed part ' + $elm$core$String$fromInt(
					$author$project$Unit$partNumber(p)));
		case 7:
			var name = c.a;
			var to = c.b;
			return $elm$core$Maybe$Just(
				'ed route ' + (name + (' ' + function () {
					if (!to.$) {
						var n = to.a;
						return $elm$core$String$fromInt(n);
					} else {
						return 'off';
					}
				}())));
		case 8:
			return $elm$core$Maybe$Just('ed projects');
		case 9:
			return $elm$core$Maybe$Just('ed project save');
		case 10:
			var n = c.a;
			return $elm$core$Maybe$Just(
				'ed project saveas ' + $author$project$Protocol$namedOnWire(n));
		case 11:
			var id = c.a;
			var g = c.b;
			var over = c.c;
			return $elm$core$Maybe$Just(
				'ed project load ' + ($elm$core$String$fromInt(id) + (' ' + ($elm$core$String$fromInt(g) + function () {
					if (!over) {
						return '';
					} else {
						return ' discard';
					}
				}()))));
		case 12:
			var mc = c.a;
			return $author$project$Protocol$encodeMap(mc);
		default:
			var oc = c.a;
			return $elm$core$Maybe$Just(
				$author$project$Protocol$encodeOrbit(oc));
	}
};
var $author$project$Protocol$outgoing = function (c) {
	return A2(
		$elm$core$Maybe$map,
		$author$project$Protocol$Outgoing(c),
		$author$project$Protocol$encode(c));
};
var $author$project$Model$effectsOf = F2(
	function (wishes, m) {
		return A3(
			$elm$core$List$foldl,
			F2(
				function (w, _v0) {
					var acc = _v0.a;
					var es = _v0.b;
					switch (w.$) {
						case 0:
							var c = w.a;
							var _v2 = $author$project$Protocol$outgoing(c);
							if (!_v2.$) {
								var o = _v2.a;
								return _Utils_Tuple2(
									acc,
									_Utils_ap(
										es,
										_List_fromArray(
											[
												$author$project$Model$Send(o)
											])));
							} else {
								return _Utils_Tuple2(
									A2(
										$author$project$Model$keep,
										$author$project$Model$Unsendable(c),
										acc),
									es);
							}
						case 1:
							var k = w.a;
							return _Utils_Tuple2(
								acc,
								_Utils_ap(
									es,
									_List_fromArray(
										[
											$author$project$Model$Recall(k)
										])));
						default:
							var k = w.a;
							var ls = w.b;
							return _Utils_Tuple2(
								acc,
								_Utils_ap(
									es,
									_List_fromArray(
										[
											A2($author$project$Model$Keep, k, ls)
										])));
					}
				}),
			_Utils_Tuple2(m, _List_Nil),
			wishes);
	});
var $author$project$Model$Following = {$: 4};
var $author$project$Model$Say = function (a) {
	return {$: 0, a: a};
};
var $author$project$Flow$Pending = $elm$core$Basics$identity;
var $author$project$Flow$Waiting = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $author$project$Protocol$Set = F2(
	function (a, b) {
		return {$: 4, a: a, b: b};
	});
var $author$project$Protocol$SetRoute = F2(
	function (a, b) {
		return {$: 7, a: a, b: b};
	});
var $author$project$Flow$command = function (e) {
	if (!e.$) {
		var a = e.a;
		var v = e.b;
		return A2($author$project$Protocol$Set, a, v);
	} else {
		var c = e.a;
		var to = e.b;
		return A2($author$project$Protocol$SetRoute, c, to);
	}
};
var $elm$core$Dict$getMin = function (dict) {
	getMin:
	while (true) {
		if ((dict.$ === -1) && (dict.d.$ === -1)) {
			var left = dict.d;
			var $temp$dict = left;
			dict = $temp$dict;
			continue getMin;
		} else {
			return dict;
		}
	}
};
var $elm$core$Dict$moveRedLeft = function (dict) {
	if (((dict.$ === -1) && (dict.d.$ === -1)) && (dict.e.$ === -1)) {
		if ((dict.e.d.$ === -1) && (!dict.e.d.a)) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var lLeft = _v1.d;
			var lRight = _v1.e;
			var _v2 = dict.e;
			var rClr = _v2.a;
			var rK = _v2.b;
			var rV = _v2.c;
			var rLeft = _v2.d;
			var _v3 = rLeft.a;
			var rlK = rLeft.b;
			var rlV = rLeft.c;
			var rlL = rLeft.d;
			var rlR = rLeft.e;
			var rRight = _v2.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				0,
				rlK,
				rlV,
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					rlL),
				A5($elm$core$Dict$RBNode_elm_builtin, 1, rK, rV, rlR, rRight));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v4 = dict.d;
			var lClr = _v4.a;
			var lK = _v4.b;
			var lV = _v4.c;
			var lLeft = _v4.d;
			var lRight = _v4.e;
			var _v5 = dict.e;
			var rClr = _v5.a;
			var rK = _v5.b;
			var rV = _v5.c;
			var rLeft = _v5.d;
			var rRight = _v5.e;
			if (clr === 1) {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$moveRedRight = function (dict) {
	if (((dict.$ === -1) && (dict.d.$ === -1)) && (dict.e.$ === -1)) {
		if ((dict.d.d.$ === -1) && (!dict.d.d.a)) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var _v2 = _v1.d;
			var _v3 = _v2.a;
			var llK = _v2.b;
			var llV = _v2.c;
			var llLeft = _v2.d;
			var llRight = _v2.e;
			var lRight = _v1.e;
			var _v4 = dict.e;
			var rClr = _v4.a;
			var rK = _v4.b;
			var rV = _v4.c;
			var rLeft = _v4.d;
			var rRight = _v4.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				0,
				lK,
				lV,
				A5($elm$core$Dict$RBNode_elm_builtin, 1, llK, llV, llLeft, llRight),
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					lRight,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight)));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v5 = dict.d;
			var lClr = _v5.a;
			var lK = _v5.b;
			var lV = _v5.c;
			var lLeft = _v5.d;
			var lRight = _v5.e;
			var _v6 = dict.e;
			var rClr = _v6.a;
			var rK = _v6.b;
			var rV = _v6.c;
			var rLeft = _v6.d;
			var rRight = _v6.e;
			if (clr === 1) {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					1,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, 0, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, 0, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$removeHelpPrepEQGT = F7(
	function (targetKey, dict, color, key, value, left, right) {
		if ((left.$ === -1) && (!left.a)) {
			var _v1 = left.a;
			var lK = left.b;
			var lV = left.c;
			var lLeft = left.d;
			var lRight = left.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				lK,
				lV,
				lLeft,
				A5($elm$core$Dict$RBNode_elm_builtin, 0, key, value, lRight, right));
		} else {
			_v2$2:
			while (true) {
				if ((right.$ === -1) && (right.a === 1)) {
					if (right.d.$ === -1) {
						if (right.d.a === 1) {
							var _v3 = right.a;
							var _v4 = right.d;
							var _v5 = _v4.a;
							return $elm$core$Dict$moveRedRight(dict);
						} else {
							break _v2$2;
						}
					} else {
						var _v6 = right.a;
						var _v7 = right.d;
						return $elm$core$Dict$moveRedRight(dict);
					}
				} else {
					break _v2$2;
				}
			}
			return dict;
		}
	});
var $elm$core$Dict$removeMin = function (dict) {
	if ((dict.$ === -1) && (dict.d.$ === -1)) {
		var color = dict.a;
		var key = dict.b;
		var value = dict.c;
		var left = dict.d;
		var lColor = left.a;
		var lLeft = left.d;
		var right = dict.e;
		if (lColor === 1) {
			if ((lLeft.$ === -1) && (!lLeft.a)) {
				var _v3 = lLeft.a;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					key,
					value,
					$elm$core$Dict$removeMin(left),
					right);
			} else {
				var _v4 = $elm$core$Dict$moveRedLeft(dict);
				if (_v4.$ === -1) {
					var nColor = _v4.a;
					var nKey = _v4.b;
					var nValue = _v4.c;
					var nLeft = _v4.d;
					var nRight = _v4.e;
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						$elm$core$Dict$removeMin(nLeft),
						nRight);
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			}
		} else {
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				key,
				value,
				$elm$core$Dict$removeMin(left),
				right);
		}
	} else {
		return $elm$core$Dict$RBEmpty_elm_builtin;
	}
};
var $elm$core$Dict$removeHelp = F2(
	function (targetKey, dict) {
		if (dict.$ === -2) {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		} else {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_cmp(targetKey, key) < 0) {
				if ((left.$ === -1) && (left.a === 1)) {
					var _v4 = left.a;
					var lLeft = left.d;
					if ((lLeft.$ === -1) && (!lLeft.a)) {
						var _v6 = lLeft.a;
						return A5(
							$elm$core$Dict$RBNode_elm_builtin,
							color,
							key,
							value,
							A2($elm$core$Dict$removeHelp, targetKey, left),
							right);
					} else {
						var _v7 = $elm$core$Dict$moveRedLeft(dict);
						if (_v7.$ === -1) {
							var nColor = _v7.a;
							var nKey = _v7.b;
							var nValue = _v7.c;
							var nLeft = _v7.d;
							var nRight = _v7.e;
							return A5(
								$elm$core$Dict$balance,
								nColor,
								nKey,
								nValue,
								A2($elm$core$Dict$removeHelp, targetKey, nLeft),
								nRight);
						} else {
							return $elm$core$Dict$RBEmpty_elm_builtin;
						}
					}
				} else {
					return A5(
						$elm$core$Dict$RBNode_elm_builtin,
						color,
						key,
						value,
						A2($elm$core$Dict$removeHelp, targetKey, left),
						right);
				}
			} else {
				return A2(
					$elm$core$Dict$removeHelpEQGT,
					targetKey,
					A7($elm$core$Dict$removeHelpPrepEQGT, targetKey, dict, color, key, value, left, right));
			}
		}
	});
var $elm$core$Dict$removeHelpEQGT = F2(
	function (targetKey, dict) {
		if (dict.$ === -1) {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_eq(targetKey, key)) {
				var _v1 = $elm$core$Dict$getMin(right);
				if (_v1.$ === -1) {
					var minKey = _v1.b;
					var minValue = _v1.c;
					return A5(
						$elm$core$Dict$balance,
						color,
						minKey,
						minValue,
						left,
						$elm$core$Dict$removeMin(right));
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			} else {
				return A5(
					$elm$core$Dict$balance,
					color,
					key,
					value,
					left,
					A2($elm$core$Dict$removeHelp, targetKey, right));
			}
		} else {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		}
	});
var $elm$core$Dict$remove = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$removeHelp, key, dict);
		if ((_v0.$ === -1) && (!_v0.a)) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, 1, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $author$project$Flow$sent = F2(
	function (now, e) {
		return {bC: now, B: e, bX: false};
	});
var $author$project$Flow$next = F2(
	function (now, _v0) {
		var d = _v0;
		var _v1 = $elm$core$Dict$toList(d);
		if (_v1.b) {
			var _v2 = _v1.a;
			var k = _v2.a;
			var e = _v2.b;
			return _Utils_Tuple2(
				A2(
					$author$project$Flow$Waiting,
					A2($author$project$Flow$sent, now, e),
					A2($elm$core$Dict$remove, k, d)),
				$elm$core$Maybe$Just(
					$author$project$Flow$command(e)));
		} else {
			return _Utils_Tuple2($author$project$Flow$Idle, $elm$core$Maybe$Nothing);
		}
	});
var $author$project$Flow$acked = F2(
	function (now, f) {
		if (!f.$) {
			return _Utils_Tuple2($author$project$Flow$Idle, $elm$core$Maybe$Nothing);
		} else {
			var p = f.b;
			return A2($author$project$Flow$next, now, p);
		}
	});
var $author$project$Flow$inFlight = function (f) {
	if (!f.$) {
		return $elm$core$Maybe$Nothing;
	} else {
		var s = f.a;
		return $elm$core$Maybe$Just(
			$author$project$Flow$command(s.B));
	}
};
var $elm$core$List$singleton = function (value) {
	return _List_fromArray(
		[value]);
};
var $author$project$Model$maybeList = A2(
	$elm$core$Basics$composeR,
	$elm$core$Maybe$map($elm$core$List$singleton),
	$elm$core$Maybe$withDefault(_List_Nil));
var $elm$core$List$member = F2(
	function (x, xs) {
		return A2(
			$elm$core$List$any,
			function (a) {
				return _Utils_eq(a, x);
			},
			xs);
	});
var $author$project$Protocol$outgoingCommand = function (_v0) {
	var c = _v0.a;
	return c;
};
var $author$project$Model$sentBy = function (e) {
	switch (e.$) {
		case 0:
			var o = e.a;
			return $elm$core$Maybe$Just(
				$author$project$Protocol$outgoingCommand(o));
		case 1:
			return $elm$core$Maybe$Nothing;
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Model$sending = F3(
	function (before, m, effects) {
		return _Utils_eq(before.b, $author$project$Model$Following) ? _Utils_Tuple2(
			_Utils_update(
				m,
				{
					l: _Utils_ap(
						m.l,
						A2($elm$core$List$filterMap, $author$project$Model$sentBy, effects))
				}),
			effects) : _Utils_Tuple2(m, effects);
	});
var $author$project$Model$released = function (_v0) {
	var m = _v0.a;
	var effects = _v0.b;
	if (!_Utils_eq(m.b, $author$project$Model$Following)) {
		return _Utils_Tuple2(
			_Utils_update(
				m,
				{u: $author$project$Flow$idle}),
			effects);
	} else {
		var _v1 = $author$project$Flow$inFlight(m.u);
		if (!_v1.$) {
			var c = _v1.a;
			if (A2($elm$core$List$member, c, m.l)) {
				return _Utils_Tuple2(m, effects);
			} else {
				var _v2 = A2($author$project$Flow$acked, m.I, m.u);
				var flow = _v2.a;
				var next = _v2.b;
				var _v3 = A2(
					$author$project$Model$effectsOf,
					A2(
						$elm$core$List$map,
						$author$project$Model$Say,
						$author$project$Model$maybeList(next)),
					_Utils_update(
						m,
						{u: flow}));
				var m1 = _v3.a;
				var more = _v3.b;
				return A2(
					$elm$core$Tuple$mapSecond,
					$elm$core$Basics$append(effects),
					A3($author$project$Model$sending, m1, m1, more));
			}
		} else {
			return _Utils_Tuple2(m, effects);
		}
	}
};
var $author$project$Protocol$Follow = function (a) {
	return {$: 6, a: a};
};
var $author$project$Protocol$Index = function (a) {
	return {$: 2, a: a};
};
var $author$project$Protocol$ListProjects = {$: 8};
var $author$project$Protocol$LoadProject = F3(
	function (a, b, c) {
		return {$: 11, a: a, b: b, c: c};
	});
var $author$project$Protocol$OrbitCmd = function (a) {
	return {$: 13, a: a};
};
var $author$project$Flow$RouteOf = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $author$project$Protocol$SaveProject = {$: 9};
var $author$project$Protocol$SaveProjectAs = function (a) {
	return {$: 10, a: a};
};
var $author$project$Model$Unsent = function (a) {
	return {$: 3, a: a};
};
var $author$project$Flow$SetTo = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Schema$param = F2(
	function (a, _v0) {
		var s = _v0;
		return A2(
			$elm$core$Dict$get,
			$author$project$Addr$key(a),
			s.es);
	});
var $author$project$Model$isMixer = F2(
	function (a, m) {
		return !_Utils_eq(
			A2($author$project$Schema$param, a, m.ai),
			$elm$core$Maybe$Nothing);
	});
var $author$project$Model$isOrbit = F2(
	function (a, m) {
		return !_Utils_eq(
			A2($author$project$Schema$param, a, m.bj),
			$elm$core$Maybe$Nothing);
	});
var $author$project$Model$isSettings = F2(
	function (a, m) {
		return !_Utils_eq(
			A2($author$project$Schema$param, a, m.bq),
			$elm$core$Maybe$Nothing);
	});
var $author$project$Model$isDescribed = F2(
	function (a, m) {
		return (!_Utils_eq(
			A2($author$project$Schema$param, a, m.g),
			$elm$core$Maybe$Nothing)) || (A2($author$project$Model$isMixer, a, m) || (A2($author$project$Model$isSettings, a, m) || A2($author$project$Model$isOrbit, a, m)));
	});
var $elm$core$Tuple$mapBoth = F3(
	function (funcA, funcB, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			funcA(x),
			funcB(y));
	});
var $author$project$Model$takesEdits = function (m) {
	return _Utils_eq(m.b, $author$project$Model$Following) && ((!_Utils_eq(m.t, $elm$core$Maybe$Nothing)) && _Utils_eq(m.t, m.aJ));
};
var $author$project$Protocol$cellKey = function (_v0) {
	var c = _v0;
	return c;
};
var $author$project$Flow$keyOf = function (e) {
	if (!e.$) {
		var a = e.a;
		return $author$project$Addr$key(a);
	} else {
		var c = e.a;
		return 'route ' + $author$project$Protocol$cellKey(c);
	}
};
var $author$project$Flow$want = F3(
	function (now, e, f) {
		if (!f.$) {
			return _Utils_Tuple2(
				A2(
					$author$project$Flow$Waiting,
					A2($author$project$Flow$sent, now, e),
					$elm$core$Dict$empty),
				$elm$core$Maybe$Just(
					$author$project$Flow$command(e)));
		} else {
			var s = f.a;
			var d = f.b;
			return _Utils_eq(s.B, e) ? _Utils_Tuple2(
				A2(
					$author$project$Flow$Waiting,
					s,
					A2(
						$elm$core$Dict$remove,
						$author$project$Flow$keyOf(e),
						d)),
				$elm$core$Maybe$Nothing) : _Utils_Tuple2(
				A2(
					$author$project$Flow$Waiting,
					s,
					A3(
						$elm$core$Dict$insert,
						$author$project$Flow$keyOf(e),
						e,
						d)),
				$elm$core$Maybe$Nothing);
		}
	});
var $author$project$Model$edit = F3(
	function (a, v, m) {
		if ($author$project$Model$takesEdits(m) && A2($author$project$Model$isDescribed, a, m)) {
			var _v0 = $author$project$Protocol$outgoing(
				A2($author$project$Protocol$Set, a, v));
			if (!_v0.$) {
				return A3(
					$elm$core$Tuple$mapBoth,
					function (flow) {
						return _Utils_update(
							m,
							{u: flow});
					},
					$author$project$Model$maybeList,
					A3(
						$author$project$Flow$want,
						m.I,
						A2($author$project$Flow$SetTo, a, v),
						m.u));
			} else {
				return _Utils_Tuple2(
					A2(
						$author$project$Model$keep,
						$author$project$Model$Unsendable(
							A2($author$project$Protocol$Set, a, v)),
						m),
					_List_Nil);
			}
		} else {
			return _Utils_Tuple2(m, _List_Nil);
		}
	});
var $author$project$Model$BadSchema = F2(
	function (a, b) {
		return {$: 6, a: a, b: b};
	});
var $author$project$Model$Halted = function (a) {
	return {$: 5, a: a};
};
var $author$project$Model$Refusal = function (a) {
	return {$: 0, a: a};
};
var $author$project$Model$Unreadable = function (a) {
	return {$: 0, a: a};
};
var $author$project$Model$AskedSet = function (a) {
	return {$: 1, a: a};
};
var $author$project$Model$AskedSince = {$: 0};
var $author$project$Model$TooLarge = {$: 5};
var $author$project$Model$UpdateUnit = {$: 1};
var $author$project$Model$Checking = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $author$project$Model$Faulted = function (a) {
	return {$: 7, a: a};
};
var $author$project$Model$OtherProtocol = function (a) {
	return {$: 2, a: a};
};
var $author$project$Model$UpdateEditor = {$: 0};
var $author$project$Protocol$EngineSchema = function (a) {
	return {$: 0, a: a};
};
var $author$project$Protocol$MatrixSchema = function (a) {
	return {$: 2, a: a};
};
var $author$project$Model$heldSchema = F2(
	function (s, m) {
		return A2(
			$elm$core$Maybe$map,
			function ($) {
				return $.g;
			},
			A2(
				$elm$core$Dict$get,
				$author$project$Protocol$schemaToken(s),
				m.aw));
	});
var $elm$core$Tuple$pair = F2(
	function (a, b) {
		return _Utils_Tuple2(a, b);
	});
var $author$project$Model$adopt = function (m) {
	var _v0 = A2(
		$elm$core$Maybe$andThen,
		function (e) {
			return A2(
				$elm$core$Maybe$map,
				$elm$core$Tuple$pair(e),
				A2(
					$author$project$Model$heldSchema,
					$author$project$Protocol$EngineSchema(e),
					m));
		},
		m.t);
	if (!_v0.$) {
		var _v1 = _v0.a;
		var e = _v1.a;
		var sch = _v1.b;
		return _Utils_update(
			m,
			{
				aJ: $elm$core$Maybe$Just(e),
				bR: A2(
					$elm$core$Maybe$withDefault,
					$author$project$Schema$empty,
					A2(
						$author$project$Model$heldSchema,
						$author$project$Protocol$MatrixSchema(e),
						m)),
				g: sch
			});
	} else {
		return m;
	}
};
var $elm$core$Dict$member = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$get, key, dict);
		if (!_v0.$) {
			return true;
		} else {
			return false;
		}
	});
var $author$project$Schema$onLast = F2(
	function (f, xs) {
		var _v0 = $elm$core$List$reverse(xs);
		if (_v0.b) {
			var last = _v0.a;
			var before = _v0.b;
			return $elm$core$List$reverse(
				A2(
					$elm$core$List$cons,
					f(last),
					before));
		} else {
			return _List_Nil;
		}
	});
var $author$project$Schema$onLastPanel = function (f) {
	return $author$project$Schema$onLast(
		function (pg) {
			return _Utils_update(
				pg,
				{
					eO: A2($author$project$Schema$onLast, f, pg.eO)
				});
		});
};
var $author$project$Schema$onMidiMap = F2(
	function (f, s) {
		return _Utils_update(
			s,
			{
				cB: f(s.cB)
			});
	});
var $elm$core$Dict$update = F3(
	function (targetKey, alter, dictionary) {
		var _v0 = alter(
			A2($elm$core$Dict$get, targetKey, dictionary));
		if (!_v0.$) {
			var value = _v0.a;
			return A3($elm$core$Dict$insert, targetKey, value, dictionary);
		} else {
			return A2($elm$core$Dict$remove, targetKey, dictionary);
		}
	});
var $author$project$Schema$add = F2(
	function (line, _v0) {
		var s = _v0;
		switch (line.$) {
			case 2:
				var p = line.a;
				return _Utils_update(
					s,
					{
						ci: $elm$core$Maybe$Just(p.ci),
						aB: _Utils_ap(
							A2(
								$elm$core$List$filter,
								function (x) {
									return !_Utils_eq(x.eC, p.eC);
								},
								s.aB),
							_List_fromArray(
								[
									{bB: _List_Nil, cj: $elm$core$Maybe$Nothing, aO: p.aO, eC: p.eC, eO: _List_Nil}
								]))
					});
			case 3:
				var p = line.a;
				return _Utils_update(
					s,
					{
						aB: A2(
							$author$project$Schema$onLast,
							function (pg) {
								return _Utils_update(
									pg,
									{
										eO: _Utils_ap(
											pg.eO,
											_List_fromArray(
												[
													{aR: p.aR, eP: _List_Nil, W: _List_Nil, dT: p.dT}
												]))
									});
							},
							s.aB)
					});
			case 4:
				var p = line.a;
				var q = {w: p.w, d9: p.d9, ej: p.ej, cv: p.cv, aO: p.aO, cx: p.cx, cC: p.cC, bi: _List_Nil, b$: p.b$, eY: p.eY};
				return _Utils_update(
					s,
					{
						es: A3(
							$elm$core$Dict$insert,
							$author$project$Addr$key(p.w),
							q,
							s.es),
						aU: A2(
							$elm$core$Dict$member,
							$author$project$Addr$key(p.w),
							s.es) ? s.aU : A2($elm$core$List$cons, p.w, s.aU),
						aB: A2(
							$author$project$Schema$onLastPanel,
							function (pn) {
								return _Utils_update(
									pn,
									{
										eP: _Utils_ap(
											pn.eP,
											_List_fromArray(
												[q]))
									});
							},
							s.aB)
					});
			case 5:
				var o = line.a;
				var withOpt = function (q) {
					return _Utils_eq(q.w, o.w) ? _Utils_update(
						q,
						{
							bi: _Utils_ap(
								q.bi,
								_List_fromArray(
									[
										_Utils_Tuple2(o.es, o.aR)
									]))
						}) : q;
				};
				return _Utils_update(
					s,
					{
						es: A3(
							$elm$core$Dict$update,
							$author$project$Addr$key(o.w),
							$elm$core$Maybe$map(withOpt),
							s.es),
						aB: A2(
							$author$project$Schema$onLastPanel,
							function (pn) {
								return _Utils_update(
									pn,
									{
										eP: A2($elm$core$List$map, withOpt, pn.eP)
									});
							},
							s.aB)
					});
			case 6:
				var r = line.a;
				return _Utils_update(
					s,
					{
						aB: A2(
							$author$project$Schema$onLastPanel,
							function (pn) {
								return _Utils_update(
									pn,
									{
										W: _Utils_ap(
											pn.W,
											_List_fromArray(
												[r]))
									});
							},
							s.aB)
					});
			case 8:
				var r = line.a;
				var m = s.bR;
				return _Utils_update(
					s,
					{
						bR: _Utils_update(
							m,
							{
								b5: _Utils_ap(
									m.b5,
									_List_fromArray(
										[
											_Utils_Tuple2(r.eX, r.aO)
										]))
							})
					});
			case 9:
				var c = line.a;
				var m = s.bR;
				return _Utils_update(
					s,
					{
						bR: _Utils_update(
							m,
							{
								bJ: _Utils_ap(
									m.bJ,
									_List_fromArray(
										[
											_Utils_Tuple2(c.e$, c.w)
										]))
							})
					});
			case 10:
				var lo = line.a;
				var hi = line.b;
				var m = s.bR;
				return _Utils_update(
					s,
					{
						bR: _Utils_update(
							m,
							{
								cM: $elm$core$Maybe$Just(
									_Utils_Tuple2(lo, hi))
							})
					});
			case 11:
				var n = line.a;
				var m = s.bR;
				return _Utils_update(
					s,
					{
						bR: _Utils_update(
							m,
							{
								cm: $elm$core$Maybe$Just(n)
							})
					});
			case 12:
				return s;
			case 13:
				return s;
			case 14:
				return s;
			case 7:
				return s;
			case 45:
				return s;
			case 0:
				return s;
			case 15:
				return s;
			case 16:
				return s;
			case 1:
				return s;
			case 17:
				return s;
			case 19:
				var c = line.a;
				return _Utils_update(
					s,
					{
						aB: A2(
							$author$project$Schema$onLast,
							function (pg) {
								return _Utils_update(
									pg,
									{
										cj: $elm$core$Maybe$Just(c)
									});
							},
							s.aB)
					});
			case 20:
				return s;
			case 21:
				return s;
			case 22:
				return s;
			case 23:
				return s;
			case 24:
				return s;
			case 25:
				return s;
			case 18:
				return s;
			case 26:
				var r = line.a;
				return A2(
					$author$project$Schema$onMidiMap,
					function (mm) {
						return _Utils_update(
							mm,
							{
								bO: _Utils_ap(
									mm.bO,
									_List_fromArray(
										[r]))
							});
					},
					s);
			case 27:
				var r = line.a;
				return A2(
					$author$project$Schema$onMidiMap,
					function (mm) {
						return _Utils_update(
							mm,
							{
								ew: _Utils_ap(
									mm.ew,
									_List_fromArray(
										[r]))
							});
					},
					s);
			case 28:
				var ns = line.a;
				return A2(
					$author$project$Schema$onMidiMap,
					function (mm) {
						return _Utils_update(
							mm,
							{cg: ns});
					},
					s);
			case 29:
				var ns = line.a;
				return A2(
					$author$project$Schema$onMidiMap,
					function (mm) {
						return _Utils_update(
							mm,
							{cE: ns});
					},
					s);
			case 30:
				var lo = line.a;
				var hi = line.b;
				return A2(
					$author$project$Schema$onMidiMap,
					function (mm) {
						return _Utils_update(
							mm,
							{
								cS: $elm$core$Maybe$Just(
									_Utils_Tuple2(lo, hi))
							});
					},
					s);
			case 31:
				var n = line.a;
				return A2(
					$author$project$Schema$onMidiMap,
					function (mm) {
						return _Utils_update(
							mm,
							{
								cO: $elm$core$Maybe$Just(n)
							});
					},
					s);
			case 32:
				var n = line.a;
				return A2(
					$author$project$Schema$onMidiMap,
					function (mm) {
						return _Utils_update(
							mm,
							{
								bd: $elm$core$Maybe$Just(n)
							});
					},
					s);
			case 33:
				return s;
			case 34:
				return s;
			case 35:
				return s;
			case 36:
				return s;
			case 37:
				var a = line.a;
				return _Utils_update(
					s,
					{
						aB: A2(
							$author$project$Schema$onLast,
							function (pg) {
								return _Utils_update(
									pg,
									{
										bB: _Utils_ap(
											pg.bB,
											_List_fromArray(
												[a]))
									});
							},
							s.aB)
					});
			case 38:
				return s;
			case 39:
				return s;
			case 40:
				return s;
			case 41:
				return s;
			case 42:
				return s;
			case 43:
				return s;
			default:
				return s;
		}
	});
var $author$project$Model$describing = F2(
	function (a, m) {
		var _v0 = m.b;
		switch (_v0.$) {
			case 3:
				return _Utils_update(
					m,
					{
						ay: A2($author$project$Schema$add, a, m.ay)
					});
			case 0:
				return m;
			case 1:
				return m;
			case 2:
				return m;
			case 4:
				return m;
			default:
				return m;
		}
	});
var $elm$core$Dict$filter = F2(
	function (isGood, dict) {
		return A3(
			$elm$core$Dict$foldl,
			F3(
				function (k, v, d) {
					return A2(isGood, k, v) ? A3($elm$core$Dict$insert, k, v, d) : d;
				}),
			$elm$core$Dict$empty,
			dict);
	});
var $author$project$Schema$hasPanel = F2(
	function (name, _v0) {
		var s = _v0;
		return A2(
			$elm$core$List$any,
			function (pg) {
				return A2(
					$elm$core$List$any,
					function (pn) {
						return _Utils_eq(pn.aR, name);
					},
					pg.eO);
			},
			s.aB);
	});
var $author$project$Model$isMixerKey = F2(
	function (k, m) {
		return A2(
			$elm$core$Maybe$withDefault,
			false,
			A2(
				$elm$core$Maybe$map,
				function (a) {
					return A2($author$project$Model$isMixer, a, m);
				},
				$author$project$Addr$fromWire(k)));
	});
var $author$project$Model$isOrbitKey = F2(
	function (k, m) {
		return A2(
			$elm$core$Maybe$withDefault,
			false,
			A2(
				$elm$core$Maybe$map,
				function (a) {
					return A2($author$project$Model$isOrbit, a, m);
				},
				$author$project$Addr$fromWire(k)));
	});
var $author$project$Model$isSettingsKey = F2(
	function (k, m) {
		return A2(
			$elm$core$Maybe$withDefault,
			false,
			A2(
				$elm$core$Maybe$map,
				function (a) {
					return A2($author$project$Model$isSettings, a, m);
				},
				$author$project$Addr$fromWire(k)));
	});
var $author$project$Model$mixerOnly = function (m) {
	return _Utils_update(
		m,
		{
			K: A2(
				$elm$core$Dict$filter,
				F2(
					function (k, _v0) {
						return A2($author$project$Model$isMixerKey, k, m) || (A2($author$project$Model$isSettingsKey, k, m) || A2($author$project$Model$isOrbitKey, k, m));
					}),
				m.K),
			L: A2(
				$elm$core$Dict$filter,
				F2(
					function (k, _v1) {
						return A2($author$project$Schema$hasPanel, k, m.ai);
					}),
				m.L)
		});
};
var $author$project$Model$nextSeat = function (_v0) {
	var n = _v0;
	return n + 1;
};
var $author$project$Protocol$ringNoToInt = function (_v0) {
	var n = _v0;
	return n;
};
var $author$project$Protocol$rowIndexToInt = function (_v0) {
	var n = _v0;
	return n;
};
var $author$project$Protocol$sceneNoToInt = function (_v0) {
	var n = _v0;
	return n;
};
var $author$project$Protocol$segmentToInt = function (_v0) {
	var n = _v0;
	return n;
};
var $author$project$Model$setRefused = F4(
	function (sent, a, why, m) {
		if (!sent.$) {
			return A2(
				$author$project$Model$keep,
				$author$project$Model$Refusal(
					{aX: sent, aH: why}),
				m);
		} else {
			return A2(
				$elm$core$String$contains,
				$author$project$Addr$key(a),
				why) ? A2(
				$author$project$Model$keep,
				$author$project$Model$Refusal(
					{aX: $elm$core$Maybe$Nothing, aH: why}),
				m) : A2(
				$author$project$Model$keep,
				$author$project$Model$Refusal(
					{
						aX: $elm$core$Maybe$Nothing,
						aH: $author$project$Addr$key(a) + (': ' + why)
					}),
				m);
		}
	});
var $author$project$Protocol$stepNoToInt = function (_v0) {
	var n = _v0;
	return n;
};
var $author$project$Model$answer = F2(
	function (a, m) {
		switch (a.$) {
			case 0:
				switch (a.a.$) {
					case 0:
						var h = a.a.a;
						return _Utils_update(
							m,
							{
								t: $elm$core$Maybe$Just(h.t),
								ak: $elm$core$Maybe$Just(h.ak)
							});
					case 1:
						var n = a.a.a;
						return _Utils_update(
							m,
							{
								b: $author$project$Model$Halted(
									$author$project$Model$OtherProtocol(n))
							});
					default:
						var n = a.a.a;
						return _Utils_update(
							m,
							{
								b: $author$project$Model$Halted(
									$author$project$Model$OtherProtocol(n))
							});
				}
			case 45:
				if (a.a.$ === 1) {
					return _Utils_update(
						m,
						{
							e: $elm$core$Maybe$Nothing,
							b: $author$project$Model$Halted($author$project$Model$UpdateEditor)
						});
				} else {
					var f = a.a;
					return _Utils_update(
						m,
						{
							e: $elm$core$Maybe$Nothing,
							b: $author$project$Model$Halted(
								$author$project$Model$Faulted(f))
						});
				}
			case 1:
				var r = a.a;
				var _v1 = m.b;
				switch (_v1.$) {
					case 1:
						if (_v1.b.$ === 1) {
							var s = _v1.a;
							var _v2 = _v1.b;
							return _Utils_eq(r.g, s) ? _Utils_update(
								m,
								{
									b: A2(
										$author$project$Model$Checking,
										s,
										$elm$core$Maybe$Just(
											{j: r.j, aB: r.aB}))
								}) : m;
						} else {
							return m;
						}
					case 0:
						return m;
					case 2:
						return m;
					case 3:
						return m;
					case 4:
						return m;
					default:
						return m;
				}
			case 16:
				var p = a.a;
				var e = a.b;
				return $author$project$Model$adopt(
					$author$project$Model$mixerOnly(
						_Utils_update(
							m,
							{
								t: $elm$core$Maybe$Just(e),
								ak: $elm$core$Maybe$Just(p),
								z: $elm$core$Dict$empty,
								W: $elm$core$Dict$empty,
								aE: $author$project$Model$nextSeat(m.aE),
								cR: $elm$core$Maybe$Nothing,
								bA: true
							})));
			case 17:
				return _Utils_update(
					m,
					{
						K: A2(
							$elm$core$Dict$filter,
							F2(
								function (k, _v3) {
									return !A2($author$project$Model$isMixerKey, k, m);
								}),
							m.K),
						L: A2(
							$elm$core$Dict$filter,
							F2(
								function (k, _v4) {
									return !A2($author$project$Schema$hasPanel, k, m.ai);
								}),
							m.L)
					});
			case 3:
				var p = a.a;
				if (_Utils_eq(m.b, $author$project$Model$Following)) {
					var _v5 = p.dT;
					if (!_v5.$) {
						var v = _v5.a;
						return _Utils_update(
							m,
							{
								L: A3($elm$core$Dict$insert, p.aR, v, m.L)
							});
					} else {
						return _Utils_update(
							m,
							{
								L: A2($elm$core$Dict$remove, p.aR, m.L)
							});
					}
				} else {
					return A2($author$project$Model$describing, a, m);
				}
			case 15:
				var v = a.a;
				return (!A2($author$project$Model$isDescribed, v.w, m)) ? m : _Utils_update(
					m,
					{
						z: A2(
							$elm$core$Dict$remove,
							$author$project$Addr$key(v.w),
							m.z),
						K: A3(
							$elm$core$Dict$insert,
							$author$project$Addr$key(v.w),
							{cG: v.cG, cW: v.cW, aZ: v.aZ},
							m.K)
					});
			case 18:
				var at = a.a;
				var why = a.b;
				return (m.bA || _Utils_eq(
					A2($author$project$Schema$param, at, m.g),
					$elm$core$Maybe$Nothing)) ? m : A4(
					$author$project$Model$setRefused,
					$elm$core$Maybe$Nothing,
					at,
					why,
					_Utils_update(
						m,
						{
							z: A3(
								$elm$core$Dict$insert,
								$author$project$Addr$key(at),
								why,
								m.z)
						}));
			case 7:
				var text = a.a;
				return _Utils_eq(m.b, $author$project$Model$Following) ? _Utils_update(
					m,
					{
						cR: $elm$core$Maybe$Just(text)
					}) : A2($author$project$Model$describing, a, m);
			case 2:
				return A2($author$project$Model$describing, a, m);
			case 4:
				return A2($author$project$Model$describing, a, m);
			case 5:
				return A2($author$project$Model$describing, a, m);
			case 6:
				return A2($author$project$Model$describing, a, m);
			case 8:
				return A2($author$project$Model$describing, a, m);
			case 9:
				return A2($author$project$Model$describing, a, m);
			case 10:
				return A2($author$project$Model$describing, a, m);
			case 11:
				return A2($author$project$Model$describing, a, m);
			case 12:
				return _Utils_update(
					m,
					{W: $elm$core$Dict$empty});
			case 13:
				var r = a.a;
				return _Utils_update(
					m,
					{
						W: A3(
							$elm$core$Dict$insert,
							$author$project$Protocol$cellKey(r.d4),
							{cd: r.cd, aZ: r.aZ},
							m.W)
					});
			case 14:
				var c = a.a;
				return _Utils_update(
					m,
					{
						W: A2(
							$elm$core$Dict$remove,
							$author$project$Protocol$cellKey(c),
							m.W)
					});
			case 19:
				return A2($author$project$Model$describing, a, m);
			case 20:
				return _Utils_update(
					m,
					{aQ: $elm$core$Maybe$Nothing, bV: $elm$core$Maybe$Nothing, bs: $elm$core$Dict$empty, b8: $elm$core$Maybe$Nothing});
			case 21:
				var p = a.a;
				return _Utils_update(
					m,
					{
						bV: $elm$core$Maybe$Just(p)
					});
			case 22:
				var snd = a.a;
				return _Utils_update(
					m,
					{
						bs: A3(
							$elm$core$Dict$insert,
							$author$project$Unit$partNumber(snd.ak),
							{aR: snd.aR, bt: snd.bt},
							m.bs)
					});
			case 23:
				var t = a.a;
				return _Utils_update(
					m,
					{
						b8: $elm$core$Maybe$Just(t)
					});
			case 24:
				var r = a.a;
				return _Utils_update(
					m,
					{
						aQ: $elm$core$Maybe$Just(
							{cD: r.cD, bW: _List_Nil})
					});
			case 25:
				var pr = a.a;
				return _Utils_update(
					m,
					{
						aQ: A2(
							$elm$core$Maybe$map,
							function (l) {
								return _Utils_update(
									l,
									{
										bW: _Utils_ap(
											l.bW,
											_List_fromArray(
												[pr]))
									});
							},
							m.aQ)
					});
			case 26:
				return A2($author$project$Model$describing, a, m);
			case 27:
				return A2($author$project$Model$describing, a, m);
			case 28:
				return A2($author$project$Model$describing, a, m);
			case 29:
				return A2($author$project$Model$describing, a, m);
			case 30:
				return A2($author$project$Model$describing, a, m);
			case 31:
				return A2($author$project$Model$describing, a, m);
			case 32:
				return A2($author$project$Model$describing, a, m);
			case 33:
				var h = a.a;
				return _Utils_update(
					m,
					{
						T: $elm$core$Maybe$Nothing,
						bc: _List_Nil,
						cw: $elm$core$Maybe$Just(h),
						bd: $elm$core$Dict$empty,
						br: $elm$core$Dict$empty
					});
			case 34:
				var r = a.a;
				var reading = {w: r.w, cn: r.cn, ct: r.ct, cv: r.cv, cx: r.cx, cC: r.cC, bt: r.bt};
				var _v6 = r.eV;
				if (!_v6.$) {
					var i = _v6.a;
					return _Utils_update(
						m,
						{
							br: A3(
								$elm$core$Dict$insert,
								$author$project$Protocol$rowIndexToInt(i),
								reading,
								m.br)
						});
				} else {
					var i = _v6.a;
					return _Utils_update(
						m,
						{
							bd: A3(
								$elm$core$Dict$insert,
								$author$project$Protocol$rowIndexToInt(i),
								reading,
								m.bd)
						});
				}
			case 35:
				var l = a.a;
				return _Utils_update(
					m,
					{
						T: $elm$core$Maybe$Just(l)
					});
			case 36:
				var name = a.a;
				return _Utils_update(
					m,
					{
						bc: _Utils_ap(
							m.bc,
							_List_fromArray(
								[name]))
					});
			case 37:
				return A2($author$project$Model$describing, a, m);
			case 38:
				return _Utils_update(
					m,
					{
						a6: $elm$core$Dict$empty,
						bm: $elm$core$Dict$empty,
						b$: $elm$core$Maybe$Nothing,
						b3: $elm$core$Dict$empty,
						b4: $elm$core$Maybe$Nothing,
						bu: $elm$core$Dict$empty,
						K: A2(
							$elm$core$Dict$filter,
							F2(
								function (k, _v7) {
									return !A2($author$project$Model$isOrbitKey, k, m);
								}),
							m.K)
					});
			case 39:
				var g = a.a;
				return _Utils_update(
					m,
					{
						b4: $elm$core$Maybe$Just(g)
					});
			case 40:
				var sl = a.a;
				return _Utils_update(
					m,
					{
						b3: A3(
							$elm$core$Dict$insert,
							$author$project$Protocol$sceneNoToInt(sl.eW),
							{dH: sl.dH, dM: sl.dM},
							m.b3)
					});
			case 41:
				var sg = a.a;
				var d = a.b;
				return _Utils_update(
					m,
					{
						a6: A3(
							$elm$core$Dict$insert,
							$author$project$Protocol$segmentToInt(sg),
							d,
							m.a6)
					});
			case 42:
				var mask = a.a;
				return _Utils_update(
					m,
					{
						b$: $elm$core$Maybe$Just(mask)
					});
			case 43:
				var r = a.a;
				var i = a.b;
				var n = a.c;
				return _Utils_update(
					m,
					{
						bu: A3(
							$elm$core$Dict$insert,
							_Utils_Tuple2(
								$author$project$Protocol$ringNoToInt(r),
								$author$project$Protocol$stepNoToInt(i)),
							n,
							m.bu)
					});
			default:
				var r = a.a;
				var ns = a.b;
				return _Utils_update(
					m,
					{
						bm: A3(
							$elm$core$Dict$insert,
							$author$project$Protocol$ringNoToInt(r),
							ns,
							m.bm)
					});
		}
	});
var $author$project$Model$AskedOther = {$: 2};
var $author$project$Model$askedBy = function (c) {
	switch (c.$) {
		case 5:
			return $author$project$Model$AskedSince;
		case 4:
			var a = c.a;
			return $author$project$Model$AskedSet(a);
		case 0:
			return $author$project$Model$AskedOther;
		case 1:
			return $author$project$Model$AskedOther;
		case 2:
			return $author$project$Model$AskedOther;
		case 3:
			return $author$project$Model$AskedOther;
		case 6:
			return $author$project$Model$AskedOther;
		case 7:
			return $author$project$Model$AskedOther;
		case 8:
			return $author$project$Model$AskedOther;
		case 9:
			return $author$project$Model$AskedOther;
		case 10:
			return $author$project$Model$AskedOther;
		case 11:
			return $author$project$Model$AskedOther;
		case 12:
			return $author$project$Model$AskedOther;
		default:
			return $author$project$Model$AskedOther;
	}
};
var $author$project$Model$answered = F2(
	function (fits, m) {
		var after = function (cs) {
			after:
			while (true) {
				if (cs.b) {
					var c = cs.a;
					var rest = cs.b;
					if (fits(
						$author$project$Model$askedBy(c))) {
						return rest;
					} else {
						var $temp$cs = rest;
						cs = $temp$cs;
						continue after;
					}
				} else {
					return m.l;
				}
			}
		};
		return _Utils_update(
			m,
			{
				l: after(m.l)
			});
	});
var $elm$core$List$head = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(x);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Model$Describing = F3(
	function (a, b, c) {
		return {$: 3, a: a, b: b, c: c};
	});
var $author$project$Model$Store = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Model$WrongHash = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $author$project$Protocol$supported = 4;
var $elm$core$String$concat = function (strings) {
	return A2($elm$core$String$join, '', strings);
};
var $elm$core$Bitwise$and = _Bitwise_and;
var $elm$core$Bitwise$shiftRightZfBy = _Bitwise_shiftRightZfBy;
var $author$project$Hash$limbHex = function (n) {
	var hexDigit = function (shift) {
		var d = 15 & (n >>> shift);
		return A3($elm$core$String$slice, d, d + 1, '0123456789abcdef');
	};
	return $elm$core$String$concat(
		A2(
			$elm$core$List$map,
			hexDigit,
			_List_fromArray(
				[12, 8, 4, 0])));
};
var $author$project$Hash$toHex = function (_v0) {
	var a3 = _v0.a;
	var a2 = _v0.b;
	var a1 = _v0.c;
	var a0 = _v0.d;
	return $elm$core$String$concat(
		A2(
			$elm$core$List$map,
			$author$project$Hash$limbHex,
			_List_fromArray(
				[a3, a2, a1, a0])));
};
var $author$project$Model$cacheKey = F2(
	function (s, h) {
		return A2(
			$elm$core$String$join,
			'/',
			_List_fromArray(
				[
					$elm$core$String$fromInt($author$project$Protocol$supported),
					$author$project$Protocol$schemaToken(s),
					$author$project$Hash$toHex(h)
				]));
	});
var $elm$core$List$isEmpty = function (xs) {
	if (!xs.b) {
		return true;
	} else {
		return false;
	}
};
var $author$project$Protocol$MapSchema = {$: 4};
var $author$project$Protocol$MixerSchema = {$: 1};
var $author$project$Protocol$OrbitSchema = {$: 5};
var $author$project$Protocol$SettingsSchema = {$: 3};
var $author$project$Model$readNext = function (m) {
	var lacks = function (s) {
		return !A2(
			$elm$core$Dict$member,
			$author$project$Protocol$schemaToken(s),
			m.aw);
	};
	var go = function (st) {
		return _Utils_update(
			m,
			{b: st});
	};
	var _v0 = m.t;
	if (!_v0.$) {
		var e = _v0.a;
		return lacks(
			$author$project$Protocol$EngineSchema(e)) ? go(
			A2(
				$author$project$Model$Checking,
				$author$project$Protocol$EngineSchema(e),
				$elm$core$Maybe$Nothing)) : (lacks($author$project$Protocol$MixerSchema) ? go(
			A2($author$project$Model$Checking, $author$project$Protocol$MixerSchema, $elm$core$Maybe$Nothing)) : (lacks(
			$author$project$Protocol$MatrixSchema(e)) ? go(
			A2(
				$author$project$Model$Checking,
				$author$project$Protocol$MatrixSchema(e),
				$elm$core$Maybe$Nothing)) : (lacks($author$project$Protocol$SettingsSchema) ? go(
			A2($author$project$Model$Checking, $author$project$Protocol$SettingsSchema, $elm$core$Maybe$Nothing)) : (lacks($author$project$Protocol$MapSchema) ? go(
			A2($author$project$Model$Checking, $author$project$Protocol$MapSchema, $elm$core$Maybe$Nothing)) : (lacks($author$project$Protocol$OrbitSchema) ? go(
			A2($author$project$Model$Checking, $author$project$Protocol$OrbitSchema, $elm$core$Maybe$Nothing)) : go($author$project$Model$Following))))));
	} else {
		return go(
			$author$project$Model$Halted($author$project$Model$UpdateEditor));
	}
};
var $author$project$Model$following = F4(
	function (g, owed, more, m) {
		return ((!owed) && ((!more) && ($elm$core$List$isEmpty(m.l) && ((!_Utils_eq(m.t, $elm$core$Maybe$Nothing)) && (!_Utils_eq(m.t, m.aJ)))))) ? $author$project$Model$readNext(
			$author$project$Model$adopt(
				$author$project$Model$mixerOnly(
					_Utils_update(
						m,
						{e: $elm$core$Maybe$Nothing, ba: $elm$core$Maybe$Nothing, aA: false, s: 0, z: $elm$core$Dict$empty, W: $elm$core$Dict$empty})))) : _Utils_update(
			m,
			{
				e: (owed > 0) ? $elm$core$Maybe$Just(m.I) : $elm$core$Maybe$Nothing,
				ba: $elm$core$Maybe$Just(g),
				aA: owed > 0,
				s: owed
			});
	});
var $author$project$Model$install = F3(
	function (s, h, m) {
		var m1 = _Utils_update(
			m,
			{
				aw: A3(
					$elm$core$Dict$insert,
					$author$project$Protocol$schemaToken(s),
					h,
					m.aw)
			});
		switch (s.$) {
			case 1:
				return _Utils_update(
					m1,
					{ai: h.g});
			case 0:
				var e = s.a;
				return _Utils_eq(
					m.t,
					$elm$core$Maybe$Just(e)) ? _Utils_update(
					m1,
					{
						aJ: $elm$core$Maybe$Just(e),
						g: h.g
					}) : m1;
			case 2:
				var e = s.a;
				return _Utils_eq(
					m.t,
					$elm$core$Maybe$Just(e)) ? _Utils_update(
					m1,
					{bR: h.g}) : m1;
			case 3:
				return _Utils_update(
					m1,
					{bq: h.g});
			case 4:
				return _Utils_update(
					m1,
					{cB: h.g});
			default:
				return _Utils_update(
					m1,
					{bj: h.g});
		}
	});
var $author$project$Protocol$PageNo = $elm$core$Basics$identity;
var $author$project$Protocol$nextPage = function (_v0) {
	var n = _v0;
	return n + 1;
};
var $author$project$Hash$Hash = F4(
	function (a, b, c, d) {
		return {$: 0, a: a, b: b, c: c, d: d};
	});
var $author$project$Hash$low = $elm$core$Bitwise$and(65535);
var $elm$core$Bitwise$shiftLeftBy = _Bitwise_shiftLeftBy;
var $elm$core$Bitwise$xor = _Bitwise_xor;
var $author$project$Hash$byte = F2(
	function (b, _v0) {
		var a3 = _v0.a;
		var a2 = _v0.b;
		var a1 = _v0.c;
		var a0 = _v0.d;
		var x0 = a0 ^ b;
		var p0 = x0 * 435;
		var p1 = (a1 * 435) + (p0 >>> 16);
		var p2 = ((a2 * 435) + (p1 >>> 16)) + $author$project$Hash$low(x0 << 8);
		var p3 = (((a3 * 435) + (p2 >>> 16)) + (x0 >>> 8)) + $author$project$Hash$low(a1 << 8);
		return A4(
			$author$project$Hash$Hash,
			$author$project$Hash$low(p3),
			$author$project$Hash$low(p2),
			$author$project$Hash$low(p1),
			$author$project$Hash$low(p0));
	});
var $elm$core$Bitwise$or = _Bitwise_or;
var $author$project$Hash$char = F2(
	function (c, h) {
		var n = $elm$core$Char$toCode(c);
		var tail = function (shift) {
			return $author$project$Hash$byte(128 | (63 & (n >>> shift)));
		};
		return (n < 128) ? A2($author$project$Hash$byte, n, h) : ((n < 2048) ? A2(
			tail,
			0,
			A2($author$project$Hash$byte, 192 | (n >>> 6), h)) : ((n < 65536) ? A2(
			tail,
			0,
			A2(
				tail,
				6,
				A2($author$project$Hash$byte, 224 | (n >>> 12), h))) : A2(
			tail,
			0,
			A2(
				tail,
				6,
				A2(
					tail,
					12,
					A2($author$project$Hash$byte, 240 | (n >>> 18), h))))));
	});
var $elm$core$String$foldl = _String_foldl;
var $author$project$Hash$offset = A4($author$project$Hash$Hash, 52210, 40164, 33826, 8997);
var $author$project$Hash$ofLines = A2(
	$elm$core$List$foldl,
	F2(
		function (l, h) {
			return A2(
				$author$project$Hash$byte,
				10,
				A3($elm$core$String$foldl, $author$project$Hash$char, h, l));
		}),
	$author$project$Hash$offset);
var $author$project$Protocol$pageNoToInt = function (_v0) {
	var n = _v0;
	return n;
};
var $author$project$Model$Recalling = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Model$Remember = function (a) {
	return {$: 1, a: a};
};
var $author$project$Model$recall = F3(
	function (s, r, m) {
		return (!r.aB) ? _Utils_Tuple2(
			$author$project$Model$readNext(
				A3(
					$author$project$Model$install,
					s,
					{j: r.j, g: $author$project$Schema$empty},
					m)),
			_List_Nil) : _Utils_Tuple2(
			_Utils_update(
				m,
				{
					e: $elm$core$Maybe$Just(m.I),
					b: A2($author$project$Model$Recalling, s, r)
				}),
			_List_fromArray(
				[
					$author$project$Model$Remember(
					A2($author$project$Model$cacheKey, s, r.j))
				]));
	});
var $author$project$Model$ok = F3(
	function (done, more, m0) {
		var m = _Utils_update(
			m0,
			{bA: false});
		var _v0 = m.b;
		switch (_v0.$) {
			case 0:
				return _Utils_Tuple2(
					$author$project$Model$readNext(
						_Utils_update(
							m,
							{e: $elm$core$Maybe$Nothing, s: 0})),
					_List_Nil);
			case 1:
				if (!_v0.b.$) {
					var s = _v0.a;
					var r = _v0.b.a;
					var m1 = _Utils_update(
						m,
						{e: $elm$core$Maybe$Nothing, s: 0});
					var _v1 = A2(
						$elm$core$Dict$get,
						$author$project$Protocol$schemaToken(s),
						m.aw);
					if (!_v1.$) {
						var h = _v1.a;
						return _Utils_eq(h.j, r.j) ? _Utils_Tuple2(
							$author$project$Model$readNext(
								A3($author$project$Model$install, s, h, m1)),
							_List_Nil) : A3($author$project$Model$recall, s, r, m1);
					} else {
						return A3($author$project$Model$recall, s, r, m1);
					}
				} else {
					var _v2 = _v0.b;
					return _Utils_Tuple2(
						_Utils_update(
							m,
							{
								e: $elm$core$Maybe$Nothing,
								b: $author$project$Model$Halted($author$project$Model$UpdateEditor)
							}),
						_List_Nil);
				}
			case 2:
				return _Utils_Tuple2(m, _List_Nil);
			case 3:
				var s = _v0.a;
				var r = _v0.b;
				var n = _v0.c;
				var m1 = _Utils_update(
					m,
					{e: $elm$core$Maybe$Nothing, s: 0});
				if (_Utils_cmp(
					$author$project$Protocol$pageNoToInt(n) + 1,
					r.aB) < 0) {
					return _Utils_Tuple2(
						_Utils_update(
							m1,
							{
								b: A3(
									$author$project$Model$Describing,
									s,
									r,
									$author$project$Protocol$nextPage(n))
							}),
						_List_Nil);
				} else {
					var lines = $elm$core$List$reverse(m.az);
					var read_ = $author$project$Hash$ofLines(lines);
					return _Utils_eq(read_, r.j) ? _Utils_Tuple2(
						$author$project$Model$readNext(
							A3(
								$author$project$Model$install,
								s,
								{j: r.j, g: m.ay},
								_Utils_update(
									m1,
									{ay: $author$project$Schema$empty, az: _List_Nil}))),
						_List_fromArray(
							[
								A2(
								$author$project$Model$Store,
								A2($author$project$Model$cacheKey, s, r.j),
								lines)
							])) : _Utils_Tuple2(
						_Utils_update(
							m1,
							{
								b: $author$project$Model$Halted(
									A2(
										$author$project$Model$BadSchema,
										s,
										A2($author$project$Model$WrongHash, r.j, read_)))
							}),
						_List_Nil);
				}
			case 4:
				if (!done.$) {
					var g = done.a;
					return _Utils_Tuple2(
						A4(
							$author$project$Model$following,
							g,
							A2($elm$core$Basics$max, 0, m.s - 1),
							more,
							m),
						_List_Nil);
				} else {
					return _Utils_Tuple2(m, _List_Nil);
				}
			default:
				return _Utils_Tuple2(m, _List_Nil);
		}
	});
var $author$project$Model$RefusedBy = function (a) {
	return {$: 3, a: a};
};
var $author$project$Model$refused = F2(
	function (why, m) {
		return _Utils_update(
			m,
			{
				e: $elm$core$Maybe$Nothing,
				b: $author$project$Model$Halted(
					$author$project$Model$RefusedBy(why))
			});
	});
var $elm$core$List$drop = F2(
	function (n, list) {
		drop:
		while (true) {
			if (n <= 0) {
				return list;
			} else {
				if (!list.b) {
					return list;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs;
					n = $temp$n;
					list = $temp$list;
					continue drop;
				}
			}
		}
	});
var $author$project$Model$refusedCommand = F2(
	function (why, m) {
		var rest = A2(
			$author$project$Model$keep,
			$author$project$Model$Refusal(
				{
					aX: $elm$core$List$head(m.l),
					aH: why
				}),
			_Utils_update(
				m,
				{
					l: A2($elm$core$List$drop, 1, m.l)
				}));
		var _v0 = A2(
			$elm$core$Maybe$map,
			$author$project$Model$askedBy,
			$elm$core$List$head(m.l));
		if (!_v0.$) {
			switch (_v0.a.$) {
				case 1:
					var a = _v0.a.a;
					return _Utils_update(
						rest,
						{
							z: A3(
								$elm$core$Dict$insert,
								$author$project$Addr$key(a),
								why,
								rest.z)
						});
				case 0:
					var _v1 = _v0.a;
					return rest;
				default:
					var _v2 = _v0.a;
					return rest;
			}
		} else {
			return rest;
		}
	});
var $author$project$Model$Unread = function (a) {
	return {$: 1, a: a};
};
var $elm$core$String$trim = _String_trim;
var $author$project$Model$unread = F2(
	function (raw, m) {
		return ($elm$core$String$trim(raw) === '') ? m : A2(
			$author$project$Model$keep,
			$author$project$Model$Unread(raw),
			m);
	});
var $author$project$Model$lineIn = F3(
	function (raw, l, m) {
		switch (l.$) {
			case 0:
				var a = l.a;
				return _Utils_Tuple2(
					A2($author$project$Model$answer, a, m),
					_List_Nil);
			case 1:
				if (!l.a.$) {
					var g = l.a.a;
					return A3(
						$author$project$Model$ok,
						$elm$core$Maybe$Just(g),
						false,
						A2(
							$author$project$Model$answered,
							function (k) {
								return _Utils_eq(k, $author$project$Model$AskedSince);
							},
							m));
				} else {
					var _v1 = l.a;
					return A3(
						$author$project$Model$ok,
						$elm$core$Maybe$Nothing,
						false,
						A2(
							$author$project$Model$answered,
							function (k) {
								return !_Utils_eq(k, $author$project$Model$AskedSince);
							},
							m));
				}
			case 2:
				var g = l.a;
				return A3(
					$author$project$Model$ok,
					$elm$core$Maybe$Just(g),
					true,
					A2(
						$author$project$Model$answered,
						function (k) {
							return _Utils_eq(k, $author$project$Model$AskedSince);
						},
						m));
			case 4:
				var why = l.a;
				var _v2 = m.b;
				switch (_v2.$) {
					case 4:
						return _Utils_Tuple2(
							A2($author$project$Model$refusedCommand, why, m),
							_List_Nil);
					case 0:
						return A2($elm$core$String$startsWith, 'unknown command', why) ? _Utils_Tuple2(
							_Utils_update(
								m,
								{
									e: $elm$core$Maybe$Nothing,
									b: $author$project$Model$Halted($author$project$Model$UpdateUnit)
								}),
							_List_Nil) : _Utils_Tuple2(
							A2($author$project$Model$refused, why, m),
							_List_Nil);
					case 1:
						return _Utils_Tuple2(
							A2($author$project$Model$refused, why, m),
							_List_Nil);
					case 2:
						return _Utils_Tuple2(
							A2($author$project$Model$refused, why, m),
							_List_Nil);
					case 3:
						return _Utils_Tuple2(
							A2($author$project$Model$refused, why, m),
							_List_Nil);
					default:
						return _Utils_Tuple2(m, _List_Nil);
				}
			case 5:
				var a = l.a;
				var why = l.b;
				var sent = $elm$core$List$head(
					A2(
						$elm$core$List$filter,
						function (c) {
							return _Utils_eq(
								$author$project$Model$askedBy(c),
								$author$project$Model$AskedSet(a));
						},
						m.l));
				return _Utils_Tuple2(
					A4(
						$author$project$Model$setRefused,
						sent,
						a,
						why,
						A2(
							$author$project$Model$answered,
							function (k) {
								return _Utils_eq(
									k,
									$author$project$Model$AskedSet(a));
							},
							_Utils_update(
								m,
								{
									z: A3(
										$elm$core$Dict$insert,
										$author$project$Addr$key(a),
										why,
										m.z)
								}))),
					_List_Nil);
			case 3:
				return _Utils_Tuple2(
					A2(
						$author$project$Model$answered,
						function (k) {
							return !_Utils_eq(k, $author$project$Model$AskedSince);
						},
						m),
					_List_Nil);
			case 6:
				return _Utils_Tuple2(
					_Utils_update(
						m,
						{
							e: $elm$core$Maybe$Nothing,
							b: $author$project$Model$Halted($author$project$Model$TooLarge)
						}),
					_List_Nil);
			default:
				return _Utils_Tuple2(
					A2($author$project$Model$unread, raw, m),
					_List_Nil);
		}
	});
var $author$project$Model$line = F3(
	function (raw, l, m) {
		var _v0 = m.b;
		switch (_v0.$) {
			case 5:
				switch (l.$) {
					case 4:
						var why = l.a;
						return _Utils_Tuple2(
							A2(
								$author$project$Model$keep,
								$author$project$Model$Refusal(
									{aX: $elm$core$Maybe$Nothing, aH: why}),
								m),
							_List_Nil);
					case 7:
						return _Utils_Tuple2(
							A2($author$project$Model$unread, raw, m),
							_List_Nil);
					case 0:
						return _Utils_Tuple2(m, _List_Nil);
					case 1:
						return _Utils_Tuple2(m, _List_Nil);
					case 2:
						return _Utils_Tuple2(m, _List_Nil);
					case 3:
						return _Utils_Tuple2(m, _List_Nil);
					case 5:
						var a = l.a;
						var why = l.b;
						return _Utils_Tuple2(
							A4($author$project$Model$setRefused, $elm$core$Maybe$Nothing, a, why, m),
							_List_Nil);
					default:
						return _Utils_Tuple2(m, _List_Nil);
				}
			case 0:
				return A3($author$project$Model$lineIn, raw, l, m);
			case 1:
				return A3($author$project$Model$lineIn, raw, l, m);
			case 2:
				return A3($author$project$Model$lineIn, raw, l, m);
			case 3:
				var s = _v0.a;
				switch (l.$) {
					case 0:
						return A3(
							$author$project$Model$lineIn,
							raw,
							l,
							_Utils_update(
								m,
								{
									az: A2($elm$core$List$cons, raw, m.az)
								}));
					case 7:
						return ($elm$core$String$trim(raw) === '') ? _Utils_Tuple2(m, _List_Nil) : _Utils_Tuple2(
							_Utils_update(
								m,
								{
									e: $elm$core$Maybe$Nothing,
									b: $author$project$Model$Halted(
										A2(
											$author$project$Model$BadSchema,
											s,
											$author$project$Model$Unreadable(raw)))
								}),
							_List_Nil);
					case 1:
						return A3($author$project$Model$lineIn, raw, l, m);
					case 2:
						return A3($author$project$Model$lineIn, raw, l, m);
					case 3:
						return A3($author$project$Model$lineIn, raw, l, m);
					case 4:
						return A3($author$project$Model$lineIn, raw, l, m);
					case 5:
						return A3($author$project$Model$lineIn, raw, l, m);
					default:
						return A3($author$project$Model$lineIn, raw, l, m);
				}
			default:
				return A3($author$project$Model$lineIn, raw, l, m);
		}
	});
var $author$project$Protocol$MapCmd = function (a) {
	return {$: 12, a: a};
};
var $author$project$Model$projectCommand = F2(
	function (c, m) {
		return _Utils_eq(m.b, $author$project$Model$Following) ? _Utils_Tuple2(
			m,
			_List_fromArray(
				[
					$author$project$Model$Say(c)
				])) : _Utils_Tuple2(m, _List_Nil);
	});
var $author$project$Model$mapCommand = F2(
	function (c, m) {
		var names = function () {
			switch (c.$) {
				case 0:
					return true;
				case 8:
					return true;
				case 1:
					return false;
				case 2:
					return false;
				case 3:
					return false;
				case 4:
					return false;
				case 5:
					return false;
				case 6:
					return false;
				case 7:
					return false;
				default:
					return false;
			}
		}();
		return (names && (!$author$project$Model$takesEdits(m))) ? _Utils_Tuple2(m, _List_Nil) : A2(
			$author$project$Model$projectCommand,
			$author$project$Protocol$MapCmd(c),
			m);
	});
var $elm$core$List$append = F2(
	function (xs, ys) {
		if (!ys.b) {
			return xs;
		} else {
			return A3($elm$core$List$foldr, $elm$core$List$cons, ys, xs);
		}
	});
var $elm$core$List$concat = function (lists) {
	return A3($elm$core$List$foldr, $elm$core$List$append, _List_Nil, lists);
};
var $elm$core$List$concatMap = F2(
	function (f, list) {
		return $elm$core$List$concat(
			A2($elm$core$List$map, f, list));
	});
var $author$project$Schema$panelShown = F2(
	function (variants, pn) {
		var _v0 = pn.dT;
		if (_v0.$ === 1) {
			return true;
		} else {
			var v = _v0.a;
			return _Utils_eq(
				A2($elm$core$Dict$get, pn.aR, variants),
				$elm$core$Maybe$Just(v));
		}
	});
var $author$project$Schema$paramIn = F3(
	function (variants, a, _v0) {
		var s = _v0;
		var shown = $author$project$Schema$panelShown(variants);
		var key = $author$project$Addr$key(a);
		var mine = function (pn) {
			return A2(
				$elm$core$Maybe$map,
				function (p) {
					return _Utils_Tuple2(
						!_Utils_eq(pn.dT, $elm$core$Maybe$Nothing),
						p);
				},
				$elm$core$List$head(
					A2(
						$elm$core$List$filter,
						function (p) {
							return _Utils_eq(
								$author$project$Addr$key(p.w),
								key);
						},
						pn.eP)));
		};
		var found = A2(
			$elm$core$List$concatMap,
			function (pg) {
				return A2(
					$elm$core$List$filterMap,
					mine,
					A2($elm$core$List$filter, shown, pg.eO));
			},
			s.aB);
		var specific = $elm$core$List$head(
			A2($elm$core$List$filter, $elm$core$Tuple$first, found));
		if (!specific.$) {
			var _v2 = specific.a;
			var p = _v2.b;
			return $elm$core$Maybe$Just(p);
		} else {
			if (found.b) {
				var _v4 = found.a;
				var p = _v4.b;
				return $elm$core$Maybe$Just(p);
			} else {
				return A2($elm$core$Dict$get, key, s.es);
			}
		}
	});
var $elm$core$Tuple$second = function (_v0) {
	var y = _v0.b;
	return y;
};
var $author$project$Schema$optionName = F4(
	function (variants, a, i, sch) {
		return A2(
			$elm$core$Maybe$map,
			$elm$core$Tuple$second,
			A2(
				$elm$core$Maybe$andThen,
				function (p) {
					return $elm$core$List$head(
						A2(
							$elm$core$List$filter,
							function (_v0) {
								var k = _v0.a;
								return _Utils_eq(k, i);
							},
							p.bi));
				},
				A3($author$project$Schema$paramIn, variants, a, sch)));
	});
var $author$project$Protocol$Answer = function (a) {
	return {$: 0, a: a};
};
var $author$project$Protocol$Err_ = function (a) {
	return {$: 4, a: a};
};
var $author$project$Protocol$OkMore = function (a) {
	return {$: 2, a: a};
};
var $author$project$Protocol$Ok_ = function (a) {
	return {$: 1, a: a};
};
var $author$project$Protocol$Queued = {$: 3};
var $author$project$Protocol$SinceTooLarge = {$: 6};
var $author$project$Protocol$Unknown = {$: 7};
var $author$project$Protocol$Act = function (a) {
	return {$: 37, a: a};
};
var $author$project$Protocol$AmountRange = F2(
	function (a, b) {
		return {$: 10, a: a, b: b};
	});
var $author$project$Protocol$Armed = function (a) {
	return {$: 1, a: a};
};
var $author$project$Protocol$CcsAre = function (a) {
	return {$: 28, a: a};
};
var $author$project$Protocol$ChordIs = F2(
	function (a, b) {
		return {$: 41, a: a, b: b};
	});
var $author$project$Protocol$Col = function (a) {
	return {$: 9, a: a};
};
var $author$project$Protocol$Crumb = function (a) {
	return {$: 19, a: a};
};
var $author$project$Protocol$Dests = function (a) {
	return {$: 11, a: a};
};
var $author$project$Protocol$InputIs = function (a) {
	return {$: 26, a: a};
};
var $author$project$Protocol$KindIs = function (a) {
	return {$: 27, a: a};
};
var $author$project$Protocol$LearnIs = function (a) {
	return {$: 35, a: a};
};
var $author$project$Protocol$MapFileIs = function (a) {
	return {$: 36, a: a};
};
var $author$project$Protocol$MapRowsAre = function (a) {
	return {$: 32, a: a};
};
var $author$project$Protocol$MixerIs = {$: 17};
var $author$project$Protocol$MsbsAre = function (a) {
	return {$: 29, a: a};
};
var $author$project$Protocol$NotLearning = {$: 0};
var $author$project$Protocol$Opt = function (a) {
	return {$: 5, a: a};
};
var $author$project$Protocol$OrbitIs = {$: 38};
var $author$project$Protocol$Page = function (a) {
	return {$: 2, a: a};
};
var $author$project$Protocol$Panel = function (a) {
	return {$: 3, a: a};
};
var $author$project$Protocol$PartIs = F2(
	function (a, b) {
		return {$: 16, a: a, b: b};
	});
var $author$project$Protocol$Pointing = {$: 3};
var $author$project$Protocol$PoolIs = F2(
	function (a, b) {
		return {$: 44, a: a, b: b};
	});
var $author$project$Protocol$Proj = function (a) {
	return {$: 25, a: a};
};
var $author$project$Protocol$ProjectIs = function (a) {
	return {$: 21, a: a};
};
var $author$project$Protocol$ProjectsIs = function (a) {
	return {$: 24, a: a};
};
var $author$project$Protocol$Refused = F2(
	function (a, b) {
		return {$: 18, a: a, b: b};
	});
var $author$project$Protocol$Route = function (a) {
	return {$: 6, a: a};
};
var $author$project$Protocol$RouteIs = function (a) {
	return {$: 13, a: a};
};
var $author$project$Protocol$RoutesIs = {$: 12};
var $author$project$Protocol$RowsAre = function (a) {
	return {$: 31, a: a};
};
var $author$project$Protocol$ScaleIs = function (a) {
	return {$: 42, a: a};
};
var $author$project$Protocol$SchemaIs = function (a) {
	return {$: 1, a: a};
};
var $author$project$Protocol$Sensing = function (a) {
	return {$: 2, a: a};
};
var $author$project$Protocol$SettingsIs = {$: 20};
var $author$project$Protocol$SlotIs = function (a) {
	return {$: 40, a: a};
};
var $author$project$Protocol$SongIs = function (a) {
	return {$: 39, a: a};
};
var $author$project$Protocol$SoundIs = function (a) {
	return {$: 22, a: a};
};
var $author$project$Protocol$Source = function (a) {
	return {$: 7, a: a};
};
var $author$project$Protocol$SpanIs = F2(
	function (a, b) {
		return {$: 30, a: a, b: b};
	});
var $author$project$Protocol$Src = function (a) {
	return {$: 8, a: a};
};
var $author$project$Protocol$StepIs = F3(
	function (a, b, c) {
		return {$: 43, a: a, b: b, c: c};
	});
var $author$project$Protocol$ToastIs = function (a) {
	return {$: 23, a: a};
};
var $author$project$Protocol$Unroute = function (a) {
	return {$: 14, a: a};
};
var $author$project$Protocol$Val = function (a) {
	return {$: 15, a: a};
};
var $author$project$Protocol$ActClear = 10;
var $author$project$Protocol$ActCursor = 6;
var $author$project$Protocol$ActDegree = 4;
var $author$project$Protocol$ActLearn = 9;
var $author$project$Protocol$ActNote = 8;
var $author$project$Protocol$ActPlay = 5;
var $author$project$Protocol$ActRing = 0;
var $author$project$Protocol$ActSave = 2;
var $author$project$Protocol$ActScene = 1;
var $author$project$Protocol$ActSet = 7;
var $author$project$Protocol$ActSwitch = 3;
var $author$project$Protocol$actCellOf = function (s) {
	switch (s) {
		case 'RING':
			return $elm$core$Maybe$Just(0);
		case 'SCENE':
			return $elm$core$Maybe$Just(1);
		case 'SAVE':
			return $elm$core$Maybe$Just(2);
		case 'SWITCH':
			return $elm$core$Maybe$Just(3);
		case 'DEGREE':
			return $elm$core$Maybe$Just(4);
		case 'PLAY':
			return $elm$core$Maybe$Just(5);
		case 'CURSOR':
			return $elm$core$Maybe$Just(6);
		case 'SET':
			return $elm$core$Maybe$Just(7);
		case 'NOTE':
			return $elm$core$Maybe$Just(8);
		case 'LEARN':
			return $elm$core$Maybe$Just(9);
		case 'CLEAR':
			return $elm$core$Maybe$Just(10);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$addrOrNone = function (s) {
	return (s === '-') ? $elm$core$Maybe$Just($elm$core$Maybe$Nothing) : A2(
		$elm$core$Maybe$map,
		$elm$core$Maybe$Just,
		$author$project$Addr$fromWire(s));
};
var $elm$core$Basics$always = F2(
	function (a, _v0) {
		return a;
	});
var $author$project$Protocol$Cell = $elm$core$Basics$identity;
var $author$project$Protocol$cell = function (s) {
	return A2(
		$elm$core$Maybe$map,
		$elm$core$Basics$identity,
		$author$project$Protocol$word(s));
};
var $author$project$Protocol$ClockExt = 1;
var $author$project$Protocol$ClockInt = 0;
var $author$project$Protocol$clockOf = function (s) {
	switch (s) {
		case 'INT':
			return $elm$core$Maybe$Just(0);
		case 'EXT':
			return $elm$core$Maybe$Just(1);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$ControlNo = $elm$core$Basics$identity;
var $elm$core$Basics$ge = _Utils_ge;
var $author$project$Protocol$controlNo = function (n) {
	return ((n >= 0) && (n <= 127)) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$Degree = $elm$core$Basics$identity;
var $author$project$Protocol$within = F4(
	function (lo, hi, make, n) {
		return ((_Utils_cmp(n, lo) > -1) && (_Utils_cmp(n, hi) < 1)) ? $elm$core$Maybe$Just(
			make(n)) : $elm$core$Maybe$Nothing;
	});
var $author$project$Protocol$degree = A3($author$project$Protocol$within, 1, 12, $elm$core$Basics$identity);
var $author$project$Protocol$Clean = 0;
var $author$project$Protocol$Edited = 1;
var $author$project$Protocol$editsOf = function (s) {
	switch (s) {
		case 'clean':
			return $elm$core$Maybe$Just(0);
		case 'edited':
			return $elm$core$Maybe$Just(1);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$NoSuchEngine = function (a) {
	return {$: 1, a: a};
};
var $author$project$Unit$Algo = 0;
var $author$project$Unit$Drum = 4;
var $author$project$Unit$Modal = 1;
var $author$project$Unit$Tape = 3;
var $author$project$Unit$Va = 2;
var $author$project$Unit$allEngines = _List_fromArray(
	[0, 1, 2, 3, 4]);
var $author$project$Unit$engineFromName = function (s) {
	return $elm$core$List$head(
		A2(
			$elm$core$List$filter,
			function (e) {
				return _Utils_eq(
					$author$project$Unit$engineName(e),
					s);
			},
			$author$project$Unit$allEngines));
};
var $elm$core$Result$fromMaybe = F2(
	function (err, maybe) {
		if (!maybe.$) {
			var v = maybe.a;
			return $elm$core$Result$Ok(v);
		} else {
			return $elm$core$Result$Err(err);
		}
	});
var $author$project$Protocol$engineOf = function (e) {
	return A2(
		$elm$core$Result$fromMaybe,
		$author$project$Protocol$NoSuchEngine(e),
		$author$project$Unit$engineFromName(e));
};
var $author$project$Protocol$Faulty = function (a) {
	return {$: 45, a: a};
};
var $author$project$Protocol$faulty = function (r) {
	if (!r.$) {
		var a = r.a;
		return a;
	} else {
		var f = r.a;
		return $author$project$Protocol$Faulty(f);
	}
};
var $author$project$Protocol$FileId = function (a) {
	return {$: 0, a: a};
};
var $author$project$Protocol$NewProject = {$: 1};
var $author$project$Protocol$nat = function (s) {
	return ((s !== '') && A2($elm$core$String$all, $elm$core$Char$isDigit, s)) ? $elm$core$String$toInt(s) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$ProjectId = $elm$core$Basics$identity;
var $author$project$Protocol$projectId = function (n) {
	return (n >= 1) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$fileOf = function (s) {
	return (s === 'new') ? $elm$core$Maybe$Just($author$project$Protocol$NewProject) : A2(
		$elm$core$Maybe$map,
		$author$project$Protocol$FileId,
		A2(
			$elm$core$Maybe$andThen,
			$author$project$Protocol$projectId,
			$author$project$Protocol$nat(s)));
};
var $author$project$Protocol$flagsOf = function (s) {
	switch (s) {
		case '-':
			return $elm$core$Maybe$Just(
				{be: false, bg: false});
		case 'm':
			return $elm$core$Maybe$Just(
				{be: true, bg: false});
		case 'd':
			return $elm$core$Maybe$Just(
				{be: false, bg: true});
		case 'md':
			return $elm$core$Maybe$Just(
				{be: true, bg: true});
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$FormCc = 0;
var $author$project$Protocol$FormCc14 = 1;
var $author$project$Protocol$FormNrpn = 2;
var $author$project$Protocol$FormPress = 3;
var $author$project$Protocol$FormSysex = 4;
var $author$project$Protocol$formOf = function (s) {
	switch (s) {
		case 'CC':
			return $elm$core$Maybe$Just(0);
		case 'CC14':
			return $elm$core$Maybe$Just(1);
		case 'NRPN':
			return $elm$core$Maybe$Just(2);
		case 'PRESS':
			return $elm$core$Maybe$Just(3);
		case 'SYSEX':
			return $elm$core$Maybe$Just(4);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Hash$digit = function (c) {
	return $elm$core$Char$isDigit(c) ? $elm$core$Maybe$Just(
		$elm$core$Char$toCode(c) - 48) : (((c >= 'a') && (c <= 'f')) ? $elm$core$Maybe$Just(
		$elm$core$Char$toCode(c) - 87) : $elm$core$Maybe$Nothing);
};
var $elm$core$Maybe$map2 = F3(
	function (func, ma, mb) {
		if (ma.$ === 1) {
			return $elm$core$Maybe$Nothing;
		} else {
			var a = ma.a;
			if (mb.$ === 1) {
				return $elm$core$Maybe$Nothing;
			} else {
				var b = mb.a;
				return $elm$core$Maybe$Just(
					A2(func, a, b));
			}
		}
	});
var $author$project$Hash$limb = A2(
	$elm$core$String$foldl,
	F2(
		function (c, acc) {
			return A3(
				$elm$core$Maybe$map2,
				F2(
					function (n, d) {
						return (n * 16) + d;
					}),
				acc,
				$author$project$Hash$digit(c));
		}),
	$elm$core$Maybe$Just(0));
var $elm$core$Maybe$map4 = F5(
	function (func, ma, mb, mc, md) {
		if (ma.$ === 1) {
			return $elm$core$Maybe$Nothing;
		} else {
			var a = ma.a;
			if (mb.$ === 1) {
				return $elm$core$Maybe$Nothing;
			} else {
				var b = mb.a;
				if (mc.$ === 1) {
					return $elm$core$Maybe$Nothing;
				} else {
					var c = mc.a;
					if (md.$ === 1) {
						return $elm$core$Maybe$Nothing;
					} else {
						var d = md.a;
						return $elm$core$Maybe$Just(
							A4(func, a, b, c, d));
					}
				}
			}
		}
	});
var $author$project$Hash$fromHex = function (s) {
	return ($elm$core$String$length(s) === 16) ? A5(
		$elm$core$Maybe$map4,
		$author$project$Hash$Hash,
		$author$project$Hash$limb(
			A3($elm$core$String$slice, 0, 4, s)),
		$author$project$Hash$limb(
			A3($elm$core$String$slice, 4, 8, s)),
		$author$project$Hash$limb(
			A3($elm$core$String$slice, 8, 12, s)),
		$author$project$Hash$limb(
			A3($elm$core$String$slice, 12, 16, s))) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$Generation = $elm$core$Basics$identity;
var $author$project$Protocol$generationOf = function (s) {
	return (s === '-') ? $elm$core$Maybe$Just($elm$core$Maybe$Nothing) : A2(
		$elm$core$Maybe$map,
		A2($elm$core$Basics$composeR, $elm$core$Basics$identity, $elm$core$Maybe$Just),
		$author$project$Protocol$nat(s));
};
var $author$project$Protocol$FileBad = 1;
var $author$project$Protocol$FileNewer = 2;
var $author$project$Protocol$FileOk = 0;
var $author$project$Protocol$healthOf = function (s) {
	switch (s) {
		case 'ok':
			return $elm$core$Maybe$Just(0);
		case 'bad':
			return $elm$core$Maybe$Just(1);
		case 'newer':
			return $elm$core$Maybe$Just(2);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$HelloIs = function (a) {
	return {$: 0, a: a};
};
var $author$project$Protocol$Speaks = function (a) {
	return {$: 0, a: a};
};
var $author$project$Protocol$TooNew = function (a) {
	return {$: 1, a: a};
};
var $author$project$Protocol$TooOld = function (a) {
	return {$: 2, a: a};
};
var $elm$core$Result$map2 = F3(
	function (func, ra, rb) {
		if (ra.$ === 1) {
			var x = ra.a;
			return $elm$core$Result$Err(x);
		} else {
			var a = ra.a;
			if (rb.$ === 1) {
				var x = rb.a;
				return $elm$core$Result$Err(x);
			} else {
				var b = rb.a;
				return $elm$core$Result$Ok(
					A2(func, a, b));
			}
		}
	});
var $author$project$Protocol$NoSuchPart = function (a) {
	return {$: 0, a: a};
};
var $author$project$Unit$P1 = 0;
var $author$project$Unit$P2 = 1;
var $author$project$Unit$P3 = 2;
var $author$project$Unit$P4 = 3;
var $author$project$Unit$P5 = 4;
var $author$project$Unit$P6 = 5;
var $author$project$Unit$allParts = _List_fromArray(
	[0, 1, 2, 3, 4, 5]);
var $author$project$Unit$partFromInt = function (n) {
	return $elm$core$List$head(
		A2(
			$elm$core$List$filter,
			function (p) {
				return _Utils_eq(
					$author$project$Unit$partNumber(p),
					n);
			},
			$author$project$Unit$allParts));
};
var $author$project$Protocol$partOf = function (n) {
	return A2(
		$elm$core$Result$fromMaybe,
		$author$project$Protocol$NoSuchPart(n),
		A2(
			$elm$core$Maybe$andThen,
			$author$project$Unit$partFromInt,
			$author$project$Protocol$nat(n)));
};
var $author$project$Protocol$hello = F4(
	function (pr, build, n, engine) {
		return (_Utils_cmp(pr, $author$project$Protocol$supported) > 0) ? $author$project$Protocol$HelloIs(
			$author$project$Protocol$TooNew(pr)) : ((_Utils_cmp(pr, $author$project$Protocol$supported) < 0) ? $author$project$Protocol$HelloIs(
			$author$project$Protocol$TooOld(pr)) : $author$project$Protocol$faulty(
			A3(
				$elm$core$Result$map2,
				F2(
					function (p, e) {
						return $author$project$Protocol$HelloIs(
							$author$project$Protocol$Speaks(
								{d3: build, t: e, ak: p}));
					}),
				$author$project$Protocol$partOf(n),
				$author$project$Protocol$engineOf(engine))));
	});
var $elm$core$Basics$negate = function (n) {
	return -n;
};
var $author$project$Protocol$int = function (s) {
	var _v0 = $elm$core$String$uncons(s);
	if (!_v0.$) {
		switch (_v0.a.a) {
			case '-':
				var _v1 = _v0.a;
				var rest = _v1.b;
				return A2(
					$elm$core$Maybe$map,
					$elm$core$Basics$negate,
					$author$project$Protocol$nat(rest));
			case '+':
				var _v2 = _v0.a;
				var rest = _v2.b;
				return $author$project$Protocol$nat(rest);
			default:
				return $author$project$Protocol$nat(s);
		}
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$Result$map = F2(
	function (func, ra) {
		if (!ra.$) {
			var a = ra.a;
			return $elm$core$Result$Ok(
				func(a));
		} else {
			var e = ra.a;
			return $elm$core$Result$Err(e);
		}
	});
var $elm$core$Maybe$map3 = F4(
	function (func, ma, mb, mc) {
		if (ma.$ === 1) {
			return $elm$core$Maybe$Nothing;
		} else {
			var a = ma.a;
			if (mb.$ === 1) {
				return $elm$core$Maybe$Nothing;
			} else {
				var b = mb.a;
				if (mc.$ === 1) {
					return $elm$core$Maybe$Nothing;
				} else {
					var c = mc.a;
					return $elm$core$Maybe$Just(
						A3(func, a, b, c));
				}
			}
		}
	});
var $author$project$Protocol$MapIs = function (a) {
	return {$: 33, a: a};
};
var $author$project$Protocol$Off = 1;
var $author$project$Protocol$On = 0;
var $author$project$Protocol$onOffOf = function (s) {
	switch (s) {
		case 'on':
			return $elm$core$Maybe$Just(0);
		case 'off':
			return $elm$core$Maybe$Just(1);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$mapHeader = F3(
	function (n, name, k) {
		return A3(
			$elm$core$Maybe$map2,
			F2(
				function (pt, kp) {
					return $author$project$Protocol$MapIs(
						{ev: kp, aR: name, ak: pt});
				}),
			A2(
				$elm$core$Maybe$andThen,
				$author$project$Unit$partFromInt,
				$author$project$Protocol$nat(n)),
			$author$project$Protocol$onOffOf(k));
	});
var $author$project$Protocol$BinaryOffset = 4;
var $author$project$Protocol$IncDec = 7;
var $author$project$Protocol$Jump = 0;
var $author$project$Protocol$Momentary = 8;
var $author$project$Protocol$Pickup = 1;
var $author$project$Protocol$ScaleTo = 2;
var $author$project$Protocol$SignedBit = 5;
var $author$project$Protocol$SignedBit2 = 6;
var $author$project$Protocol$ToggleButton = 9;
var $author$project$Protocol$TwosComp = 3;
var $author$project$Protocol$mapKindOf = function (s) {
	switch (s) {
		case 'JUMP':
			return $elm$core$Maybe$Just(0);
		case 'PICKUP':
			return $elm$core$Maybe$Just(1);
		case 'SCALE':
			return $elm$core$Maybe$Just(2);
		case 'TWOS-COMP':
			return $elm$core$Maybe$Just(3);
		case 'OFFSET':
			return $elm$core$Maybe$Just(4);
		case 'SIGNED':
			return $elm$core$Maybe$Just(5);
		case 'SIGNED-2':
			return $elm$core$Maybe$Just(6);
		case 'INC-DEC':
			return $elm$core$Maybe$Just(7);
		case 'MOMENTARY':
			return $elm$core$Maybe$Just(8);
		case 'TOGGLE':
			return $elm$core$Maybe$Just(9);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$Msb = $elm$core$Basics$identity;
var $author$project$Protocol$msb = function (n) {
	return ((n >= 1) && ((n <= 31) && (n !== 6))) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$Note = $elm$core$Basics$identity;
var $author$project$Protocol$note = A3($author$project$Protocol$within, 0, 127, $elm$core$Basics$identity);
var $author$project$Protocol$NotePool = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Protocol$notePool = function (ns) {
	if (ns.b) {
		var first = ns.a;
		var rest = ns.b;
		return ($elm$core$List$length(rest) < 8) ? $elm$core$Maybe$Just(
			A2($author$project$Protocol$NotePool, first, rest)) : $elm$core$Maybe$Nothing;
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$String$toFloat = _String_toFloat;
var $author$project$Protocol$num = function (s) {
	var body = (A2($elm$core$String$startsWith, '-', s) || A2($elm$core$String$startsWith, '+', s)) ? A2($elm$core$String$dropLeft, 1, s) : s;
	return ((body !== '') && A2(
		$elm$core$String$all,
		function (c) {
			return $elm$core$Char$isDigit(c) || (c === '.');
		},
		body)) ? $elm$core$String$toFloat(s) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$number = function (make) {
	return A2(
		$elm$core$Basics$composeR,
		$author$project$Protocol$nat,
		$elm$core$Maybe$andThen(make));
};
var $author$project$Protocol$OptIndex = $elm$core$Basics$identity;
var $author$project$Protocol$optIndex = function (i) {
	return (i >= 0) ? $elm$core$Maybe$Just(i) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$PageLabel = $elm$core$Basics$identity;
var $author$project$Protocol$pageLabelFrom = function (s) {
	return A2(
		$elm$core$Maybe$map,
		$elm$core$Basics$identity,
		$author$project$Protocol$word(s));
};
var $author$project$Protocol$Param = function (a) {
	return {$: 4, a: a};
};
var $author$project$Protocol$Choice = 2;
var $author$project$Protocol$Cont = 0;
var $author$project$Protocol$Stepped = 1;
var $author$project$Protocol$Toggle = 3;
var $author$project$Protocol$kindOf = function (s) {
	switch (s) {
		case 'cont':
			return $elm$core$Maybe$Just(0);
		case 'stepped':
			return $elm$core$Maybe$Just(1);
		case 'choice':
			return $elm$core$Maybe$Just(2);
		case 'toggle':
			return $elm$core$Maybe$Just(3);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$Maybe$map5 = F6(
	function (func, ma, mb, mc, md, me) {
		if (ma.$ === 1) {
			return $elm$core$Maybe$Nothing;
		} else {
			var a = ma.a;
			if (mb.$ === 1) {
				return $elm$core$Maybe$Nothing;
			} else {
				var b = mb.a;
				if (mc.$ === 1) {
					return $elm$core$Maybe$Nothing;
				} else {
					var c = mc.a;
					if (md.$ === 1) {
						return $elm$core$Maybe$Nothing;
					} else {
						var d = md.a;
						if (me.$ === 1) {
							return $elm$core$Maybe$Nothing;
						} else {
							var e = me.a;
							return $elm$core$Maybe$Just(
								A5(func, a, b, c, d, e));
						}
					}
				}
			}
		}
	});
var $author$project$Protocol$param = F7(
	function (a, label, kind, scale, flags, _v0, _v1) {
		var lo = _v0.a;
		var hi = _v0.b;
		var step = _v1.a;
		var def = _v1.b;
		return A6(
			$elm$core$Maybe$map5,
			F5(
				function (_v2, l, h, s, d) {
					var x = _v2.a;
					var k = _v2.b;
					return $author$project$Protocol$Param(
						{w: x, d9: d, ej: flags, cv: k, aO: label, cx: h, cC: l, b$: scale, eY: s});
				}),
			A3(
				$elm$core$Maybe$map2,
				$elm$core$Tuple$pair,
				$author$project$Addr$fromWire(a),
				$author$project$Protocol$kindOf(kind)),
			$author$project$Protocol$num(lo),
			$author$project$Protocol$num(hi),
			$author$project$Protocol$num(step),
			$author$project$Protocol$num(def));
	});
var $author$project$Protocol$SpanPlace = $elm$core$Basics$identity;
var $author$project$Protocol$spanPlace = function (n) {
	return ((n >= 0) && (n <= 255)) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$place = A2(
	$elm$core$Basics$composeR,
	$author$project$Protocol$nat,
	$elm$core$Maybe$andThen($author$project$Protocol$spanPlace));
var $author$project$Protocol$Playing = 0;
var $author$project$Protocol$Stopped = 1;
var $author$project$Protocol$playbackOf = function (s) {
	switch (s) {
		case 'playing':
			return $elm$core$Maybe$Just(0);
		case 'stopped':
			return $elm$core$Maybe$Just(1);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$Rev = $elm$core$Basics$identity;
var $author$project$Protocol$rev = A3($author$project$Protocol$within, 0, 4294967295, $elm$core$Basics$identity);
var $author$project$Protocol$RingNo = $elm$core$Basics$identity;
var $author$project$Protocol$ringNo = A3($author$project$Protocol$within, 1, 5, $elm$core$Basics$identity);
var $author$project$Protocol$KnobKeybd = 1;
var $author$project$Protocol$KnobRoute = 0;
var $author$project$Protocol$routeKind = function (s) {
	switch (s) {
		case 'route':
			return $elm$core$Maybe$Just(0);
		case 'keybd':
			return $elm$core$Maybe$Just(1);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$RowIs = function (a) {
	return {$: 34, a: a};
};
var $author$project$Protocol$InSysex = {$: 4};
var $author$project$Protocol$NrpnNo = $elm$core$Basics$identity;
var $author$project$Protocol$nrpnNo = function (n) {
	return ((n >= 0) && (n <= 16383)) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$inputOf = function (s) {
	return (s === 'PRESS') ? $elm$core$Maybe$Just($author$project$Protocol$InPress) : ((s === 'SYSEX') ? $elm$core$Maybe$Just($author$project$Protocol$InSysex) : (A2($elm$core$String$startsWith, 'CC14:', s) ? A2(
		$elm$core$Maybe$map,
		$author$project$Protocol$InCc14,
		A2(
			$elm$core$Maybe$andThen,
			$author$project$Protocol$msb,
			$author$project$Protocol$nat(
				A2($elm$core$String$dropLeft, 5, s)))) : (A2($elm$core$String$startsWith, 'NRPN:', s) ? A2(
		$elm$core$Maybe$map,
		$author$project$Protocol$InNrpn,
		A2(
			$elm$core$Maybe$andThen,
			$author$project$Protocol$nrpnNo,
			$author$project$Protocol$nat(
				A2($elm$core$String$dropLeft, 5, s)))) : (A2($elm$core$String$startsWith, 'CC', s) ? A2(
		$elm$core$Maybe$map,
		$author$project$Protocol$InCc,
		A2(
			$elm$core$Maybe$andThen,
			$author$project$Protocol$controlNo,
			$author$project$Protocol$nat(
				A2($elm$core$String$dropLeft, 2, s)))) : $elm$core$Maybe$Nothing))));
};
var $author$project$Protocol$MapFileRow = function (a) {
	return {$: 1, a: a};
};
var $author$project$Protocol$SoundRow = function (a) {
	return {$: 0, a: a};
};
var $author$project$Protocol$RowIndex = $elm$core$Basics$identity;
var $author$project$Protocol$rowIndex = function (n) {
	return (n >= 1) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$rowOf = function (s) {
	var _v0 = $elm$core$String$uncons(s);
	if (!_v0.$) {
		switch (_v0.a.a) {
			case 'S':
				var _v1 = _v0.a;
				var i = _v1.b;
				return A2(
					$elm$core$Maybe$map,
					$author$project$Protocol$SoundRow,
					A2(
						$elm$core$Maybe$andThen,
						$author$project$Protocol$rowIndex,
						$author$project$Protocol$nat(i)));
			case 'M':
				var _v2 = _v0.a;
				var i = _v2.b;
				return A2(
					$elm$core$Maybe$map,
					$author$project$Protocol$MapFileRow,
					A2(
						$elm$core$Maybe$andThen,
						$author$project$Protocol$rowIndex,
						$author$project$Protocol$nat(i)));
			default:
				return $elm$core$Maybe$Nothing;
		}
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$Dead = 1;
var $author$project$Protocol$Live = 0;
var $author$project$Protocol$Shadowed = 2;
var $author$project$Protocol$rowStatusOf = function (s) {
	switch (s) {
		case 'live':
			return $elm$core$Maybe$Just(0);
		case 'dead':
			return $elm$core$Maybe$Just(1);
		case 'shadowed':
			return $elm$core$Maybe$Just(2);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$statusFits = F2(
	function (rw, st) {
		if (!rw.$) {
			return st !== 2;
		} else {
			return true;
		}
	});
var $author$project$Protocol$rowLine = F7(
	function (r, input, kind, a, _v0, echo, status) {
		var lo = _v0.a;
		var hi = _v0.b;
		return A5(
			$elm$core$Maybe$map4,
			F4(
				function (_v1, inp, _v2, _v3) {
					var rw = _v1.a;
					var st = _v1.b;
					var k = _v2.a;
					var x = _v2.b;
					var mn = _v3.a;
					var mx = _v3.b;
					var e = _v3.c;
					return $author$project$Protocol$RowIs(
						{w: x, cn: e, ct: inp, cv: k, cx: mx, cC: mn, eV: rw, bt: st});
				}),
			A2(
				$elm$core$Maybe$andThen,
				function (_v4) {
					var rw = _v4.a;
					var st = _v4.b;
					return A2($author$project$Protocol$statusFits, rw, st) ? $elm$core$Maybe$Just(
						_Utils_Tuple2(rw, st)) : $elm$core$Maybe$Nothing;
				},
				A3(
					$elm$core$Maybe$map2,
					$elm$core$Tuple$pair,
					$author$project$Protocol$rowOf(r),
					$author$project$Protocol$rowStatusOf(status))),
			$author$project$Protocol$inputOf(input),
			A3(
				$elm$core$Maybe$map2,
				$elm$core$Tuple$pair,
				$author$project$Protocol$mapKindOf(kind),
				$author$project$Protocol$addrOrNone(a)),
			A4(
				$elm$core$Maybe$map3,
				F3(
					function (mn, mx, e) {
						return _Utils_Tuple3(mn, mx, e);
					}),
				$author$project$Protocol$place(lo),
				$author$project$Protocol$place(hi),
				$author$project$Protocol$onOffOf(echo)));
	});
var $author$project$Protocol$ScaleMask = $elm$core$Basics$identity;
var $elm$core$Basics$modBy = _Basics_modBy;
var $author$project$Protocol$scaleMask = function (n) {
	return ((n >= 1) && ((n <= 4095) && (A2($elm$core$Basics$modBy, 2, n) === 1))) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$Linear = 0;
var $author$project$Protocol$Octaves = 1;
var $author$project$Protocol$scaleOf = function (s) {
	switch (s) {
		case 'lin':
			return $elm$core$Maybe$Just(0);
		case 'oct':
			return $elm$core$Maybe$Just(1);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$SceneNo = $elm$core$Basics$identity;
var $author$project$Protocol$sceneNo = A3($author$project$Protocol$within, 1, 8, $elm$core$Basics$identity);
var $author$project$Protocol$sceneOrNone = function (s) {
	return (s === '-') ? $elm$core$Maybe$Just($elm$core$Maybe$Nothing) : A2(
		$elm$core$Maybe$map,
		$elm$core$Maybe$Just,
		A2($author$project$Protocol$number, $author$project$Protocol$sceneNo, s));
};
var $author$project$Protocol$schemaFromToken = function (t) {
	return (t === 'MIXER') ? $elm$core$Maybe$Just($author$project$Protocol$MixerSchema) : ((t === 'SETTINGS') ? $elm$core$Maybe$Just($author$project$Protocol$SettingsSchema) : ((t === 'MAP') ? $elm$core$Maybe$Just($author$project$Protocol$MapSchema) : ((t === 'ORBIT') ? $elm$core$Maybe$Just($author$project$Protocol$OrbitSchema) : (A2($elm$core$String$startsWith, 'MTX-', t) ? A2(
		$elm$core$Maybe$map,
		$author$project$Protocol$MatrixSchema,
		$author$project$Unit$engineFromName(
			A2($elm$core$String$dropLeft, 4, t))) : A2(
		$elm$core$Maybe$map,
		$author$project$Protocol$EngineSchema,
		$author$project$Unit$engineFromName(t))))));
};
var $author$project$Protocol$Segment = $elm$core$Basics$identity;
var $author$project$Protocol$segment = A3($author$project$Protocol$within, 1, 8, $elm$core$Basics$identity);
var $author$project$Protocol$SlotNeutral = 1;
var $author$project$Protocol$SlotSaved = 0;
var $author$project$Protocol$slotStateOf = function (s) {
	switch (s) {
		case 'saved':
			return $elm$core$Maybe$Just(0);
		case 'neutral':
			return $elm$core$Maybe$Just(1);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$SoundClean = 0;
var $author$project$Protocol$SoundEdited = 1;
var $author$project$Protocol$SoundStale = 2;
var $author$project$Protocol$soundStatusOf = function (s) {
	switch (s) {
		case 'clean':
			return $elm$core$Maybe$Just(0);
		case 'edited':
			return $elm$core$Maybe$Just(1);
		case 'stale':
			return $elm$core$Maybe$Just(2);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$StepNo = $elm$core$Basics$identity;
var $author$project$Protocol$stepNo = A3($author$project$Protocol$within, 1, 32, $elm$core$Basics$identity);
var $author$project$Protocol$traverse = function (f) {
	return A2(
		$elm$core$List$foldr,
		F2(
			function (s, acc) {
				return A3(
					$elm$core$Maybe$map2,
					$elm$core$List$cons,
					f(s),
					acc);
			}),
		$elm$core$Maybe$Just(_List_Nil));
};
var $author$project$Protocol$VariantName = $elm$core$Basics$identity;
var $author$project$Protocol$variantName = function (s) {
	return (s === '-') ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(s);
};
var $author$project$Protocol$yesNoOf = function (s) {
	switch (s) {
		case 'yes':
			return $elm$core$Maybe$Just(1);
		case 'no':
			return $elm$core$Maybe$Just(0);
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Protocol$answer = function (ts) {
	_v0$48:
	while (true) {
		if (ts.b) {
			switch (ts.a) {
				case 'ed':
					if ((((((((ts.b.b && (ts.b.a === 'hello')) && ts.b.b.b) && ts.b.b.b.b) && ts.b.b.b.b.b) && (ts.b.b.b.b.a === 'part')) && ts.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b) && (!ts.b.b.b.b.b.b.b.b)) {
						var _v1 = ts.b;
						var _v2 = _v1.b;
						var proto = _v2.a;
						var _v3 = _v2.b;
						var build = _v3.a;
						var _v4 = _v3.b;
						var _v5 = _v4.b;
						var n = _v5.a;
						var _v6 = _v5.b;
						var engine = _v6.a;
						return A2(
							$elm$core$Maybe$map,
							function (pr) {
								return A4($author$project$Protocol$hello, pr, build, n, engine);
							},
							$author$project$Protocol$nat(proto));
					} else {
						break _v0$48;
					}
				case 'schema':
					if (((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && (!ts.b.b.b.b.b)) {
						var _v7 = ts.b;
						var token = _v7.a;
						var _v8 = _v7.b;
						var pages = _v8.a;
						var _v9 = _v8.b;
						var hash = _v9.a;
						return A4(
							$elm$core$Maybe$map3,
							F3(
								function (sc, n, h) {
									return $author$project$Protocol$SchemaIs(
										{j: h, aB: n, g: sc});
								}),
							$author$project$Protocol$schemaFromToken(token),
							$author$project$Protocol$nat(pages),
							$author$project$Hash$fromHex(hash));
					} else {
						break _v0$48;
					}
				case 'mixer':
					if (!ts.b.b) {
						return $elm$core$Maybe$Just($author$project$Protocol$MixerIs);
					} else {
						break _v0$48;
					}
				case 'page':
					if (((((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && (ts.b.b.b.a === 'of')) && ts.b.b.b.b.b) && (!ts.b.b.b.b.b.b)) {
						var _v10 = ts.b;
						var n = _v10.a;
						var _v11 = _v10.b;
						var label = _v11.a;
						var _v12 = _v11.b;
						var _v13 = _v12.b;
						var count = _v13.a;
						return A4(
							$elm$core$Maybe$map3,
							F3(
								function (a, l, b) {
									return $author$project$Protocol$Page(
										{ci: b, aO: l, eC: a});
								}),
							$author$project$Protocol$nat(n),
							$author$project$Protocol$pageLabelFrom(label),
							$author$project$Protocol$nat(count));
					} else {
						break _v0$48;
					}
				case 'panel':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v14 = ts.b;
						var name = _v14.a;
						var _v15 = _v14.b;
						var variant = _v15.a;
						return $elm$core$Maybe$Just(
							$author$project$Protocol$Panel(
								{
									aR: name,
									dT: $author$project$Protocol$variantName(variant)
								}));
					} else {
						break _v0$48;
					}
				case 'part':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v16 = ts.b;
						var n = _v16.a;
						var _v17 = _v16.b;
						var engine = _v17.a;
						return $elm$core$Maybe$Just(
							$author$project$Protocol$faulty(
								A3(
									$elm$core$Result$map2,
									$author$project$Protocol$PartIs,
									$author$project$Protocol$partOf(n),
									$author$project$Protocol$engineOf(engine))));
					} else {
						break _v0$48;
					}
				case 'param':
					if (((((((((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && ts.b.b.b.b.b) && ts.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b.b.b.b) && (!ts.b.b.b.b.b.b.b.b.b.b.b)) {
						var _v18 = ts.b;
						var a = _v18.a;
						var _v19 = _v18.b;
						var label = _v19.a;
						var _v20 = _v19.b;
						var kind = _v20.a;
						var _v21 = _v20.b;
						var scale = _v21.a;
						var _v22 = _v21.b;
						var lo = _v22.a;
						var _v23 = _v22.b;
						var hi = _v23.a;
						var _v24 = _v23.b;
						var step = _v24.a;
						var _v25 = _v24.b;
						var def = _v25.a;
						var _v26 = _v25.b;
						var flags = _v26.a;
						return A2(
							$elm$core$Maybe$andThen,
							function (_v27) {
								var sc = _v27.a;
								var fl = _v27.b;
								return A7(
									$author$project$Protocol$param,
									a,
									label,
									kind,
									sc,
									fl,
									_Utils_Tuple2(lo, hi),
									_Utils_Tuple2(step, def));
							},
							A3(
								$elm$core$Maybe$map2,
								$elm$core$Tuple$pair,
								$author$project$Protocol$scaleOf(scale),
								$author$project$Protocol$flagsOf(flags)));
					} else {
						break _v0$48;
					}
				case 'opt':
					if (((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && (!ts.b.b.b.b.b)) {
						var _v28 = ts.b;
						var a = _v28.a;
						var _v29 = _v28.b;
						var i = _v29.a;
						var _v30 = _v29.b;
						var name = _v30.a;
						return A3(
							$elm$core$Maybe$map2,
							F2(
								function (x, ix) {
									return $author$project$Protocol$Opt(
										{w: x, es: ix, aR: name});
								}),
							$author$project$Addr$fromWire(a),
							A2(
								$elm$core$Maybe$andThen,
								$author$project$Protocol$optIndex,
								$author$project$Protocol$nat(i)));
					} else {
						break _v0$48;
					}
				case 'route':
					if (((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && (!ts.b.b.b.b.b)) {
						var _v31 = ts.b;
						var a = _v31.a;
						var _v32 = _v31.b;
						var b = _v32.a;
						var _v33 = _v32.b;
						var c = _v33.a;
						var _v34 = $author$project$Protocol$int(b);
						if (!_v34.$) {
							var n = _v34.a;
							return A2(
								$elm$core$Maybe$map,
								function (x) {
									return $author$project$Protocol$RouteIs(
										{cd: n, d4: x, aZ: c});
								},
								$author$project$Protocol$cell(a));
						} else {
							return A3(
								$elm$core$Maybe$map2,
								F2(
									function (x, k) {
										return $author$project$Protocol$Route(
											{d4: x, cv: k, aO: a});
									}),
								$author$project$Protocol$cell(b),
								$author$project$Protocol$routeKind(c));
						}
					} else {
						break _v0$48;
					}
				case 'unroute':
					if (ts.b.b && (!ts.b.b.b)) {
						var _v35 = ts.b;
						var c = _v35.a;
						return A2(
							$elm$core$Maybe$map,
							$author$project$Protocol$Unroute,
							$author$project$Protocol$cell(c));
					} else {
						break _v0$48;
					}
				case 'routes':
					if (ts.b.b && (!ts.b.b.b)) {
						var _v36 = ts.b;
						var n = _v36.a;
						return A2(
							$elm$core$Maybe$map,
							$elm$core$Basics$always($author$project$Protocol$RoutesIs),
							$author$project$Protocol$nat(n));
					} else {
						break _v0$48;
					}
				case 'src':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v37 = ts.b;
						var src = _v37.a;
						var _v38 = _v37.b;
						var label = _v38.a;
						return $elm$core$Maybe$Just(
							$author$project$Protocol$Src(
								{aO: label, eX: src}));
					} else {
						break _v0$48;
					}
				case 'col':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v39 = ts.b;
						var tag = _v39.a;
						var _v40 = _v39.b;
						var a = _v40.a;
						return A2(
							$elm$core$Maybe$map,
							function (x) {
								return $author$project$Protocol$Col(
									{w: x, e$: tag});
							},
							$author$project$Addr$fromWire(a));
					} else {
						break _v0$48;
					}
				case 'amount':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v41 = ts.b;
						var lo = _v41.a;
						var _v42 = _v41.b;
						var hi = _v42.a;
						return A3(
							$elm$core$Maybe$map2,
							$author$project$Protocol$AmountRange,
							$author$project$Protocol$int(lo),
							$author$project$Protocol$int(hi));
					} else {
						break _v0$48;
					}
				case 'dests':
					if (ts.b.b && (!ts.b.b.b)) {
						var _v43 = ts.b;
						var n = _v43.a;
						return A2(
							$elm$core$Maybe$map,
							$author$project$Protocol$Dests,
							$author$project$Protocol$nat(n));
					} else {
						break _v0$48;
					}
				case 'source':
					if (ts.b.b && (!ts.b.b.b)) {
						var _v44 = ts.b;
						var text = _v44.a;
						return $elm$core$Maybe$Just(
							$author$project$Protocol$Source(text));
					} else {
						break _v0$48;
					}
				case 'val':
					if ((((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && ts.b.b.b.b.b) && (!ts.b.b.b.b.b.b)) {
						var _v45 = ts.b;
						var a = _v45.a;
						var _v46 = _v45.b;
						var norm = _v46.a;
						var _v47 = _v46.b;
						var stored = _v47.a;
						var _v48 = _v47.b;
						var text = _v48.a;
						return A4(
							$elm$core$Maybe$map3,
							F3(
								function (x, n, s) {
									return $author$project$Protocol$Val(
										{w: x, cG: n, cW: s, aZ: text});
								}),
							$author$project$Addr$fromWire(a),
							$author$project$Protocol$num(norm),
							$author$project$Protocol$num(stored));
					} else {
						break _v0$48;
					}
				case 'refused':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v49 = ts.b;
						var a = _v49.a;
						var _v50 = _v49.b;
						var why = _v50.a;
						return A2(
							$elm$core$Maybe$map,
							function (x) {
								return A2($author$project$Protocol$Refused, x, why);
							},
							$author$project$Addr$fromWire(a));
					} else {
						break _v0$48;
					}
				case 'crumb':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v51 = ts.b;
						var list = _v51.a;
						var _v52 = _v51.b;
						var row = _v52.a;
						return $elm$core$Maybe$Just(
							$author$project$Protocol$Crumb(
								{ez: list, eV: row}));
					} else {
						break _v0$48;
					}
				case 'settings':
					if (!ts.b.b) {
						return $elm$core$Maybe$Just($author$project$Protocol$SettingsIs);
					} else {
						break _v0$48;
					}
				case 'project':
					if ((((((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && ts.b.b.b.b.b) && (ts.b.b.b.b.a === 'gen')) && ts.b.b.b.b.b.b) && (!ts.b.b.b.b.b.b.b)) {
						var _v53 = ts.b;
						var name = _v53.a;
						var _v54 = _v53.b;
						var file = _v54.a;
						var _v55 = _v54.b;
						var edits = _v55.a;
						var _v56 = _v55.b;
						var _v57 = _v56.b;
						var g = _v57.a;
						return A4(
							$elm$core$Maybe$map3,
							F3(
								function (f, e, gn) {
									return $author$project$Protocol$ProjectIs(
										{co: e, ei: f, em: gn, aR: name});
								}),
							$author$project$Protocol$fileOf(file),
							$author$project$Protocol$editsOf(edits),
							$author$project$Protocol$generationOf(g));
					} else {
						break _v0$48;
					}
				case 'sound':
					if (((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && (!ts.b.b.b.b.b)) {
						var _v58 = ts.b;
						var n = _v58.a;
						var _v59 = _v58.b;
						var name = _v59.a;
						var _v60 = _v59.b;
						var status = _v60.a;
						return A2(
							$elm$core$Maybe$map,
							function (st) {
								return $author$project$Protocol$faulty(
									A2(
										$elm$core$Result$map,
										function (p) {
											return $author$project$Protocol$SoundIs(
												{aR: name, ak: p, bt: st});
										},
										$author$project$Protocol$partOf(n)));
							},
							$author$project$Protocol$soundStatusOf(status));
					} else {
						break _v0$48;
					}
				case 'toast':
					if (ts.b.b && (!ts.b.b.b)) {
						var _v61 = ts.b;
						var text = _v61.a;
						return $elm$core$Maybe$Just(
							$author$project$Protocol$ToastIs(text));
					} else {
						break _v0$48;
					}
				case 'projects':
					if (ts.b.b) {
						if (!ts.b.b.b) {
							var _v62 = ts.b;
							var n = _v62.a;
							return A2(
								$elm$core$Maybe$map,
								function (c) {
									return $author$project$Protocol$ProjectsIs(
										{ci: c, cD: false});
								},
								$author$project$Protocol$nat(n));
						} else {
							if ((ts.b.b.a === 'more') && (!ts.b.b.b.b)) {
								var _v63 = ts.b;
								var n = _v63.a;
								var _v64 = _v63.b;
								return A2(
									$elm$core$Maybe$map,
									function (c) {
										return $author$project$Protocol$ProjectsIs(
											{ci: c, cD: true});
									},
									$author$project$Protocol$nat(n));
							} else {
								break _v0$48;
							}
						}
					} else {
						break _v0$48;
					}
				case 'proj':
					if ((((((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && ts.b.b.b.b.b) && (ts.b.b.b.b.a === 'gen')) && ts.b.b.b.b.b.b) && (!ts.b.b.b.b.b.b.b)) {
						var _v65 = ts.b;
						var id = _v65.a;
						var _v66 = _v65.b;
						var name = _v66.a;
						var _v67 = _v66.b;
						var health = _v67.a;
						var _v68 = _v67.b;
						var _v69 = _v68.b;
						var g = _v69.a;
						return A4(
							$elm$core$Maybe$map3,
							F3(
								function (i, h, gn) {
									return $author$project$Protocol$Proj(
										{em: gn, ep: h, eq: i, aR: name});
								}),
							A2(
								$elm$core$Maybe$andThen,
								$author$project$Protocol$projectId,
								$author$project$Protocol$nat(id)),
							$author$project$Protocol$healthOf(health),
							$author$project$Protocol$generationOf(g));
					} else {
						break _v0$48;
					}
				case 'input':
					if (ts.b.b) {
						var _v70 = ts.b;
						var form = _v70.a;
						var kinds = _v70.b;
						return A3(
							$elm$core$Maybe$map2,
							F2(
								function (f, ks) {
									return $author$project$Protocol$InputIs(
										{el: f, ew: ks});
								}),
							$author$project$Protocol$formOf(form),
							A2($author$project$Protocol$traverse, $author$project$Protocol$mapKindOf, kinds));
					} else {
						break _v0$48;
					}
				case 'kind':
					if (((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && (!ts.b.b.b.b.b)) {
						var _v71 = ts.b;
						var k = _v71.a;
						var _v72 = _v71.b;
						var head = _v72.a;
						var _v73 = _v72.b;
						var tail = _v73.a;
						return A2(
							$elm$core$Maybe$map,
							function (x) {
								return $author$project$Protocol$KindIs(
									{eo: head, cv: x, e1: tail});
							},
							$author$project$Protocol$mapKindOf(k));
					} else {
						break _v0$48;
					}
				case 'ccs':
					var ns = ts.b;
					return A2(
						$elm$core$Maybe$map,
						$author$project$Protocol$CcsAre,
						A2(
							$author$project$Protocol$traverse,
							A2(
								$elm$core$Basics$composeR,
								$author$project$Protocol$nat,
								$elm$core$Maybe$andThen($author$project$Protocol$controlNo)),
							ns));
				case 'msbs':
					var ns = ts.b;
					return A2(
						$elm$core$Maybe$map,
						$author$project$Protocol$MsbsAre,
						A2(
							$author$project$Protocol$traverse,
							A2(
								$elm$core$Basics$composeR,
								$author$project$Protocol$nat,
								$elm$core$Maybe$andThen($author$project$Protocol$msb)),
							ns));
				case 'span':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v74 = ts.b;
						var lo = _v74.a;
						var _v75 = _v74.b;
						var hi = _v75.a;
						return A3(
							$elm$core$Maybe$map2,
							$author$project$Protocol$SpanIs,
							$author$project$Protocol$place(lo),
							$author$project$Protocol$place(hi));
					} else {
						break _v0$48;
					}
				case 'rows':
					if (ts.b.b && (!ts.b.b.b)) {
						var _v76 = ts.b;
						var n = _v76.a;
						return A2(
							$elm$core$Maybe$map,
							$author$project$Protocol$RowsAre,
							$author$project$Protocol$nat(n));
					} else {
						break _v0$48;
					}
				case 'maprows':
					if (ts.b.b && (!ts.b.b.b)) {
						var _v77 = ts.b;
						var n = _v77.a;
						return A2(
							$elm$core$Maybe$map,
							$author$project$Protocol$MapRowsAre,
							$author$project$Protocol$nat(n));
					} else {
						break _v0$48;
					}
				case 'map':
					if (((((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && (ts.b.b.b.a === 'keep')) && ts.b.b.b.b.b) && (!ts.b.b.b.b.b.b)) {
						var _v78 = ts.b;
						var n = _v78.a;
						var _v79 = _v78.b;
						var name = _v79.a;
						var _v80 = _v79.b;
						var _v81 = _v80.b;
						var k = _v81.a;
						return A3(
							$author$project$Protocol$mapHeader,
							n,
							$elm$core$Maybe$Just(name),
							k);
					} else {
						break _v0$48;
					}
				case 'row':
					if ((((((((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && ts.b.b.b.b.b) && ts.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b.b.b) && (!ts.b.b.b.b.b.b.b.b.b.b)) {
						var _v82 = ts.b;
						var r = _v82.a;
						var _v83 = _v82.b;
						var input = _v83.a;
						var _v84 = _v83.b;
						var kind = _v84.a;
						var _v85 = _v84.b;
						var a = _v85.a;
						var _v86 = _v85.b;
						var lo = _v86.a;
						var _v87 = _v86.b;
						var hi = _v87.a;
						var _v88 = _v87.b;
						var echo = _v88.a;
						var _v89 = _v88.b;
						var status = _v89.a;
						return A7(
							$author$project$Protocol$rowLine,
							r,
							input,
							kind,
							a,
							_Utils_Tuple2(lo, hi),
							echo,
							status);
					} else {
						break _v0$48;
					}
				case 'learn':
					if (ts.b.b && ts.b.b.b) {
						if (ts.b.b.b.b) {
							if (!ts.b.b.b.b.b) {
								switch (ts.b.a) {
									case 'armed':
										var _v92 = ts.b;
										var _v93 = _v92.b;
										var a = _v93.a;
										var _v94 = _v93.b;
										var band = _v94.a;
										return A2(
											$elm$core$Maybe$map,
											function (x) {
												return $author$project$Protocol$LearnIs(
													{
														T: $author$project$Protocol$Armed(x),
														cH: band
													});
											},
											$author$project$Protocol$addrOrNone(a));
									case 'sensing':
										var _v95 = ts.b;
										var _v96 = _v95.b;
										var r = _v96.a;
										var _v97 = _v96.b;
										var band = _v97.a;
										return A2(
											$elm$core$Maybe$andThen,
											function (x) {
												if (!x.$) {
													var i = x.a;
													return $elm$core$Maybe$Just(
														$author$project$Protocol$LearnIs(
															{
																T: $author$project$Protocol$Sensing(i),
																cH: band
															}));
												} else {
													return $elm$core$Maybe$Nothing;
												}
											},
											$author$project$Protocol$rowOf(r));
									default:
										break _v0$48;
								}
							} else {
								break _v0$48;
							}
						} else {
							switch (ts.b.a) {
								case 'off':
									var _v90 = ts.b;
									var _v91 = _v90.b;
									var band = _v91.a;
									return $elm$core$Maybe$Just(
										$author$project$Protocol$LearnIs(
											{T: $author$project$Protocol$NotLearning, cH: band}));
								case 'pointing':
									var _v99 = ts.b;
									var _v100 = _v99.b;
									var band = _v100.a;
									return $elm$core$Maybe$Just(
										$author$project$Protocol$LearnIs(
											{T: $author$project$Protocol$Pointing, cH: band}));
								default:
									break _v0$48;
							}
						}
					} else {
						break _v0$48;
					}
				case 'mapfile':
					if (ts.b.b && (!ts.b.b.b)) {
						var _v101 = ts.b;
						var name = _v101.a;
						return $elm$core$Maybe$Just(
							$author$project$Protocol$MapFileIs(name));
					} else {
						break _v0$48;
					}
				case 'act':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v102 = ts.b;
						var label = _v102.a;
						var _v103 = _v102.b;
						var token = _v103.a;
						return A2(
							$elm$core$Maybe$map,
							function (x) {
								return $author$project$Protocol$Act(
									{d4: x, aO: label});
							},
							$author$project$Protocol$actCellOf(token));
					} else {
						break _v0$48;
					}
				case 'orbit':
					if (!ts.b.b) {
						return $elm$core$Maybe$Just($author$project$Protocol$OrbitIs);
					} else {
						break _v0$48;
					}
				case 'song':
					if (((((((((((((ts.b.b && ts.b.b.b) && (ts.b.b.a === 'clock')) && ts.b.b.b.b) && ts.b.b.b.b.b) && (ts.b.b.b.b.a === 'scene')) && ts.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b) && (ts.b.b.b.b.b.b.a === 'queued')) && ts.b.b.b.b.b.b.b.b) && ts.b.b.b.b.b.b.b.b.b) && (ts.b.b.b.b.b.b.b.b.a === 'edited')) && ts.b.b.b.b.b.b.b.b.b.b) && (!ts.b.b.b.b.b.b.b.b.b.b.b)) {
						var _v104 = ts.b;
						var playback = _v104.a;
						var _v105 = _v104.b;
						var _v106 = _v105.b;
						var clock = _v106.a;
						var _v107 = _v106.b;
						var _v108 = _v107.b;
						var n = _v108.a;
						var _v109 = _v108.b;
						var _v110 = _v109.b;
						var q = _v110.a;
						var _v111 = _v110.b;
						var _v112 = _v111.b;
						var e = _v112.a;
						return A4(
							$elm$core$Maybe$map3,
							F3(
								function (_v113, _v114, ed) {
									var pb = _v113.a;
									var ck = _v113.b;
									var sc = _v114.a;
									var qd = _v114.b;
									return $author$project$Protocol$SongIs(
										{c5: ck, co: ed, dy: pb, dE: qd, dJ: sc});
								}),
							A3(
								$elm$core$Maybe$map2,
								$elm$core$Tuple$pair,
								$author$project$Protocol$playbackOf(playback),
								$author$project$Protocol$clockOf(clock)),
							A3(
								$elm$core$Maybe$map2,
								$elm$core$Tuple$pair,
								A2($author$project$Protocol$number, $author$project$Protocol$sceneNo, n),
								$author$project$Protocol$sceneOrNone(q)),
							$author$project$Protocol$yesNoOf(e));
					} else {
						break _v0$48;
					}
				case 'slot':
					if (((((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && (ts.b.b.b.a === 'rev')) && ts.b.b.b.b.b) && (!ts.b.b.b.b.b.b)) {
						var _v115 = ts.b;
						var n = _v115.a;
						var _v116 = _v115.b;
						var state = _v116.a;
						var _v117 = _v116.b;
						var _v118 = _v117.b;
						var r = _v118.a;
						return A4(
							$elm$core$Maybe$map3,
							F3(
								function (sc, st, rv) {
									return $author$project$Protocol$SlotIs(
										{dH: rv, eW: sc, dM: st});
								}),
							A2($author$project$Protocol$number, $author$project$Protocol$sceneNo, n),
							$author$project$Protocol$slotStateOf(state),
							A2($author$project$Protocol$number, $author$project$Protocol$rev, r));
					} else {
						break _v0$48;
					}
				case 'chord':
					if ((ts.b.b && ts.b.b.b) && (!ts.b.b.b.b)) {
						var _v119 = ts.b;
						var sg = _v119.a;
						var _v120 = _v119.b;
						var d = _v120.a;
						return A3(
							$elm$core$Maybe$map2,
							$author$project$Protocol$ChordIs,
							A2($author$project$Protocol$number, $author$project$Protocol$segment, sg),
							A2($author$project$Protocol$number, $author$project$Protocol$degree, d));
					} else {
						break _v0$48;
					}
				case 'scale':
					if (ts.b.b && (!ts.b.b.b)) {
						var _v121 = ts.b;
						var m = _v121.a;
						return A2(
							$elm$core$Maybe$map,
							$author$project$Protocol$ScaleIs,
							A2($author$project$Protocol$number, $author$project$Protocol$scaleMask, m));
					} else {
						break _v0$48;
					}
				case 'step':
					if (((ts.b.b && ts.b.b.b) && ts.b.b.b.b) && (!ts.b.b.b.b.b)) {
						var _v122 = ts.b;
						var r = _v122.a;
						var _v123 = _v122.b;
						var i = _v123.a;
						var _v124 = _v123.b;
						var n = _v124.a;
						return A4(
							$elm$core$Maybe$map3,
							$author$project$Protocol$StepIs,
							A2($author$project$Protocol$number, $author$project$Protocol$ringNo, r),
							A2($author$project$Protocol$number, $author$project$Protocol$stepNo, i),
							A2($author$project$Protocol$number, $author$project$Protocol$note, n));
					} else {
						break _v0$48;
					}
				case 'pool':
					if (ts.b.b) {
						var _v125 = ts.b;
						var r = _v125.a;
						var ns = _v125.b;
						return A3(
							$elm$core$Maybe$map2,
							$author$project$Protocol$PoolIs,
							A2($author$project$Protocol$number, $author$project$Protocol$ringNo, r),
							A2(
								$elm$core$Maybe$andThen,
								$author$project$Protocol$notePool,
								A2(
									$author$project$Protocol$traverse,
									$author$project$Protocol$number($author$project$Protocol$note),
									ns)));
					} else {
						break _v0$48;
					}
				default:
					break _v0$48;
			}
		} else {
			break _v0$48;
		}
	}
	return $elm$core$Maybe$Nothing;
};
var $author$project$Unit$Gen = $elm$core$Basics$identity;
var $author$project$Unit$genFromInt = function (n) {
	return (n >= 1) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $author$project$Protocol$SetRefused = F2(
	function (a, b) {
		return {$: 5, a: a, b: b};
	});
var $elm$core$String$words = _String_words;
var $author$project$Protocol$setRefusal = function (rest) {
	var plain = $author$project$Protocol$Err_('ed set ' + rest);
	var _v0 = $elm$core$String$words(rest);
	if (_v0.b) {
		if (_v0.b.b) {
			if (((_v0.a === 'has') && (_v0.b.a === 'no')) && _v0.b.b.b) {
				var _v1 = _v0.b;
				var _v2 = _v1.b;
				var a = _v2.a;
				return A2(
					$elm$core$Maybe$withDefault,
					plain,
					A2(
						$elm$core$Maybe$map,
						function (x) {
							return A2($author$project$Protocol$SetRefused, x, rest);
						},
						$author$project$Addr$fromWire(a)));
			} else {
				var a = _v0.a;
				var why = _v0.b;
				return A2(
					$elm$core$Maybe$withDefault,
					plain,
					A2(
						$elm$core$Maybe$map,
						function (x) {
							return A2(
								$author$project$Protocol$SetRefused,
								x,
								A2($elm$core$String$join, ' ', why));
						},
						$author$project$Addr$fromWire(a)));
			}
		} else {
			return plain;
		}
	} else {
		return plain;
	}
};
var $elm$core$String$dropRight = F2(
	function (n, string) {
		return (n < 1) ? string : A3($elm$core$String$slice, 0, -n, string);
	});
var $author$project$Protocol$stripCr = function (s) {
	return A2($elm$core$String$endsWith, '\u000D', s) ? A2($elm$core$String$dropRight, 1, s) : s;
};
var $elm$core$String$fromList = _String_fromList;
var $author$project$Protocol$quoted = F2(
	function (cs, w) {
		quoted:
		while (true) {
			_v0$3:
			while (true) {
				if (!cs.b) {
					return $elm$core$Maybe$Nothing;
				} else {
					if ('\"' === cs.a) {
						if (!cs.b.b) {
							return $elm$core$Maybe$Just(
								_Utils_Tuple2(
									$elm$core$String$fromList(
										$elm$core$List$reverse(w)),
									_List_Nil));
						} else {
							if (' ' === cs.b.a) {
								var _v1 = cs.b;
								var rest = _v1.b;
								return $elm$core$Maybe$Just(
									_Utils_Tuple2(
										$elm$core$String$fromList(
											$elm$core$List$reverse(w)),
										A2($elm$core$List$cons, ' ', rest)));
							} else {
								break _v0$3;
							}
						}
					} else {
						break _v0$3;
					}
				}
			}
			var c = cs.a;
			var rest = cs.b;
			var $temp$cs = rest,
				$temp$w = A2($elm$core$List$cons, c, w);
			cs = $temp$cs;
			w = $temp$w;
			continue quoted;
		}
	});
var $author$project$Protocol$spanWord = F2(
	function (cs, w) {
		spanWord:
		while (true) {
			if (!cs.b) {
				return _Utils_Tuple2(
					$elm$core$String$fromList(
						$elm$core$List$reverse(w)),
					_List_Nil);
			} else {
				if (' ' === cs.a) {
					return _Utils_Tuple2(
						$elm$core$String$fromList(
							$elm$core$List$reverse(w)),
						cs);
				} else {
					var c = cs.a;
					var rest = cs.b;
					var $temp$cs = rest,
						$temp$w = A2($elm$core$List$cons, c, w);
					cs = $temp$cs;
					w = $temp$w;
					continue spanWord;
				}
			}
		}
	});
var $author$project$Protocol$go = F2(
	function (cs, acc) {
		go:
		while (true) {
			if (!cs.b) {
				return $elm$core$Maybe$Just(acc);
			} else {
				switch (cs.a) {
					case ' ':
						var rest = cs.b;
						var $temp$cs = rest,
							$temp$acc = acc;
						cs = $temp$cs;
						acc = $temp$acc;
						continue go;
					case '\"':
						var rest = cs.b;
						return A2(
							$elm$core$Maybe$andThen,
							function (_v1) {
								var t = _v1.a;
								var after = _v1.b;
								return A2(
									$author$project$Protocol$go,
									after,
									A2($elm$core$List$cons, t, acc));
							},
							A2($author$project$Protocol$quoted, rest, _List_Nil));
					default:
						var _v2 = A2($author$project$Protocol$spanWord, cs, _List_Nil);
						var w = _v2.a;
						var after = _v2.b;
						var $temp$cs = after,
							$temp$acc = A2($elm$core$List$cons, w, acc);
						cs = $temp$cs;
						acc = $temp$acc;
						continue go;
				}
			}
		}
	});
var $elm$core$String$foldr = _String_foldr;
var $elm$core$String$toList = function (string) {
	return A3($elm$core$String$foldr, $elm$core$List$cons, _List_Nil, string);
};
var $author$project$Protocol$tokens = function (s) {
	return A2(
		$elm$core$Maybe$map,
		$elm$core$List$reverse,
		A2(
			$author$project$Protocol$go,
			$elm$core$String$toList(s),
			_List_Nil));
};
var $elm$core$String$trimLeft = _String_trimLeft;
var $author$project$Protocol$parse = function (raw) {
	var line = $author$project$Protocol$stripCr(raw);
	var trimmed = $elm$core$String$trimLeft(line);
	if (trimmed === 'ERR ed since too large') {
		return $author$project$Protocol$SinceTooLarge;
	} else {
		if (A2($elm$core$String$startsWith, 'ERR ed set ', trimmed)) {
			return $author$project$Protocol$setRefusal(
				A2($elm$core$String$dropLeft, 11, trimmed));
		} else {
			if ((trimmed === 'ERR') || A2($elm$core$String$startsWith, 'ERR ', trimmed)) {
				return $author$project$Protocol$Err_(
					$elm$core$String$trim(
						A2($elm$core$String$dropLeft, 3, trimmed)));
			} else {
				if ((trimmed === 'OK') || A2($elm$core$String$startsWith, 'OK ', trimmed)) {
					var _v0 = $elm$core$String$trim(
						A2($elm$core$String$dropLeft, 2, trimmed));
					switch (_v0) {
						case '':
							return $author$project$Protocol$Ok_($elm$core$Maybe$Nothing);
						case 'queued':
							return $author$project$Protocol$Queued;
						default:
							var m = _v0;
							var _v1 = A2($elm$core$String$split, ' ', m);
							_v1$2:
							while (true) {
								if (_v1.b) {
									if (!_v1.b.b) {
										var n = _v1.a;
										return A2(
											$elm$core$Maybe$withDefault,
											$author$project$Protocol$Unknown,
											A2(
												$elm$core$Maybe$map,
												A2($elm$core$Basics$composeR, $elm$core$Maybe$Just, $author$project$Protocol$Ok_),
												A2(
													$elm$core$Maybe$andThen,
													$author$project$Unit$genFromInt,
													$author$project$Protocol$nat(n))));
									} else {
										if ((_v1.b.a === 'more') && (!_v1.b.b.b)) {
											var n = _v1.a;
											var _v2 = _v1.b;
											return A2(
												$elm$core$Maybe$withDefault,
												$author$project$Protocol$Unknown,
												A2(
													$elm$core$Maybe$map,
													$author$project$Protocol$OkMore,
													A2(
														$elm$core$Maybe$andThen,
														$author$project$Unit$genFromInt,
														$author$project$Protocol$nat(n))));
										} else {
											break _v1$2;
										}
									}
								} else {
									break _v1$2;
								}
							}
							return $author$project$Protocol$Unknown;
					}
				} else {
					var _v3 = $elm$core$String$words(trimmed);
					if ((((((((_v3.b && (_v3.a === 'map')) && _v3.b.b) && _v3.b.b.b) && (_v3.b.b.a === 'none')) && _v3.b.b.b.b) && (_v3.b.b.b.a === 'keep')) && _v3.b.b.b.b.b) && (!_v3.b.b.b.b.b.b)) {
						var _v4 = _v3.b;
						var n = _v4.a;
						var _v5 = _v4.b;
						var _v6 = _v5.b;
						var _v7 = _v6.b;
						var k = _v7.a;
						return A2(
							$elm$core$Maybe$withDefault,
							$author$project$Protocol$Unknown,
							A2(
								$elm$core$Maybe$map,
								$author$project$Protocol$Answer,
								A3($author$project$Protocol$mapHeader, n, $elm$core$Maybe$Nothing, k)));
					} else {
						var _v8 = $author$project$Protocol$tokens(line);
						if (!_v8.$) {
							var ts = _v8.a;
							return A2(
								$elm$core$Maybe$withDefault,
								$author$project$Protocol$Unknown,
								A2(
									$elm$core$Maybe$map,
									$author$project$Protocol$Answer,
									$author$project$Protocol$answer(ts)));
						} else {
							return $author$project$Protocol$Unknown;
						}
					}
				}
			}
		}
	}
};
var $author$project$Protocol$firstPage = 0;
var $author$project$Model$recallMissed = function (m) {
	var _v0 = m.b;
	switch (_v0.$) {
		case 2:
			var s = _v0.a;
			var reply = _v0.b;
			return _Utils_update(
				m,
				{
					e: $elm$core$Maybe$Nothing,
					ay: $author$project$Schema$empty,
					az: _List_Nil,
					b: A3($author$project$Model$Describing, s, reply, $author$project$Protocol$firstPage)
				});
		case 0:
			return m;
		case 1:
			return m;
		case 3:
			return m;
		case 4:
			return m;
		default:
			return m;
	}
};
var $author$project$Schema$pageCount = function (_v0) {
	var s = _v0;
	return s.ci;
};
var $author$project$Schema$pages = function (_v0) {
	var s = _v0;
	return s.aB;
};
var $author$project$Model$read = F2(
	function (raw, acc) {
		if (!acc.$) {
			var sch = acc.a;
			var _v1 = $author$project$Protocol$parse(raw);
			switch (_v1.$) {
				case 0:
					var a = _v1.a;
					return $elm$core$Result$Ok(
						A2($author$project$Schema$add, a, sch));
				case 1:
					return $elm$core$Result$Err(raw);
				case 2:
					return $elm$core$Result$Err(raw);
				case 3:
					return $elm$core$Result$Err(raw);
				case 4:
					return $elm$core$Result$Err(raw);
				case 5:
					return $elm$core$Result$Err(raw);
				case 6:
					return $elm$core$Result$Err(raw);
				default:
					return $elm$core$Result$Err(raw);
			}
		} else {
			return acc;
		}
	});
var $author$project$Model$recalled = F2(
	function (r, m) {
		var _v0 = m.b;
		switch (_v0.$) {
			case 2:
				var s = _v0.a;
				var reply = _v0.b;
				if (!_Utils_eq(
					r.dk,
					A2($author$project$Model$cacheKey, s, reply.j))) {
					return m;
				} else {
					var describe = $author$project$Model$recallMissed(m);
					var _v1 = A2(
						$elm$core$Maybe$map,
						function (ls) {
							return _Utils_Tuple2(
								_Utils_eq(
									$author$project$Hash$ofLines(ls),
									reply.j),
								A3(
									$elm$core$List$foldl,
									$author$project$Model$read,
									$elm$core$Result$Ok($author$project$Schema$empty),
									ls));
						},
						r.dp);
					if (!_v1.$) {
						if (_v1.a.a) {
							if (!_v1.a.b.$) {
								var _v2 = _v1.a;
								var sch = _v2.b.a;
								return (_Utils_eq(
									$author$project$Schema$pageCount(sch),
									$elm$core$Maybe$Just(reply.aB)) && _Utils_eq(
									$elm$core$List$length(
										$author$project$Schema$pages(sch)),
									reply.aB)) ? $author$project$Model$readNext(
									A3(
										$author$project$Model$install,
										s,
										{j: reply.j, g: sch},
										_Utils_update(
											m,
											{e: $elm$core$Maybe$Nothing}))) : describe;
							} else {
								var _v3 = _v1.a;
								var l = _v3.b.a;
								return _Utils_update(
									m,
									{
										e: $elm$core$Maybe$Nothing,
										b: $author$project$Model$Halted(
											A2(
												$author$project$Model$BadSchema,
												s,
												$author$project$Model$Unreadable(l)))
									});
							}
						} else {
							var _v4 = _v1.a;
							return describe;
						}
					} else {
						return describe;
					}
				}
			case 0:
				return m;
			case 1:
				return m;
			case 3:
				return m;
			case 4:
				return m;
			default:
				return m;
		}
	});
var $author$project$Model$schemaOf = F2(
	function (a, m) {
		var _v0 = _Utils_Tuple3(
			A2($author$project$Schema$param, a, m.g),
			A2($author$project$Schema$param, a, m.ai),
			A2($author$project$Model$isOrbit, a, m));
		if (!_v0.a.$) {
			return m.g;
		} else {
			if (!_v0.b.$) {
				var _v1 = _v0.a;
				return m.ai;
			} else {
				if (_v0.c) {
					var _v2 = _v0.a;
					var _v3 = _v0.b;
					return m.bj;
				} else {
					var _v4 = _v0.a;
					var _v5 = _v0.b;
					return m.bq;
				}
			}
		}
	});
var $author$project$Protocol$AskSchema = function (a) {
	return {$: 1, a: a};
};
var $author$project$Protocol$Describe = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Protocol$Hello = {$: 0};
var $author$project$Model$Silent = {$: 4};
var $author$project$Protocol$Since = function (a) {
	return {$: 5, a: a};
};
var $author$project$Model$answerTimeoutMs = 1000;
var $author$project$Model$connecting = F4(
	function (timedOut, silent, go, m) {
		return timedOut ? silent : (_Utils_eq(m.e, $elm$core$Maybe$Nothing) ? go : _Utils_Tuple2(m, _List_Nil));
	});
var $author$project$Model$NoAnswer = function (a) {
	return {$: 4, a: a};
};
var $author$project$Flow$Fresh = {$: 0};
var $author$project$Flow$GaveUp = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Flow$Resent = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $elm$time$Time$posixToMillis = function (_v0) {
	var millis = _v0;
	return millis;
};
var $author$project$Flow$expire = F3(
	function (now, ms, f) {
		if (!f.$) {
			return _Utils_Tuple2(f, $author$project$Flow$Fresh);
		} else {
			var s = f.a;
			var d = f.b;
			if (_Utils_cmp(
				$elm$time$Time$posixToMillis(now) - $elm$time$Time$posixToMillis(s.bC),
				ms) < 0) {
				return _Utils_Tuple2(f, $author$project$Flow$Fresh);
			} else {
				if (!s.bX) {
					var e = A2(
						$elm$core$Maybe$withDefault,
						s.B,
						A2(
							$elm$core$Dict$get,
							$author$project$Flow$keyOf(s.B),
							d));
					return _Utils_Tuple2(
						A2(
							$author$project$Flow$Waiting,
							_Utils_update(
								s,
								{bC: now, B: e, bX: true}),
							A2(
								$elm$core$Dict$remove,
								$author$project$Flow$keyOf(s.B),
								d)),
						A2(
							$author$project$Flow$Resent,
							$author$project$Flow$command(s.B),
							$author$project$Flow$command(e)));
				} else {
					var _v1 = A2($author$project$Flow$next, now, d);
					var after = _v1.a;
					var n = _v1.b;
					return _Utils_Tuple2(
						after,
						A2(
							$author$project$Flow$GaveUp,
							$author$project$Flow$command(s.B),
							n));
				}
			}
		}
	});
var $author$project$Model$removeFirst = F2(
	function (x, xs) {
		if (xs.b) {
			var y = xs.a;
			var rest = xs.b;
			return _Utils_eq(y, x) ? rest : A2(
				$elm$core$List$cons,
				y,
				A2($author$project$Model$removeFirst, x, rest));
		} else {
			return _List_Nil;
		}
	});
var $author$project$Model$expire = function (m) {
	var _v0 = A3($author$project$Flow$expire, m.I, $author$project$Model$answerTimeoutMs, m.u);
	var flow = _v0.a;
	var ex = _v0.b;
	var dropped = function (c) {
		return _Utils_update(
			m,
			{
				l: A2($author$project$Model$removeFirst, c, m.l),
				u: flow
			});
	};
	switch (ex.$) {
		case 0:
			return _Utils_Tuple2(m, _List_Nil);
		case 1:
			var old = ex.a;
			var _new = ex.b;
			return _Utils_Tuple2(
				dropped(old),
				_List_fromArray(
					[_new]));
		default:
			var old = ex.a;
			var next = ex.b;
			return _Utils_Tuple2(
				A2(
					$author$project$Model$keep,
					$author$project$Model$NoAnswer(old),
					dropped(old)),
				$author$project$Model$maybeList(next));
	}
};
var $elm$core$Tuple$mapFirst = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			func(x),
			y);
	});
var $author$project$Model$ms = $elm$time$Time$posixToMillis;
var $author$project$Model$tick = F2(
	function (t, m0) {
		var m = _Utils_update(
			m0,
			{I: t});
		var ask = function (c) {
			return _Utils_Tuple2(
				_Utils_update(
					m,
					{
						e: $elm$core$Maybe$Just(t),
						aA: false,
						s: m.s + 1
					}),
				_List_fromArray(
					[c]));
		};
		if (!_Utils_eq(
			m.aP,
			$elm$core$Maybe$Just(0))) {
			return _Utils_Tuple2(m, _List_Nil);
		} else {
			var timedOut = A2(
				$elm$core$Maybe$withDefault,
				false,
				A2(
					$elm$core$Maybe$map,
					function (at) {
						return _Utils_cmp(
							$author$project$Model$ms(t) - $author$project$Model$ms(at),
							$author$project$Model$answerTimeoutMs) > -1;
					},
					m.e));
			var silent = _Utils_Tuple2(
				_Utils_update(
					m,
					{
						e: $elm$core$Maybe$Nothing,
						b: $author$project$Model$Halted($author$project$Model$Silent)
					}),
				_List_Nil);
			var _v0 = m.b;
			switch (_v0.$) {
				case 5:
					return _Utils_Tuple2(m, _List_Nil);
				case 4:
					var _v1 = $author$project$Model$expire(m);
					var mf = _v1.a;
					var window = _v1.b;
					var again = _Utils_Tuple2(
						_Utils_update(
							mf,
							{
								e: $elm$core$Maybe$Just(t),
								aA: false,
								s: mf.s + 1
							}),
						_Utils_ap(
							window,
							_List_fromArray(
								[
									$author$project$Protocol$Since(mf.ba)
								])));
					return (!mf.s) ? again : ((timedOut && ((mf.s === 1) && (!mf.aA))) ? again : (timedOut ? A2(
						$elm$core$Tuple$mapFirst,
						function (fresh) {
							return _Utils_update(
								fresh,
								{l: _List_Nil, s: 1});
						},
						again) : _Utils_Tuple2(mf, window)));
				case 0:
					return A4(
						$author$project$Model$connecting,
						timedOut,
						silent,
						ask($author$project$Protocol$Hello),
						m);
				case 1:
					var s = _v0.a;
					return A4(
						$author$project$Model$connecting,
						timedOut,
						silent,
						ask(
							$author$project$Protocol$AskSchema(s)),
						m);
				case 2:
					return timedOut ? _Utils_Tuple2(
						$author$project$Model$recallMissed(m),
						_List_Nil) : _Utils_Tuple2(m, _List_Nil);
				default:
					var s = _v0.a;
					var n = _v0.c;
					return A4(
						$author$project$Model$connecting,
						timedOut,
						silent,
						ask(
							A2($author$project$Protocol$Describe, s, n)),
						m);
			}
		}
	});
var $author$project$Model$stepIn = F2(
	function (msg, m) {
		switch (msg.$) {
			case 0:
				var l = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						$author$project$Model$init,
						{
							H: m.H,
							aP: $elm$core$Maybe$Just(l),
							af: m.af,
							I: m.I,
							aE: $author$project$Model$nextSeat(m.aE),
							a0: m.a0
						}),
					_List_Nil);
			case 17:
				return _Utils_Tuple2(
					_Utils_update(
						m,
						{H: _List_Nil, af: 0}),
					_List_Nil);
			case 2:
				var t = msg.a;
				return A2(
					$elm$core$Tuple$mapSecond,
					$elm$core$List$map($author$project$Model$Say),
					A2($author$project$Model$tick, t, m));
			case 1:
				var raw = msg.a;
				return A3(
					$author$project$Model$line,
					raw,
					$author$project$Protocol$parse(raw),
					m);
			case 3:
				var a = msg.a;
				var v = msg.b;
				return A2(
					$elm$core$Tuple$mapSecond,
					$elm$core$List$map($author$project$Model$Say),
					A3($author$project$Model$edit, a, v, m));
			case 4:
				var a = msg.a;
				var i = msg.b;
				var _v1 = A4(
					$author$project$Schema$optionName,
					m.L,
					a,
					i,
					A2($author$project$Model$schemaOf, a, m));
				if (!_v1.$) {
					return A2(
						$elm$core$Tuple$mapSecond,
						$elm$core$List$map($author$project$Model$Say),
						A3(
							$author$project$Model$edit,
							a,
							$author$project$Protocol$Index(i),
							m));
				} else {
					return _Utils_Tuple2(m, _List_Nil);
				}
			case 5:
				var p = msg.a;
				return _Utils_eq(m.b, $author$project$Model$Following) ? _Utils_Tuple2(
					m,
					_List_fromArray(
						[
							$author$project$Model$Say(
							$author$project$Protocol$Follow(p))
						])) : _Utils_Tuple2(m, _List_Nil);
			case 6:
				var v = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						m,
						{
							a0: $elm$core$Maybe$Just(v)
						}),
					_List_Nil);
			case 7:
				var r = msg.a;
				return _Utils_Tuple2(
					A2($author$project$Model$recalled, r, m),
					_List_Nil);
			case 8:
				return _Utils_Tuple2(
					$author$project$Model$recallMissed(m),
					_List_Nil);
			case 9:
				var l = msg.a;
				return _Utils_Tuple2(
					A2(
						$author$project$Model$keep,
						$author$project$Model$Unsent(l),
						m),
					_List_Nil);
			case 10:
				var c = msg.a;
				var to = msg.b;
				return $author$project$Model$takesEdits(m) ? A3(
					$elm$core$Tuple$mapBoth,
					function (flow) {
						return _Utils_update(
							m,
							{u: flow});
					},
					A2(
						$elm$core$Basics$composeR,
						$author$project$Model$maybeList,
						$elm$core$List$map($author$project$Model$Say)),
					A3(
						$author$project$Flow$want,
						m.I,
						A2($author$project$Flow$RouteOf, c, to),
						m.u)) : _Utils_Tuple2(m, _List_Nil);
			case 11:
				return A2($author$project$Model$projectCommand, $author$project$Protocol$ListProjects, m);
			case 12:
				return A2($author$project$Model$projectCommand, $author$project$Protocol$SaveProject, m);
			case 13:
				var n = msg.a;
				return A2(
					$author$project$Model$projectCommand,
					$author$project$Protocol$SaveProjectAs(n),
					m);
			case 14:
				var id = msg.a;
				var g = msg.b;
				var over = msg.c;
				return A2(
					$author$project$Model$projectCommand,
					A3($author$project$Protocol$LoadProject, id, g, over),
					m);
			case 15:
				var c = msg.a;
				return A2($author$project$Model$mapCommand, c, m);
			default:
				var c = msg.a;
				return A2(
					$author$project$Model$projectCommand,
					$author$project$Protocol$OrbitCmd(c),
					m);
		}
	});
var $author$project$Model$step = F2(
	function (msg, m) {
		var _v0 = A2($author$project$Model$stepIn, msg, m);
		var m1 = _v0.a;
		var wishes = _v0.b;
		var _v1 = A2($author$project$Model$effectsOf, wishes, m1);
		var m2 = _v1.a;
		var effects = _v1.b;
		return $author$project$Model$released(
			A3($author$project$Model$sending, m, m2, effects));
	});
var $author$project$Model$update = F2(
	function (msg, model) {
		var _v0 = A2($author$project$Model$step, msg, model);
		var m = _v0.a;
		var effects = _v0.b;
		return _Utils_Tuple2(
			m,
			$elm$core$Platform$Cmd$batch(
				A2(
					$elm$core$List$cons,
					$author$project$Model$opening(msg),
					A2($elm$core$List$map, $author$project$Model$run, effects))));
	});
var $author$project$Model$Edit = F2(
	function (a, b) {
		return {$: 3, a: a, b: b};
	});
var $author$project$Model$EditRoute = F2(
	function (a, b) {
		return {$: 10, a: a, b: b};
	});
var $author$project$Protocol$Num = function (a) {
	return {$: 0, a: a};
};
var $author$project$Model$Pick = F2(
	function (a, b) {
		return {$: 4, a: a, b: b};
	});
var $author$project$Protocol$RouteAmount = function (a) {
	return {$: 0, a: a};
};
var $author$project$Protocol$Amount = $elm$core$Basics$identity;
var $author$project$Protocol$amount = function (n) {
	return ((_Utils_cmp(n, -127) > -1) && (n <= 127)) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $author$project$Ui$Control$Number = function (a) {
	return {$: 0, a: a};
};
var $author$project$Ui$Control$Option = function (a) {
	return {$: 1, a: a};
};
var $author$project$Protocol$RouteOff = {$: 1};
var $author$project$Ui$Routes$Amount = $elm$core$Basics$identity;
var $elm$core$Basics$clamp = F3(
	function (low, high, number) {
		return (_Utils_cmp(number, low) < 0) ? low : ((_Utils_cmp(number, high) > 0) ? high : number);
	});
var $author$project$Ui$Routes$amount = A2(
	$elm$core$Basics$composeR,
	A2($elm$core$Basics$clamp, -100, 100),
	$elm$core$Basics$identity);
var $elm$core$Basics$round = _Basics_round;
var $author$project$Ui$Routes$amountFromNorm = function (t) {
	return $author$project$Ui$Routes$amount(
		$elm$core$Basics$round(
			(A3($elm$core$Basics$clamp, 0, 1, t) - 0.5) * 200));
};
var $author$project$Ui$Routes$amountValue = function (_v0) {
	var a = _v0;
	return a;
};
var $author$project$Ui$Control$roundAway = function (x) {
	return (x >= 0) ? $elm$core$Basics$floor(x + 0.5) : (-$elm$core$Basics$floor((-x) + 0.5));
};
var $author$project$Ui$Control$onStep = F2(
	function (p, v) {
		return (p.eY > 0) ? ($author$project$Ui$Control$roundAway(v / p.eY) * p.eY) : v;
	});
var $author$project$Ui$Control$stored = F2(
	function (p, v) {
		return $elm$core$Basics$round(
			A3($elm$core$Basics$clamp, p.cC, p.cx, v) * 10000) / 10000;
	});
var $elm$core$Basics$pow = _Basics_pow;
var $author$project$Ui$Control$scaleOf = function (p) {
	return p.b$;
};
var $author$project$Ui$Control$valueAt = F2(
	function (p, t) {
		var _v0 = $author$project$Ui$Control$scaleOf(p);
		if (!_v0) {
			return p.cC + (t * (p.cx - p.cC));
		} else {
			return p.cC * A2(
				$elm$core$Basics$pow,
				2,
				t * A2($elm$core$Basics$logBase, 2, p.cx / p.cC));
		}
	});
var $author$project$Ui$Control$atNorm = F2(
	function (p, t) {
		var v = A2(
			$author$project$Ui$Control$valueAt,
			p,
			A3($elm$core$Basics$clamp, 0, 1, t));
		return A2(
			$author$project$Ui$Control$stored,
			p,
			function () {
				var _v0 = p.cv;
				switch (_v0) {
					case 1:
						return A2($author$project$Ui$Control$onStep, p, v);
					case 0:
						return v;
					case 2:
						return v;
					default:
						return v;
				}
			}());
	});
var $author$project$Ui$Routes$cables = function (_v0) {
	var r = _v0;
	return r.ad;
};
var $author$project$Ui$Routes$destOption = function (_v0) {
	var i = _v0.a;
	return i;
};
var $author$project$View$EnginePage$boxAt = function (t) {
	return A3(
		$elm$core$Basics$clamp,
		-127,
		127,
		$elm$core$Basics$round(
			((A3($elm$core$Basics$clamp, 0, 1, t) * 2) - 1) * 127));
};
var $author$project$View$EnginePage$isChoice = function (p) {
	var _v0 = p.cv;
	switch (_v0) {
		case 0:
			return false;
		case 1:
			return false;
		case 2:
			return true;
		default:
			return true;
	}
};
var $author$project$Ui$Control$nudged = F2(
	function (p, n) {
		var notch = function (_v6) {
			return A2($author$project$Ui$Control$atNorm, p, n.S + (n.cf * n.c$));
		};
		var _v0 = _Utils_Tuple2(p.cv, p.eY > 0);
		switch (_v0.a) {
			case 1:
				if (_v0.b) {
					var _v1 = _v0.a;
					return A2(
						$author$project$Ui$Control$stored,
						p,
						($author$project$Ui$Control$roundAway(
							A2(
								$author$project$Ui$Control$valueAt,
								p,
								A3($elm$core$Basics$clamp, 0, 1, n.S)) / p.eY) + n.cf) * p.eY);
				} else {
					var _v2 = _v0.a;
					return notch(0);
				}
			case 0:
				var _v3 = _v0.a;
				return notch(0);
			case 2:
				var _v4 = _v0.a;
				return notch(0);
			default:
				var _v5 = _v0.a;
				return notch(0);
		}
	});
var $author$project$View$EnginePage$paramOf = F2(
	function (m, a) {
		return A3($author$project$Schema$paramIn, m.L, a, m.g);
	});
var $author$project$Ui$Control$want = F3(
	function (a, w, _v0) {
		var d = _v0;
		return A3(
			$elm$core$Dict$insert,
			$author$project$Addr$key(a),
			_Utils_Tuple2(a, w),
			d);
	});
var $author$project$View$EnginePage$want = F3(
	function (a, w, s) {
		return _Utils_update(
			s,
			{
				Z: A3($author$project$Ui$Control$want, a, w, s.Z)
			});
	});
var $author$project$View$EnginePage$intendParam = F3(
	function (m, intent, s) {
		var on = F2(
			function (a, f) {
				return A2(
					$elm$core$Maybe$withDefault,
					s,
					A2(
						$elm$core$Maybe$map,
						f,
						A2($author$project$View$EnginePage$paramOf, m, a)));
			});
		switch (intent.$) {
			case 0:
				var a = intent.a;
				var t = intent.b;
				return A2(
					on,
					a,
					function (p) {
						return A3(
							$author$project$View$EnginePage$want,
							p.w,
							$author$project$Ui$Control$Number(
								A2($author$project$Ui$Control$atNorm, p, t)),
							s);
					});
			case 1:
				var a = intent.a;
				var n = intent.b;
				return A2(
					on,
					a,
					function (p) {
						return A3(
							$author$project$View$EnginePage$want,
							p.w,
							$author$project$Ui$Control$Number(
								A2($author$project$Ui$Control$nudged, p, n)),
							s);
					});
			case 2:
				var a = intent.a;
				var i = intent.b;
				return A3(
					$author$project$View$EnginePage$want,
					a,
					$author$project$Ui$Control$Option(i),
					s);
			default:
				var a = intent.a;
				return A2(
					on,
					a,
					function (p) {
						return $author$project$View$EnginePage$isChoice(p) ? A2(
							$elm$core$Maybe$withDefault,
							s,
							A2(
								$elm$core$Maybe$map,
								function (i) {
									return A3(
										$author$project$View$EnginePage$want,
										p.w,
										$author$project$Ui$Control$Option(i),
										s);
								},
								$author$project$Protocol$optIndex(
									$elm$core$Basics$round(p.d9)))) : A3(
							$author$project$View$EnginePage$want,
							p.w,
							$author$project$Ui$Control$Number(p.d9),
							s);
					});
		}
	});
var $author$project$View$EnginePage$intentAddr = function (intent) {
	switch (intent.$) {
		case 0:
			var a = intent.a;
			return a;
		case 1:
			var a = intent.a;
			return a;
		case 2:
			var a = intent.a;
			return a;
		default:
			var a = intent.a;
			return a;
	}
};
var $author$project$Protocol$amountToInt = function (_v0) {
	var n = _v0;
	return n;
};
var $author$project$Flow$target = F2(
	function (like, f) {
		if (!f.$) {
			return $elm$core$Maybe$Nothing;
		} else {
			var s = f.a;
			var d = f.b;
			var _v1 = A2(
				$elm$core$Dict$get,
				$author$project$Flow$keyOf(like),
				d);
			if (!_v1.$) {
				var e = _v1.a;
				return $elm$core$Maybe$Just(e);
			} else {
				return _Utils_eq(
					$author$project$Flow$keyOf(s.B),
					$author$project$Flow$keyOf(like)) ? $elm$core$Maybe$Just(s.B) : $elm$core$Maybe$Nothing;
			}
		}
	});
var $author$project$Model$pendingRoute = F2(
	function (c, m) {
		var _v0 = A2(
			$author$project$Flow$target,
			A2($author$project$Flow$RouteOf, c, $author$project$Protocol$RouteOff),
			m.u);
		if (!_v0.$) {
			if (_v0.a.$ === 1) {
				var _v1 = _v0.a;
				var to = _v1.b;
				return $elm$core$Maybe$Just(to);
			} else {
				var _v2 = _v0.a;
				return $elm$core$Maybe$Nothing;
			}
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$View$EnginePage$partRoute = F3(
	function (m, s, a) {
		return A2(
			$elm$core$Maybe$map,
			function (_v0) {
				var c = _v0.a;
				var r = _v0.b;
				var _v1 = A2(
					$elm$core$Dict$get,
					$author$project$Addr$key(a),
					s.ao);
				if (!_v1.$) {
					var _v2 = _v1.a;
					var n = _v2.b;
					return _Utils_Tuple2(c, n);
				} else {
					var _v3 = A2($author$project$Model$pendingRoute, c, m);
					if (!_v3.$) {
						if (!_v3.a.$) {
							var x = _v3.a.a;
							return _Utils_Tuple2(
								c,
								$author$project$Protocol$amountToInt(x));
						} else {
							var _v4 = _v3.a;
							return _Utils_Tuple2(c, r.cd);
						}
					} else {
						return _Utils_Tuple2(c, r.cd);
					}
				}
			},
			A3(
				$elm$core$Maybe$map2,
				$elm$core$Tuple$pair,
				$author$project$Protocol$cell(
					$author$project$Addr$key(a)),
				A2(
					$elm$core$Dict$get,
					$author$project$Addr$key(a),
					m.W)));
	});
var $author$project$View$EnginePage$wantRoute = F3(
	function (c, n, s) {
		return _Utils_update(
			s,
			{
				ao: A3(
					$elm$core$Dict$insert,
					$author$project$Protocol$cellKey(c),
					_Utils_Tuple2(c, n),
					s.ao)
			});
	});
var $author$project$View$EnginePage$intend = F3(
	function (m, intent, s) {
		var _v0 = A3(
			$author$project$View$EnginePage$partRoute,
			m,
			s,
			$author$project$View$EnginePage$intentAddr(intent));
		if (!_v0.$) {
			var _v1 = _v0.a;
			var c = _v1.a;
			switch (intent.$) {
				case 0:
					var t = intent.b;
					return A3(
						$author$project$View$EnginePage$wantRoute,
						c,
						$author$project$View$EnginePage$boxAt(t),
						s);
				case 1:
					var n = intent.b;
					return A3(
						$author$project$View$EnginePage$wantRoute,
						c,
						$author$project$View$EnginePage$boxAt(n.S + (n.cf * n.c$)),
						s);
				case 2:
					return s;
				default:
					return s;
			}
		} else {
			return A3($author$project$View$EnginePage$intendParam, m, intent, s);
		}
	});
var $author$project$Ui$Control$Continuous = function (a) {
	return {$: 0, a: a};
};
var $author$project$View$EnginePage$normOfBox = function (n) {
	return ((n / 127) + 1) / 2;
};
var $author$project$Ui$Control$Discrete = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$Control$Chosen = $elm$core$Basics$identity;
var $author$project$Ui$Control$Clear = {$: 0};
var $author$project$Ui$Control$On = function (a) {
	return {$: 0, a: a};
};
var $author$project$Ui$Control$chosen = function (i) {
	return {
		a5: $author$project$Ui$Control$On(i),
		U: $author$project$Ui$Control$Clear
	};
};
var $author$project$Ui$Control$NoValue = {$: 2};
var $author$project$Ui$Control$noValue = {a5: $author$project$Ui$Control$NoValue, U: $author$project$Ui$Control$Clear};
var $author$project$Ui$Control$NotInList = {$: 1};
var $author$project$Ui$Control$notInList = {a5: $author$project$Ui$Control$NotInList, U: $author$project$Ui$Control$Clear};
var $author$project$Model$refusal = F2(
	function (a, m) {
		return A2(
			$elm$core$Dict$get,
			$author$project$Addr$key(a),
			m.z);
	});
var $author$project$Ui$Control$Refused = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$Control$refusedChoice = F2(
	function (why, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{
				U: $author$project$Ui$Control$Refused(why)
			});
	});
var $author$project$Model$shown = F2(
	function (a, m) {
		return A2(
			$elm$core$Dict$get,
			$author$project$Addr$key(a),
			m.K);
	});
var $author$project$View$EnginePage$chosen = F2(
	function (m, p) {
		var c = function () {
			var _v1 = A2($author$project$Model$shown, p.w, m);
			if (!_v1.$) {
				var v = _v1.a;
				var _v2 = A2(
					$elm$core$Maybe$andThen,
					function (i) {
						return $elm$core$List$head(
							A2(
								$elm$core$List$filter,
								function (_v3) {
									var k = _v3.a;
									return _Utils_eq(k, i);
								},
								p.bi));
					},
					$author$project$Protocol$optIndex(
						$elm$core$Basics$round(v.cW)));
				if (!_v2.$) {
					var _v4 = _v2.a;
					var i = _v4.a;
					return $author$project$Ui$Control$chosen(i);
				} else {
					return $author$project$Ui$Control$notInList;
				}
			} else {
				return $author$project$Ui$Control$noValue;
			}
		}();
		var _v0 = A2($author$project$Model$refusal, p.w, m);
		if (!_v0.$) {
			var why = _v0.a;
			return A2($author$project$Ui$Control$refusedChoice, why, c);
		} else {
			return c;
		}
	});
var $author$project$Ui$Control$current = function (_v0) {
	var c = _v0;
	var _v1 = c.a5;
	switch (_v1.$) {
		case 0:
			var i = _v1.a;
			return $elm$core$Maybe$Just(i);
		case 1:
			return $elm$core$Maybe$Nothing;
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Ui$Control$normOf = F2(
	function (p, v) {
		return A3(
			$elm$core$Basics$clamp,
			0,
			1,
			function () {
				var _v0 = $author$project$Ui$Control$scaleOf(p);
				if (!_v0) {
					return _Utils_eq(p.cx, p.cC) ? 0 : ((v - p.cC) / (p.cx - p.cC));
				} else {
					return ((p.cC <= 0) || ((v <= 0) || _Utils_eq(p.cx, p.cC))) ? 0 : (A2($elm$core$Basics$logBase, 2, v / p.cC) / A2($elm$core$Basics$logBase, 2, p.cx / p.cC));
				}
			}());
	});
var $author$project$Model$pending = F2(
	function (a, m) {
		var _v0 = A2(
			$author$project$Flow$target,
			A2(
				$author$project$Flow$SetTo,
				a,
				$author$project$Protocol$Num(0)),
			m.u);
		if (!_v0.$) {
			if (!_v0.a.$) {
				var _v1 = _v0.a;
				var v = _v1.b;
				return $elm$core$Maybe$Just(v);
			} else {
				var _v2 = _v0.a;
				return $elm$core$Maybe$Nothing;
			}
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$View$EnginePage$wantOf = function (v) {
	switch (v.$) {
		case 0:
			var x = v.a;
			return $elm$core$Maybe$Just(
				$author$project$Ui$Control$Number(x));
		case 2:
			var i = v.a;
			return $elm$core$Maybe$Just(
				$author$project$Ui$Control$Option(i));
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Ui$Control$wanted = F2(
	function (a, _v0) {
		var d = _v0;
		return A2(
			$elm$core$Maybe$map,
			$elm$core$Tuple$second,
			A2(
				$elm$core$Dict$get,
				$author$project$Addr$key(a),
				d));
	});
var $author$project$Ui$Control$wheelNorm = function (p) {
	var travel = function () {
		var _v0 = $author$project$Ui$Control$scaleOf(p);
		if (!_v0) {
			return p.cx - p.cC;
		} else {
			return A2($elm$core$Basics$logBase, 2, p.cx / p.cC);
		}
	}();
	return (travel <= 0) ? (1 / 64) : A2($elm$core$Basics$max, 1 / 64, p.eY / travel);
};
var $author$project$View$EnginePage$paramTarget = F3(
	function (m, s, a) {
		return A2(
			$elm$core$Maybe$andThen,
			function (p) {
				var local = function () {
					var _v2 = A2($author$project$Ui$Control$wanted, p.w, s.Z);
					if (!_v2.$) {
						var w = _v2.a;
						return $elm$core$Maybe$Just(w);
					} else {
						return A2(
							$elm$core$Maybe$andThen,
							$author$project$View$EnginePage$wantOf,
							A2($author$project$Model$pending, p.w, m));
					}
				}();
				return $author$project$View$EnginePage$isChoice(p) ? A2(
					$elm$core$Maybe$map,
					function (i) {
						return $author$project$Ui$Control$Discrete(
							{
								c6: i,
								bi: A2($elm$core$List$map, $elm$core$Tuple$first, p.bi)
							});
					},
					function () {
						if (!local.$) {
							if (local.a.$ === 1) {
								var i = local.a.a;
								return $elm$core$Maybe$Just(i);
							} else {
								return $author$project$Ui$Control$current(
									A2($author$project$View$EnginePage$chosen, m, p));
							}
						} else {
							return $author$project$Ui$Control$current(
								A2($author$project$View$EnginePage$chosen, m, p));
						}
					}()) : A2(
					$elm$core$Maybe$map,
					function (v) {
						return $author$project$Ui$Control$Continuous(
							{
								cG: function () {
									if (!local.$) {
										if (!local.a.$) {
											var x = local.a.a;
											return A2($author$project$Ui$Control$normOf, p, x);
										} else {
											return v.cG;
										}
									} else {
										return v.cG;
									}
								}(),
								c$: $author$project$Ui$Control$wheelNorm(p)
							});
					},
					A2($author$project$Model$shown, p.w, m));
			},
			A2($author$project$View$EnginePage$paramOf, m, a));
	});
var $author$project$View$EnginePage$routeWheel = 1 / 64;
var $author$project$View$EnginePage$target = F3(
	function (m, s, a) {
		var _v0 = A3($author$project$View$EnginePage$partRoute, m, s, a);
		if (!_v0.$) {
			var _v1 = _v0.a;
			var n = _v1.b;
			return $elm$core$Maybe$Just(
				$author$project$Ui$Control$Continuous(
					{
						cG: $author$project$View$EnginePage$normOfBox(n),
						c$: $author$project$View$EnginePage$routeWheel
					}));
		} else {
			return A3($author$project$View$EnginePage$paramTarget, m, s, a);
		}
	});
var $author$project$Ui$Control$Dragging = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$Control$Nudge = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $author$project$Ui$Control$Restore = function (a) {
	return {$: 3, a: a};
};
var $author$project$Ui$Control$SetNorm = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Ui$Control$SetOption = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Ui$Control$at = F2(
	function (i, xs) {
		return $elm$core$List$head(
			A2($elm$core$List$drop, i, xs));
	});
var $author$project$Ui$Control$dragIndex = F3(
	function (_v0, startY, y) {
		var n = _v0.eC;
		var from = _v0.S;
		return A3(
			$elm$core$Basics$clamp,
			0,
			A2($elm$core$Basics$max, 0, n - 1),
			from + $elm$core$Basics$round(
				(startY - y) / A2($elm$core$Basics$max, 5, 180 / n)));
	});
var $author$project$Ui$Control$dragNorm = F3(
	function (_v0, startY, y) {
		var px = _v0.aV;
		var from = _v0.S;
		return A3($elm$core$Basics$clamp, 0, 1, from + ((startY - y) / px));
	});
var $author$project$Ui$Control$positionOf = F2(
	function (x, xs) {
		return A2(
			$elm$core$Maybe$map,
			$elm$core$Tuple$first,
			$elm$core$List$head(
				A2(
					$elm$core$List$filter,
					function (_v0) {
						var y = _v0.b;
						return _Utils_eq(y, x);
					},
					A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, xs))));
	});
var $author$project$Ui$Control$travelPx = function (t) {
	switch (t) {
		case 0:
			return 150;
		case 1:
			return 240;
		case 2:
			return 60;
		default:
			return 240;
	}
};
var $author$project$Ui$Control$update = F3(
	function (lookup, msg, held) {
		switch (msg.$) {
			case 0:
				var a = msg.a;
				var t = msg.b;
				var y = msg.c;
				var _v1 = lookup(a);
				if (!_v1.$) {
					var from = _v1.a;
					return _Utils_Tuple2(
						$author$project$Ui$Control$Dragging(
							{w: a, S: from, cU: y, dS: t}),
						_List_Nil);
				} else {
					return _Utils_Tuple2(held, _List_Nil);
				}
			case 1:
				var y = msg.a;
				if (held.$ === 1) {
					var d = held.a;
					return _Utils_Tuple2(
						held,
						function () {
							var _v3 = d.S;
							if (!_v3.$) {
								var c = _v3.a;
								return _List_fromArray(
									[
										A2(
										$author$project$Ui$Control$SetNorm,
										d.w,
										A3(
											$author$project$Ui$Control$dragNorm,
											{
												S: c.cG,
												aV: $author$project$Ui$Control$travelPx(d.dS)
											},
											d.cU,
											y))
									]);
							} else {
								var o = _v3.a;
								return A2(
									$elm$core$Maybe$withDefault,
									_List_Nil,
									A2(
										$elm$core$Maybe$map,
										function (i) {
											return _List_fromArray(
												[
													A2($author$project$Ui$Control$SetOption, d.w, i)
												]);
										},
										A2(
											$elm$core$Maybe$andThen,
											function (i) {
												return A2($author$project$Ui$Control$at, i, o.bi);
											},
											A2(
												$elm$core$Maybe$map,
												function (from) {
													return A3(
														$author$project$Ui$Control$dragIndex,
														{
															S: from,
															eC: $elm$core$List$length(o.bi)
														},
														d.cU,
														y);
												},
												A2($author$project$Ui$Control$positionOf, o.c6, o.bi)))));
							}
						}());
				} else {
					return _Utils_Tuple2(held, _List_Nil);
				}
			case 2:
				return _Utils_Tuple2($author$project$Ui$Control$Idle, _List_Nil);
			case 3:
				var a = msg.a;
				var dir = msg.b;
				var sign = function () {
					if (!dir) {
						return 1;
					} else {
						return -1;
					}
				}();
				return _Utils_Tuple2(
					held,
					function () {
						var _v4 = lookup(a);
						if (!_v4.$) {
							if (!_v4.a.$) {
								var c = _v4.a.a;
								return _List_fromArray(
									[
										A2(
										$author$project$Ui$Control$Nudge,
										a,
										{cf: sign, S: c.cG, c$: c.c$})
									]);
							} else {
								var o = _v4.a.a;
								return A2(
									$elm$core$Maybe$withDefault,
									_List_Nil,
									A2(
										$elm$core$Maybe$map,
										function (i) {
											return _List_fromArray(
												[
													A2($author$project$Ui$Control$SetOption, a, i)
												]);
										},
										A2(
											$elm$core$Maybe$andThen,
											function (p) {
												return A2(
													$author$project$Ui$Control$at,
													A3(
														$elm$core$Basics$clamp,
														0,
														$elm$core$List$length(o.bi) - 1,
														p + sign),
													o.bi);
											},
											A2($author$project$Ui$Control$positionOf, o.c6, o.bi))));
							}
						} else {
							return _List_Nil;
						}
					}());
			case 4:
				var a = msg.a;
				var i = msg.b;
				return _Utils_Tuple2(
					held,
					_List_fromArray(
						[
							A2($author$project$Ui$Control$SetOption, a, i)
						]));
			default:
				var a = msg.a;
				return _Utils_Tuple2(
					held,
					_List_fromArray(
						[
							$author$project$Ui$Control$Restore(a)
						]));
		}
	});
var $author$project$View$EnginePage$hand = F3(
	function (m, h, s) {
		var _v0 = A3(
			$author$project$Ui$Control$update,
			A2($author$project$View$EnginePage$target, m, s),
			h,
			s.aK);
		var drag = _v0.a;
		var intents = _v0.b;
		return A3(
			$elm$core$List$foldl,
			$author$project$View$EnginePage$intend(m),
			_Utils_update(
				s,
				{aK: drag}),
			intents);
	});
var $author$project$View$EnginePage$newCable = 0.75;
var $author$project$Ui$Routes$Routes = $elm$core$Basics$identity;
var $author$project$Ui$Routes$add = F2(
	function (c, _v0) {
		var r = _v0;
		return _Utils_update(
			r,
			{
				ad: _Utils_ap(
					A2(
						$elm$core$List$filter,
						function (x) {
							return (!_Utils_eq(x.S, c.S)) || (!_Utils_eq(x.e2, c.e2));
						},
						r.ad),
					_List_fromArray(
						[c]))
			});
	});
var $author$project$View$EnginePage$lookup = function (k) {
	return A2(
		$elm$core$Basics$composeR,
		$elm$core$List$filter(
			A2(
				$elm$core$Basics$composeR,
				$elm$core$Tuple$first,
				$elm$core$Basics$eq(k))),
		A2(
			$elm$core$Basics$composeR,
			$elm$core$List$head,
			$elm$core$Maybe$map($elm$core$Tuple$second)));
};
var $author$project$Ui$Routes$new = F2(
	function (ss, ds) {
		return {ad: _List_Nil, cm: ds, b5: ss};
	});
var $author$project$Ui$Routes$Dest = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Ui$Routes$dest = function (_v0) {
	var i = _v0.a;
	var name = _v0.b;
	return A2($author$project$Ui$Routes$Dest, i, name);
};
var $author$project$Schema$matrix = function (_v0) {
	var s = _v0;
	return s.bR;
};
var $author$project$Ui$Routes$Source = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Ui$Routes$source = function (_v0) {
	var i = _v0.a;
	var name = _v0.b;
	return A2($author$project$Ui$Routes$Source, i, name);
};
var $author$project$View$EnginePage$partJacks = function (m) {
	var routed = A2(
		$elm$core$List$filterMap,
		function (_v4) {
			var k = _v4.a;
			var r = _v4.b;
			return A2(
				$elm$core$Maybe$map,
				function (i) {
					return _Utils_Tuple3(
						A2($elm$core$String$left, i, k),
						A2($elm$core$String$dropLeft, i + 1, k),
						r.cd);
				},
				$elm$core$List$head(
					A2($elm$core$String$indexes, ':', k)));
		},
		$elm$core$Dict$toList(m.W));
	var mtx = $author$project$Schema$matrix(m.bR);
	var indexed = function (make) {
		return A2(
			$elm$core$Basics$composeR,
			$elm$core$List$indexedMap(
				F2(
					function (i, _v3) {
						var k = _v3.a;
						var name = _v3.b;
						return A2(
							$elm$core$Maybe$map,
							function (ix) {
								return _Utils_Tuple2(
									k,
									make(
										_Utils_Tuple2(ix, name)));
							},
							$author$project$Protocol$optIndex(i));
					})),
			$elm$core$List$filterMap($elm$core$Basics$identity));
	};
	var fixed = A2(
		$elm$core$List$map,
		function (_v2) {
			var tag = _v2.a;
			var a = _v2.b;
			return _Utils_Tuple2(
				$author$project$Addr$key(a),
				tag);
		},
		mtx.bJ);
	var named = A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, acc) {
				var d = _v0.b;
				return A2(
					$elm$core$List$any,
					function (_v1) {
						var k = _v1.a;
						return _Utils_eq(k, d);
					},
					acc) ? acc : _Utils_ap(
					acc,
					_List_fromArray(
						[
							_Utils_Tuple2(d, d)
						]));
			}),
		fixed,
		routed);
	return {
		cm: A2(indexed, $author$project$Ui$Routes$dest, named),
		cN: routed,
		b5: A2(indexed, $author$project$Ui$Routes$source, mtx.b5)
	};
};
var $author$project$View$EnginePage$partBay = function (m) {
	var jacks = $author$project$View$EnginePage$partJacks(m);
	var cable = function (_v0) {
		var s = _v0.a;
		var d = _v0.b;
		var a = _v0.c;
		return A4(
			$elm$core$Maybe$map3,
			F3(
				function (from, to, key) {
					return {
						w: key,
						cd: $author$project$Ui$Routes$amount(
							$elm$core$Basics$round((a * 100) / 127)),
						S: from,
						e2: to
					};
				}),
			A2($author$project$View$EnginePage$lookup, s, jacks.b5),
			A2($author$project$View$EnginePage$lookup, d, jacks.cm),
			$author$project$Addr$fromWire(s + (':' + d)));
	};
	return A3(
		$elm$core$List$foldl,
		$author$project$Ui$Routes$add,
		A2(
			$author$project$Ui$Routes$new,
			A2($elm$core$List$map, $elm$core$Tuple$second, jacks.b5),
			A2($elm$core$List$map, $elm$core$Tuple$second, jacks.cm)),
		A2($elm$core$List$filterMap, cable, jacks.cN));
};
var $author$project$View$EnginePage$wordOf = function (jack) {
	return A2(
		$elm$core$Basics$composeR,
		$elm$core$List$filter(
			A2(
				$elm$core$Basics$composeR,
				$elm$core$Tuple$second,
				$elm$core$Basics$eq(jack))),
		A2(
			$elm$core$Basics$composeR,
			$elm$core$List$head,
			$elm$core$Maybe$map($elm$core$Tuple$first)));
};
var $author$project$View$EnginePage$partCell = F3(
	function (m, from, to) {
		var jacks = $author$project$View$EnginePage$partJacks(m);
		return A2(
			$elm$core$Maybe$andThen,
			$author$project$Protocol$cell,
			A3(
				$elm$core$Maybe$map2,
				F2(
					function (s, d) {
						return s + (':' + d);
					}),
				A2($author$project$View$EnginePage$wordOf, from, jacks.b5),
				A2($author$project$View$EnginePage$wordOf, to, jacks.cm)));
	});
var $elm$core$Basics$abs = function (n) {
	return (n < 0) ? (-n) : n;
};
var $author$project$Addr$Pad = F2(
	function (a, b) {
		return {$: 12, a: a, b: b};
	});
var $author$project$Addr$PadRoute = function (a) {
	return {$: 5, a: a};
};
var $author$project$Layout$Shared$errOf = function (r) {
	if (!r.$) {
		return $elm$core$Maybe$Nothing;
	} else {
		var e = r.a;
		return $elm$core$Maybe$Just(e);
	}
};
var $author$project$Addr$envNumber = function (e) {
	switch (e) {
		case 0:
			return 1;
		case 1:
			return 2;
		default:
			return 3;
	}
};
var $author$project$Addr$lfoNumber = function (l) {
	switch (l) {
		case 0:
			return 1;
		case 1:
			return 2;
		default:
			return 3;
	}
};
var $author$project$Ui$Pad$number = function (p) {
	switch (p) {
		case 0:
			return 1;
		case 1:
			return 2;
		case 2:
			return 3;
		case 3:
			return 4;
		case 4:
			return 5;
		case 5:
			return 6;
		case 6:
			return 7;
		case 7:
			return 8;
		case 8:
			return 9;
		case 9:
			return 10;
		case 10:
			return 11;
		default:
			return 12;
	}
};
var $author$project$Addr$operatorLetter = function (o) {
	switch (o) {
		case 0:
			return 'A';
		case 1:
			return 'B';
		case 2:
			return 'C';
		case 3:
			return 'D';
		case 4:
			return 'E';
		default:
			return 'F';
	}
};
var $author$project$Addr$routeNumber = function (r) {
	switch (r) {
		case 0:
			return 1;
		case 1:
			return 2;
		case 2:
			return 3;
		default:
			return 4;
	}
};
var $author$project$Addr$padSuffix = function (part) {
	switch (part.$) {
		case 0:
			return '';
		case 1:
			return '_AMP';
		case 2:
			return '_ENV';
		case 3:
			return '_LFO';
		case 4:
			return '_FLT';
		default:
			var r = part.a;
			return '_RT' + $elm$core$String$fromInt(
				$author$project$Addr$routeNumber(r));
	}
};
var $author$project$Addr$blockName = function (b) {
	switch (b.$) {
		case 0:
			return 'PITCH';
		case 1:
			return 'FILTER';
		case 2:
			return 'VOICEFX';
		case 3:
			return 'OUT';
		case 4:
			var e = b.a;
			return 'ENV' + $elm$core$String$fromInt(
				$author$project$Addr$envNumber(e));
		case 5:
			var l = b.a;
			return 'LFO' + $elm$core$String$fromInt(
				$author$project$Addr$lfoNumber(l));
		case 6:
			return 'ALGO';
		case 7:
			var o = b.a;
			return 'OP_' + $author$project$Addr$operatorLetter(o);
		case 8:
			return 'VA';
		case 9:
			return 'MODAL';
		case 10:
			return 'TAPE_ENG';
		case 11:
			return 'KIT';
		default:
			var p = b.a;
			var part = b.b;
			return 'PAD' + ($elm$core$String$fromInt(
				$author$project$Ui$Pad$number(p)) + $author$project$Addr$padSuffix(part));
	}
};
var $author$project$Addr$at = F2(
	function (b, _v0) {
		var f = _v0;
		return $author$project$Addr$blockName(b) + ('.' + f);
	});
var $author$project$Addr$Field = $elm$core$Basics$identity;
var $author$project$Addr$unitChar = function (c) {
	return $elm$core$Char$isUpper(c) || ($elm$core$Char$isDigit(c) || ((c === '_') || (c === '.')));
};
var $author$project$Addr$field = function (w) {
	return ((w !== '') && ((!A2($elm$core$String$startsWith, '.', w)) && ((!A2($elm$core$String$endsWith, '.', w)) && A2($elm$core$String$all, $author$project$Addr$unitChar, w)))) ? $elm$core$Maybe$Just(w) : $elm$core$Maybe$Nothing;
};
var $author$project$Addr$named = F2(
	function (b, w) {
		return A2(
			$elm$core$Result$fromMaybe,
			$author$project$Addr$blockName(b) + ('.' + w),
			A2(
				$elm$core$Maybe$map,
				$author$project$Addr$at(b),
				$author$project$Addr$field(w)));
	});
var $author$project$Addr$Rt1 = 0;
var $author$project$Addr$Rt2 = 1;
var $author$project$Addr$Rt3 = 2;
var $author$project$Addr$Rt4 = 3;
var $author$project$Addr$routeSlots = _List_fromArray(
	[0, 1, 2, 3]);
var $author$project$Layout$Shared$builtRoutes = function (p) {
	return A2(
		$elm$core$List$map,
		function (k) {
			var at = $author$project$Addr$named(
				A2(
					$author$project$Addr$Pad,
					p,
					$author$project$Addr$PadRoute(k)));
			var _v0 = _Utils_Tuple3(
				at('SOURCE'),
				at('DEST'),
				at('AMOUNT'));
			if (((!_v0.a.$) && (!_v0.b.$)) && (!_v0.c.$)) {
				var source = _v0.a.a;
				var dest = _v0.b.a;
				var amount = _v0.c.a;
				return $elm$core$Result$Ok(
					{cd: amount, cl: dest, cR: source});
			} else {
				var s = _v0.a;
				var d = _v0.b;
				var a = _v0.c;
				return $elm$core$Result$Err(
					A2(
						$elm$core$List$filterMap,
						$author$project$Layout$Shared$errOf,
						_List_fromArray(
							[s, d, a])));
			}
		},
		$author$project$Addr$routeSlots);
};
var $author$project$Layout$Shared$padRoutes = function (p) {
	return A2(
		$elm$core$List$filterMap,
		$elm$core$Result$toMaybe,
		$author$project$Layout$Shared$builtRoutes(p));
};
var $author$project$View$EnginePage$routesNow = F2(
	function (m, p) {
		return A2(
			$elm$core$List$map,
			function (r) {
				var option = function (a) {
					return A2(
						$elm$core$Maybe$andThen,
						function (q) {
							return A2(
								$elm$core$Maybe$andThen,
								function (i) {
									return $elm$core$List$head(
										A2(
											$elm$core$List$filter,
											function (_v0) {
												var k = _v0.a;
												return _Utils_eq(k, i);
											},
											q.bi));
								},
								$author$project$Ui$Control$current(
									A2($author$project$View$EnginePage$chosen, m, q)));
						},
						A2($author$project$View$EnginePage$paramOf, m, a));
				};
				var amount = A2($author$project$View$EnginePage$paramOf, m, r.cd);
				return {
					cd: amount,
					S: A2(
						$elm$core$Maybe$map,
						$author$project$Ui$Routes$source,
						option(r.cR)),
					aT: A2(
						$elm$core$Maybe$withDefault,
						false,
						A3(
							$elm$core$Maybe$map2,
							F2(
								function (v, ap) {
									return _Utils_cmp(
										$elm$core$Basics$abs(v.cW),
										ap.eY / 2) > -1;
								}),
							A2($author$project$Model$shown, r.cd, m),
							amount)),
					an: r,
					e2: A2(
						$elm$core$Maybe$map,
						$author$project$Ui$Routes$dest,
						option(r.cl))
				};
			},
			$author$project$Layout$Shared$padRoutes(p));
	});
var $author$project$Ui$Routes$sourceOption = function (_v0) {
	var i = _v0.a;
	return i;
};
var $author$project$View$EnginePage$bayEffect = F4(
	function (m, id, effect, s) {
		var _v0 = _Utils_Tuple2(id, effect);
		switch (_v0.b.$) {
			case 2:
				var h = _v0.b.a;
				return _Utils_Tuple2(
					A3($author$project$View$EnginePage$hand, m, h, s),
					_List_Nil);
			case 0:
				if (!_v0.a.$) {
					var _v1 = _v0.a;
					var _v2 = _v0.b;
					var from = _v2.a;
					var to = _v2.b;
					return A2(
						$elm$core$List$any,
						function (c) {
							return _Utils_eq(c.S, from) && _Utils_eq(c.e2, to);
						},
						$author$project$Ui$Routes$cables(
							$author$project$View$EnginePage$partBay(m))) ? _Utils_Tuple2(s, _List_Nil) : _Utils_Tuple2(
						s,
						A2(
							$elm$core$Maybe$withDefault,
							_List_Nil,
							A3(
								$elm$core$Maybe$map2,
								F2(
									function (c, a) {
										return _List_fromArray(
											[
												A2(
												$author$project$Model$EditRoute,
												c,
												$author$project$Protocol$RouteAmount(a))
											]);
									}),
								A3($author$project$View$EnginePage$partCell, m, from, to),
								$author$project$Protocol$amount(
									$elm$core$Basics$round(
										($author$project$Ui$Routes$amountValue(
											$author$project$Ui$Routes$amountFromNorm($author$project$View$EnginePage$newCable)) * 127) / 100)))));
				} else {
					var p = _v0.a.a;
					var _v5 = _v0.b;
					var from = _v5.a;
					var to = _v5.b;
					var routes = A2($author$project$View$EnginePage$routesNow, m, p);
					return _Utils_Tuple2(
						function () {
							if (A2(
								$elm$core$List$any,
								function (r) {
									return r.aT && (_Utils_eq(
										r.S,
										$elm$core$Maybe$Just(from)) && _Utils_eq(
										r.e2,
										$elm$core$Maybe$Just(to)));
								},
								routes)) {
								return s;
							} else {
								var _v6 = $elm$core$List$head(
									A2(
										$elm$core$List$filter,
										A2(
											$elm$core$Basics$composeR,
											function ($) {
												return $.aT;
											},
											$elm$core$Basics$not),
										routes));
								if (!_v6.$) {
									var r = _v6.a;
									return function (st) {
										return A2(
											$elm$core$Maybe$withDefault,
											st,
											A2(
												$elm$core$Maybe$map,
												function (ap) {
													return A3(
														$author$project$View$EnginePage$want,
														ap.w,
														$author$project$Ui$Control$Number(
															A2($author$project$Ui$Control$atNorm, ap, $author$project$View$EnginePage$newCable)),
														st);
												},
												A2($author$project$View$EnginePage$paramOf, m, r.an.cd)));
									}(
										A3(
											$author$project$View$EnginePage$want,
											r.an.cl,
											$author$project$Ui$Control$Option(
												$author$project$Ui$Routes$destOption(to)),
											A3(
												$author$project$View$EnginePage$want,
												r.an.cR,
												$author$project$Ui$Control$Option(
													$author$project$Ui$Routes$sourceOption(from)),
												s)));
								} else {
									return s;
								}
							}
						}(),
						_List_Nil);
				}
			default:
				if (!_v0.a.$) {
					var _v3 = _v0.a;
					var _v4 = _v0.b;
					var from = _v4.a;
					var to = _v4.b;
					return _Utils_Tuple2(
						s,
						A2(
							$elm$core$Maybe$withDefault,
							_List_Nil,
							A2(
								$elm$core$Maybe$map,
								function (c) {
									return _List_fromArray(
										[
											A2($author$project$Model$EditRoute, c, $author$project$Protocol$RouteOff)
										]);
								},
								A3($author$project$View$EnginePage$partCell, m, from, to))));
				} else {
					var p = _v0.a.a;
					var _v7 = _v0.b;
					var from = _v7.a;
					var to = _v7.b;
					return _Utils_Tuple2(
						A3(
							$elm$core$List$foldl,
							function (r) {
								return A2(
									$author$project$View$EnginePage$want,
									r.an.cd,
									$author$project$Ui$Control$Number(0));
							},
							s,
							A2(
								$elm$core$List$filter,
								function (r) {
									return r.aT && (_Utils_eq(
										r.S,
										$elm$core$Maybe$Just(from)) && _Utils_eq(
										r.e2,
										$elm$core$Maybe$Just(to)));
								},
								A2($author$project$View$EnginePage$routesNow, m, p))),
						_List_Nil);
				}
		}
	});
var $author$project$View$EnginePage$bayKey = function (id) {
	if (!id.$) {
		return 'MOD';
	} else {
		var p = id.a;
		return 'PAD' + $elm$core$String$fromInt(
			$author$project$Ui$Pad$number(p));
	}
};
var $author$project$Ui$PatchBay$Bay = $elm$core$Basics$identity;
var $author$project$Ui$PatchBay$PatchView = 0;
var $author$project$Ui$PatchBay$init = {aC: $elm$core$Maybe$Nothing, e6: 0};
var $author$project$View$EnginePage$bayOf = F2(
	function (id, s) {
		return A2(
			$elm$core$Maybe$withDefault,
			$author$project$Ui$PatchBay$init,
			A2(
				$elm$core$Maybe$map,
				$elm$core$Tuple$second,
				A2(
					$elm$core$Dict$get,
					$author$project$View$EnginePage$bayKey(id),
					s.aI)));
	});
var $author$project$Ui$Control$flush = function (_v0) {
	var d = _v0;
	return _Utils_Tuple2(
		$elm$core$Dict$values(d),
		$author$project$Ui$Control$empty);
};
var $author$project$Ui$Control$Pick = F2(
	function (a, b) {
		return {$: 4, a: a, b: b};
	});
var $author$project$Ui$Menu$Showing = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$Menu$update = function (msg) {
	switch (msg.$) {
		case 0:
			var a = msg.a;
			return _Utils_Tuple2(
				$author$project$Ui$Menu$Showing(a),
				$elm$core$Maybe$Nothing);
		case 1:
			return _Utils_Tuple2($author$project$Ui$Menu$Shut, $elm$core$Maybe$Nothing);
		default:
			var a = msg.a;
			var i = msg.b;
			return _Utils_Tuple2(
				$author$project$Ui$Menu$Shut,
				$elm$core$Maybe$Just(
					A2($author$project$Ui$Control$Pick, a, i)));
	}
};
var $author$project$Ui$Page$NoEffect = {$: 0};
var $author$project$Ui$Page$StoreTheme = function (a) {
	return {$: 1, a: a};
};
var $elm$core$Set$insert = F2(
	function (key, _v0) {
		var dict = _v0;
		return A3($elm$core$Dict$insert, key, 0, dict);
	});
var $author$project$Ui$Chip$label = function (c) {
	switch (c) {
		case 0:
			return 'ALGORITHM';
		case 1:
			return 'PITCH';
		case 2:
			return 'OPERATORS';
		case 3:
			return 'OSCILLATORS';
		case 4:
			return 'RESONATOR';
		case 5:
			return 'TAPE';
		case 6:
			return 'FILTER';
		case 7:
			return 'FX';
		case 8:
			return 'AMP';
		case 9:
			return 'ENVELOPES';
		case 10:
			return 'LFOS';
		case 11:
			return 'MOD';
		case 12:
			return 'KIT';
		case 13:
			return 'OUT';
		case 14:
			return 'PAD';
		case 15:
			return 'OTHER';
		case 16:
			return 'UNIT';
		case 17:
			return 'CONTROLS';
		case 18:
			return 'CHOICES';
		case 19:
			return 'SCREENS';
		default:
			return 'FOLDING';
	}
};
var $elm$core$Set$member = F2(
	function (key, _v0) {
		var dict = _v0;
		return A2($elm$core$Dict$member, key, dict);
	});
var $elm$core$Set$remove = F2(
	function (key, _v0) {
		var dict = _v0;
		return A2($elm$core$Dict$remove, key, dict);
	});
var $author$project$Ui$Chip$toggle = F2(
	function (c, _v0) {
		var s = _v0;
		return A2(
			$elm$core$Set$member,
			$author$project$Ui$Chip$label(c),
			s) ? A2(
			$elm$core$Set$remove,
			$author$project$Ui$Chip$label(c),
			s) : A2(
			$elm$core$Set$insert,
			$author$project$Ui$Chip$label(c),
			s);
	});
var $elm$core$Dict$diff = F2(
	function (t1, t2) {
		return A3(
			$elm$core$Dict$foldl,
			F3(
				function (k, v, t) {
					return A2($elm$core$Dict$remove, k, t);
				}),
			t1,
			t2);
	});
var $elm$core$Set$diff = F2(
	function (_v0, _v1) {
		var dict1 = _v0;
		var dict2 = _v1;
		return A2($elm$core$Dict$diff, dict1, dict2);
	});
var $elm$core$Set$fromList = function (list) {
	return A3($elm$core$List$foldl, $elm$core$Set$insert, $elm$core$Set$empty, list);
};
var $author$project$Ui$Module$idKey = function (_v0) {
	var c = _v0.a;
	var t = _v0.b;
	return $author$project$Ui$Chip$label(c) + ('/' + t);
};
var $elm$core$Set$union = F2(
	function (_v0, _v1) {
		var dict1 = _v0;
		var dict2 = _v1;
		return A2($elm$core$Dict$union, dict1, dict2);
	});
var $author$project$Ui$Module$update = F2(
	function (_v0, _v1) {
		var ids = _v0.a;
		var fold = _v0.b;
		var s = _v1;
		var keys = $elm$core$Set$fromList(
			A2($elm$core$List$map, $author$project$Ui$Module$idKey, ids));
		if (fold === 1) {
			return A2($elm$core$Set$union, keys, s);
		} else {
			return A2($elm$core$Set$diff, s, keys);
		}
	});
var $author$project$Ui$Page$update = F2(
	function (msg, _v0) {
		var s = _v0;
		switch (msg.$) {
			case 0:
				var t = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						s,
						{a_: t}),
					$author$project$Ui$Page$StoreTheme(t));
			case 1:
				var chip = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						s,
						{
							aN: A2($author$project$Ui$Chip$toggle, chip, s.aN)
						}),
					$author$project$Ui$Page$NoEffect);
			default:
				var m = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						s,
						{
							bM: A2($author$project$Ui$Module$update, m, s.bM)
						}),
					$author$project$Ui$Page$NoEffect);
		}
	});
var $author$project$Ui$PatchBay$Handed = function (a) {
	return {$: 2, a: a};
};
var $author$project$Ui$PatchBay$Patched = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Ui$PatchBay$Unpatched = F2(
	function (a, b) {
		return {$: 1, a: a, b: b};
	});
var $author$project$Ui$PatchBay$update = F2(
	function (msg, _v0) {
		var b = _v0;
		switch (msg.$) {
			case 0:
				var v = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						b,
						{e6: v}),
					_List_Nil);
			case 1:
				var s = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						b,
						{
							aC: $elm$core$Maybe$Just(s)
						}),
					_List_Nil);
			case 2:
				var d = msg.a;
				return _Utils_Tuple2(
					_Utils_update(
						b,
						{aC: $elm$core$Maybe$Nothing}),
					function () {
						var _v2 = b.aC;
						if (!_v2.$) {
							var s = _v2.a;
							return _List_fromArray(
								[
									A2($author$project$Ui$PatchBay$Patched, s, d)
								]);
						} else {
							return _List_Nil;
						}
					}());
			case 3:
				return _Utils_Tuple2(
					_Utils_update(
						b,
						{aC: $elm$core$Maybe$Nothing}),
					_List_Nil);
			case 4:
				var s = msg.a;
				var d = msg.b;
				return _Utils_Tuple2(
					b,
					_List_fromArray(
						[
							A2($author$project$Ui$PatchBay$Patched, s, d)
						]));
			case 5:
				var s = msg.a;
				var d = msg.b;
				return _Utils_Tuple2(
					b,
					_List_fromArray(
						[
							A2($author$project$Ui$PatchBay$Unpatched, s, d)
						]));
			default:
				var m = msg.a;
				return _Utils_Tuple2(
					b,
					_List_fromArray(
						[
							$author$project$Ui$PatchBay$Handed(m)
						]));
		}
	});
var $author$project$View$EnginePage$update = F3(
	function (msg, m, s0) {
		var s = A2($author$project$View$EnginePage$follow, m, s0);
		switch (msg.$) {
			case 0:
				var h = msg.a;
				return _Utils_Tuple3(
					A3($author$project$View$EnginePage$hand, m, h, s),
					_List_Nil,
					$elm$core$Maybe$Nothing);
			case 1:
				var mm = msg.a;
				var _v1 = $author$project$Ui$Menu$update(mm);
				var menu = _v1.a;
				var picked = _v1.b;
				var shut = _Utils_update(
					s,
					{bf: menu});
				return _Utils_Tuple3(
					A2(
						$elm$core$Maybe$withDefault,
						shut,
						A2(
							$elm$core$Maybe$map,
							function (h) {
								return A3($author$project$View$EnginePage$hand, m, h, shut);
							},
							picked)),
					_List_Nil,
					$elm$core$Maybe$Nothing);
			case 2:
				var pm = msg.a;
				var _v2 = A2($author$project$Ui$Page$update, pm, s.bk);
				var page = _v2.a;
				var effect = _v2.b;
				return _Utils_Tuple3(
					_Utils_update(
						s,
						{bk: page}),
					_List_Nil,
					function () {
						if (effect.$ === 1) {
							var t = effect.a;
							return $elm$core$Maybe$Just(t);
						} else {
							return $elm$core$Maybe$Nothing;
						}
					}());
			case 3:
				var id = msg.a;
				var bm = msg.b;
				var _v4 = A2(
					$author$project$Ui$PatchBay$update,
					bm,
					A2($author$project$View$EnginePage$bayOf, id, s));
				var bay = _v4.a;
				var effects = _v4.b;
				return function (_v6) {
					var st = _v6.a;
					var asks = _v6.b;
					return _Utils_Tuple3(st, asks, $elm$core$Maybe$Nothing);
				}(
					A3(
						$elm$core$List$foldl,
						F2(
							function (e, _v5) {
								var st = _v5.a;
								var asks = _v5.b;
								return A2(
									$elm$core$Tuple$mapSecond,
									$elm$core$Basics$append(asks),
									A4($author$project$View$EnginePage$bayEffect, m, id, e, st));
							}),
						_Utils_Tuple2(
							_Utils_update(
								s,
								{
									aI: A3(
										$elm$core$Dict$insert,
										$author$project$View$EnginePage$bayKey(id),
										_Utils_Tuple2(id, bay),
										s.aI)
								}),
							_List_Nil),
						effects));
			case 4:
				var t = msg.a;
				return _Utils_Tuple3(
					_Utils_update(
						s,
						{bv: t}),
					_List_Nil,
					$elm$core$Maybe$Nothing);
			case 5:
				var _v7 = $author$project$Ui$Control$flush(s.Z);
				var wants = _v7.a;
				var rest = _v7.b;
				return _Utils_Tuple3(
					_Utils_update(
						s,
						{ao: $elm$core$Dict$empty, Z: rest}),
					_Utils_ap(
						A2(
							$elm$core$List$map,
							function (_v8) {
								var a = _v8.a;
								var w = _v8.b;
								if (!w.$) {
									var v = w.a;
									return A2(
										$author$project$Model$Edit,
										a,
										$author$project$Protocol$Num(v));
								} else {
									var i = w.a;
									return A2($author$project$Model$Pick, a, i);
								}
							},
							wants),
						A2(
							$elm$core$List$filterMap,
							function (_v10) {
								var c = _v10.a;
								var n = _v10.b;
								return A2(
									$elm$core$Maybe$map,
									A2(
										$elm$core$Basics$composeL,
										$author$project$Model$EditRoute(c),
										$author$project$Protocol$RouteAmount),
									$author$project$Protocol$amount(n));
							},
							$elm$core$Dict$values(s.ao))),
					$elm$core$Maybe$Nothing);
			default:
				var um = msg.a;
				return _Utils_Tuple3(
					s,
					_List_fromArray(
						[um]),
					$elm$core$Maybe$Nothing);
		}
	});
var $author$project$Main$update = F2(
	function (msg, app) {
		if (!msg.$) {
			var m = msg.a;
			var _v1 = A2($author$project$Model$update, m, app.ap);
			var unit = _v1.a;
			var cmd = _v1.b;
			return _Utils_Tuple2(
				_Utils_update(
					app,
					{
						bk: A2($author$project$View$EnginePage$follow, unit, app.bk),
						ap: unit
					}),
				A2($elm$core$Platform$Cmd$map, $author$project$Main$Unit, cmd));
		} else {
			var m = msg.a;
			var _v2 = A3($author$project$View$EnginePage$update, m, app.ap, app.bk);
			var page = _v2.a;
			var asks = _v2.b;
			var store = _v2.c;
			var _v3 = A3(
				$elm$core$List$foldl,
				F2(
					function (e, _v4) {
						var u = _v4.a;
						var cs = _v4.b;
						return A2(
							$elm$core$Tuple$mapSecond,
							function (c) {
								return A2(
									$elm$core$List$cons,
									A2($elm$core$Platform$Cmd$map, $author$project$Main$Unit, c),
									cs);
							},
							A2($author$project$Model$update, e, u));
					}),
				_Utils_Tuple2(app.ap, _List_Nil),
				asks);
			var unit = _v3.a;
			var cmds = _v3.b;
			return _Utils_Tuple2(
				_Utils_update(
					app,
					{
						bk: A2($author$project$View$EnginePage$follow, unit, page),
						ap: unit
					}),
				$elm$core$Platform$Cmd$batch(
					A2(
						$elm$core$List$cons,
						A2(
							$elm$core$Maybe$withDefault,
							$elm$core$Platform$Cmd$none,
							A2(
								$elm$core$Maybe$map,
								A2($elm$core$Basics$composeR, $author$project$Ui$Tokens$name, $author$project$Main$storeTheme),
								store)),
						cmds)));
		}
	});
var $elm$virtual_dom$VirtualDom$map = _VirtualDom_map;
var $elm$html$Html$map = $elm$virtual_dom$VirtualDom$map;
var $author$project$Model$Connect = function (a) {
	return {$: 6, a: a};
};
var $author$project$View$EnginePage$PageMsg = function (a) {
	return {$: 2, a: a};
};
var $author$project$Ui$Chip$Unit = 16;
var $author$project$View$EnginePage$Unit = function (a) {
	return {$: 6, a: a};
};
var $author$project$Model$ViaSimulator = 1;
var $author$project$Model$ViaUnit = 0;
var $author$project$Ui$Module$Config = $elm$core$Basics$identity;
var $author$project$Ui$Module$body = F2(
	function (b, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{ce: b});
	});
var $elm$html$Html$button = _VirtualDom_node('button');
var $elm$html$Html$Attributes$stringProperty = F2(
	function (key, string) {
		return A2(
			_VirtualDom_property,
			key,
			$elm$json$Json$Encode$string(string));
	});
var $elm$html$Html$Attributes$class = $elm$html$Html$Attributes$stringProperty('className');
var $elm$html$Html$div = _VirtualDom_node('div');
var $author$project$Ui$Page$Config = $elm$core$Basics$identity;
var $author$project$Ui$Page$meta = F2(
	function (s, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{cz: s});
	});
var $author$project$Ui$Page$modules = F2(
	function (ms, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{bS: ms});
	});
var $author$project$Ui$Module$Half = 0;
var $author$project$Ui$Module$new = F2(
	function (c, title) {
		return {ce: _List_Nil, ch: c, cu: _List_Nil, cy: _List_Nil, cH: '', cS: 0, cY: _List_Nil, b7: title};
	});
var $author$project$Ui$Page$Offline = {$: 0};
var $author$project$Ui$Page$new = function (title) {
	return {aP: $author$project$Ui$Page$Offline, cz: '', bS: _List_Nil, cJ: _List_Nil, cX: _List_Nil, b7: title, b9: _List_Nil};
};
var $author$project$Ui$Module$note = F2(
	function (s, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{cH: s});
	});
var $author$project$Transport$linkText = function (l) {
	switch (l) {
		case 0:
			return $elm$core$Maybe$Nothing;
		case 1:
			return $elm$core$Maybe$Just('THE PORT IS IN USE (CLOSE chimera-usb.py)');
		case 2:
			return $elm$core$Maybe$Just('THE SIMULATOR IS NOT RUNNING (just editor-sim)');
		case 3:
			return $elm$core$Maybe$Just('THE UNIT WAS DISCONNECTED');
		default:
			return $elm$core$Maybe$Just('USE CHROME OR EDGE');
	}
};
var $author$project$Model$stageNotice = function (m) {
	var _v0 = m.b;
	switch (_v0.$) {
		case 5:
			switch (_v0.a.$) {
				case 0:
					var _v1 = _v0.a;
					return $elm$core$Maybe$Just('UPDATE THE EDITOR');
				case 1:
					var _v2 = _v0.a;
					return $elm$core$Maybe$Just('UPDATE THE UNIT');
				case 2:
					var n = _v0.a.a;
					return $elm$core$Maybe$Just(
						((_Utils_cmp(n, $author$project$Protocol$supported) > 0) ? 'UPDATE THE EDITOR' : 'UPDATE THE UNIT') + (': THE UNIT SPEAKS PROTOCOL ' + ($elm$core$String$fromInt(n) + (', THIS EDITOR ' + $elm$core$String$fromInt($author$project$Protocol$supported)))));
				case 3:
					var t = _v0.a.a;
					return $elm$core$Maybe$Just('THE UNIT REFUSED: ' + t);
				case 4:
					var _v3 = _v0.a;
					return $elm$core$Maybe$Just('THE UNIT STOPPED ANSWERING');
				case 5:
					var _v4 = _v0.a;
					return $elm$core$Maybe$Just('THE UNIT\'S ANSWER IS TOO LARGE FOR ONE READ');
				case 6:
					if (!_v0.a.b.$) {
						var _v5 = _v0.a;
						var s = _v5.a;
						var l = _v5.b.a;
						return $elm$core$Maybe$Just(
							'THE UNIT\'S ' + ($author$project$Protocol$schemaToken(s) + (' SCHEMA HAS A LINE THIS EDITOR CAN\'T READ: ' + l)));
					} else {
						var _v6 = _v0.a;
						var s = _v6.a;
						var _v7 = _v6.b;
						var said = _v7.a;
						var read_ = _v7.b;
						return $elm$core$Maybe$Just(
							'THE UNIT\'S ' + ($author$project$Protocol$schemaToken(s) + (' SCHEMA IS NOT THE TEXT ITS HASH NAMES: ' + ($author$project$Hash$toHex(said) + (', READ ' + $author$project$Hash$toHex(read_))))));
					}
				default:
					if (!_v0.a.a.$) {
						var n = _v0.a.a.a;
						return $elm$core$Maybe$Just('THE UNIT NAMED PART ' + (n + ': THIS EDITOR KNOWS PARTS 1 TO 6'));
					} else {
						var e = _v0.a.a.a;
						return $elm$core$Maybe$Just('THE UNIT NAMED AN ENGINE THIS EDITOR DOESN\'T KNOW: ' + (e + '. UPDATE THE EDITOR'));
					}
			}
		case 0:
			return $elm$core$Maybe$Nothing;
		case 1:
			return $elm$core$Maybe$Nothing;
		case 2:
			return $elm$core$Maybe$Nothing;
		case 3:
			return $elm$core$Maybe$Nothing;
		default:
			return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Model$notice = function (m) {
	var _v0 = m.aP;
	if (!_v0.$) {
		var l = _v0.a;
		return (!(!l)) ? $author$project$Transport$linkText(l) : $author$project$Model$stageNotice(m);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$virtual_dom$VirtualDom$Normal = function (a) {
	return {$: 0, a: a};
};
var $elm$virtual_dom$VirtualDom$on = _VirtualDom_on;
var $elm$html$Html$Events$on = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$Normal(decoder));
	});
var $elm$html$Html$Events$onClick = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'click',
		$elm$json$Json$Decode$succeed(msg));
};
var $author$project$Model$SeenNotices = {$: 17};
var $author$project$Ui$Module$Whole = 1;
var $author$project$Ui$Module$full = function (_v0) {
	var c = _v0;
	return _Utils_update(
		c,
		{cS: 1});
};
var $author$project$Protocol$sketch = function (c) {
	var value = function (v) {
		switch (v.$) {
			case 0:
				var n = v.a;
				return $elm$core$String$fromFloat(n);
			case 1:
				var n = v.a;
				return n;
			default:
				var i = v.a;
				return '#' + $elm$core$String$fromInt(i);
		}
	};
	switch (c.$) {
		case 4:
			var a = c.a;
			var v = c.b;
			return 'ed set ' + ($author$project$Addr$key(a) + (' ' + value(v)));
		case 3:
			var a = c.a;
			return 'ed get ' + $author$project$Addr$key(a);
		case 12:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed map',
				$author$project$Protocol$encode(c));
		case 10:
			var n = c.a;
			return 'ed project saveas ' + n;
		case 0:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed hello',
				$author$project$Protocol$encode(c));
		case 1:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed schema',
				$author$project$Protocol$encode(c));
		case 2:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed describe',
				$author$project$Protocol$encode(c));
		case 5:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed since',
				$author$project$Protocol$encode(c));
		case 6:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed part',
				$author$project$Protocol$encode(c));
		case 7:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed route',
				$author$project$Protocol$encode(c));
		case 8:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed projects',
				$author$project$Protocol$encode(c));
		case 9:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed project save',
				$author$project$Protocol$encode(c));
		case 11:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed project load',
				$author$project$Protocol$encode(c));
		default:
			return A2(
				$elm$core$Maybe$withDefault,
				'ed orbit',
				$author$project$Protocol$encode(c));
	}
};
var $author$project$Model$noticeText = function (n) {
	switch (n.$) {
		case 0:
			var r = n.a;
			var _v1 = A2($elm$core$Maybe$andThen, $author$project$Protocol$encode, r.aX);
			if (!_v1.$) {
				var sent = _v1.a;
				return 'THE UNIT REFUSED ' + (sent + (': ' + r.aH));
			} else {
				return 'THE UNIT REFUSED: ' + r.aH;
			}
		case 1:
			var raw = n.a;
			return 'THE UNIT SAID A LINE THIS EDITOR CAN\'T READ: ' + raw;
		case 2:
			var c = n.a;
			return 'THE EDITOR COULD NOT WRITE ' + ($author$project$Protocol$sketch(c) + ' AS A LINE THE UNIT READS: NOT SENT');
		case 3:
			var l = n.a;
			return 'THE LINK DROPPED A LINE: ' + l;
		default:
			var c = n.a;
			return 'THE UNIT DID NOT ANSWER ' + ($author$project$Protocol$sketch(c) + ', SENT TWICE: GIVEN UP');
	}
};
var $author$project$Model$notices = function (m) {
	return m.H;
};
var $author$project$Model$noticesLost = function (m) {
	return m.af;
};
var $elm$virtual_dom$VirtualDom$text = _VirtualDom_text;
var $elm$html$Html$text = $elm$virtual_dom$VirtualDom$text;
var $author$project$View$EnginePage$saidModule = function (m) {
	if ($elm$core$List$isEmpty(
		$author$project$Model$notices(m))) {
		return _List_Nil;
	} else {
		var lost = ($author$project$Model$noticesLost(m) > 0) ? _List_fromArray(
			[
				A2(
				$elm$html$Html$div,
				_List_Nil,
				_List_fromArray(
					[
						$elm$html$Html$text(
						'AND ' + ($elm$core$String$fromInt(
							$author$project$Model$noticesLost(m)) + ' MORE NO LONGER KEPT'))
					]))
			]) : _List_Nil;
		var line = function (k) {
			return A2(
				$elm$html$Html$div,
				_List_Nil,
				_List_fromArray(
					[
						$elm$html$Html$text(
						$author$project$Model$noticeText(k.aS)),
						$elm$html$Html$text(
						(k.cZ > 1) ? (' ×' + $elm$core$String$fromInt(k.cZ)) : '')
					]));
		};
		return _List_fromArray(
			[
				A2(
				$author$project$Ui$Module$body,
				_List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('said')
							]),
						_Utils_ap(
							A2(
								$elm$core$List$map,
								line,
								$author$project$Model$notices(m)),
							_Utils_ap(
								lost,
								_List_fromArray(
									[
										A2(
										$elm$html$Html$div,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('connect')
											]),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$button,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('hbtn'),
														$elm$html$Html$Events$onClick(
														$author$project$View$EnginePage$Unit($author$project$Model$SeenNotices))
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('SEEN')
													]))
											]))
									]))))
					]),
				$author$project$Ui$Module$full(
					A2($author$project$Ui$Module$new, 16, 'THE UNIT SAID')))
			]);
	}
};
var $author$project$Ui$Page$ChoseTheme = function (a) {
	return {$: 0, a: a};
};
var $author$project$Ui$Module$Folded = 1;
var $author$project$Ui$Page$Folding = function (a) {
	return {$: 2, a: a};
};
var $author$project$Ui$Module$Open = 0;
var $author$project$Ui$Module$SetFold = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Ui$Page$ToggleChip = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$Page$ariaBool = function (on) {
	return on ? 'true' : 'false';
};
var $elm$virtual_dom$VirtualDom$attribute = F2(
	function (key, value) {
		return A2(
			_VirtualDom_attribute,
			_VirtualDom_noOnOrFormAction(key),
			_VirtualDom_noJavaScriptOrHtmlUri(value));
	});
var $elm$html$Html$Attributes$attribute = $elm$virtual_dom$VirtualDom$attribute;
var $author$project$Ui$Module$chipOf = function (_v0) {
	var c = _v0;
	return c.ch;
};
var $elm$html$Html$Attributes$classList = function (classes) {
	return $elm$html$Html$Attributes$class(
		A2(
			$elm$core$String$join,
			' ',
			A2(
				$elm$core$List$map,
				$elm$core$Tuple$first,
				A2($elm$core$List$filter, $elm$core$Tuple$second, classes))));
};
var $elm$html$Html$h1 = _VirtualDom_node('h1');
var $elm$html$Html$i = _VirtualDom_node('i');
var $author$project$Ui$Module$Id = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Ui$Module$idOf = function (_v0) {
	var c = _v0;
	return A2($author$project$Ui$Module$Id, c.ch, c.b7);
};
var $elm$core$String$toUpper = _String_toUpper;
var $author$project$Ui$Tokens$label = A2($elm$core$Basics$composeR, $author$project$Ui$Tokens$name, $elm$core$String$toUpper);
var $elm$html$Html$main_ = _VirtualDom_node('main');
var $author$project$Ui$Chip$member = F2(
	function (c, _v0) {
		var s = _v0;
		return A2(
			$elm$core$Set$member,
			$author$project$Ui$Chip$label(c),
			s);
	});
var $author$project$Ui$Row$Lone = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$Row$Pair = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Ui$Row$Whole = function (a) {
	return {$: 2, a: a};
};
var $author$project$Ui$Module$isFull = function (_v0) {
	var c = _v0;
	return c.cS === 1;
};
var $author$project$Ui$Row$pairUp = function (modules) {
	if (!modules.b) {
		return _List_Nil;
	} else {
		var a = modules.a;
		var rest = modules.b;
		if ($author$project$Ui$Module$isFull(a)) {
			return A2(
				$elm$core$List$cons,
				$author$project$Ui$Row$Whole(a),
				$author$project$Ui$Row$pairUp(rest));
		} else {
			if (rest.b) {
				var b = rest.a;
				var more = rest.b;
				return $author$project$Ui$Module$isFull(b) ? A2(
					$elm$core$List$cons,
					$author$project$Ui$Row$Lone(a),
					$author$project$Ui$Row$pairUp(rest)) : A2(
					$elm$core$List$cons,
					A2($author$project$Ui$Row$Pair, a, b),
					$author$project$Ui$Row$pairUp(more));
			} else {
				return _List_fromArray(
					[
						$author$project$Ui$Row$Lone(a)
					]);
			}
		}
	}
};
var $elm$html$Html$span = _VirtualDom_node('span');
var $author$project$Ui$Page$Here = 0;
var $elm$html$Html$b = _VirtualDom_node('b');
var $author$project$Ui$Page$tab = function (t) {
	return A2(
		$elm$html$Html$button,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$classList(
				_List_fromArray(
					[
						_Utils_Tuple2('tab', true),
						_Utils_Tuple2('on', !t.c6)
					])),
				$elm$html$Html$Events$onClick(t.dg)
			]),
		_List_fromArray(
			[
				A2(
				$elm$html$Html$b,
				_List_Nil,
				_List_fromArray(
					[
						$elm$html$Html$text(t.dl)
					])),
				A2(
				$elm$html$Html$span,
				_List_Nil,
				_List_fromArray(
					[
						$elm$html$Html$text(t.aR)
					]))
			]));
};
var $author$project$Ui$Tokens$themed = function (t) {
	return A2(
		$elm$html$Html$Attributes$attribute,
		'data-theme',
		$author$project$Ui$Tokens$name(t));
};
var $author$project$Ui$Tokens$themes = _List_fromArray(
	[0, 1]);
var $author$project$Ui$Module$foldOf = F2(
	function (i, _v0) {
		var s = _v0;
		return A2(
			$elm$core$Set$member,
			$author$project$Ui$Module$idKey(i),
			s) ? 1 : 0;
	});
var $author$project$Ui$Row$members = function (row) {
	switch (row.$) {
		case 0:
			var a = row.a;
			var b = row.b;
			return _List_fromArray(
				[a, b]);
		case 1:
			var a = row.a;
			return _List_fromArray(
				[a]);
		default:
			var a = row.a;
			return _List_fromArray(
				[a]);
	}
};
var $elm$html$Html$h2 = _VirtualDom_node('h2');
var $elm$html$Html$header = _VirtualDom_node('header');
var $author$project$Ui$Routes$destName = function (_v0) {
	var name = _v0.b;
	return name;
};
var $author$project$Ui$Routes$sourceName = function (_v0) {
	var name = _v0.b;
	return name;
};
var $author$project$Ui$Module$jacksOf = function (js) {
	var outs = A2(
		$elm$core$List$filterMap,
		function (j) {
			if (j.$ === 1) {
				var o = j.a;
				return $elm$core$Maybe$Just(
					$author$project$Ui$Routes$sourceName(o));
			} else {
				return $elm$core$Maybe$Nothing;
			}
		},
		js);
	var jack = F2(
		function (dir, l) {
			return A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('jk ' + dir)
					]),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$span,
						_List_Nil,
						_List_fromArray(
							[
								$elm$html$Html$text(l)
							])),
						A2(
						$elm$html$Html$span,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('hole')
							]),
						_List_Nil)
					]));
		});
	var ins = A2(
		$elm$core$List$filterMap,
		function (j) {
			if (!j.$) {
				var d = j.a;
				return $elm$core$Maybe$Just(
					$author$project$Ui$Routes$destName(d));
			} else {
				return $elm$core$Maybe$Nothing;
			}
		},
		js);
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('jacks')
			]),
		_Utils_ap(
			$elm$core$List$isEmpty(ins) ? _List_Nil : A2(
				$elm$core$List$cons,
				A2(
					$elm$html$Html$span,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('jt')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('IN')
						])),
				A2(
					$elm$core$List$map,
					jack('in'),
					ins)),
			A2(
				$elm$core$List$cons,
				A2(
					$elm$html$Html$span,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('sp')
						]),
					_List_Nil),
				A2(
					$elm$core$List$map,
					jack('out'),
					outs))));
};
var $author$project$Ui$Module$jackRow = function (js) {
	return $elm$core$List$isEmpty(js) ? $elm$html$Html$text('') : $author$project$Ui$Module$jacksOf(js);
};
var $elm$html$Html$section = _VirtualDom_node('section');
var $elm$html$Html$small = _VirtualDom_node('small');
var $author$project$Ui$Module$view = F2(
	function (_v0, _v1) {
		var fold = _v0.ek;
		var toggle = _v0.e3;
		var c = _v1;
		var folded = fold === 1;
		return A2(
			$elm$html$Html$section,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2('sec', true),
							_Utils_Tuple2('folded', folded)
						]))
				]),
			A2(
				$elm$core$List$cons,
				A2(
					$elm$html$Html$header,
					_List_Nil,
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('handle'),
									$elm$html$Html$Events$onClick(toggle),
									A2(
									$elm$html$Html$Attributes$attribute,
									'aria-expanded',
									folded ? 'false' : 'true')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('fold')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text('▾')
										])),
									A2(
									$elm$html$Html$h2,
									_List_Nil,
									_List_fromArray(
										[
											$elm$html$Html$text(c.b7),
											A2(
											$elm$html$Html$small,
											_List_Nil,
											_List_fromArray(
												[
													$elm$html$Html$text(c.cH)
												]))
										])),
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('sum')
										]),
									A2(
										$elm$core$List$map,
										function (_v2) {
											var k = _v2.a;
											var v = _v2.b;
											return A2(
												$elm$html$Html$span,
												_List_Nil,
												_List_fromArray(
													[
														$elm$html$Html$text(k + ' '),
														A2(
														$elm$html$Html$b,
														_List_Nil,
														_List_fromArray(
															[
																$elm$html$Html$text(v)
															]))
													]));
										},
										c.cY))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('hmenu')
								]),
							c.cy)
						])),
				folded ? _List_Nil : _List_fromArray(
					[
						A2(
						$elm$html$Html$div,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$class('body')
							]),
						c.ce),
						$author$project$Ui$Module$jackRow(c.cu)
					])));
	});
var $author$project$Ui$Row$view = F3(
	function (toMsg, folds, row) {
		var ms = $author$project$Ui$Row$members(row);
		var fold = A2(
			$elm$core$List$any,
			function (m) {
				return A2(
					$author$project$Ui$Module$foldOf,
					$author$project$Ui$Module$idOf(m),
					folds) === 1;
			},
			ms) ? 1 : 0;
		var toggle = toMsg(
			A2(
				$author$project$Ui$Module$SetFold,
				A2($elm$core$List$map, $author$project$Ui$Module$idOf, ms),
				function () {
					if (fold === 1) {
						return 0;
					} else {
						return 1;
					}
				}()));
		var one = $author$project$Ui$Module$view(
			{ek: fold, e3: toggle});
		switch (row.$) {
			case 0:
				var a = row.a;
				var b = row.b;
				return A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('prow')
						]),
					_List_fromArray(
						[
							one(a),
							one(b)
						]));
			case 1:
				var a = row.a;
				return A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('prow')
						]),
					_List_fromArray(
						[
							one(a),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('blank')
								]),
							_List_Nil)
						]));
			default:
				var a = row.a;
				return A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$classList(
							_List_fromArray(
								[
									_Utils_Tuple2('prow', true),
									_Utils_Tuple2('one', true)
								]))
						]),
					_List_fromArray(
						[
							one(a)
						]));
		}
	});
var $author$project$Ui$Page$view = F3(
	function (toMsg, _v0, _v1) {
		var s = _v0;
		var c = _v1;
		var shown = A2(
			$elm$core$List$filter,
			function (m) {
				return !A2(
					$author$project$Ui$Chip$member,
					$author$project$Ui$Module$chipOf(m),
					s.aN);
			},
			c.bS);
		var foldAll = function (f) {
			return toMsg(
				$author$project$Ui$Page$Folding(
					A2(
						$author$project$Ui$Module$SetFold,
						A2($elm$core$List$map, $author$project$Ui$Module$idOf, shown),
						f)));
		};
		var chips = A3(
			$elm$core$List$foldl,
			F2(
				function (m, acc) {
					return A2(
						$elm$core$List$member,
						$author$project$Ui$Module$chipOf(m),
						acc) ? acc : _Utils_ap(
						acc,
						_List_fromArray(
							[
								$author$project$Ui$Module$chipOf(m)
							]));
				}),
			_List_Nil,
			c.bS);
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('ui page'),
					$author$project$Ui$Tokens$themed(s.a_)
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('ptop')
						]),
					_Utils_ap(
						_List_fromArray(
							[
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('row')
									]),
								A2(
									$elm$core$List$cons,
									A2(
										$elm$html$Html$span,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('brand')
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('CHIMERA')
											])),
									_Utils_ap(
										A2($elm$core$List$map, $author$project$Ui$Page$tab, c.cJ),
										_Utils_ap(
											$elm$core$List$isEmpty(c.b9) ? _List_Nil : A2(
												$elm$core$List$cons,
												A2(
													$elm$html$Html$span,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('sep')
														]),
													_List_Nil),
												A2($elm$core$List$map, $author$project$Ui$Page$tab, c.b9)),
											_List_fromArray(
												[
													A2(
													$elm$html$Html$div,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('themesw')
														]),
													A2(
														$elm$core$List$map,
														function (t) {
															return A2(
																$elm$html$Html$button,
																_List_fromArray(
																	[
																		$elm$html$Html$Attributes$classList(
																		_List_fromArray(
																			[
																				_Utils_Tuple2(
																				'on',
																				_Utils_eq(t, s.a_))
																			])),
																		A2(
																		$elm$html$Html$Attributes$attribute,
																		'aria-pressed',
																		$author$project$Ui$Page$ariaBool(
																			_Utils_eq(t, s.a_))),
																		$elm$html$Html$Events$onClick(
																		toMsg(
																			$author$project$Ui$Page$ChoseTheme(t)))
																	]),
																_List_fromArray(
																	[
																		$elm$html$Html$text(
																		$author$project$Ui$Tokens$label(t))
																	]));
														},
														$author$project$Ui$Tokens$themes)),
													A2(
													$elm$html$Html$span,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$class('unit')
														]),
													function () {
														var _v2 = c.aP;
														if (_v2.$ === 1) {
															var l = _v2.a;
															return _List_fromArray(
																[
																	A2(
																	$elm$html$Html$i,
																	_List_fromArray(
																		[
																			$elm$html$Html$Attributes$class('live')
																		]),
																	_List_Nil),
																	$elm$html$Html$text(l)
																]);
														} else {
															return _List_fromArray(
																[
																	A2($elm$html$Html$i, _List_Nil, _List_Nil),
																	$elm$html$Html$text('NO UNIT')
																]);
														}
													}())
												]))))),
								A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('row chips')
									]),
								A2(
									$elm$core$List$cons,
									A2(
										$elm$html$Html$span,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('k')
											]),
										_List_fromArray(
											[
												$elm$html$Html$text('SHOW')
											])),
									_Utils_ap(
										A2(
											$elm$core$List$map,
											function (chip) {
												return A2(
													$elm$html$Html$button,
													_List_fromArray(
														[
															$elm$html$Html$Attributes$classList(
															_List_fromArray(
																[
																	_Utils_Tuple2('chip', true),
																	_Utils_Tuple2(
																	'off',
																	A2($author$project$Ui$Chip$member, chip, s.aN))
																])),
															A2(
															$elm$html$Html$Attributes$attribute,
															'aria-pressed',
															$author$project$Ui$Page$ariaBool(
																!A2($author$project$Ui$Chip$member, chip, s.aN))),
															$elm$html$Html$Events$onClick(
															toMsg(
																$author$project$Ui$Page$ToggleChip(chip)))
														]),
													_List_fromArray(
														[
															$elm$html$Html$text(
															$author$project$Ui$Chip$label(chip))
														]));
											},
											chips),
										_List_fromArray(
											[
												A2(
												$elm$html$Html$button,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('chip push'),
														$elm$html$Html$Events$onClick(
														foldAll(1))
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('FOLD ALL')
													])),
												A2(
												$elm$html$Html$button,
												_List_fromArray(
													[
														$elm$html$Html$Attributes$class('chip'),
														$elm$html$Html$Events$onClick(
														foldAll(0))
													]),
												_List_fromArray(
													[
														$elm$html$Html$text('OPEN ALL')
													]))
											]))))
							]),
						A2(
							$elm$core$List$map,
							function (x) {
								return A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('row')
										]),
									_List_fromArray(
										[x]));
							},
							c.cX))),
					A2(
					$elm$html$Html$main_,
					_List_Nil,
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('pagehead')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$h1,
									_List_Nil,
									_List_fromArray(
										[
											$elm$html$Html$text(c.b7)
										])),
									A2(
									$elm$html$Html$span,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('meta')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(c.cz)
										]))
								])),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('prows')
								]),
							A2(
								$elm$core$List$map,
								A2(
									$author$project$Ui$Row$view,
									A2($elm$core$Basics$composeR, $author$project$Ui$Page$Folding, toMsg),
									s.bM),
								$author$project$Ui$Row$pairUp(shown)))
						]))
				]));
	});
var $author$project$View$EnginePage$connectPage = F2(
	function (m, s) {
		var says = function () {
			var _v0 = $author$project$Model$notice(m);
			if (!_v0.$) {
				var n = _v0.a;
				return n;
			} else {
				return _Utils_eq(
					m.aP,
					$elm$core$Maybe$Just(0)) ? 'READING THE UNIT' : 'NOT CONNECTED';
			}
		}();
		return A3(
			$author$project$Ui$Page$view,
			$author$project$View$EnginePage$PageMsg,
			s.bk,
			A2(
				$author$project$Ui$Page$modules,
				_Utils_ap(
					$author$project$View$EnginePage$saidModule(m),
					_List_fromArray(
						[
							A2(
							$author$project$Ui$Module$body,
							_List_fromArray(
								[
									A2(
									$elm$html$Html$div,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('connect')
										]),
									_List_fromArray(
										[
											A2(
											$elm$html$Html$button,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('hbtn'),
													$elm$html$Html$Events$onClick(
													$author$project$View$EnginePage$Unit(
														$author$project$Model$Connect(0)))
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('CONNECT UNIT')
												])),
											A2(
											$elm$html$Html$button,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('hbtn'),
													$elm$html$Html$Events$onClick(
													$author$project$View$EnginePage$Unit(
														$author$project$Model$Connect(1)))
												]),
											_List_fromArray(
												[
													$elm$html$Html$text('CONNECT SIMULATOR')
												]))
										]))
								]),
							A2(
								$author$project$Ui$Module$note,
								says,
								A2($author$project$Ui$Module$new, 16, 'UNIT')))
						])),
				A2(
					$author$project$Ui$Page$meta,
					says,
					$author$project$Ui$Page$new('CHIMERA'))));
	});
var $author$project$Ui$Page$Linked = function (a) {
	return {$: 1, a: a};
};
var $author$project$View$EnginePage$PadMsg = function (a) {
	return {$: 4, a: a};
};
var $author$project$Protocol$pageLabel = function (_v0) {
	var l = _v0;
	return l;
};
var $author$project$Layout$Shared$labelOf = F3(
	function (pg, pn, p) {
		var _v0 = _Utils_Tuple2(
			pn.dT,
			$elm$core$String$toList(p.aO));
		if (((((((_v0.a.$ === 1) && _v0.b.b) && ('O' === _v0.b.a)) && _v0.b.b.b) && ('P' === _v0.b.b.a)) && _v0.b.b.b.b) && (!_v0.b.b.b.b.b)) {
			var _v1 = _v0.a;
			var _v2 = _v0.b;
			var _v3 = _v2.b;
			var _v4 = _v3.b;
			var d = _v4.a;
			return ((d >= '1') && (d <= '6')) ? $author$project$Protocol$pageLabel(pg.aO) : p.aO;
		} else {
			return p.aO;
		}
	});
var $author$project$Layout$Shared$active = F2(
	function (sch, variants) {
		var shown = $author$project$Schema$panelShown(variants);
		var keep = F2(
			function (_v3, _v4) {
				var generic = _v3.a;
				var item = _v3.b;
				var order = _v4.a;
				var best = _v4.b;
				var k = $author$project$Addr$key(item.bl.w);
				var _v1 = A2($elm$core$Dict$get, k, best);
				if (_v1.$ === 1) {
					return _Utils_Tuple2(
						_Utils_ap(
							order,
							_List_fromArray(
								[k])),
						A3(
							$elm$core$Dict$insert,
							k,
							_Utils_Tuple2(generic, item),
							best));
				} else {
					var _v2 = _v1.a;
					var heldGeneric = _v2.a;
					return (heldGeneric && (!generic)) ? _Utils_Tuple2(
						order,
						A3(
							$elm$core$Dict$insert,
							k,
							_Utils_Tuple2(generic, item),
							best)) : _Utils_Tuple2(order, best);
				}
			});
		var _v0 = A3(
			$elm$core$List$foldl,
			keep,
			_Utils_Tuple2(_List_Nil, $elm$core$Dict$empty),
			A2(
				$elm$core$List$concatMap,
				function (pg) {
					return A2(
						$elm$core$List$concatMap,
						function (pn) {
							return A2(
								$elm$core$List$map,
								function (p) {
									return _Utils_Tuple2(
										_Utils_eq(pn.dT, $elm$core$Maybe$Nothing),
										{
											aO: A3($author$project$Layout$Shared$labelOf, pg, pn, p),
											bl: p
										});
								},
								pn.eP);
						},
						A2($elm$core$List$filter, shown, pg.eO));
				},
				$author$project$Schema$pages(sch)));
		var keys = _v0.a;
		var chosen = _v0.b;
		return A2(
			$elm$core$List$filterMap,
			function (k) {
				return A2(
					$elm$core$Maybe$map,
					$elm$core$Tuple$second,
					A2($elm$core$Dict$get, k, chosen));
			},
			keys);
	});
var $author$project$Ui$PadStrip$Config = $elm$core$Basics$identity;
var $author$project$Ui$PadStrip$icons = F2(
	function (f, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{cr: f});
	});
var $author$project$Layout$Shared$index = function (items) {
	return $elm$core$Dict$fromList(
		A2(
			$elm$core$List$map,
			function (i) {
				return _Utils_Tuple2(
					$author$project$Addr$key(i.bl.w),
					i);
			},
			items));
};
var $author$project$Ui$Pad$Pad1 = 0;
var $author$project$Ui$Pad$Pad10 = 9;
var $author$project$Ui$Pad$Pad11 = 10;
var $author$project$Ui$Pad$Pad12 = 11;
var $author$project$Ui$Pad$Pad2 = 1;
var $author$project$Ui$Pad$Pad3 = 2;
var $author$project$Ui$Pad$Pad4 = 3;
var $author$project$Ui$Pad$Pad5 = 4;
var $author$project$Ui$Pad$Pad6 = 5;
var $author$project$Ui$Pad$Pad7 = 6;
var $author$project$Ui$Pad$Pad8 = 7;
var $author$project$Ui$Pad$Pad9 = 8;
var $author$project$Ui$Pad$all = _List_fromArray(
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
var $author$project$Layout$Page$PadDrawn = F2(
	function (a, b) {
		return {$: 8, a: a, b: b};
	});
var $author$project$Layout$Page$PadFx = 4;
var $author$project$Addr$EnvBlock = function (a) {
	return {$: 4, a: a};
};
var $author$project$Layout$Page$EnvPage = function (a) {
	return {$: 6, a: a};
};
var $author$project$Ui$Chip$Envelopes = 9;
var $author$project$Layout$Shared$Auto = 0;
var $author$project$Layout$Shared$auto = function (a) {
	return {w: a, ac: 0};
};
var $author$project$Layout$Shared$AsFader = 3;
var $author$project$Layout$Shared$fader = function (a) {
	return {w: a, ac: 3};
};
var $author$project$Layout$Shared$Group = F2(
	function (title, slots) {
		return {b3: slots, b7: title};
	});
var $author$project$Layout$Shared$group = $author$project$Layout$Shared$Group;
var $author$project$Layout$Shared$AsKnob = 1;
var $author$project$Layout$Shared$knob = function (a) {
	return {w: a, ac: 1};
};
var $author$project$Layout$Shared$Half = 0;
var $author$project$Layout$Shared$Module = $elm$core$Basics$identity;
var $author$project$Layout$Shared$module_ = F2(
	function (c, t) {
		return {ch: c, a8: _List_Nil, av: _List_Nil, bN: _List_Nil, cH: '', b0: $elm$core$Maybe$Nothing, cS: 0, b7: t};
	});
var $author$project$Layout$Shared$Band = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Layout$Page$Drawn = function (a) {
	return {$: 0, a: a};
};
var $author$project$Layout$Shared$ScreenAt = $elm$core$Basics$identity;
var $author$project$Ui$Screen$Tall = 1;
var $author$project$Layout$Shared$tall = function (page) {
	return {
		ar: A2($author$project$Layout$Shared$Band, 1, $elm$core$Maybe$Nothing),
		a9: $elm$core$Maybe$Nothing,
		bk: $author$project$Layout$Page$Drawn(page),
		aW: _List_Nil
	};
};
var $author$project$Layout$Shared$withGroups = F2(
	function (gs, _v0) {
		var m = _v0;
		return _Utils_update(
			m,
			{av: gs});
	});
var $author$project$Layout$Shared$withHeader = F2(
	function (h, _v0) {
		var m = _v0;
		return _Utils_update(
			m,
			{bN: h});
	});
var $author$project$Layout$Shared$withScreen = F2(
	function (s, _v0) {
		var m = _v0;
		return _Utils_update(
			m,
			{
				b0: $elm$core$Maybe$Just(s)
			});
	});
var $author$project$Layout$Shared$envelope = function (e) {
	var a = $author$project$Addr$named(
		$author$project$Addr$EnvBlock(e));
	return A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$fader(
						a('ATK')),
						$author$project$Layout$Shared$fader(
						a('H')),
						$author$project$Layout$Shared$fader(
						a('DEC')),
						$author$project$Layout$Shared$fader(
						a('SUS')),
						$author$project$Layout$Shared$fader(
						a('REL'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$fader(
						a('RISE')),
						$author$project$Layout$Shared$fader(
						a('FALL')),
						$author$project$Layout$Shared$knob(
						a('SHAPE'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$auto(
						a('MODE')),
						$author$project$Layout$Shared$auto(
						a('FORM')),
						$author$project$Layout$Shared$auto(
						a('SPEED')),
						$author$project$Layout$Shared$auto(
						a('HOLD'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			$author$project$Layout$Shared$tall(
				$author$project$Layout$Page$EnvPage(e)),
			A2(
				$author$project$Layout$Shared$withHeader,
				_List_fromArray(
					[
						a('TYPE')
					]),
				A2(
					$author$project$Layout$Shared$module_,
					9,
					'ENVELOPE ' + $elm$core$String$fromInt(
						$author$project$Addr$envNumber(e))))));
};
var $author$project$Addr$Env1 = 0;
var $author$project$Addr$Env2 = 1;
var $author$project$Addr$Env3 = 2;
var $author$project$Addr$envs = _List_fromArray(
	[0, 1, 2]);
var $author$project$Addr$Filter = {$: 1};
var $author$project$Layout$Shared$addGroups = F2(
	function (gs, _v0) {
		var m = _v0;
		return _Utils_update(
			m,
			{
				av: _Utils_ap(m.av, gs)
			});
	});
var $author$project$Ui$Chip$Filter = 6;
var $author$project$Layout$Shared$NextSlice = {$: 2};
var $author$project$Layout$Shared$AsMenu = 5;
var $author$project$Layout$Shared$menu = function (a) {
	return {w: a, ac: 5};
};
var $author$project$Layout$Shared$withExtras = F2(
	function (xs, _v0) {
		var m = _v0;
		return _Utils_update(
			m,
			{a8: xs});
	});
var $author$project$Layout$Shared$filterMod = function () {
	var a = $author$project$Addr$named($author$project$Addr$Filter);
	return A2(
		$author$project$Layout$Shared$withExtras,
		_List_fromArray(
			[$author$project$Layout$Shared$NextSlice]),
		A2(
			$author$project$Layout$Shared$withGroups,
			_List_fromArray(
				[
					A2(
					$author$project$Layout$Shared$group,
					'',
					_List_fromArray(
						[
							$author$project$Layout$Shared$fader(
							a('FB')),
							$author$project$Layout$Shared$fader(
							a('LEVEL'))
						])),
					A2(
					$author$project$Layout$Shared$group,
					'JACKS',
					_List_fromArray(
						[
							$author$project$Layout$Shared$menu(
							a('FM3IN')),
							$author$project$Layout$Shared$menu(
							a('QMIN'))
						]))
				]),
			A2($author$project$Layout$Shared$module_, 6, 'FILTER MOD')));
}();
var $author$project$Layout$Drum$filterMod = A2(
	$author$project$Layout$Shared$addGroups,
	_List_fromArray(
		[
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$fader(
					A2($author$project$Addr$named, $author$project$Addr$Filter, 'STAB'))
				]))
		]),
	$author$project$Layout$Shared$filterMod);
var $author$project$Addr$LfoBlock = function (a) {
	return {$: 5, a: a};
};
var $author$project$Layout$Page$LfoPage = function (a) {
	return {$: 7, a: a};
};
var $author$project$Ui$Chip$Lfos = 10;
var $author$project$Layout$Shared$AsHero = 2;
var $author$project$Layout$Shared$hero = function (a) {
	return {w: a, ac: 2};
};
var $author$project$Ui$Screen$Strip = 0;
var $author$project$Layout$Shared$strip = function (page) {
	return {
		ar: A2($author$project$Layout$Shared$Band, 0, $elm$core$Maybe$Nothing),
		a9: $elm$core$Maybe$Nothing,
		bk: $author$project$Layout$Page$Drawn(page),
		aW: _List_Nil
	};
};
var $author$project$Layout$Shared$lfo = function (l) {
	var a = $author$project$Addr$named(
		$author$project$Addr$LfoBlock(l));
	return A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$hero(
						a('RATE')),
						$author$project$Layout$Shared$hero(
						a('RISE')),
						$author$project$Layout$Shared$auto(
						a('SHAPE'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$fader(
						a('DEPTH')),
						$author$project$Layout$Shared$auto(
						a('SYNC')),
						$author$project$Layout$Shared$knob(
						a('PHASE')),
						$author$project$Layout$Shared$knob(
						a('FALL')),
						$author$project$Layout$Shared$knob(
						a('SHAPE_B')),
						$author$project$Layout$Shared$auto(
						a('FORM'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			$author$project$Layout$Shared$strip(
				$author$project$Layout$Page$LfoPage(l)),
			A2(
				$author$project$Layout$Shared$withHeader,
				_List_fromArray(
					[
						a('TYPE')
					]),
				A2(
					$author$project$Layout$Shared$module_,
					10,
					'LFO ' + $elm$core$String$fromInt(
						$author$project$Addr$lfoNumber(l))))));
};
var $author$project$Addr$Lfo1 = 0;
var $author$project$Addr$Lfo2 = 1;
var $author$project$Addr$Lfo3 = 2;
var $author$project$Addr$lfos = _List_fromArray(
	[0, 1, 2]);
var $author$project$Addr$Out = {$: 3};
var $author$project$Ui$Chip$Out = 13;
var $author$project$Layout$Page$Snd = {$: 5};
var $author$project$Layout$Shared$withNote = F2(
	function (n, _v0) {
		var m = _v0;
		return _Utils_update(
			m,
			{cH: n});
	});
var $author$project$Layout$Drum$out = function () {
	var a = $author$project$Addr$named($author$project$Addr$Out);
	return A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$fader(
						a('SEND1')),
						$author$project$Layout$Shared$fader(
						a('SEND2')),
						$author$project$Layout$Shared$fader(
						a('SEND3'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$fader(
						a('WIDTH'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			$author$project$Layout$Shared$strip($author$project$Layout$Page$Snd),
			A2(
				$author$project$Layout$Shared$withNote,
				'SENDS · WIDTH · WHOLE KIT',
				A2($author$project$Layout$Shared$module_, 13, 'OUT'))));
}();
var $author$project$Addr$Kit = {$: 11};
var $author$project$Ui$Chip$Kit = 12;
var $author$project$Layout$Page$PadKit = 0;
var $author$project$Addr$Voice = {$: 0};
var $elm$core$String$cons = _String_cons;
var $elm$core$String$fromChar = function (_char) {
	return A2($elm$core$String$cons, _char, '');
};
var $elm$core$Bitwise$shiftRightBy = _Bitwise_shiftRightBy;
var $elm$core$String$repeatHelp = F3(
	function (n, chunk, result) {
		return (n <= 0) ? result : A3(
			$elm$core$String$repeatHelp,
			n >> 1,
			_Utils_ap(chunk, chunk),
			(!(n & 1)) ? result : _Utils_ap(result, chunk));
	});
var $elm$core$String$repeat = F2(
	function (n, chunk) {
		return A3($elm$core$String$repeatHelp, n, chunk, '');
	});
var $elm$core$String$padLeft = F3(
	function (n, _char, string) {
		return _Utils_ap(
			A2(
				$elm$core$String$repeat,
				n - $elm$core$String$length(string),
				$elm$core$String$fromChar(_char)),
			string);
	});
var $author$project$Ui$Pad$label = function (p) {
	return A3(
		$elm$core$String$padLeft,
		2,
		'0',
		$elm$core$String$fromInt(
			$author$project$Ui$Pad$number(p)));
};
var $author$project$Layout$Drum$pads = function (_v0) {
	var first = _v0.a;
	var rest = _v0.b;
	var row = function (p) {
		var a = $author$project$Addr$named(
			A2($author$project$Addr$Pad, p, $author$project$Addr$Voice));
		return A2(
			$author$project$Layout$Shared$group,
			'PAD ' + $author$project$Ui$Pad$label(p),
			_List_fromArray(
				[
					$author$project$Layout$Shared$knob(
					a('LEVEL')),
					$author$project$Layout$Shared$knob(
					a('PAN')),
					$author$project$Layout$Shared$menu(
					a('CHOKE')),
					$author$project$Layout$Shared$auto(
					a('RETRIG'))
				]));
	};
	var last = A3($elm$core$List$foldl, $elm$core$Basics$always, first, rest);
	return A2(
		$author$project$Layout$Shared$withGroups,
		_Utils_ap(
			(!first) ? _List_fromArray(
				[
					A2(
					$author$project$Layout$Shared$group,
					'',
					_List_fromArray(
						[
							$author$project$Layout$Shared$menu(
							A2($author$project$Addr$named, $author$project$Addr$Kit, 'TONAL'))
						]))
				]) : _List_Nil,
			A2(
				$elm$core$List$map,
				row,
				A2($elm$core$List$cons, first, rest))),
		A2(
			$author$project$Layout$Shared$withScreen,
			$author$project$Layout$Shared$strip(
				A2($author$project$Layout$Page$PadDrawn, first, 0)),
			A2(
				$author$project$Layout$Shared$module_,
				12,
				'PADS ' + ($elm$core$String$fromInt(
					$author$project$Ui$Pad$number(first)) + ('–' + $elm$core$String$fromInt(
					$author$project$Ui$Pad$number(last)))))));
};
var $author$project$Ui$Chip$Fx = 7;
var $author$project$Addr$VoiceFx = {$: 2};
var $author$project$Layout$Shared$voiceFx = function (page) {
	var a = $author$project$Addr$named($author$project$Addr$VoiceFx);
	return A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$auto(
						a('PLACE'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$hero(
						a('P1')),
						$author$project$Layout$Shared$knob(
						a('P2'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$fader(
						a('P3')),
						$author$project$Layout$Shared$fader(
						a('MIX'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			$author$project$Layout$Shared$strip(page),
			A2(
				$author$project$Layout$Shared$withHeader,
				_List_fromArray(
					[
						a('TYPE')
					]),
				A2($author$project$Layout$Shared$module_, 7, 'VOICE FX'))));
};
var $author$project$Layout$Drum$wholeKit = $author$project$Layout$Shared$withNote('WHOLE KIT');
var $author$project$Layout$Drum$kit = _Utils_ap(
	_List_fromArray(
		[
			$author$project$Layout$Drum$pads(
			_Utils_Tuple2(
				0,
				_List_fromArray(
					[1, 2, 3, 4, 5]))),
			$author$project$Layout$Drum$pads(
			_Utils_Tuple2(
				6,
				_List_fromArray(
					[7, 8, 9, 10, 11]))),
			$author$project$Layout$Drum$wholeKit(
			$author$project$Layout$Shared$voiceFx(
				A2($author$project$Layout$Page$PadDrawn, 0, 4))),
			$author$project$Layout$Drum$out,
			$author$project$Layout$Drum$wholeKit($author$project$Layout$Drum$filterMod)
		]),
	_Utils_ap(
		A2(
			$elm$core$List$map,
			A2($elm$core$Basics$composeR, $author$project$Layout$Shared$envelope, $author$project$Layout$Drum$wholeKit),
			$author$project$Addr$envs),
		A2(
			$elm$core$List$map,
			A2($elm$core$Basics$composeR, $author$project$Layout$Shared$lfo, $author$project$Layout$Drum$wholeKit),
			$author$project$Addr$lfos)));
var $author$project$Addr$Amp = {$: 1};
var $author$project$Ui$Screen$CellA = 0;
var $author$project$Ui$Screen$CellB = 1;
var $author$project$Ui$Chip$Pad = 14;
var $author$project$Layout$Page$PadAmp = 2;
var $author$project$Addr$PadFilter = {$: 4};
var $author$project$Layout$Page$PadFlt = 1;
var $author$project$Layout$Page$PadMch = 0;
var $author$project$Layout$Page$PadPenv = 3;
var $author$project$Layout$Page$PadPlfo = 1;
var $author$project$Layout$Shared$PadRoutes = function (a) {
	return {$: 4, a: a};
};
var $author$project$Layout$Page$PadScoped = F2(
	function (a, b) {
		return {$: 9, a: a, b: b};
	});
var $author$project$Addr$PitchEnv = {$: 2};
var $author$project$Addr$PitchLfo = {$: 3};
var $author$project$Layout$Page$Scoped = function (a) {
	return {$: 1, a: a};
};
var $author$project$Layout$Shared$filterCore = F2(
	function (block, page) {
		var a = $author$project$Addr$named(block);
		return A2(
			$author$project$Layout$Shared$withGroups,
			_List_fromArray(
				[
					A2(
					$author$project$Layout$Shared$group,
					'',
					_List_fromArray(
						[
							$author$project$Layout$Shared$hero(
							a('CUTOFF')),
							$author$project$Layout$Shared$knob(
							a('RESO'))
						])),
					A2(
					$author$project$Layout$Shared$group,
					'',
					_List_fromArray(
						[
							$author$project$Layout$Shared$auto(
							a('MODE')),
							$author$project$Layout$Shared$auto(
							a('VOICE')),
							$author$project$Layout$Shared$knob(
							a('MORPH'))
						]))
				]),
			A2(
				$author$project$Layout$Shared$withScreen,
				$author$project$Layout$Shared$tall(page),
				A2(
					$author$project$Layout$Shared$withHeader,
					_List_fromArray(
						[
							a('KIND')
						]),
					A2($author$project$Layout$Shared$module_, 6, 'FILTER'))));
	});
var $author$project$Layout$Shared$GaugeOf = function (a) {
	return {$: 1, a: a};
};
var $author$project$Layout$Shared$gauge = F2(
	function (page, f) {
		return {
			ar: $author$project$Layout$Shared$GaugeOf(f),
			a9: $elm$core$Maybe$Nothing,
			bk: page,
			aW: _List_Nil
		};
	});
var $author$project$Layout$Shared$AsHeroFader = 4;
var $author$project$Layout$Shared$heroFader = function (a) {
	return {w: a, ac: 4};
};
var $author$project$Ui$Chip$Mod = 11;
var $author$project$Layout$Shared$PartMatrix = {$: 3};
var $author$project$Layout$Shared$Whole = 1;
var $author$project$Layout$Shared$whole = function (_v0) {
	var m = _v0;
	return _Utils_update(
		m,
		{cS: 1});
};
var $author$project$Layout$Shared$mod = A2(
	$author$project$Layout$Shared$withExtras,
	_List_fromArray(
		[$author$project$Layout$Shared$PartMatrix]),
	$author$project$Layout$Shared$whole(
		A2(
			$author$project$Layout$Shared$withNote,
			'PATCH BAY',
			A2($author$project$Layout$Shared$module_, 11, 'MOD'))));
var $author$project$Layout$Shared$withChip = F2(
	function (c, _v0) {
		var m = _v0;
		return _Utils_update(
			m,
			{ch: c});
	});
var $author$project$Layout$Drum$pad = function (p) {
	var _this = A2(
		$elm$core$Basics$composeR,
		$author$project$Layout$Shared$withNote(
			'PAD ' + $author$project$Ui$Pad$label(p)),
		$author$project$Layout$Shared$withChip(14));
	var on = $author$project$Layout$Page$PadDrawn(p);
	var a = function (block) {
		return $author$project$Addr$named(
			A2($author$project$Addr$Pad, p, block));
	};
	return _Utils_ap(
		A2(
			$elm$core$List$map,
			_this,
			_List_fromArray(
				[
					A2(
					$author$project$Layout$Shared$withGroups,
					_List_fromArray(
						[
							A2(
							$author$project$Layout$Shared$group,
							'',
							_List_fromArray(
								[
									$author$project$Layout$Shared$heroFader(
									A2(a, $author$project$Addr$Voice, 'LEVEL')),
									$author$project$Layout$Shared$knob(
									A2(a, $author$project$Addr$Voice, 'PAN'))
								])),
							A2(
							$author$project$Layout$Shared$group,
							'KEYS',
							_List_fromArray(
								[
									$author$project$Layout$Shared$auto(
									A2(a, $author$project$Addr$Voice, 'CHOKE')),
									$author$project$Layout$Shared$auto(
									A2(a, $author$project$Addr$Voice, 'RETRIG'))
								]))
						]),
					A2(
						$author$project$Layout$Shared$withScreen,
						$author$project$Layout$Shared$strip(
							on(0)),
						A2($author$project$Layout$Shared$module_, 14, 'PAD'))),
					A2(
					$author$project$Layout$Shared$withGroups,
					_List_fromArray(
						[
							A2(
							$author$project$Layout$Shared$group,
							'A–F',
							_List_fromArray(
								[
									$author$project$Layout$Shared$hero(
									A2(a, $author$project$Addr$Voice, 'KNOB_A')),
									$author$project$Layout$Shared$knob(
									A2(a, $author$project$Addr$Voice, 'KNOB_B')),
									$author$project$Layout$Shared$knob(
									A2(a, $author$project$Addr$Voice, 'KNOB_C')),
									$author$project$Layout$Shared$knob(
									A2(a, $author$project$Addr$Voice, 'KNOB_D')),
									$author$project$Layout$Shared$knob(
									A2(a, $author$project$Addr$Voice, 'KNOB_E')),
									$author$project$Layout$Shared$knob(
									A2(a, $author$project$Addr$Voice, 'KNOB_F'))
								])),
							A2(
							$author$project$Layout$Shared$group,
							'MORE',
							_List_fromArray(
								[
									$author$project$Layout$Shared$knob(
									A2(a, $author$project$Addr$Voice, 'KNOB_G')),
									$author$project$Layout$Shared$knob(
									A2(a, $author$project$Addr$Voice, 'KNOB_H'))
								]))
						]),
					A2(
						$author$project$Layout$Shared$withScreen,
						A2(
							$author$project$Layout$Shared$gauge,
							$author$project$Layout$Page$Scoped(
								A2($author$project$Layout$Page$PadScoped, p, 0)),
							0),
						A2(
							$author$project$Layout$Shared$withHeader,
							_List_fromArray(
								[
									A2(a, $author$project$Addr$Voice, 'MACHINE')
								]),
							A2($author$project$Layout$Shared$module_, 14, 'MACHINE')))),
					A2(
					$author$project$Layout$Shared$filterCore,
					A2($author$project$Addr$Pad, p, $author$project$Addr$PadFilter),
					on(1)),
					A2(
					$author$project$Layout$Shared$withGroups,
					_List_fromArray(
						[
							A2(
							$author$project$Layout$Shared$group,
							'',
							_List_fromArray(
								[
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$Amp, 'ATTACK')),
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$Amp, 'HOLD')),
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$Amp, 'DECAY'))
								])),
							A2(
							$author$project$Layout$Shared$group,
							'',
							_List_fromArray(
								[
									$author$project$Layout$Shared$auto(
									A2(a, $author$project$Addr$Amp, 'SPEED')),
									$author$project$Layout$Shared$auto(
									A2(a, $author$project$Addr$Amp, 'MODE')),
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$Amp, 'VEL'))
								])),
							A2(
							$author$project$Layout$Shared$group,
							'GATE',
							_List_fromArray(
								[
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$Amp, 'LPG')),
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$Amp, 'GATE_DECAY')),
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$Amp, 'STRIKE'))
								]))
						]),
					A2(
						$author$project$Layout$Shared$withScreen,
						$author$project$Layout$Shared$tall(
							on(2)),
						A2($author$project$Layout$Shared$module_, 14, 'AMP'))),
					A2(
					$author$project$Layout$Shared$withGroups,
					_List_fromArray(
						[
							A2(
							$author$project$Layout$Shared$group,
							'',
							_List_fromArray(
								[
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$PitchEnv, 'ATTACK')),
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$PitchEnv, 'HOLD')),
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$PitchEnv, 'DECAY'))
								])),
							A2(
							$author$project$Layout$Shared$group,
							'',
							_List_fromArray(
								[
									$author$project$Layout$Shared$auto(
									A2(a, $author$project$Addr$PitchEnv, 'SPEED'))
								]))
						]),
					A2(
						$author$project$Layout$Shared$withScreen,
						$author$project$Layout$Shared$tall(
							on(3)),
						A2($author$project$Layout$Shared$module_, 14, 'PITCH ENV'))),
					A2(
					$author$project$Layout$Shared$withGroups,
					_List_fromArray(
						[
							A2(
							$author$project$Layout$Shared$group,
							'',
							_List_fromArray(
								[
									$author$project$Layout$Shared$hero(
									A2(a, $author$project$Addr$PitchLfo, 'SPEED')),
									$author$project$Layout$Shared$auto(
									A2(a, $author$project$Addr$PitchLfo, 'WAVE'))
								])),
							A2(
							$author$project$Layout$Shared$group,
							'',
							_List_fromArray(
								[
									$author$project$Layout$Shared$fader(
									A2(a, $author$project$Addr$PitchLfo, 'DEPTH')),
									$author$project$Layout$Shared$knob(
									A2(a, $author$project$Addr$PitchLfo, 'PHASE')),
									$author$project$Layout$Shared$auto(
									A2(a, $author$project$Addr$PitchLfo, 'MODE'))
								]))
						]),
					A2(
						$author$project$Layout$Shared$withScreen,
						A2(
							$author$project$Layout$Shared$gauge,
							$author$project$Layout$Page$Scoped(
								A2($author$project$Layout$Page$PadScoped, p, 1)),
							1),
						A2($author$project$Layout$Shared$module_, 14, 'PITCH LFO'))),
					A2(
					$author$project$Layout$Shared$withExtras,
					_List_fromArray(
						[
							$author$project$Layout$Shared$PadRoutes(p)
						]),
					A2($author$project$Layout$Shared$module_, 14, 'ROUTE 1–4'))
				])),
		_List_fromArray(
			[$author$project$Layout$Shared$mod]));
};
var $author$project$Layout$Drum$every = _Utils_ap(
	$author$project$Layout$Drum$kit,
	A2($elm$core$List$concatMap, $author$project$Layout$Drum$pad, $author$project$Ui$Pad$all));
var $author$project$Layout$Page$Fx = {$: 4};
var $author$project$Layout$Page$Alg = {$: 0};
var $author$project$Addr$Algo = {$: 6};
var $author$project$Ui$Screen$AlgoChart = {$: 0};
var $author$project$Ui$Chip$Algorithm = 0;
var $author$project$Ui$Screen$CellC = 2;
var $author$project$Layout$Algo$chartFocus = 2;
var $author$project$Layout$Shared$withFallback = F2(
	function (g, _v0) {
		var s = _v0;
		return _Utils_update(
			s,
			{
				a9: $elm$core$Maybe$Just(g)
			});
	});
var $author$project$Layout$Shared$withFocus = F2(
	function (f, _v0) {
		var s = _v0;
		var _v1 = s.ar;
		if (!_v1.$) {
			var shape = _v1.a;
			return _Utils_update(
				s,
				{
					ar: A2(
						$author$project$Layout$Shared$Band,
						shape,
						$elm$core$Maybe$Just(f))
				});
		} else {
			return _Utils_update(
				s,
				{
					ar: $author$project$Layout$Shared$GaugeOf(f)
				});
		}
	});
var $author$project$Layout$Algo$algorithm = function () {
	var a = $author$project$Addr$named($author$project$Addr$Algo);
	return A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$menu(
						a('ALG_A')),
						$author$project$Layout$Shared$menu(
						a('ALG_B'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$hero(
						a('MORPH')),
						$author$project$Layout$Shared$knob(
						a('TRNSP')),
						$author$project$Layout$Shared$knob(
						a('VOWEL'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			A2(
				$author$project$Layout$Shared$withFocus,
				$author$project$Layout$Algo$chartFocus,
				A2(
					$author$project$Layout$Shared$withFallback,
					$author$project$Ui$Screen$AlgoChart,
					$author$project$Layout$Shared$strip($author$project$Layout$Page$Alg))),
			A2($author$project$Layout$Shared$module_, 0, 'ALGORITHM')));
}();
var $author$project$Ui$Chip$Amp = 8;
var $author$project$Layout$Shared$ampOut = function () {
	var a = $author$project$Addr$named($author$project$Addr$Out);
	return A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'GATE',
				_List_fromArray(
					[
						$author$project$Layout$Shared$heroFader(
						a('LPG')),
						$author$project$Layout$Shared$fader(
						a('DECAY')),
						$author$project$Layout$Shared$fader(
						a('STRIKE')),
						$author$project$Layout$Shared$fader(
						a('VEL')),
						$author$project$Layout$Shared$fader(
						a('VCA'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'STEREO',
				_List_fromArray(
					[
						$author$project$Layout$Shared$knob(
						a('PAN')),
						$author$project$Layout$Shared$fader(
						a('WIDTH'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'OUT',
				_List_fromArray(
					[
						$author$project$Layout$Shared$heroFader(
						a('LEVEL')),
						$author$project$Layout$Shared$fader(
						a('SEND1')),
						$author$project$Layout$Shared$fader(
						a('SEND2')),
						$author$project$Layout$Shared$fader(
						a('SEND3'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			$author$project$Layout$Shared$strip($author$project$Layout$Page$Snd),
			A2(
				$author$project$Layout$Shared$withNote,
				'LOW-PASS GATE · STEREO · SENDS',
				A2($author$project$Layout$Shared$module_, 8, 'AMP · OUT'))));
}();
var $author$project$Layout$Page$Flt = {$: 3};
var $author$project$Layout$Shared$filter = A2(
	$author$project$Layout$Shared$addGroups,
	_List_fromArray(
		[
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$fader(
					A2($author$project$Addr$named, $author$project$Addr$Filter, 'STAB'))
				]))
		]),
	A2($author$project$Layout$Shared$filterCore, $author$project$Addr$Filter, $author$project$Layout$Page$Flt));
var $author$project$Addr$Op = function (a) {
	return {$: 7, a: a};
};
var $author$project$Layout$Page$OpPage = function (a) {
	return {$: 2, a: a};
};
var $author$project$Ui$Screen$OpWave = {$: 1};
var $author$project$Ui$Chip$Operators = 2;
var $author$project$Addr$operatorNumber = function (o) {
	switch (o) {
		case 0:
			return 1;
		case 1:
			return 2;
		case 2:
			return 3;
		case 3:
			return 4;
		case 4:
			return 5;
		default:
			return 6;
	}
};
var $author$project$Layout$Algo$operator = function (o) {
	var a = $author$project$Addr$named(
		$author$project$Addr$Op(o));
	return A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'PITCH',
				_List_fromArray(
					[
						$author$project$Layout$Shared$hero(
						a('CRSE')),
						$author$project$Layout$Shared$knob(
						a('FINE')),
						$author$project$Layout$Shared$knob(
						a('DETUN')),
						$author$project$Layout$Shared$fader(
						a('FDBK'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'OUTPUT',
				_List_fromArray(
					[
						$author$project$Layout$Shared$heroFader(
						a('LEVEL')),
						$author$project$Layout$Shared$fader(
						a('VEL'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'ENVELOPE',
				_List_fromArray(
					[
						$author$project$Layout$Shared$fader(
						a('AR')),
						$author$project$Layout$Shared$fader(
						a('D1R')),
						$author$project$Layout$Shared$fader(
						a('D1L')),
						$author$project$Layout$Shared$fader(
						a('D2R')),
						$author$project$Layout$Shared$fader(
						a('RR')),
						$author$project$Layout$Shared$fader(
						a('RS'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'BAND',
				_List_fromArray(
					[
						$author$project$Layout$Shared$hero(
						a('FRMT')),
						$author$project$Layout$Shared$knob(
						a('BW')),
						$author$project$Layout$Shared$fader(
						a('SKIRT')),
						$author$project$Layout$Shared$fader(
						a('KEY')),
						$author$project$Layout$Shared$fader(
						a('RES')),
						$author$project$Layout$Shared$auto(
						a('VSLOT'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			A2(
				$author$project$Layout$Shared$withFallback,
				$author$project$Ui$Screen$OpWave,
				$author$project$Layout$Shared$strip(
					$author$project$Layout$Page$OpPage(o))),
			A2(
				$author$project$Layout$Shared$withHeader,
				_List_fromArray(
					[
						a('WAVE')
					]),
				A2(
					$author$project$Layout$Shared$module_,
					2,
					'OP ' + $elm$core$String$fromInt(
						$author$project$Addr$operatorNumber(o))))));
};
var $author$project$Addr$OpA = 0;
var $author$project$Addr$OpB = 1;
var $author$project$Addr$OpC = 2;
var $author$project$Addr$OpD = 3;
var $author$project$Addr$OpE = 4;
var $author$project$Addr$OpF = 5;
var $author$project$Addr$operators = _List_fromArray(
	[0, 1, 2, 3, 4, 5]);
var $author$project$Layout$Page$Pit = {$: 1};
var $author$project$Addr$Pitch = {$: 0};
var $author$project$Ui$Chip$Pitch = 1;
var $author$project$Layout$Shared$pitchWith = function (sc) {
	var a = $author$project$Addr$named($author$project$Addr$Pitch);
	return A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$hero(
						a('PITCH')),
						$author$project$Layout$Shared$knob(
						a('FINE'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$fader(
						a('GLIDE_TIME'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$auto(
						a('STEAL')),
						$author$project$Layout$Shared$auto(
						a('SNAP'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			sc,
			A2($author$project$Layout$Shared$module_, 1, 'PITCH')));
};
var $author$project$Layout$Shared$pitch = $author$project$Layout$Shared$pitchWith(
	$author$project$Layout$Shared$strip($author$project$Layout$Page$Pit));
var $author$project$Layout$Algo$modules = _Utils_ap(
	_List_fromArray(
		[$author$project$Layout$Algo$algorithm, $author$project$Layout$Shared$pitch]),
	_Utils_ap(
		A2($elm$core$List$map, $author$project$Layout$Algo$operator, $author$project$Addr$operators),
		_Utils_ap(
			_List_fromArray(
				[
					$author$project$Layout$Shared$filter,
					$author$project$Layout$Shared$filterMod,
					$author$project$Layout$Shared$voiceFx($author$project$Layout$Page$Fx),
					$author$project$Layout$Shared$ampOut
				]),
			_Utils_ap(
				A2($elm$core$List$map, $author$project$Layout$Shared$envelope, $author$project$Addr$envs),
				_Utils_ap(
					A2($elm$core$List$map, $author$project$Layout$Shared$lfo, $author$project$Addr$lfos),
					_List_fromArray(
						[$author$project$Layout$Shared$mod]))))));
var $author$project$Layout$Page$Exc = {$: 3};
var $author$project$Ui$Chip$Resonator = 4;
var $author$project$Addr$Modal = {$: 9};
var $author$project$Layout$Modal$a = $author$project$Addr$named($author$project$Addr$Modal);
var $author$project$Layout$Modal$exciter = A2(
	$author$project$Layout$Shared$withGroups,
	_List_fromArray(
		[
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$hero(
					$author$project$Layout$Modal$a('EXCITE')),
					$author$project$Layout$Shared$hero(
					$author$project$Layout$Modal$a('FORCE')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('COLOR')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('BURST')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('SPEED'))
				]))
		]),
	A2(
		$author$project$Layout$Shared$withScreen,
		A2(
			$author$project$Layout$Shared$gauge,
			$author$project$Layout$Page$Scoped($author$project$Layout$Page$Exc),
			0),
		A2($author$project$Layout$Shared$module_, 4, 'EXCITER')));
var $author$project$Layout$Page$Mdl2 = {$: 4};
var $author$project$Layout$Modal$modal2 = A2(
	$author$project$Layout$Shared$withGroups,
	_List_fromArray(
		[
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$auto(
					$author$project$Layout$Modal$a('MODES'))
				])),
			A2(
			$author$project$Layout$Shared$group,
			'BODY',
			_List_fromArray(
				[
					$author$project$Layout$Shared$knob(
					$author$project$Layout$Modal$a('COUPLE')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('HALO')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('BODY'))
				])),
			A2(
			$author$project$Layout$Shared$group,
			'ENSEMBLE',
			_List_fromArray(
				[
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('E.DPT')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('E.RAT')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('E.MIX'))
				]))
		]),
	A2(
		$author$project$Layout$Shared$withScreen,
		A2(
			$author$project$Layout$Shared$gauge,
			$author$project$Layout$Page$Scoped($author$project$Layout$Page$Mdl2),
			0),
		A2($author$project$Layout$Shared$module_, 4, 'MODAL-2')));
var $author$project$Layout$Page$Res = {$: 2};
var $author$project$Layout$Modal$resonator = A2(
	$author$project$Layout$Shared$withGroups,
	_List_fromArray(
		[
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$hero(
					$author$project$Layout$Modal$a('BRIGHT')),
					$author$project$Layout$Shared$knob(
					$author$project$Layout$Modal$a('STRUCTURE'))
				])),
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('DAMP')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Modal$a('POS'))
				]))
		]),
	A2(
		$author$project$Layout$Shared$withScreen,
		A2(
			$author$project$Layout$Shared$gauge,
			$author$project$Layout$Page$Scoped($author$project$Layout$Page$Res),
			2),
		A2(
			$author$project$Layout$Shared$withHeader,
			_List_fromArray(
				[
					$author$project$Layout$Modal$a('MODE')
				]),
			A2($author$project$Layout$Shared$module_, 4, 'RESONATOR'))));
var $author$project$Layout$Modal$modules = _Utils_ap(
	_List_fromArray(
		[
			$author$project$Layout$Modal$resonator,
			$author$project$Layout$Modal$exciter,
			$author$project$Layout$Modal$modal2,
			$author$project$Layout$Shared$pitch,
			$author$project$Layout$Shared$filter,
			$author$project$Layout$Shared$filterMod,
			$author$project$Layout$Shared$voiceFx($author$project$Layout$Page$Fx),
			$author$project$Layout$Shared$ampOut
		]),
	_Utils_ap(
		A2($elm$core$List$map, $author$project$Layout$Shared$envelope, $author$project$Addr$envs),
		_Utils_ap(
			A2($elm$core$List$map, $author$project$Layout$Shared$lfo, $author$project$Addr$lfos),
			_List_fromArray(
				[$author$project$Layout$Shared$mod]))));
var $author$project$Layout$Page$TapePit = {$: 8};
var $author$project$Layout$Page$Deck = {$: 6};
var $author$project$Ui$Chip$Tape = 5;
var $author$project$Addr$Tape = {$: 10};
var $author$project$Layout$Tape$a = $author$project$Addr$named($author$project$Addr$Tape);
var $author$project$Layout$Tape$deck = A2(
	$author$project$Layout$Shared$withGroups,
	_List_fromArray(
		[
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$hero(
					$author$project$Layout$Tape$a('POSITION'))
				])),
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$knob(
					$author$project$Layout$Tape$a('MOTION')),
					$author$project$Layout$Shared$auto(
					$author$project$Layout$Tape$a('TYPE'))
				])),
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Tape$a('SIZE')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Tape$a('DRAG')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Tape$a('STRETCH_LENGTH')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Tape$a('XFADE')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Tape$a('DRIFT')),
					$author$project$Layout$Shared$auto(
					$author$project$Layout$Tape$a('MODE'))
				]))
		]),
	A2(
		$author$project$Layout$Shared$withScreen,
		A2(
			$author$project$Layout$Shared$gauge,
			$author$project$Layout$Page$Scoped($author$project$Layout$Page$Deck),
			1),
		A2(
			$author$project$Layout$Shared$withHeader,
			_List_fromArray(
				[
					$author$project$Layout$Tape$a('MODEL')
				]),
			A2($author$project$Layout$Shared$module_, 5, 'DECK'))));
var $author$project$Layout$Page$Mch = {$: 7};
var $author$project$Layout$Tape$machine = A2(
	$author$project$Layout$Shared$withGroups,
	_List_fromArray(
		[
			A2(
			$author$project$Layout$Shared$group,
			'TAPE',
			_List_fromArray(
				[
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Tape$a('TAPE')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Tape$a('AGE')),
					$author$project$Layout$Shared$auto(
					$author$project$Layout$Tape$a('WOW'))
				])),
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$auto(
					$author$project$Layout$Tape$a('TRON')),
					$author$project$Layout$Shared$auto(
					$author$project$Layout$Tape$a('RETRIG')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Tape$a('GRAIN')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Tape$a('SPRAY')),
					$author$project$Layout$Shared$auto(
					$author$project$Layout$Tape$a('STRETCH_END')),
					$author$project$Layout$Shared$auto(
					$author$project$Layout$Tape$a('KEY'))
				]))
		]),
	A2(
		$author$project$Layout$Shared$withScreen,
		A2(
			$author$project$Layout$Shared$gauge,
			$author$project$Layout$Page$Scoped($author$project$Layout$Page$Mch),
			0),
		A2($author$project$Layout$Shared$module_, 5, 'MACHINE')));
var $author$project$Layout$Shared$Note = function (a) {
	return {$: 1, a: a};
};
var $author$project$Layout$Shared$SourceText = {$: 0};
var $author$project$Layout$Page$Src = {$: 5};
var $author$project$Layout$Tape$source = A2(
	$author$project$Layout$Shared$withExtras,
	_List_fromArray(
		[
			$author$project$Layout$Shared$SourceText,
			$author$project$Layout$Shared$Note('THE SAMPLE LIVES ON THE CARD: CHANGE IT ON THE UNIT, AND THE EDITOR SHOWS IT')
		]),
	A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$knob(
						$author$project$Layout$Tape$a('START')),
						$author$project$Layout$Shared$knob(
						$author$project$Layout$Tape$a('END'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			A2(
				$author$project$Layout$Shared$gauge,
				$author$project$Layout$Page$Scoped($author$project$Layout$Page$Src),
				1),
			A2(
				$author$project$Layout$Shared$withNote,
				'READ-ONLY',
				A2($author$project$Layout$Shared$module_, 5, 'SOURCE')))));
var $author$project$Layout$Tape$modules = _Utils_ap(
	_List_fromArray(
		[
			$author$project$Layout$Tape$source,
			$author$project$Layout$Tape$deck,
			$author$project$Layout$Tape$machine,
			$author$project$Layout$Shared$pitchWith(
			A2(
				$author$project$Layout$Shared$gauge,
				$author$project$Layout$Page$Scoped($author$project$Layout$Page$TapePit),
				0)),
			$author$project$Layout$Shared$filter,
			$author$project$Layout$Shared$filterMod,
			$author$project$Layout$Shared$voiceFx($author$project$Layout$Page$Fx),
			$author$project$Layout$Shared$ampOut
		]),
	_Utils_ap(
		A2($elm$core$List$map, $author$project$Layout$Shared$envelope, $author$project$Addr$envs),
		_Utils_ap(
			A2($elm$core$List$map, $author$project$Layout$Shared$lfo, $author$project$Addr$lfos),
			_List_fromArray(
				[$author$project$Layout$Shared$mod]))));
var $author$project$Addr$Osc1 = 0;
var $author$project$Addr$Osc2 = 1;
var $author$project$Layout$Page$Noise = {$: 1};
var $author$project$Ui$Chip$Oscillators = 3;
var $author$project$Addr$Va = {$: 8};
var $author$project$Layout$Va$va = $author$project$Addr$named($author$project$Addr$Va);
var $author$project$Layout$Va$mixer = A2(
	$author$project$Layout$Shared$withGroups,
	_List_fromArray(
		[
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Va$va('SUB'))
				])),
			A2(
			$author$project$Layout$Shared$group,
			'NOISE',
			_List_fromArray(
				[
					$author$project$Layout$Shared$auto(
					$author$project$Layout$Va$va('NOISEKIND')),
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Va$va('NOISE'))
				]))
		]),
	A2(
		$author$project$Layout$Shared$withScreen,
		A2(
			$author$project$Layout$Shared$gauge,
			$author$project$Layout$Page$Scoped($author$project$Layout$Page$Noise),
			1),
		A2($author$project$Layout$Shared$module_, 3, 'MIXER')));
var $author$project$Layout$Page$VaPage = {$: 0};
var $author$project$Addr$oscNumber = function (o) {
	if (!o) {
		return 1;
	} else {
		return 2;
	}
};
var $author$project$Addr$vaOsc = F2(
	function (o, _v0) {
		var f = _v0;
		return 'VA.' + (f + $elm$core$String$fromInt(
			$author$project$Addr$oscNumber(o)));
	});
var $author$project$Addr$vaNamed = F2(
	function (o, w) {
		return A2(
			$elm$core$Result$fromMaybe,
			'VA.' + (w + $elm$core$String$fromInt(
				$author$project$Addr$oscNumber(o))),
			A2(
				$elm$core$Maybe$map,
				$author$project$Addr$vaOsc(o),
				$author$project$Addr$field(w)));
	});
var $author$project$Layout$Shared$withReads = F2(
	function (rs, _v0) {
		var s = _v0;
		return _Utils_update(
			s,
			{aW: rs});
	});
var $author$project$Layout$Va$mode = A2(
	$author$project$Layout$Shared$withGroups,
	_List_fromArray(
		[
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$menu(
					$author$project$Layout$Va$va('MODE'))
				])),
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$hero(
					$author$project$Layout$Va$va('AMOUNT'))
				])),
			A2(
			$author$project$Layout$Shared$group,
			'',
			_List_fromArray(
				[
					$author$project$Layout$Shared$fader(
					$author$project$Layout$Va$va('STAB'))
				]))
		]),
	A2(
		$author$project$Layout$Shared$withScreen,
		A2(
			$author$project$Layout$Shared$withReads,
			_List_fromArray(
				[
					A2($author$project$Addr$vaNamed, 0, 'SHAPE'),
					A2($author$project$Addr$vaNamed, 1, 'SHAPE')
				]),
			A2(
				$author$project$Layout$Shared$gauge,
				$author$project$Layout$Page$Scoped($author$project$Layout$Page$VaPage),
				2)),
		A2($author$project$Layout$Shared$module_, 3, 'MODE')));
var $author$project$Ui$Screen$VaWave = {$: 6};
var $author$project$Layout$Va$waveCell = function (o) {
	if (!o) {
		return 0;
	} else {
		return 1;
	}
};
var $author$project$Layout$Va$osc = function (o) {
	var a = $author$project$Addr$vaNamed(o);
	return A2(
		$author$project$Layout$Shared$withGroups,
		_List_fromArray(
			[
				A2(
				$author$project$Layout$Shared$group,
				'',
				_List_fromArray(
					[
						$author$project$Layout$Shared$hero(
						a('WAVE')),
						$author$project$Layout$Shared$knob(
						a('SHAPE'))
					])),
				A2(
				$author$project$Layout$Shared$group,
				'PITCH',
				_List_fromArray(
					[
						$author$project$Layout$Shared$knob(
						a('CRSE')),
						$author$project$Layout$Shared$knob(
						a('FINE'))
					]))
			]),
		A2(
			$author$project$Layout$Shared$withScreen,
			A2(
				$author$project$Layout$Shared$withFallback,
				$author$project$Ui$Screen$VaWave,
				A2(
					$author$project$Layout$Shared$withReads,
					_List_fromArray(
						[
							a('SHAPE')
						]),
					A2(
						$author$project$Layout$Shared$gauge,
						$author$project$Layout$Page$Scoped($author$project$Layout$Page$VaPage),
						$author$project$Layout$Va$waveCell(o)))),
			A2(
				$author$project$Layout$Shared$module_,
				3,
				'OSC ' + $elm$core$String$fromInt(
					$author$project$Addr$oscNumber(o)))));
};
var $author$project$Layout$Va$modules = _Utils_ap(
	_List_fromArray(
		[
			$author$project$Layout$Va$osc(0),
			$author$project$Layout$Va$osc(1),
			$author$project$Layout$Va$mode,
			$author$project$Layout$Va$mixer,
			$author$project$Layout$Shared$filter,
			$author$project$Layout$Shared$filterMod,
			$author$project$Layout$Shared$voiceFx($author$project$Layout$Page$Fx),
			$author$project$Layout$Shared$ampOut
		]),
	_Utils_ap(
		A2($elm$core$List$map, $author$project$Layout$Shared$envelope, $author$project$Addr$envs),
		_Utils_ap(
			A2($elm$core$List$map, $author$project$Layout$Shared$lfo, $author$project$Addr$lfos),
			_List_fromArray(
				[$author$project$Layout$Shared$pitch, $author$project$Layout$Shared$mod]))));
var $author$project$View$EnginePage$layout = F2(
	function (e, tab) {
		var one = function (ms) {
			return {bK: ms, b2: ms};
		};
		switch (e) {
			case 0:
				return one($author$project$Layout$Algo$modules);
			case 2:
				return one($author$project$Layout$Va$modules);
			case 1:
				return one($author$project$Layout$Modal$modules);
			case 3:
				return one($author$project$Layout$Tape$modules);
			default:
				return {
					bK: $author$project$Layout$Drum$every,
					b2: function () {
						if (!tab.$) {
							return $author$project$Layout$Drum$kit;
						} else {
							var p = tab.a;
							return $author$project$Layout$Drum$pad(p);
						}
					}()
				};
		}
	});
var $author$project$Ui$Page$link = F2(
	function (l, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{aP: l});
	});
var $author$project$Layout$Shared$chip = function (_v0) {
	var m = _v0;
	return m.ch;
};
var $author$project$Ui$Selector$Config = $elm$core$Basics$identity;
var $author$project$Ui$Selector$fromOptions = F2(
	function (a, opts) {
		return (($elm$core$List$length(opts) >= 4) && ($elm$core$List$length(opts) <= 8)) ? $elm$core$Maybe$Just(
			{w: a, aO: '', bi: opts}) : $elm$core$Maybe$Nothing;
	});
var $author$project$Ui$Toggle$Config = $elm$core$Basics$identity;
var $author$project$Ui$Toggle$Three = F3(
	function (a, b, c) {
		return {$: 1, a: a, b: b, c: c};
	});
var $author$project$Ui$Toggle$three = F4(
	function (a, x, y, z) {
		return {
			w: a,
			aO: '',
			bn: A3($author$project$Ui$Toggle$Three, x, y, z)
		};
	});
var $author$project$Ui$Toggle$Two = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Ui$Toggle$two = F3(
	function (a, x, y) {
		return {
			w: a,
			aO: '',
			bn: A2($author$project$Ui$Toggle$Two, x, y)
		};
	});
var $author$project$Ui$Toggle$fromOptions = F2(
	function (a, opts) {
		if (!opts.b) {
			return $elm$core$Maybe$Nothing;
		} else {
			if (!opts.b.b) {
				return $elm$core$Maybe$Nothing;
			} else {
				if (!opts.b.b.b) {
					var x = opts.a;
					var _v1 = opts.b;
					var y = _v1.a;
					return $elm$core$Maybe$Just(
						A3($author$project$Ui$Toggle$two, a, x, y));
				} else {
					if (!opts.b.b.b.b) {
						var x = opts.a;
						var _v2 = opts.b;
						var y = _v2.a;
						var _v3 = _v2.b;
						var z = _v3.a;
						return $elm$core$Maybe$Just(
							A4($author$project$Ui$Toggle$three, a, x, y, z));
					} else {
						var _v4 = opts.b;
						var _v5 = _v4.b;
						var _v6 = _v5.b;
						return $elm$core$Maybe$Nothing;
					}
				}
			}
		}
	});
var $author$project$Ui$Selector$label = F2(
	function (l, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{aO: l});
	});
var $author$project$Ui$Toggle$label = F2(
	function (l, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{aO: l});
	});
var $author$project$View$EnginePage$MenuMsg = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$Control$choice = function (_v0) {
	var c = _v0;
	return c.a5;
};
var $author$project$Ui$Control$choiceText = F2(
	function (opts, ch) {
		var _v0 = $author$project$Ui$Control$choice(ch);
		switch (_v0.$) {
			case 0:
				var i = _v0.a;
				return A2(
					$elm$core$Maybe$withDefault,
					'--',
					A2(
						$elm$core$Maybe$map,
						$elm$core$Tuple$second,
						$elm$core$List$head(
							A2(
								$elm$core$List$filter,
								function (_v1) {
									var k = _v1.a;
									return _Utils_eq(k, i);
								},
								opts))));
			case 1:
				return '??';
			default:
				return '--';
		}
	});
var $author$project$Ui$Control$Missing = {$: 1};
var $author$project$Ui$Control$Reading = $elm$core$Basics$identity;
var $author$project$Ui$Control$missing = {bC: $author$project$Ui$Control$Missing, U: $author$project$Ui$Control$Clear};
var $author$project$Ui$Control$Known = function (a) {
	return {$: 0, a: a};
};
var $author$project$Ui$Control$reading = F2(
	function (n, t) {
		return {
			bC: $author$project$Ui$Control$Known(
				{
					cG: A3($elm$core$Basics$clamp, 0, 1, n),
					aZ: t
				}),
			U: $author$project$Ui$Control$Clear
		};
	});
var $author$project$Ui$Control$refused = F2(
	function (why, _v0) {
		var r = _v0;
		return _Utils_update(
			r,
			{
				U: $author$project$Ui$Control$Refused(why)
			});
	});
var $author$project$View$EnginePage$choiceReading = F2(
	function (m, p) {
		var ch = A2($author$project$View$EnginePage$chosen, m, p);
		var r = function () {
			var _v1 = $author$project$Ui$Control$current(ch);
			if (!_v1.$) {
				var i = _v1.a;
				return A2(
					$elm$core$Maybe$withDefault,
					$author$project$Ui$Control$missing,
					A2(
						$elm$core$Maybe$map,
						function (_v4) {
							var k = _v4.a;
							return A2(
								$author$project$Ui$Control$reading,
								k / A2(
									$elm$core$Basics$max,
									1,
									$elm$core$List$length(p.bi) - 1),
								A2($author$project$Ui$Control$choiceText, p.bi, ch));
						},
						$elm$core$List$head(
							A2(
								$elm$core$List$filter,
								function (_v3) {
									var o = _v3.b;
									return _Utils_eq(o, i);
								},
								A2(
									$elm$core$List$indexedMap,
									F2(
										function (k, _v2) {
											var o = _v2.a;
											return _Utils_Tuple2(k, o);
										}),
									p.bi)))));
			} else {
				return $author$project$Ui$Control$missing;
			}
		}();
		var _v0 = A2($author$project$Model$refusal, p.w, m);
		if (!_v0.$) {
			var why = _v0.a;
			return A2($author$project$Ui$Control$refused, why, r);
		} else {
			return r;
		}
	});
var $author$project$Ui$Knob$Big = 1;
var $author$project$Ui$Knob$Config = $elm$core$Basics$identity;
var $author$project$Ui$Knob$hero = function (_v0) {
	var c = _v0;
	return _Utils_update(
		c,
		{cQ: 1});
};
var $author$project$Ui$Knob$label = F2(
	function (l, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{aO: l});
	});
var $author$project$Ui$Knob$Regular = 0;
var $author$project$Ui$Tokens$Chars = $elm$core$Basics$identity;
var $author$project$Ui$Tokens$readoutChars = 8;
var $author$project$Ui$Knob$new = F2(
	function (a, p) {
		return {w: a, bI: $author$project$Ui$Tokens$readoutChars, aO: '', cK: p, cQ: 0};
	});
var $author$project$Ui$Control$Bipolar = 1;
var $author$project$Ui$Control$Unipolar = 0;
var $author$project$Ui$Control$polarity = function (r) {
	return ((r.cC < 0) && (r.cx > 0)) ? 1 : 0;
};
var $author$project$Ui$Control$Hero = 1;
var $author$project$Ui$Control$Knob = 0;
var $elm$html$Html$Attributes$title = $elm$html$Html$Attributes$stringProperty('title');
var $author$project$Ui$Control$cell = F3(
	function (attrs, label, body) {
		return A2(
			$elm$html$Html$div,
			A2(
				$elm$core$List$cons,
				$elm$html$Html$Attributes$class('c'),
				attrs),
			A2(
				$elm$core$List$cons,
				A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('k'),
							$elm$html$Html$Attributes$title(label)
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(label)
						])),
				body));
	});
var $author$project$Ui$Knob$diameter = function (s) {
	if (!s) {
		return 44;
	} else {
		return 66;
	}
};
var $author$project$Ui$Tokens$KnobBody = 3;
var $author$project$Ui$Tokens$KnobFace = 4;
var $elm$svg$Svg$trustedNode = _VirtualDom_nodeNS('http://www.w3.org/2000/svg');
var $elm$svg$Svg$circle = $elm$svg$Svg$trustedNode('circle');
var $elm$svg$Svg$Attributes$cx = _VirtualDom_attribute('cx');
var $elm$svg$Svg$Attributes$cy = _VirtualDom_attribute('cy');
var $author$project$Ui$Tokens$Acc = 1;
var $author$project$Ui$Tokens$KnobPointer = 5;
var $elm$core$Basics$cos = _Basics_cos;
var $elm$core$Basics$pi = _Basics_pi;
var $elm$core$Basics$degrees = function (angleInDegrees) {
	return (angleInDegrees * $elm$core$Basics$pi) / 180;
};
var $elm$core$Basics$sin = _Basics_sin;
var $author$project$Ui$Knob$arc = F2(
	function (t0, t1) {
		var point = function (t) {
			return _Utils_Tuple2(
				50 + (44 * $elm$core$Basics$sin(
					$elm$core$Basics$degrees((-135) + (270 * t)))),
				50 - (44 * $elm$core$Basics$cos(
					$elm$core$Basics$degrees((-135) + (270 * t)))));
		};
		var n = $elm$core$String$fromFloat;
		var _v0 = point(t1);
		var x1 = _v0.a;
		var y1 = _v0.b;
		var _v1 = point(t0);
		var x0 = _v1.a;
		var y0 = _v1.b;
		return 'M' + (n(x0) + (' ' + (n(y0) + ('A44 44 0 0 ' + (((_Utils_cmp(t1, t0) > 0) ? '1' : '0') + (' ' + (n(x1) + (' ' + n(y1)))))))));
	});
var $elm$svg$Svg$Attributes$d = _VirtualDom_attribute('d');
var $elm$svg$Svg$Attributes$fill = _VirtualDom_attribute('fill');
var $elm$svg$Svg$line = $elm$svg$Svg$trustedNode('line');
var $elm$svg$Svg$path = $elm$svg$Svg$trustedNode('path');
var $elm$svg$Svg$Attributes$strokeLinecap = _VirtualDom_attribute('stroke-linecap');
var $elm$svg$Svg$Attributes$strokeWidth = _VirtualDom_attribute('stroke-width');
var $elm$svg$Svg$Attributes$style = _VirtualDom_attribute('style');
var $elm$svg$Svg$Attributes$transform = _VirtualDom_attribute('transform');
var $author$project$Ui$Tokens$var = function (t) {
	return 'var(--' + (function () {
		switch (t) {
			case 0:
				return 'ink';
			case 1:
				return 'acc';
			case 2:
				return 'mod';
			case 3:
				return 'knob';
			case 4:
				return 'knob2';
			default:
				return 'knob-ptr';
		}
	}() + ')');
};
var $elm$svg$Svg$Attributes$x1 = _VirtualDom_attribute('x1');
var $elm$svg$Svg$Attributes$x2 = _VirtualDom_attribute('x2');
var $elm$svg$Svg$Attributes$y1 = _VirtualDom_attribute('y1');
var $elm$svg$Svg$Attributes$y2 = _VirtualDom_attribute('y2');
var $author$project$Ui$Knob$pointer = F2(
	function (fill, t) {
		return _Utils_ap(
			function () {
				if (!fill) {
					return _List_Nil;
				} else {
					return _List_fromArray(
						[
							A2(
							$elm$svg$Svg$path,
							_List_fromArray(
								[
									$elm$svg$Svg$Attributes$d(
									A2($author$project$Ui$Knob$arc, 0.5, t)),
									$elm$svg$Svg$Attributes$fill('none'),
									$elm$svg$Svg$Attributes$strokeWidth('6'),
									$elm$svg$Svg$Attributes$style(
									'stroke:' + $author$project$Ui$Tokens$var(1))
								]),
							_List_Nil)
						]);
				}
			}(),
			_List_fromArray(
				[
					A2(
					$elm$svg$Svg$line,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$x1('50'),
							$elm$svg$Svg$Attributes$y1('50'),
							$elm$svg$Svg$Attributes$x2('50'),
							$elm$svg$Svg$Attributes$y2('20'),
							$elm$svg$Svg$Attributes$strokeWidth('6'),
							$elm$svg$Svg$Attributes$strokeLinecap('round'),
							$elm$svg$Svg$Attributes$style(
							'stroke:' + $author$project$Ui$Tokens$var(5)),
							$elm$svg$Svg$Attributes$transform(
							'rotate(' + ($elm$core$String$fromFloat((-135) + (270 * t)) + ' 50 50)'))
						]),
					_List_Nil)
				]));
	});
var $elm$svg$Svg$Attributes$r = _VirtualDom_attribute('r');
var $elm$svg$Svg$svg = $elm$svg$Svg$trustedNode('svg');
var $author$project$Ui$Tokens$Ink = 0;
var $author$project$Ui$Knob$tick = function (i) {
	var inner = (!A2($elm$core$Basics$modBy, 5, i)) ? 38 : 41;
	var a = $elm$core$Basics$degrees((-135) + (27 * i));
	return A2(
		$elm$svg$Svg$line,
		_List_fromArray(
			[
				$elm$svg$Svg$Attributes$x1(
				$elm$core$String$fromFloat(
					50 + (47 * $elm$core$Basics$sin(a)))),
				$elm$svg$Svg$Attributes$y1(
				$elm$core$String$fromFloat(
					50 - (47 * $elm$core$Basics$cos(a)))),
				$elm$svg$Svg$Attributes$x2(
				$elm$core$String$fromFloat(
					50 + (inner * $elm$core$Basics$sin(a)))),
				$elm$svg$Svg$Attributes$y2(
				$elm$core$String$fromFloat(
					50 - (inner * $elm$core$Basics$cos(a)))),
				$elm$svg$Svg$Attributes$strokeWidth(
				(!A2($elm$core$Basics$modBy, 5, i)) ? '3.5' : '2'),
				$elm$svg$Svg$Attributes$style(
				'stroke:' + $author$project$Ui$Tokens$var(0))
			]),
		_List_Nil);
};
var $elm$svg$Svg$Attributes$viewBox = _VirtualDom_attribute('viewBox');
var $author$project$Ui$Knob$face = F2(
	function (fill, at) {
		return A2(
			$elm$svg$Svg$svg,
			_List_fromArray(
				[
					$elm$svg$Svg$Attributes$viewBox('0 0 100 100')
				]),
			_Utils_ap(
				A2(
					$elm$core$List$map,
					$author$project$Ui$Knob$tick,
					A2($elm$core$List$range, 0, 10)),
				_Utils_ap(
					_List_fromArray(
						[
							A2(
							$elm$svg$Svg$circle,
							_List_fromArray(
								[
									$elm$svg$Svg$Attributes$cx('50'),
									$elm$svg$Svg$Attributes$cy('50'),
									$elm$svg$Svg$Attributes$r('33'),
									$elm$svg$Svg$Attributes$style(
									'fill:' + $author$project$Ui$Tokens$var(3))
								]),
							_List_Nil),
							A2(
							$elm$svg$Svg$circle,
							_List_fromArray(
								[
									$elm$svg$Svg$Attributes$cx('50'),
									$elm$svg$Svg$Attributes$cy('50'),
									$elm$svg$Svg$Attributes$r('26'),
									$elm$svg$Svg$Attributes$style(
									'fill:' + $author$project$Ui$Tokens$var(4))
								]),
							_List_Nil)
						]),
					function () {
						if (!at.$) {
							var t = at.a;
							return A2($author$project$Ui$Knob$pointer, fill, t);
						} else {
							return _List_Nil;
						}
					}())));
	});
var $author$project$Ui$Control$Reset = function (a) {
	return {$: 5, a: a};
};
var $author$project$Ui$Control$Grab = F3(
	function (a, b, c) {
		return {$: 0, a: a, b: b, c: c};
	});
var $elm$json$Json$Decode$andThen = _Json_andThen;
var $author$project$Ui$Control$Down = 1;
var $author$project$Ui$Control$Step = F2(
	function (a, b) {
		return {$: 3, a: a, b: b};
	});
var $author$project$Ui$Control$Up = 0;
var $elm$json$Json$Decode$fail = _Json_fail;
var $author$project$Ui$Control$arrow = F2(
	function (a, key) {
		switch (key) {
			case 'ArrowUp':
				return $elm$json$Json$Decode$succeed(
					_Utils_Tuple2(
						A2($author$project$Ui$Control$Step, a, 0),
						true));
			case 'ArrowRight':
				return $elm$json$Json$Decode$succeed(
					_Utils_Tuple2(
						A2($author$project$Ui$Control$Step, a, 0),
						true));
			case 'ArrowDown':
				return $elm$json$Json$Decode$succeed(
					_Utils_Tuple2(
						A2($author$project$Ui$Control$Step, a, 1),
						true));
			case 'ArrowLeft':
				return $elm$json$Json$Decode$succeed(
					_Utils_Tuple2(
						A2($author$project$Ui$Control$Step, a, 1),
						true));
			default:
				return $elm$json$Json$Decode$fail('not an arrow');
		}
	});
var $elm$virtual_dom$VirtualDom$MayPreventDefault = function (a) {
	return {$: 2, a: a};
};
var $elm$html$Html$Events$preventDefaultOn = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$MayPreventDefault(decoder));
	});
var $elm$html$Html$Attributes$tabindex = function (n) {
	return A2(
		_VirtualDom_attribute,
		'tabIndex',
		$elm$core$String$fromInt(n));
};
var $author$project$Ui$Control$wheel = F2(
	function (a, dy) {
		return (dy < 0) ? $elm$json$Json$Decode$succeed(
			_Utils_Tuple2(
				A2($author$project$Ui$Control$Step, a, 0),
				true)) : ((dy > 0) ? $elm$json$Json$Decode$succeed(
			_Utils_Tuple2(
				A2($author$project$Ui$Control$Step, a, 1),
				true)) : $elm$json$Json$Decode$fail('no roll'));
	});
var $author$project$Ui$Control$drag = F2(
	function (a, t) {
		return _List_fromArray(
			[
				$elm$html$Html$Attributes$tabindex(0),
				A2(
				$elm$html$Html$Events$preventDefaultOn,
				'mousedown',
				A2(
					$elm$json$Json$Decode$map,
					function (y) {
						return _Utils_Tuple2(
							A3($author$project$Ui$Control$Grab, a, t, y),
							true);
					},
					A2($elm$json$Json$Decode$field, 'clientY', $elm$json$Json$Decode$float))),
				A2(
				$elm$html$Html$Events$preventDefaultOn,
				'wheel',
				A2(
					$elm$json$Json$Decode$andThen,
					$author$project$Ui$Control$wheel(a),
					A2($elm$json$Json$Decode$field, 'deltaY', $elm$json$Json$Decode$float))),
				A2(
				$elm$html$Html$Events$preventDefaultOn,
				'keydown',
				A2(
					$elm$json$Json$Decode$andThen,
					$author$project$Ui$Control$arrow(a),
					A2($elm$json$Json$Decode$field, 'key', $elm$json$Json$Decode$string)))
			]);
	});
var $elm$html$Html$Events$onDoubleClick = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'dblclick',
		$elm$json$Json$Decode$succeed(msg));
};
var $author$project$Ui$Control$grab = F2(
	function (a, t) {
		return A2(
			$elm$core$List$cons,
			$elm$html$Html$Events$onDoubleClick(
				$author$project$Ui$Control$Reset(a)),
			A2($author$project$Ui$Control$drag, a, t));
	});
var $author$project$Ui$Control$isBipolar = function (p) {
	return p === 1;
};
var $author$project$Ui$Control$mark = function (_v0) {
	var r = _v0;
	return r.U;
};
var $author$project$Ui$Control$markAttrs = function (m) {
	if (!m.$) {
		return _List_Nil;
	} else {
		var why = m.a;
		return _List_fromArray(
			[
				$elm$html$Html$Attributes$class('refused'),
				$elm$html$Html$Attributes$title('THE UNIT REFUSED: ' + why),
				A2($elm$html$Html$Attributes$attribute, 'aria-description', 'the unit refused: ' + why)
			]);
	}
};
var $author$project$Ui$Control$norm = function (_v0) {
	var r = _v0;
	var _v1 = r.bC;
	if (!_v1.$) {
		var k = _v1.a;
		return $elm$core$Maybe$Just(k.cG);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Ui$Knob$FromCentre = 1;
var $author$project$Ui$Knob$NoFill = 0;
var $author$project$Ui$Knob$polarityFill = function (p) {
	return $author$project$Ui$Control$isBipolar(p) ? 1 : 0;
};
var $author$project$Ui$Tokens$charsCount = function (_v0) {
	var n = _v0;
	return n;
};
var $elm$virtual_dom$VirtualDom$style = _VirtualDom_style;
var $elm$html$Html$Attributes$style = $elm$virtual_dom$VirtualDom$style;
var $author$project$Ui$Control$text = function (_v0) {
	var r = _v0;
	var _v1 = r.bC;
	if (!_v1.$) {
		var k = _v1.a;
		return k.aZ;
	} else {
		return '--';
	}
};
var $author$project$Ui$Control$readout = F2(
	function (chars, r) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2('v', true),
							_Utils_Tuple2(
							'missing',
							_Utils_eq(
								$author$project$Ui$Control$norm(r),
								$elm$core$Maybe$Nothing))
						])),
					A2(
					$elm$html$Html$Attributes$style,
					'width',
					$elm$core$String$fromInt(
						$author$project$Ui$Tokens$charsCount(chars)) + 'ch'),
					$elm$html$Html$Attributes$title(
					$author$project$Ui$Control$text(r))
				]),
			_List_fromArray(
				[
					$elm$html$Html$text(
					$author$project$Ui$Control$text(r))
				]));
	});
var $author$project$Ui$Control$ariaLabel = $elm$html$Html$Attributes$attribute('aria-label');
var $author$project$Ui$Control$ariaRole = $elm$html$Html$Attributes$attribute('role');
var $author$project$Ui$Control$ariaValueText = $elm$html$Html$Attributes$attribute('aria-valuetext');
var $author$project$Ui$Control$slider = F2(
	function (label, r) {
		return _Utils_ap(
			_List_fromArray(
				[
					$author$project$Ui$Control$ariaRole('slider'),
					$author$project$Ui$Control$ariaLabel(label),
					$author$project$Ui$Control$ariaValueText(
					$author$project$Ui$Control$text(r)),
					A2($elm$html$Html$Attributes$attribute, 'aria-valuemin', '0'),
					A2($elm$html$Html$Attributes$attribute, 'aria-valuemax', '100')
				]),
			function () {
				var _v0 = $author$project$Ui$Control$norm(r);
				if (!_v0.$) {
					var n = _v0.a;
					return _List_fromArray(
						[
							A2(
							$elm$html$Html$Attributes$attribute,
							'aria-valuenow',
							$elm$core$String$fromInt(
								$elm$core$Basics$round(n * 100)))
						]);
				} else {
					return _List_Nil;
				}
			}());
	});
var $author$project$Ui$Tokens$LabelFace = 0;
var $author$project$Ui$Tokens$capitalPx = function (f) {
	switch (f) {
		case 0:
			return 7.2;
		case 1:
			return 7.5;
		case 2:
			return 9.3;
		case 3:
			return 7;
		default:
			return 9;
	}
};
var $author$project$Ui$Tokens$textPx = F2(
	function (f, s) {
		return $elm$core$Basics$ceiling(
			$elm$core$String$length(s) * $author$project$Ui$Tokens$capitalPx(f));
	});
var $author$project$Ui$Control$labelPx = function (label) {
	return A2($author$project$Ui$Tokens$textPx, 0, label) + 4;
};
var $author$project$Ui$Tokens$oneMore = function (_v0) {
	var n = _v0;
	return n + 1;
};
var $author$project$Ui$Control$snap16 = function (px) {
	return 16 * $elm$core$Basics$ceiling(px / 16);
};
var $author$project$Ui$Control$Width = $elm$core$Basics$identity;
var $author$project$Ui$Control$width = function (w) {
	return {
		bH: $author$project$Ui$Tokens$charsCount(w.bH),
		aV: A2($elm$core$Basics$max, 0, w.aV)
	};
};
var $author$project$Ui$Knob$width = function (_v0) {
	var c = _v0;
	return $author$project$Ui$Control$width(
		{
			bH: $author$project$Ui$Tokens$oneMore(c.bI),
			aV: $author$project$Ui$Control$snap16(
				A2(
					$elm$core$Basics$max,
					$author$project$Ui$Knob$diameter(c.cQ) + 8,
					$author$project$Ui$Control$labelPx(c.aO)))
		});
};
var $author$project$Ui$Control$widthText = function (_v0) {
	var w = _v0;
	return 'max(' + ($elm$core$String$fromInt(w.aV) + ('px, ' + ($elm$core$String$fromInt(w.bH) + 'ch)')));
};
var $author$project$Ui$Control$widthStyle = function (w) {
	return A2(
		$elm$html$Html$Attributes$style,
		'width',
		$author$project$Ui$Control$widthText(w));
};
var $author$project$Ui$Knob$view = F2(
	function (config, r) {
		var c = config;
		var travel = function () {
			var _v0 = c.cQ;
			if (!_v0) {
				return 0;
			} else {
				return 1;
			}
		}();
		var d = $elm$core$String$fromInt(
			$author$project$Ui$Knob$diameter(c.cQ)) + 'px';
		return A3(
			$author$project$Ui$Control$cell,
			_Utils_ap(
				_List_fromArray(
					[
						$elm$html$Html$Attributes$classList(
						_List_fromArray(
							[
								_Utils_Tuple2('hero', c.cQ === 1),
								_Utils_Tuple2(
								'bip',
								$author$project$Ui$Control$isBipolar(c.cK))
							])),
						$elm$html$Html$Attributes$classList(
						_List_fromArray(
							[
								_Utils_Tuple2(
								'missing',
								_Utils_eq(
									$author$project$Ui$Control$norm(r),
									$elm$core$Maybe$Nothing))
							])),
						$author$project$Ui$Control$widthStyle(
						$author$project$Ui$Knob$width(config))
					]),
				$author$project$Ui$Control$markAttrs(
					$author$project$Ui$Control$mark(r))),
			c.aO,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					A2(
						$elm$core$List$cons,
						$elm$html$Html$Attributes$class('kn'),
						A2(
							$elm$core$List$cons,
							A2($elm$html$Html$Attributes$style, 'width', d),
							A2(
								$elm$core$List$cons,
								A2($elm$html$Html$Attributes$style, 'height', d),
								_Utils_ap(
									A2($author$project$Ui$Control$slider, c.aO, r),
									A2($author$project$Ui$Control$grab, c.w, travel))))),
					_List_fromArray(
						[
							A2(
							$author$project$Ui$Knob$face,
							$author$project$Ui$Knob$polarityFill(c.cK),
							$author$project$Ui$Control$norm(r))
						])),
					A2($author$project$Ui$Control$readout, c.bI, r)
				]));
	});
var $author$project$View$EnginePage$when = F2(
	function (yes, f) {
		return yes ? f : $elm$core$Basics$identity;
	});
var $author$project$View$EnginePage$choiceKnob = F3(
	function (ctx, item, big) {
		return function (c) {
			return A2(
				$elm$html$Html$map,
				$author$project$View$EnginePage$Hand,
				A2(
					$author$project$Ui$Knob$view,
					c,
					A2($author$project$View$EnginePage$choiceReading, ctx.q, item.bl)));
		}(
			A3(
				$author$project$View$EnginePage$when,
				big,
				$author$project$Ui$Knob$hero,
				A2(
					$author$project$Ui$Knob$label,
					item.aO,
					A2(
						$author$project$Ui$Knob$new,
						item.bl.w,
						$author$project$Ui$Control$polarity(
							{cx: 1, cC: 0})))));
	});
var $author$project$Ui$Menu$Config = $elm$core$Basics$identity;
var $author$project$Ui$Menu$InHeader = 1;
var $author$project$Ui$Menu$inHeader = function (_v0) {
	var c = _v0;
	return _Utils_update(
		c,
		{bU: 1});
};
var $author$project$Ui$Menu$label = F2(
	function (l, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{aO: l});
	});
var $author$project$Ui$Menu$InPanel = 0;
var $author$project$Ui$Control$optionList = function (_v0) {
	var first = _v0.a;
	var rest = _v0.b;
	return A2($elm$core$List$cons, first, rest);
};
var $author$project$Ui$Menu$new = F2(
	function (a, opts) {
		return {
			w: a,
			cq: function (_v0) {
				return $elm$core$Maybe$Nothing;
			},
			aO: '',
			bi: $author$project$Ui$Control$optionList(opts),
			bU: 0
		};
	});
var $author$project$Ui$Control$Options = F2(
	function (a, b) {
		return {$: 0, a: a, b: b};
	});
var $author$project$Ui$Control$options = function (opts) {
	if (opts.b) {
		var first = opts.a;
		var rest = opts.b;
		return $elm$core$Maybe$Just(
			A2($author$project$Ui$Control$Options, first, rest));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Ui$Menu$Choose = F2(
	function (a, b) {
		return {$: 2, a: a, b: b};
	});
var $author$project$Ui$Menu$Close = {$: 1};
var $author$project$Ui$Menu$Open = function (a) {
	return {$: 0, a: a};
};
var $author$project$Ui$Menu$ariaBool = function (on) {
	return on ? 'true' : 'false';
};
var $author$project$Ui$Control$chosenMark = function (_v0) {
	var c = _v0;
	return c.U;
};
var $author$project$Ui$Menu$escape = function (key) {
	return (key === 'Escape') ? $elm$json$Json$Decode$succeed($author$project$Ui$Menu$Close) : $elm$json$Json$Decode$fail('not escape');
};
var $elm$json$Json$Encode$float = _Json_wrap;
var $author$project$Ui$Screen$focusIndex = function (f) {
	switch (f) {
		case 0:
			return 0;
		case 1:
			return 1;
		case 2:
			return 2;
		case 3:
			return 3;
		case 4:
			return 4;
		default:
			return 5;
	}
};
var $elm$json$Json$Encode$int = _Json_wrap;
var $author$project$Ui$Screen$regionName = function (r) {
	switch (r.$) {
		case 0:
			return 'screen';
		case 1:
			return 'gauge';
		default:
			return 'padicon';
	}
};
var $author$project$Ui$Screen$encodeSpec = function (s) {
	return $elm$json$Json$Encode$object(
		_List_fromArray(
			[
				_Utils_Tuple2(
				'engine',
				$elm$json$Json$Encode$string(
					$author$project$Unit$engineName(s.t))),
				_Utils_Tuple2(
				'page',
				$elm$json$Json$Encode$int(
					$author$project$Protocol$pageNoToInt(s.bk))),
				_Utils_Tuple2(
				'region',
				$elm$json$Json$Encode$string(
					$author$project$Ui$Screen$regionName(s.am))),
				_Utils_Tuple2(
				'focus',
				A2(
					$elm$core$Maybe$withDefault,
					$elm$json$Json$Encode$null,
					A2(
						$elm$core$Maybe$map,
						A2($elm$core$Basics$composeR, $author$project$Ui$Screen$focusIndex, $elm$json$Json$Encode$int),
						s.ae))),
				_Utils_Tuple2(
				'pad',
				A2(
					$elm$core$Maybe$withDefault,
					$elm$json$Json$Encode$null,
					A2(
						$elm$core$Maybe$map,
						A2($elm$core$Basics$composeR, $author$project$Ui$Pad$number, $elm$json$Json$Encode$int),
						s.aj))),
				_Utils_Tuple2(
				'vals',
				A2(
					$elm$json$Json$Encode$list,
					function (_v0) {
						var a = _v0.a;
						var v = _v0.b;
						return A2(
							$elm$json$Json$Encode$list,
							$elm$core$Basics$identity,
							_List_fromArray(
								[
									$elm$json$Json$Encode$string(
									$author$project$Addr$key(a)),
									$elm$json$Json$Encode$float(v)
								]));
					},
					s.c_))
			]));
};
var $elm$html$Html$Attributes$alt = $elm$html$Html$Attributes$stringProperty('alt');
var $author$project$Ui$Screen$crop = function (g) {
	switch (g.$) {
		case 0:
			return {ei: 'algo_chart', F: 112, M: 176};
		case 1:
			return {ei: 'op_wave', F: 53, M: 162};
		case 2:
			return {ei: 'env_a', F: 89, M: 128};
		case 3:
			return {ei: 'env_b', F: 89, M: 128};
		case 4:
			return {ei: 'lfo_classic', F: 53, M: 162};
		case 5:
			return {ei: 'flt_clean', F: 89, M: 128};
		case 6:
			return {ei: 'va_scope', F: 53, M: 162};
		default:
			var p = g.a;
			return {
				ei: 'pad' + $elm$core$String$fromInt(
					$author$project$Ui$Pad$number(p)),
				F: 51,
				M: 56
			};
	}
};
var $elm$html$Html$img = _VirtualDom_node('img');
var $elm$html$Html$Attributes$src = function (url) {
	return A2(
		$elm$html$Html$Attributes$stringProperty,
		'src',
		_VirtualDom_noJavaScriptOrHtmlUri(url));
};
var $author$project$Ui$Screen$image = F2(
	function (what, g) {
		return A2(
			$elm$html$Html$img,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$src(
					'glyphs/' + ($author$project$Ui$Screen$crop(g).ei + '.png')),
					$elm$html$Html$Attributes$alt(what)
				]),
			_List_Nil);
	});
var $elm$virtual_dom$VirtualDom$node = function (tag) {
	return _VirtualDom_node(
		_VirtualDom_noScript(tag));
};
var $elm$html$Html$node = $elm$virtual_dom$VirtualDom$node;
var $author$project$Ui$Screen$PadIcon = function (a) {
	return {$: 7, a: a};
};
var $author$project$Ui$Screen$size = function (art) {
	if (!art.$) {
		var g = art.a;
		return _Utils_Tuple2(
			$author$project$Ui$Screen$crop(g).M,
			$author$project$Ui$Screen$crop(g).F);
	} else {
		var d = art.a;
		var _v1 = _Utils_Tuple2(d.am, d.b1);
		switch (_v1.a.$) {
			case 2:
				var p = _v1.a.a;
				return _Utils_Tuple2(
					$author$project$Ui$Screen$crop(
						$author$project$Ui$Screen$PadIcon(p)).M,
					$author$project$Ui$Screen$crop(
						$author$project$Ui$Screen$PadIcon(p)).F);
			case 0:
				if (!_v1.b) {
					var _v2 = _v1.a;
					var _v3 = _v1.b;
					return _Utils_Tuple2(240, 68);
				} else {
					var _v4 = _v1.a;
					var _v5 = _v1.b;
					return _Utils_Tuple2(240, 158);
				}
			default:
				var _v6 = _v1.a;
				return _Utils_Tuple2(120, 90);
		}
	}
};
var $author$project$Ui$Screen$spec = function (_v0) {
	var c = _v0;
	var _v1 = c.ar;
	if (_v1.$ === 1) {
		var d = _v1.a;
		return $elm$core$Maybe$Just(
			{t: c.t, ae: d.ae, aj: d.aj, bk: d.bk, am: d.am, c_: c.K});
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Ui$Control$pxWidth = function (px) {
	return {
		bH: 0,
		aV: A2($elm$core$Basics$max, 0, px)
	};
};
var $author$project$Ui$Screen$width = function (_v0) {
	var c = _v0;
	return $author$project$Ui$Control$pxWidth(
		$author$project$Ui$Screen$size(c.ar).a);
};
var $author$project$Ui$Screen$view = function (config) {
	var c = config;
	var _v0 = $author$project$Ui$Screen$size(c.ar);
	var w = _v0.a;
	var h = _v0.b;
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class('screen'),
				$author$project$Ui$Control$widthStyle(
				$author$project$Ui$Screen$width(config)),
				A2(
				$elm$html$Html$Attributes$style,
				'aspect-ratio',
				$elm$core$String$fromInt(w) + (' / ' + $elm$core$String$fromInt(h)))
			]),
		_List_fromArray(
			[
				function () {
				var _v1 = $author$project$Ui$Screen$spec(config);
				if (!_v1.$) {
					var s = _v1.a;
					return A3(
						$elm$html$Html$node,
						'chimera-screen',
						_List_fromArray(
							[
								A2(
								$elm$html$Html$Attributes$attribute,
								'spec',
								A2(
									$elm$json$Json$Encode$encode,
									0,
									$author$project$Ui$Screen$encodeSpec(s)))
							]),
						A2(
							$elm$core$Maybe$withDefault,
							_List_Nil,
							A2(
								$elm$core$Maybe$map,
								A2(
									$elm$core$Basics$composeR,
									$author$project$Ui$Screen$image(c.R),
									$elm$core$List$singleton),
								c.a9)));
				} else {
					var _v2 = c.ar;
					if (!_v2.$) {
						var g = _v2.a;
						return A2($author$project$Ui$Screen$image, c.R, g);
					} else {
						return $elm$html$Html$text('');
					}
				}
			}(),
				(c.R === '') ? $elm$html$Html$text('') : A2(
				$elm$html$Html$div,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('cap')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(c.R)
					]))
			]));
};
var $author$project$Ui$Tokens$chars = function (n) {
	return (n >= 1) ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
};
var $elm$core$List$maximum = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(
			A3($elm$core$List$foldl, $elm$core$Basics$max, x, xs));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Ui$Menu$widest = function (opts) {
	return A2(
		$elm$core$Maybe$withDefault,
		$author$project$Ui$Tokens$readoutChars,
		A2(
			$elm$core$Maybe$andThen,
			$author$project$Ui$Tokens$chars,
			$elm$core$List$maximum(
				A2(
					$elm$core$List$map,
					$elm$core$String$length,
					A2(
						$elm$core$List$cons,
						'--',
						A2($elm$core$List$map, $elm$core$Tuple$second, opts))))));
};
var $author$project$Ui$Tokens$HeaderValueFace = 4;
var $author$project$Ui$Menu$width = function (_v0) {
	var c = _v0;
	var _v1 = c.bU;
	if (!_v1) {
		return $author$project$Ui$Control$width(
			{
				bH: $author$project$Ui$Tokens$oneMore(
					$author$project$Ui$Tokens$oneMore(
						$author$project$Ui$Menu$widest(c.bi))),
				aV: $author$project$Ui$Control$snap16(
					A2(
						$elm$core$Basics$max,
						56,
						$author$project$Ui$Control$labelPx(c.aO)))
			});
	} else {
		return $author$project$Ui$Control$pxWidth(
			($author$project$Ui$Control$labelPx(c.aO) + 34) + A2(
				$author$project$Ui$Tokens$textPx,
				4,
				A2(
					$elm$core$String$repeat,
					$author$project$Ui$Tokens$charsCount(
						$author$project$Ui$Menu$widest(c.bi)),
					'M')));
	}
};
var $author$project$Ui$Menu$view = F3(
	function (config, state, ch) {
		var c = config;
		var open = _Utils_eq(
			state,
			$author$project$Ui$Menu$Showing(c.w));
		var popup = open ? A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('pop'),
					$author$project$Ui$Control$ariaRole('listbox'),
					$author$project$Ui$Control$ariaLabel(c.aO),
					A2(
					$elm$html$Html$Events$on,
					'keydown',
					A2(
						$elm$json$Json$Decode$andThen,
						$author$project$Ui$Menu$escape,
						A2($elm$json$Json$Decode$field, 'key', $elm$json$Json$Decode$string)))
				]),
			A2(
				$elm$core$List$map,
				function (_v1) {
					var i = _v1.a;
					var w = _v1.b;
					return A2(
						$elm$html$Html$button,
						_List_fromArray(
							[
								$elm$html$Html$Attributes$classList(
								_List_fromArray(
									[
										_Utils_Tuple2(
										'on',
										_Utils_eq(
											$elm$core$Maybe$Just(i),
											$author$project$Ui$Control$current(ch)))
									])),
								$author$project$Ui$Control$ariaRole('option'),
								A2(
								$elm$html$Html$Attributes$attribute,
								'aria-selected',
								$author$project$Ui$Menu$ariaBool(
									_Utils_eq(
										$elm$core$Maybe$Just(i),
										$author$project$Ui$Control$current(ch)))),
								$elm$html$Html$Events$onClick(
								A2($author$project$Ui$Menu$Choose, c.w, i))
							]),
						function () {
							var _v2 = c.cq(i);
							if (!_v2.$) {
								var g = _v2.a;
								return _List_fromArray(
									[
										$author$project$Ui$Screen$view(g),
										$elm$html$Html$text(w)
									]);
							} else {
								return _List_fromArray(
									[
										$elm$html$Html$text(w)
									]);
							}
						}());
				},
				c.bi)) : $elm$html$Html$text('');
		var toggle = $elm$html$Html$Events$onClick(
			open ? $author$project$Ui$Menu$Close : $author$project$Ui$Menu$Open(c.w));
		var popupAttrs = _List_fromArray(
			[
				A2($elm$html$Html$Attributes$attribute, 'aria-haspopup', 'listbox'),
				A2(
				$elm$html$Html$Attributes$attribute,
				'aria-expanded',
				$author$project$Ui$Menu$ariaBool(open)),
				toggle
			]);
		var name = A2($author$project$Ui$Control$choiceText, c.bi, ch);
		var _v0 = c.bU;
		if (!_v0) {
			return A3(
				$author$project$Ui$Control$cell,
				A2(
					$elm$core$List$cons,
					$elm$html$Html$Attributes$class('mnc'),
					A2(
						$elm$core$List$cons,
						$author$project$Ui$Control$widthStyle(
							$author$project$Ui$Menu$width(config)),
						$author$project$Ui$Control$markAttrs(
							$author$project$Ui$Control$chosenMark(ch)))),
				c.aO,
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						A2(
							$elm$core$List$cons,
							$elm$html$Html$Attributes$class('mn'),
							popupAttrs),
						_List_fromArray(
							[
								$elm$html$Html$text(name)
							])),
						popup
					]));
		} else {
			return A2(
				$elm$html$Html$div,
				A2(
					$elm$core$List$cons,
					$elm$html$Html$Attributes$class('hmn'),
					A2(
						$elm$core$List$cons,
						$author$project$Ui$Control$widthStyle(
							$author$project$Ui$Menu$width(config)),
						$author$project$Ui$Control$markAttrs(
							$author$project$Ui$Control$chosenMark(ch)))),
				_List_fromArray(
					[
						A2(
						$elm$html$Html$button,
						A2(
							$elm$core$List$cons,
							$elm$html$Html$Attributes$class('hbtn'),
							popupAttrs),
						_List_fromArray(
							[
								A2(
								$elm$html$Html$b,
								_List_Nil,
								_List_fromArray(
									[
										$elm$html$Html$text(c.aO)
									])),
								A2(
								$elm$html$Html$span,
								_List_fromArray(
									[
										A2(
										$elm$html$Html$Attributes$style,
										'width',
										$elm$core$String$fromInt(
											$author$project$Ui$Tokens$charsCount(
												$author$project$Ui$Menu$widest(c.bi))) + 'ch')
									]),
								_List_fromArray(
									[
										$elm$html$Html$text(name)
									]))
							])),
						popup
					]));
		}
	});
var $author$project$View$EnginePage$menuOf = F3(
	function (ctx, header, item) {
		var _v0 = $author$project$Ui$Control$options(item.bl.bi);
		if (!_v0.$) {
			var opts = _v0.a;
			return A2(
				$elm$html$Html$map,
				$author$project$View$EnginePage$MenuMsg,
				A3(
					$author$project$Ui$Menu$view,
					A3(
						$author$project$View$EnginePage$when,
						header,
						$author$project$Ui$Menu$inHeader,
						A2(
							$author$project$Ui$Menu$label,
							item.aO,
							A2($author$project$Ui$Menu$new, item.bl.w, opts))),
					ctx.bp.bf,
					A2($author$project$View$EnginePage$chosen, ctx.q, item.bl)));
		} else {
			return A3($author$project$View$EnginePage$choiceKnob, ctx, item, false);
		}
	});
var $author$project$Ui$Control$ariaChecked = function (on) {
	return A2(
		$elm$html$Html$Attributes$attribute,
		'aria-checked',
		on ? 'true' : 'false');
};
var $author$project$Ui$Tokens$SelectorFace = 3;
var $elm$core$Basics$min = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) < 0) ? x : y;
	});
var $author$project$Ui$Selector$geometry = function (opts) {
	var widest = A2(
		$elm$core$Maybe$withDefault,
		0,
		$elm$core$List$maximum(
			A2(
				$elm$core$List$map,
				A2(
					$elm$core$Basics$composeR,
					$elm$core$Tuple$second,
					$author$project$Ui$Tokens$textPx(3)),
				opts)));
	var n = $elm$core$List$length(opts);
	var radius = (n > 5) ? 50 : 40;
	return {
		F: (2 * radius) + 18,
		bo: radius,
		cS: (n > 5) ? 270 : A2($elm$core$Basics$min, 240, 60 * (n - 1)),
		M: (2 * (radius + ((widest + 8) / 2))) + 4
	};
};
var $author$project$Ui$Selector$width = function (_v0) {
	var c = _v0;
	return $author$project$Ui$Control$pxWidth(
		$author$project$Ui$Control$snap16(
			A2(
				$elm$core$Basics$max,
				$author$project$Ui$Control$labelPx(c.aO),
				$elm$core$Basics$ceiling(
					$author$project$Ui$Selector$geometry(c.bi).M))));
};
var $author$project$Ui$Selector$view = F2(
	function (config, ch) {
		var c = config;
		var px = function (v) {
			return $elm$core$String$fromFloat(v) + 'px';
		};
		var n = $elm$core$List$length(c.bi);
		var here = A2(
			$elm$core$Maybe$map,
			$elm$core$Tuple$first,
			$elm$core$List$head(
				A2(
					$elm$core$List$filter,
					function (_v1) {
						var _v2 = _v1.b;
						var i = _v2.a;
						return _Utils_eq(
							$elm$core$Maybe$Just(i),
							$author$project$Ui$Control$current(ch));
					},
					A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, c.bi))));
		var g = $author$project$Ui$Selector$geometry(c.bi);
		var cy = g.bo + 12;
		var cx = g.M / 2;
		var angle = function (i) {
			return ((-g.cS) / 2) + ((g.cS * i) / A2($elm$core$Basics$max, 1, n - 1));
		};
		return A3(
			$author$project$Ui$Control$cell,
			A2(
				$elm$core$List$cons,
				$elm$html$Html$Attributes$classList(
					_List_fromArray(
						[
							_Utils_Tuple2('slc', true),
							_Utils_Tuple2(
							'unlisted',
							_Utils_eq(
								$author$project$Ui$Control$choice(ch),
								$author$project$Ui$Control$NotInList)),
							_Utils_Tuple2(
							'missing',
							_Utils_eq(
								$author$project$Ui$Control$choice(ch),
								$author$project$Ui$Control$NoValue))
						])),
				A2(
					$elm$core$List$cons,
					$author$project$Ui$Control$widthStyle(
						$author$project$Ui$Selector$width(config)),
					$author$project$Ui$Control$markAttrs(
						$author$project$Ui$Control$chosenMark(ch)))),
			c.aO,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('sl'),
							A2(
							$elm$html$Html$Attributes$style,
							'width',
							px(g.M)),
							A2(
							$elm$html$Html$Attributes$style,
							'height',
							px(g.F)),
							$author$project$Ui$Control$ariaRole('radiogroup'),
							$author$project$Ui$Control$ariaLabel(c.aO)
						]),
					A2(
						$elm$core$List$cons,
						A2(
							$elm$html$Html$div,
							_Utils_ap(
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('kn'),
										A2($elm$html$Html$Attributes$style, 'width', '34px'),
										A2($elm$html$Html$Attributes$style, 'height', '34px'),
										A2(
										$elm$html$Html$Attributes$style,
										'left',
										px(cx - 17)),
										A2(
										$elm$html$Html$Attributes$style,
										'top',
										px(cy - 17))
									]),
								A2($author$project$Ui$Control$grab, c.w, 0)),
							_List_fromArray(
								[
									A2(
									$author$project$Ui$Knob$face,
									0,
									A2(
										$elm$core$Maybe$map,
										function (k) {
											return (angle(k) + 135) / 270;
										},
										here))
								])),
						A2(
							$elm$core$List$indexedMap,
							F2(
								function (k, _v0) {
									var i = _v0.a;
									var w = _v0.b;
									return A2(
										$elm$html$Html$button,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$classList(
												_List_fromArray(
													[
														_Utils_Tuple2(
														'on',
														_Utils_eq(
															$elm$core$Maybe$Just(i),
															$author$project$Ui$Control$current(ch)))
													])),
												$author$project$Ui$Control$ariaRole('radio'),
												$author$project$Ui$Control$ariaChecked(
												_Utils_eq(
													$elm$core$Maybe$Just(i),
													$author$project$Ui$Control$current(ch))),
												A2(
												$elm$html$Html$Attributes$style,
												'left',
												px(
													cx + ((g.bo + 4) * $elm$core$Basics$sin(
														$elm$core$Basics$degrees(
															angle(k)))))),
												A2(
												$elm$html$Html$Attributes$style,
												'top',
												px(
													cy - ((g.bo - 4) * $elm$core$Basics$cos(
														$elm$core$Basics$degrees(
															angle(k)))))),
												$elm$html$Html$Events$onClick(
												A2($author$project$Ui$Control$Pick, c.w, i))
											]),
										_List_fromArray(
											[
												$elm$html$Html$text(w)
											]));
								}),
							c.bi)))
				]));
	});
var $author$project$Ui$Toggle$options = function (p) {
	if (!p.$) {
		var x = p.a;
		var y = p.b;
		return _List_fromArray(
			[x, y]);
	} else {
		var x = p.a;
		var y = p.b;
		var z = p.c;
		return _List_fromArray(
			[x, y, z]);
	}
};
var $author$project$Ui$Tokens$ToggleFace = 1;
var $author$project$Ui$Toggle$wordPx = function (w) {
	return A2($author$project$Ui$Tokens$textPx, 1, w) + 4;
};
var $author$project$Ui$Toggle$width = function (_v0) {
	var c = _v0;
	var widest = A2(
		$elm$core$Maybe$withDefault,
		0,
		$elm$core$List$maximum(
			A2(
				$elm$core$List$map,
				A2($elm$core$Basics$composeR, $elm$core$Tuple$second, $author$project$Ui$Toggle$wordPx),
				$author$project$Ui$Toggle$options(c.bn))));
	return $author$project$Ui$Control$pxWidth(
		$author$project$Ui$Control$snap16(
			A2(
				$elm$core$Basics$max,
				$author$project$Ui$Control$labelPx(c.aO),
				(14 + 6) + widest)));
};
var $author$project$Ui$Toggle$view = F2(
	function (config, ch) {
		var c = config;
		var opts = $author$project$Ui$Toggle$options(c.bn);
		var n = $elm$core$List$length(opts);
		var here = A2(
			$elm$core$Maybe$map,
			$elm$core$Tuple$first,
			$elm$core$List$head(
				A2(
					$elm$core$List$filter,
					function (_v9) {
						var _v10 = _v9.b;
						var i = _v10.a;
						return _Utils_eq(
							$elm$core$Maybe$Just(i),
							$author$project$Ui$Control$current(ch));
					},
					A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, opts))));
		var next = function () {
			if (!here.$) {
				var k = here.a;
				return $elm$core$List$head(
					A2(
						$elm$core$List$drop,
						A2($elm$core$Basics$modBy, n, k + 1),
						opts));
			} else {
				return $elm$core$List$head(opts);
			}
		}();
		var ball = function () {
			var _v3 = _Utils_Tuple2(c.bn, here);
			_v3$2:
			while (true) {
				if (_v3.b.$ === 1) {
					var _v4 = _v3.b;
					return 'none';
				} else {
					if (!_v3.a.$) {
						if (!_v3.b.a) {
							break _v3$2;
						} else {
							var _v6 = _v3.a;
							return 'b';
						}
					} else {
						switch (_v3.b.a) {
							case 1:
								var _v5 = _v3.a;
								return 'm';
							case 0:
								break _v3$2;
							default:
								var _v7 = _v3.a;
								return 'b';
						}
					}
				}
			}
			return 't';
		}();
		return A3(
			$author$project$Ui$Control$cell,
			A2(
				$elm$core$List$cons,
				$elm$html$Html$Attributes$class('tgc'),
				A2(
					$elm$core$List$cons,
					$author$project$Ui$Control$widthStyle(
						$author$project$Ui$Toggle$width(config)),
					$author$project$Ui$Control$markAttrs(
						$author$project$Ui$Control$chosenMark(ch)))),
			c.aO,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$classList(
							_List_fromArray(
								[
									_Utils_Tuple2('tg', true),
									_Utils_Tuple2('n3', n === 3)
								])),
							$author$project$Ui$Control$ariaRole('radiogroup'),
							$author$project$Ui$Control$ariaLabel(c.aO)
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$button,
							_Utils_ap(
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class('lv'),
										A2($elm$html$Html$Attributes$attribute, 'data-p', ball),
										$author$project$Ui$Control$ariaLabel(c.aO + ': next')
									]),
								function () {
									if (!next.$) {
										var _v1 = next.a;
										var i = _v1.a;
										return _List_fromArray(
											[
												$elm$html$Html$Events$onClick(
												A2($author$project$Ui$Control$Pick, c.w, i))
											]);
									} else {
										return _List_Nil;
									}
								}()),
							_List_Nil),
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('tw')
								]),
							A2(
								$elm$core$List$map,
								function (_v2) {
									var i = _v2.a;
									var w = _v2.b;
									return A2(
										$elm$html$Html$button,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$classList(
												_List_fromArray(
													[
														_Utils_Tuple2(
														'on',
														_Utils_eq(
															$elm$core$Maybe$Just(i),
															$author$project$Ui$Control$current(ch)))
													])),
												$author$project$Ui$Control$ariaRole('radio'),
												$author$project$Ui$Control$ariaChecked(
												_Utils_eq(
													$elm$core$Maybe$Just(i),
													$author$project$Ui$Control$current(ch))),
												A2(
												$elm$html$Html$Attributes$style,
												'width',
												$elm$core$String$fromInt(
													$author$project$Ui$Toggle$wordPx(w)) + 'px'),
												$elm$html$Html$Events$onClick(
												A2($author$project$Ui$Control$Pick, c.w, i))
											]),
										_List_fromArray(
											[
												$elm$html$Html$text(w)
											]));
								},
								opts))
						]))
				]));
	});
var $author$project$View$EnginePage$autoChoice = F2(
	function (ctx, item) {
		var p = item.bl;
		var now = A2($author$project$View$EnginePage$chosen, ctx.q, p);
		var _v0 = _Utils_Tuple2(
			A2($author$project$Ui$Toggle$fromOptions, p.w, p.bi),
			A2($author$project$Ui$Selector$fromOptions, p.w, p.bi));
		if (!_v0.a.$) {
			var t = _v0.a.a;
			return A2(
				$elm$html$Html$map,
				$author$project$View$EnginePage$Hand,
				A2(
					$author$project$Ui$Toggle$view,
					A2($author$project$Ui$Toggle$label, item.aO, t),
					now));
		} else {
			if (!_v0.b.$) {
				var _v1 = _v0.a;
				var sl = _v0.b.a;
				return A2(
					$elm$html$Html$map,
					$author$project$View$EnginePage$Hand,
					A2(
						$author$project$Ui$Selector$view,
						A2($author$project$Ui$Selector$label, item.aO, sl),
						now));
			} else {
				var _v2 = _v0.a;
				var _v3 = _v0.b;
				return A3($author$project$View$EnginePage$menuOf, ctx, false, item);
			}
		}
	});
var $author$project$Ui$Fader$Config = $elm$core$Basics$identity;
var $author$project$Ui$Fader$Tall = 1;
var $author$project$Ui$Fader$hero = function (_v0) {
	var c = _v0;
	return _Utils_update(
		c,
		{cQ: 1});
};
var $author$project$Ui$Fader$label = F2(
	function (l, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{aO: l});
	});
var $author$project$Ui$Fader$Regular = 0;
var $author$project$Ui$Fader$new = F2(
	function (a, p) {
		return {w: a, bI: $author$project$Ui$Tokens$readoutChars, aO: '', cK: p, cQ: 0};
	});
var $author$project$View$EnginePage$reading = F2(
	function (m, p) {
		var r = function () {
			var _v1 = A2($author$project$Model$shown, p.w, m);
			if (!_v1.$) {
				var v = _v1.a;
				return A2($author$project$Ui$Control$reading, v.cG, v.aZ);
			} else {
				return $author$project$Ui$Control$missing;
			}
		}();
		var _v0 = A2($author$project$Model$refusal, p.w, m);
		if (!_v0.$) {
			var why = _v0.a;
			return A2($author$project$Ui$Control$refused, why, r);
		} else {
			return r;
		}
	});
var $author$project$Ui$Control$Fader = 2;
var $author$project$Ui$Fader$width = function (_v0) {
	var c = _v0;
	return $author$project$Ui$Control$width(
		{
			bH: $author$project$Ui$Tokens$oneMore(c.bI),
			aV: $author$project$Ui$Control$snap16(
				A2(
					$elm$core$Basics$max,
					44,
					$author$project$Ui$Control$labelPx(c.aO)))
		});
};
var $author$project$Ui$Fader$view = F2(
	function (config, r) {
		var c = config;
		var at = function (x) {
			return 'calc(4px + (100% - 21px) * ' + ($elm$core$String$fromFloat(x) + ')');
		};
		return A3(
			$author$project$Ui$Control$cell,
			_Utils_ap(
				_List_fromArray(
					[
						$elm$html$Html$Attributes$classList(
						_List_fromArray(
							[
								_Utils_Tuple2('hero', c.cQ === 1),
								_Utils_Tuple2(
								'bip',
								$author$project$Ui$Control$isBipolar(c.cK))
							])),
						$elm$html$Html$Attributes$classList(
						_List_fromArray(
							[
								_Utils_Tuple2(
								'missing',
								_Utils_eq(
									$author$project$Ui$Control$norm(r),
									$elm$core$Maybe$Nothing))
							])),
						$author$project$Ui$Control$widthStyle(
						$author$project$Ui$Fader$width(config))
					]),
				$author$project$Ui$Control$markAttrs(
					$author$project$Ui$Control$mark(r))),
			c.aO,
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					A2(
						$elm$core$List$cons,
						$elm$html$Html$Attributes$class('fd'),
						_Utils_ap(
							A2($author$project$Ui$Control$slider, c.aO, r),
							A2($author$project$Ui$Control$grab, c.w, 2))),
					A2(
						$elm$core$List$cons,
						A2(
							$elm$html$Html$i,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('tk')
								]),
							_List_Nil),
						function () {
							var _v0 = $author$project$Ui$Control$norm(r);
							if (!_v0.$) {
								var t = _v0.a;
								return _Utils_ap(
									$author$project$Ui$Control$isBipolar(c.cK) ? _List_fromArray(
										[
											A2(
											$elm$html$Html$i,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('fill'),
													A2(
													$elm$html$Html$Attributes$style,
													'bottom',
													at(
														A2($elm$core$Basics$min, t, 0.5))),
													A2(
													$elm$html$Html$Attributes$style,
													'top',
													'calc(100% - ' + (at(
														A2($elm$core$Basics$max, t, 0.5)) + ')'))
												]),
											_List_Nil)
										]) : _List_Nil,
									_List_fromArray(
										[
											A2(
											$elm$html$Html$b,
											_List_fromArray(
												[
													$elm$html$Html$Attributes$class('cap'),
													A2(
													$elm$html$Html$Attributes$style,
													'bottom',
													at(t))
												]),
											_List_Nil)
										]));
							} else {
								return _List_Nil;
							}
						}())),
					A2($author$project$Ui$Control$readout, c.bI, r)
				]));
	});
var $author$project$View$EnginePage$contFader = F3(
	function (ctx, item, big) {
		return function (c) {
			return A2(
				$elm$html$Html$map,
				$author$project$View$EnginePage$Hand,
				A2(
					$author$project$Ui$Fader$view,
					c,
					A2($author$project$View$EnginePage$reading, ctx.q, item.bl)));
		}(
			A3(
				$author$project$View$EnginePage$when,
				big,
				$author$project$Ui$Fader$hero,
				A2(
					$author$project$Ui$Fader$label,
					item.aO,
					A2(
						$author$project$Ui$Fader$new,
						item.bl.w,
						$author$project$Ui$Control$polarity(item.bl)))));
	});
var $author$project$View$EnginePage$contKnob = F3(
	function (ctx, item, big) {
		return function (c) {
			return A2(
				$elm$html$Html$map,
				$author$project$View$EnginePage$Hand,
				A2(
					$author$project$Ui$Knob$view,
					c,
					A2($author$project$View$EnginePage$reading, ctx.q, item.bl)));
		}(
			A3(
				$author$project$View$EnginePage$when,
				big,
				$author$project$Ui$Knob$hero,
				A2(
					$author$project$Ui$Knob$label,
					item.aO,
					A2(
						$author$project$Ui$Knob$new,
						item.bl.w,
						$author$project$Ui$Control$polarity(item.bl)))));
	});
var $author$project$View$EnginePage$control = F2(
	function (ctx, _v0) {
		var item = _v0.a;
		var as_ = _v0.b;
		var p = item.bl;
		if ($author$project$View$EnginePage$isChoice(p)) {
			switch (as_) {
				case 1:
					return A3($author$project$View$EnginePage$choiceKnob, ctx, item, false);
				case 2:
					return A3($author$project$View$EnginePage$choiceKnob, ctx, item, true);
				case 5:
					return A3($author$project$View$EnginePage$menuOf, ctx, false, item);
				case 0:
					return A2($author$project$View$EnginePage$autoChoice, ctx, item);
				case 3:
					return A2($author$project$View$EnginePage$autoChoice, ctx, item);
				default:
					return A2($author$project$View$EnginePage$autoChoice, ctx, item);
			}
		} else {
			switch (as_) {
				case 1:
					return A3($author$project$View$EnginePage$contKnob, ctx, item, false);
				case 2:
					return A3($author$project$View$EnginePage$contKnob, ctx, item, true);
				case 3:
					return A3($author$project$View$EnginePage$contFader, ctx, item, false);
				case 4:
					return A3($author$project$View$EnginePage$contFader, ctx, item, true);
				case 5:
					return A3($author$project$View$EnginePage$contKnob, ctx, item, false);
				default:
					var _v3 = p.b$;
					if (_v3 === 1) {
						return A3($author$project$View$EnginePage$contKnob, ctx, item, false);
					} else {
						return A3($author$project$View$EnginePage$contFader, ctx, item, false);
					}
			}
		}
	});
var $author$project$View$EnginePage$PadBay = function (a) {
	return {$: 1, a: a};
};
var $author$project$View$EnginePage$PartBay = {$: 0};
var $author$project$Ui$Module$group = F2(
	function (title, items) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('grp')
				]),
			A2(
				$elm$core$List$cons,
				(title === '') ? $elm$html$Html$text('') : A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('gt')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(title)
						])),
				items));
	});
var $elm$html$Html$p = _VirtualDom_node('p');
var $author$project$View$EnginePage$padBay = F2(
	function (m, p) {
		var routes = A2($author$project$View$EnginePage$routesNow, m, p);
		var options = function (f) {
			return A2(
				$elm$core$Maybe$withDefault,
				_List_Nil,
				A2(
					$elm$core$Maybe$map,
					function ($) {
						return $.bi;
					},
					A2(
						$elm$core$Maybe$andThen,
						function (r) {
							return A2(
								$author$project$View$EnginePage$paramOf,
								m,
								f(r.an));
						},
						$elm$core$List$head(routes))));
		};
		return A3(
			$elm$core$List$foldl,
			$author$project$Ui$Routes$add,
			A2(
				$author$project$Ui$Routes$new,
				A2(
					$elm$core$List$map,
					$author$project$Ui$Routes$source,
					options(
						function ($) {
							return $.cR;
						})),
				A2(
					$elm$core$List$map,
					$author$project$Ui$Routes$dest,
					options(
						function ($) {
							return $.cl;
						}))),
			A2(
				$elm$core$List$filterMap,
				function (r) {
					var _v0 = _Utils_Tuple3(
						r.aT,
						_Utils_Tuple2(r.S, r.e2),
						A2(
							$elm$core$Maybe$andThen,
							function (ap) {
								return A2($author$project$Model$shown, ap.w, m);
							},
							r.cd));
					if (((_v0.a && (!_v0.b.a.$)) && (!_v0.b.b.$)) && (!_v0.c.$)) {
						var _v1 = _v0.b;
						var from = _v1.a.a;
						var to = _v1.b.a;
						var v = _v0.c.a;
						return $elm$core$Maybe$Just(
							{
								w: r.an.cd,
								cd: $author$project$Ui$Routes$amountFromNorm(v.cG),
								S: from,
								e2: to
							});
					} else {
						return $elm$core$Maybe$Nothing;
					}
				},
				routes));
	});
var $author$project$Ui$Module$panel = $elm$html$Html$div(
	_List_fromArray(
		[
			$elm$html$Html$Attributes$class('pnl')
		]));
var $author$project$View$EnginePage$sourceChars = $author$project$Ui$Tokens$oneMore(
	$author$project$Ui$Tokens$oneMore($author$project$Ui$Tokens$readoutChars));
var $author$project$Ui$PatchBay$Connect = F2(
	function (a, b) {
		return {$: 4, a: a, b: b};
	});
var $author$project$Ui$PatchBay$Hand = function (a) {
	return {$: 6, a: a};
};
var $author$project$Ui$PatchBay$MatrixView = 1;
var $author$project$Ui$PatchBay$ShowAs = function (a) {
	return {$: 0, a: a};
};
var $author$project$Ui$PatchBay$ariaBool = function (on) {
	return on ? 'true' : 'false';
};
var $author$project$Ui$PatchBay$Begin = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$PatchBay$Drop = function (a) {
	return {$: 2, a: a};
};
var $author$project$Ui$Control$Attenuverter = 3;
var $author$project$Ui$PatchBay$Unpatch = F2(
	function (a, b) {
		return {$: 5, a: a, b: b};
	});
var $author$project$Ui$Routes$amountText = function (_v0) {
	var a = _v0;
	return (a > 0) ? ('+' + $elm$core$String$fromInt(a)) : $elm$core$String$fromInt(a);
};
var $author$project$Ui$PatchBay$attenuverterChars = $author$project$Ui$Tokens$oneMore($author$project$Ui$Tokens$readoutChars);
var $author$project$Ui$PatchBay$attenuverterWidth = $author$project$Ui$Control$width(
	{bH: $author$project$Ui$PatchBay$attenuverterChars, aV: 78});
var $elm$svg$Svg$Attributes$class = _VirtualDom_attribute('class');
var $author$project$Ui$PatchBay$destName = $author$project$Ui$Routes$destName;
var $elm$svg$Svg$Attributes$height = _VirtualDom_attribute('height');
var $elm$virtual_dom$VirtualDom$mapAttribute = _VirtualDom_mapAttribute;
var $elm$html$Html$Attributes$map = $elm$virtual_dom$VirtualDom$mapAttribute;
var $author$project$Ui$Routes$Adds = 0;
var $author$project$Ui$Routes$Subtracts = 1;
var $author$project$Ui$Routes$sign = function (_v0) {
	var a = _v0;
	return (a < 0) ? 1 : 0;
};
var $author$project$Ui$PatchBay$signClass = function (c) {
	var _v0 = $author$project$Ui$Routes$sign(c.cd);
	if (!_v0) {
		return 'adds';
	} else {
		return 'subtracts';
	}
};
var $author$project$Ui$PatchBay$sourceName = $author$project$Ui$Routes$sourceName;
var $elm$svg$Svg$Attributes$strokeDasharray = _VirtualDom_attribute('stroke-dasharray');
var $elm$svg$Svg$Attributes$width = _VirtualDom_attribute('width');
var $author$project$Ui$PatchBay$attenuverter = function (_v0) {
	var w = _v0.a;
	var _v1 = _v0.b;
	var x = _v1.a;
	var y = _v1.b;
	var ring = (2 * $elm$core$Basics$pi) * 7;
	var c = w.at;
	var f = $elm$core$Basics$abs(
		$author$project$Ui$Routes$amountValue(c.cd)) / 100;
	return A2(
		$elm$html$Html$div,
		_Utils_ap(
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class(
					'att ' + $author$project$Ui$PatchBay$signClass(c)),
					$author$project$Ui$Control$widthStyle($author$project$Ui$PatchBay$attenuverterWidth),
					A2(
					$elm$html$Html$Attributes$style,
					'left',
					$elm$core$String$fromFloat(x) + '%'),
					A2(
					$elm$html$Html$Attributes$style,
					'top',
					$elm$core$String$fromFloat(y) + 'px'),
					$author$project$Ui$Control$ariaRole('slider'),
					$author$project$Ui$Control$ariaLabel(
					$author$project$Ui$PatchBay$sourceName(c.S) + (' to ' + $author$project$Ui$PatchBay$destName(c.e2))),
					$author$project$Ui$Control$ariaValueText(
					$author$project$Ui$Routes$amountText(c.cd)),
					$elm$html$Html$Events$onDoubleClick(
					A2($author$project$Ui$PatchBay$Unpatch, c.S, c.e2))
				]),
			A2(
				$elm$core$List$map,
				$elm$html$Html$Attributes$map($author$project$Ui$PatchBay$Hand),
				A2($author$project$Ui$Control$drag, c.w, 3))),
		_List_fromArray(
			[
				A2(
				$elm$svg$Svg$svg,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$width('20'),
						$elm$svg$Svg$Attributes$height('20'),
						$elm$svg$Svg$Attributes$viewBox('0 0 20 20')
					]),
				_List_fromArray(
					[
						A2(
						$elm$svg$Svg$circle,
						_List_fromArray(
							[
								$elm$svg$Svg$Attributes$class('track'),
								$elm$svg$Svg$Attributes$cx('10'),
								$elm$svg$Svg$Attributes$cy('10'),
								$elm$svg$Svg$Attributes$r('7'),
								$elm$svg$Svg$Attributes$fill('none'),
								$elm$svg$Svg$Attributes$strokeWidth('3')
							]),
						_List_Nil),
						A2(
						$elm$svg$Svg$circle,
						_List_fromArray(
							[
								$elm$svg$Svg$Attributes$class('amt'),
								$elm$svg$Svg$Attributes$cx('10'),
								$elm$svg$Svg$Attributes$cy('10'),
								$elm$svg$Svg$Attributes$r('7'),
								$elm$svg$Svg$Attributes$fill('none'),
								$elm$svg$Svg$Attributes$strokeWidth('3'),
								$elm$svg$Svg$Attributes$strokeDasharray(
								$elm$core$String$fromFloat(f * ring) + (' ' + $elm$core$String$fromFloat(ring))),
								$elm$svg$Svg$Attributes$transform('rotate(-90 10 10)')
							]),
						_List_Nil)
					])),
				A2(
				$elm$html$Html$span,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('v'),
						A2($elm$html$Html$Attributes$style, 'width', '4ch')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text(
						$author$project$Ui$Routes$amountText(c.cd))
					]))
			]));
};
var $author$project$Ui$PatchBay$curve = function (w) {
	var sag = 18 + ($elm$core$Basics$abs(w.aa - w._) * 0.12);
	return {bD: 38, bE: w._ + sag, bF: 62, bG: w.aa + sag, cb: 0, cc: 100, _: w._, aa: w.aa};
};
var $elm$svg$Svg$g = $elm$svg$Svg$trustedNode('g');
var $elm$svg$Svg$Attributes$strokeOpacity = _VirtualDom_attribute('stroke-opacity');
var $author$project$Ui$PatchBay$cable = function (w) {
	var n = $elm$core$String$fromFloat;
	var c = $author$project$Ui$PatchBay$curve(w);
	var d = 'M' + (n(c.cb) + (' ' + (n(c._) + ('C' + (n(c.bD) + (' ' + (n(c.bE) + (' ' + (n(c.bF) + (' ' + (n(c.bG) + (' ' + (n(c.cc) + (' ' + n(c.aa)))))))))))))));
	return A2(
		$elm$svg$Svg$g,
		_List_fromArray(
			[
				$elm$svg$Svg$Attributes$class(
				'cable ' + $author$project$Ui$PatchBay$signClass(w.at))
			]),
		_List_fromArray(
			[
				A2(
				$elm$svg$Svg$path,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('ws'),
						$elm$svg$Svg$Attributes$d(d)
					]),
				_List_Nil),
				A2(
				$elm$svg$Svg$path,
				_List_fromArray(
					[
						$elm$svg$Svg$Attributes$class('w'),
						$elm$svg$Svg$Attributes$d(d),
						$elm$svg$Svg$Attributes$strokeOpacity(
						n(
							0.45 + ((0.55 * $elm$core$Basics$abs(
								$author$project$Ui$Routes$amountValue(w.at.cd))) / 100)))
					]),
				_List_Nil)
			]));
};
var $author$project$Ui$Routes$dests = function (_v0) {
	var r = _v0;
	return r.cm;
};
var $author$project$Ui$PatchBay$midpoint = function (w) {
	var u = 1 - w.X;
	var c = $author$project$Ui$PatchBay$curve(w);
	var bez = F4(
		function (p0, p1, p2, p3) {
			return (((((u * u) * u) * p0) + ((((3 * u) * u) * w.X) * p1)) + ((((3 * u) * w.X) * w.X) * p2)) + (((w.X * w.X) * w.X) * p3);
		});
	return _Utils_Tuple2(
		A4(bez, c.cb, c.bD, c.bF, c.cc),
		A4(bez, c._, c.bE, c.bG, c.aa));
};
var $elm$html$Html$Events$onMouseUp = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'mouseup',
		$elm$json$Json$Decode$succeed(msg));
};
var $author$project$Ui$PatchBay$pitch = 32;
var $elm$svg$Svg$Attributes$preserveAspectRatio = _VirtualDom_attribute('preserveAspectRatio');
var $elm$core$List$sortBy = _List_sortBy;
var $author$project$Ui$Routes$sources = function (_v0) {
	var r = _v0;
	return r.b5;
};
var $author$project$Ui$PatchBay$spread = F2(
	function (n, k) {
		return (n < 2) ? 0.5 : (0.3 + ((0.4 * k) / (n - 1)));
	});
var $author$project$Ui$PatchBay$unstack = A2(
	$elm$core$Basics$composeR,
	$elm$core$List$sortBy(
		function (_v0) {
			var _v1 = _v0.b;
			var y = _v1.b;
			return y;
		}),
	A2(
		$elm$core$List$foldl,
		F2(
			function (_v2, placed) {
				var w = _v2.a;
				var _v3 = _v2.b;
				var x = _v3.a;
				var y = _v3.b;
				var y1 = A3(
					$elm$core$List$foldl,
					F2(
						function (_v4, acc) {
							var _v5 = _v4.b;
							var px = _v5.a;
							var py = _v5.b;
							return (($elm$core$Basics$abs(px - x) < 14) && ((acc - py) < 34)) ? (py + 34) : acc;
						}),
					y,
					placed);
				return _Utils_ap(
					placed,
					_List_fromArray(
						[
							_Utils_Tuple2(
							w,
							_Utils_Tuple2(x, y1))
						]));
			}),
		_List_Nil));
var $author$project$Ui$PatchBay$patch = F2(
	function (patching, routes) {
		var srcs = $author$project$Ui$Routes$sources(routes);
		var rowOf = F2(
			function (x, xs) {
				return A2(
					$elm$core$Maybe$map,
					function (_v1) {
						var i = _v1.a;
						return (i * $author$project$Ui$PatchBay$pitch) + 15;
					},
					$elm$core$List$head(
						A2(
							$elm$core$List$filter,
							function (_v0) {
								var y = _v0.b;
								return _Utils_eq(y, x);
							},
							A2($elm$core$List$indexedMap, $elm$core$Tuple$pair, xs))));
			});
		var px = function (v) {
			return $elm$core$String$fromFloat(v) + 'px';
		};
		var dsts = $author$project$Ui$Routes$dests(routes);
		var height = $author$project$Ui$PatchBay$pitch * A2(
			$elm$core$Basics$max,
			$elm$core$List$length(srcs),
			$elm$core$List$length(dsts));
		var ordered = A2(
			$elm$core$List$sortBy,
			function (c) {
				return _Utils_Tuple2(
					A2(
						$elm$core$Maybe$withDefault,
						0,
						A2(rowOf, c.e2, dsts)),
					A2(
						$elm$core$Maybe$withDefault,
						0,
						A2(rowOf, c.S, srcs)));
			},
			$author$project$Ui$Routes$cables(routes));
		var n = $elm$core$List$length(ordered);
		var wires = A2(
			$elm$core$List$filterMap,
			$elm$core$Basics$identity,
			A2(
				$elm$core$List$indexedMap,
				F2(
					function (k, c) {
						return A3(
							$elm$core$Maybe$map2,
							F2(
								function (y1, y2) {
									return {
										at: c,
										X: A2($author$project$Ui$PatchBay$spread, n, k),
										_: y1,
										aa: y2
									};
								}),
							A2(rowOf, c.S, srcs),
							A2(rowOf, c.e2, dsts));
					}),
				ordered));
		var lit = A2(
			$elm$core$List$map,
			A2(
				$elm$core$Basics$composeR,
				function ($) {
					return $.at;
				},
				function ($) {
					return $.S;
				}),
			wires);
		var litDst = A2(
			$elm$core$List$map,
			A2(
				$elm$core$Basics$composeR,
				function ($) {
					return $.at;
				},
				function ($) {
					return $.e2;
				}),
			wires);
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('pb')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('jcol srcs')
						]),
					A2(
						$elm$core$List$map,
						function (src) {
							return A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$classList(
										_List_fromArray(
											[
												_Utils_Tuple2('jack', true),
												_Utils_Tuple2('out', true),
												_Utils_Tuple2(
												'on',
												A2($elm$core$List$member, src, lit)),
												_Utils_Tuple2(
												'hot',
												_Utils_eq(
													patching,
													$elm$core$Maybe$Just(src)))
											])),
										A2(
										$elm$html$Html$Events$preventDefaultOn,
										'mousedown',
										$elm$json$Json$Decode$succeed(
											_Utils_Tuple2(
												$author$project$Ui$PatchBay$Begin(src),
												true)))
									]),
								_List_fromArray(
									[
										A2(
										$elm$html$Html$span,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('hole')
											]),
										_List_Nil),
										A2(
										$elm$html$Html$b,
										_List_Nil,
										_List_fromArray(
											[
												$elm$html$Html$text(
												$author$project$Ui$Routes$sourceName(src))
											]))
									]));
						},
						srcs)),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('wires'),
							A2(
							$elm$html$Html$Attributes$style,
							'height',
							px(height))
						]),
					A2(
						$elm$core$List$cons,
						A2(
							$elm$svg$Svg$svg,
							_List_fromArray(
								[
									$elm$svg$Svg$Attributes$viewBox(
									'0 0 100 ' + $elm$core$String$fromFloat(height)),
									$elm$svg$Svg$Attributes$preserveAspectRatio('none')
								]),
							A2($elm$core$List$map, $author$project$Ui$PatchBay$cable, wires)),
						A2(
							$elm$core$List$map,
							$author$project$Ui$PatchBay$attenuverter,
							$author$project$Ui$PatchBay$unstack(
								A2(
									$elm$core$List$map,
									function (w) {
										return _Utils_Tuple2(
											w,
											$author$project$Ui$PatchBay$midpoint(w));
									},
									wires))))),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('jcol dsts')
						]),
					A2(
						$elm$core$List$map,
						function (dst) {
							return A2(
								$elm$html$Html$div,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$classList(
										_List_fromArray(
											[
												_Utils_Tuple2('jack', true),
												_Utils_Tuple2('in', true),
												_Utils_Tuple2(
												'on',
												A2($elm$core$List$member, dst, litDst))
											])),
										$elm$html$Html$Events$onMouseUp(
										$author$project$Ui$PatchBay$Drop(dst))
									]),
								_List_fromArray(
									[
										A2(
										$elm$html$Html$b,
										_List_Nil,
										_List_fromArray(
											[
												$elm$html$Html$text(
												$author$project$Ui$Routes$destName(dst))
											])),
										A2(
										$elm$html$Html$span,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$class('hole')
											]),
										_List_Nil)
									]));
						},
						dsts))
				]));
	});
var $elm$html$Html$td = _VirtualDom_node('td');
var $author$project$Ui$MatrixGrid$patched = F2(
	function (hand, c) {
		var a = $elm$core$Basics$abs(
			$author$project$Ui$Routes$amountValue(c.cd));
		var _v0 = function () {
			var _v1 = $author$project$Ui$Routes$sign(c.cd);
			if (!_v1) {
				return _Utils_Tuple2('adds', 'var(--mod)');
			} else {
				return _Utils_Tuple2('subtracts', 'var(--modneg)');
			}
		}();
		var cls = _v0.a;
		var token = _v0.b;
		return A2(
			$elm$html$Html$td,
			_Utils_ap(
				_List_fromArray(
					[
						$elm$html$Html$Attributes$classList(
						_List_fromArray(
							[
								_Utils_Tuple2(cls, true),
								_Utils_Tuple2('strong', a > 60)
							])),
						A2(
						$elm$html$Html$Attributes$style,
						'background',
						'color-mix(in srgb, ' + (token + (' ' + ($elm$core$String$fromFloat(a * 0.6) + '%, var(--pn2))'))))
					]),
				A2(
					$elm$core$List$map,
					$elm$html$Html$Attributes$map(hand),
					A2($author$project$Ui$Control$drag, c.w, 3))),
			_List_fromArray(
				[
					$elm$html$Html$text(
					$author$project$Ui$Routes$amountText(c.cd))
				]));
	});
var $author$project$Ui$MatrixGrid$cell = F5(
	function (connect, hand, routes, src, dst) {
		var _v0 = A2(
			$elm$core$List$filter,
			function (c) {
				return _Utils_eq(c.S, src) && _Utils_eq(c.e2, dst);
			},
			$author$project$Ui$Routes$cables(routes));
		if (_v0.b) {
			var c = _v0.a;
			return A2($author$project$Ui$MatrixGrid$patched, hand, c);
		} else {
			return A2(
				$elm$html$Html$td,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$title(
						'patch ' + ($author$project$Ui$Routes$sourceName(src) + (' → ' + $author$project$Ui$Routes$destName(dst)))),
						$elm$html$Html$Events$onClick(
						A2(connect, src, dst))
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('·')
					]));
		}
	});
var $elm$html$Html$table = _VirtualDom_node('table');
var $elm$html$Html$th = _VirtualDom_node('th');
var $elm$html$Html$tr = _VirtualDom_node('tr');
var $author$project$Ui$MatrixGrid$view = F2(
	function (_v0, routes) {
		var connect = _v0.d7;
		var hand = _v0.en;
		return A2(
			$elm$html$Html$table,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('mx')
				]),
			A2(
				$elm$core$List$cons,
				A2(
					$elm$html$Html$tr,
					_List_Nil,
					A2(
						$elm$core$List$cons,
						A2(
							$elm$html$Html$th,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('rh')
								]),
							_List_Nil),
						A2(
							$elm$core$List$map,
							function (dst) {
								return A2(
									$elm$html$Html$th,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$title(
											$author$project$Ui$Routes$destName(dst))
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(
											$author$project$Ui$Routes$destName(dst))
										]));
							},
							$author$project$Ui$Routes$dests(routes)))),
				A2(
					$elm$core$List$map,
					function (src) {
						return A2(
							$elm$html$Html$tr,
							_List_Nil,
							A2(
								$elm$core$List$cons,
								A2(
									$elm$html$Html$th,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('rh')
										]),
									_List_fromArray(
										[
											$elm$html$Html$text(
											$author$project$Ui$Routes$sourceName(src))
										])),
								A2(
									$elm$core$List$map,
									A4($author$project$Ui$MatrixGrid$cell, connect, hand, routes, src),
									$author$project$Ui$Routes$dests(routes))));
					},
					$author$project$Ui$Routes$sources(routes))));
	});
var $author$project$Ui$PatchBay$view = F2(
	function (_v0, routes) {
		var bay = _v0;
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('bay')
				]),
			_List_fromArray(
				[
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('bayhead')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$div,
							_List_fromArray(
								[
									$elm$html$Html$Attributes$class('words')
								]),
							A2(
								$elm$core$List$map,
								function (_v1) {
									var v = _v1.a;
									var l = _v1.b;
									return A2(
										$elm$html$Html$button,
										_List_fromArray(
											[
												$elm$html$Html$Attributes$classList(
												_List_fromArray(
													[
														_Utils_Tuple2(
														'on',
														_Utils_eq(v, bay.e6))
													])),
												A2(
												$elm$html$Html$Attributes$attribute,
												'aria-pressed',
												$author$project$Ui$PatchBay$ariaBool(
													_Utils_eq(v, bay.e6))),
												$elm$html$Html$Events$onClick(
												$author$project$Ui$PatchBay$ShowAs(v))
											]),
										_List_fromArray(
											[
												$elm$html$Html$text(l)
											]));
								},
								_List_fromArray(
									[
										_Utils_Tuple2(0, 'PATCH'),
										_Utils_Tuple2(1, 'MATRIX')
									])))
						])),
					function () {
					var _v2 = bay.e6;
					if (!_v2) {
						return A2($author$project$Ui$PatchBay$patch, bay.aC, routes);
					} else {
						return A2(
							$author$project$Ui$MatrixGrid$view,
							{d7: $author$project$Ui$PatchBay$Connect, en: $author$project$Ui$PatchBay$Hand},
							routes);
					}
				}(),
					A2(
					$elm$html$Html$div,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('baynote')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text('Drag from an output to an input to patch. Drag a knob up or down for its amount, double-click it to unpatch. Cable colour is the sign: '),
							A2(
							$elm$html$Html$b,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text('amber')
								])),
							$elm$html$Html$text(' adds, '),
							A2(
							$elm$html$Html$i,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text('blue')
								])),
							$elm$html$Html$text(' subtracts.')
						]))
				]));
	});
var $author$project$View$EnginePage$extra = F2(
	function (ctx, x) {
		switch (x.$) {
			case 2:
				var named = A3(
					$elm$core$List$foldl,
					F2(
						function (r, acc) {
							return A2($elm$core$List$member, r, acc) ? acc : _Utils_ap(
								acc,
								_List_fromArray(
									[r]));
						}),
					_List_Nil,
					A2(
						$elm$core$List$concatMap,
						A2(
							$elm$core$Basics$composeR,
							function ($) {
								return $.eO;
							},
							A2(
								$elm$core$Basics$composeR,
								$elm$core$List$filter(
									$author$project$Schema$panelShown(ctx.q.L)),
								$elm$core$List$concatMap(
									A2(
										$elm$core$Basics$composeR,
										function ($) {
											return $.W;
										},
										$elm$core$List$map(
											function ($) {
												return $.aO;
											}))))),
						$author$project$Schema$pages(ctx.q.g)));
				return $elm$core$List$isEmpty(named) ? $elm$html$Html$text('') : A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('pnote')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(
							A2($elm$core$String$join, ' · ', named) + ': MOD MATRIX ROUTES, IN MOD ONCE THE UNIT DESCRIBES THEM')
						]));
			case 0:
				return $author$project$Ui$Module$panel(
					_List_fromArray(
						[
							A2(
							$author$project$Ui$Module$group,
							'',
							_List_fromArray(
								[
									A3(
									$author$project$Ui$Control$cell,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$class('ro')
										]),
									'SOURCE',
									_List_fromArray(
										[
											A2(
											$author$project$Ui$Control$readout,
											$author$project$View$EnginePage$sourceChars,
											function () {
												var _v1 = ctx.q.cR;
												if (!_v1.$) {
													var t = _v1.a;
													return A2($author$project$Ui$Control$reading, 0, t);
												} else {
													return $author$project$Ui$Control$missing;
												}
											}())
										]))
								]))
						]));
			case 1:
				var t = x.a;
				return A2(
					$elm$html$Html$p,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('pnote')
						]),
					_List_fromArray(
						[
							$elm$html$Html$text(t)
						]));
			case 4:
				var pad = x.a;
				return A2(
					$elm$html$Html$map,
					$author$project$View$EnginePage$BayMsg(
						$author$project$View$EnginePage$PadBay(pad)),
					A2(
						$author$project$Ui$PatchBay$view,
						A2(
							$author$project$View$EnginePage$bayOf,
							$author$project$View$EnginePage$PadBay(pad),
							ctx.bp),
						A2($author$project$View$EnginePage$padBay, ctx.q, pad)));
			default:
				return A2(
					$elm$html$Html$div,
					_List_Nil,
					_List_fromArray(
						[
							A2(
							$elm$html$Html$map,
							$author$project$View$EnginePage$BayMsg($author$project$View$EnginePage$PartBay),
							A2(
								$author$project$Ui$PatchBay$view,
								A2($author$project$View$EnginePage$bayOf, $author$project$View$EnginePage$PartBay, ctx.bp),
								$author$project$View$EnginePage$partBay(ctx.q)))
						]));
		}
	});
var $author$project$Layout$Shared$extras = function (_v0) {
	var m = _v0;
	return m.a8;
};
var $author$project$Layout$Shared$fill = F2(
	function (items, _v0) {
		var m = _v0;
		return A2(
			$elm$core$List$filter,
			A2(
				$elm$core$Basics$composeR,
				$elm$core$Tuple$second,
				A2($elm$core$Basics$composeR, $elm$core$List$isEmpty, $elm$core$Basics$not)),
			A2(
				$elm$core$List$map,
				function (g) {
					return _Utils_Tuple2(
						g.b7,
						A2(
							$elm$core$List$filterMap,
							function (s) {
								return A2(
									$elm$core$Maybe$map,
									function (i) {
										return _Utils_Tuple2(i, s.ac);
									},
									A2(
										$elm$core$Maybe$andThen,
										function (a) {
											return A2(
												$elm$core$Dict$get,
												$author$project$Addr$key(a),
												items);
										},
										$elm$core$Result$toMaybe(s.w)));
							},
							g.b3));
				},
				m.av));
	});
var $author$project$Layout$Shared$header = function (_v0) {
	var m = _v0;
	return A2($elm$core$List$filterMap, $elm$core$Result$toMaybe, m.bN);
};
var $author$project$Layout$Shared$isWhole = function (_v0) {
	var m = _v0;
	return m.cS === 1;
};
var $author$project$Ui$Module$menus = F2(
	function (ms, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{cy: ms});
	});
var $author$project$Layout$Shared$note = function (_v0) {
	var m = _v0;
	return m.cH;
};
var $author$project$Layout$Shared$screen = function (_v0) {
	var m = _v0;
	return m.b0;
};
var $author$project$Layout$Page$padLabel = function (n) {
	return 'PAD' + $elm$core$String$fromInt(
		$author$project$Ui$Pad$number(n));
};
var $author$project$Layout$Page$drawnLabel = function (p) {
	switch (p.$) {
		case 0:
			return 'ALG';
		case 1:
			return 'PIT';
		case 2:
			var o = p.a;
			return 'OP' + $elm$core$String$fromInt(
				$author$project$Addr$operatorNumber(o));
		case 3:
			return 'FLT';
		case 4:
			return 'FX';
		case 5:
			return 'SND';
		case 6:
			var e = p.a;
			return 'E' + $elm$core$String$fromInt(
				$author$project$Addr$envNumber(e));
		case 7:
			var l = p.a;
			return 'L' + $elm$core$String$fromInt(
				$author$project$Addr$lfoNumber(l));
		default:
			var n = p.a;
			var pp = p.b;
			return _Utils_ap(
				$author$project$Layout$Page$padLabel(n),
				function () {
					switch (pp) {
						case 0:
							return '_KIT';
						case 1:
							return '_FLT';
						case 2:
							return '_AMP';
						case 3:
							return '_PENV';
						default:
							return '_FX';
					}
				}());
	}
};
var $author$project$Layout$Page$scopedLabel = function (p) {
	switch (p.$) {
		case 0:
			return 'VA';
		case 1:
			return 'NOISE';
		case 2:
			return 'RES';
		case 3:
			return 'EXC';
		case 4:
			return 'MDL2';
		case 5:
			return 'SRC';
		case 6:
			return 'DECK';
		case 7:
			return 'MCH';
		case 8:
			return 'PIT';
		default:
			var n = p.a;
			var pp = p.b;
			return _Utils_ap(
				$author$project$Layout$Page$padLabel(n),
				function () {
					if (!pp) {
						return '_MCH';
					} else {
						return '_PLFO';
					}
				}());
	}
};
var $author$project$Layout$Page$label = function (p) {
	if (!p.$) {
		var d = p.a;
		return $author$project$Layout$Page$drawnLabel(d);
	} else {
		var s = p.a;
		return $author$project$Layout$Page$scopedLabel(s);
	}
};
var $author$project$Schema$pageNumber = F2(
	function (label, _v0) {
		var s = _v0;
		return A2(
			$elm$core$Maybe$map,
			function ($) {
				return $.eC;
			},
			$elm$core$List$head(
				A2(
					$elm$core$List$filter,
					function (pg) {
						return _Utils_eq(
							$author$project$Protocol$pageLabel(pg.aO),
							label);
					},
					s.aB)));
	});
var $author$project$Layout$Page$resolve = function (p) {
	return $author$project$Schema$pageNumber(
		$author$project$Layout$Page$label(p));
};
var $author$project$Ui$Screen$Config = $elm$core$Basics$identity;
var $author$project$Ui$Screen$Drawn = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$Screen$ScreenArt = {$: 0};
var $author$project$Ui$Screen$drawn = F3(
	function (e, n, s) {
		return {
			ar: $author$project$Ui$Screen$Drawn(
				{ae: $elm$core$Maybe$Nothing, aj: $elm$core$Maybe$Nothing, bk: n, am: $author$project$Ui$Screen$ScreenArt, b1: s}),
			R: '',
			t: e,
			a9: $elm$core$Maybe$Nothing,
			K: _List_Nil
		};
	});
var $author$project$Ui$Screen$fallback = F2(
	function (g, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{
				a9: $elm$core$Maybe$Just(g)
			});
	});
var $author$project$Ui$Screen$focus = F2(
	function (f, _v0) {
		var c = _v0;
		var _v1 = c.ar;
		if (_v1.$ === 1) {
			var d = _v1.a;
			return _Utils_update(
				c,
				{
					ar: $author$project$Ui$Screen$Drawn(
						_Utils_update(
							d,
							{
								ae: $elm$core$Maybe$Just(f)
							}))
				});
		} else {
			return c;
		}
	});
var $author$project$Ui$Screen$Gauge = {$: 1};
var $author$project$Ui$Screen$gauge = F3(
	function (e, n, f) {
		return {
			ar: $author$project$Ui$Screen$Drawn(
				{
					ae: $elm$core$Maybe$Just(f),
					aj: $elm$core$Maybe$Nothing,
					bk: n,
					am: $author$project$Ui$Screen$Gauge,
					b1: 0
				}),
			R: '',
			t: e,
			a9: $elm$core$Maybe$Nothing,
			K: _List_Nil
		};
	});
var $author$project$Ui$Screen$onPad = F2(
	function (p, _v0) {
		var c = _v0;
		var _v1 = c.ar;
		if (_v1.$ === 1) {
			var d = _v1.a;
			return _Utils_update(
				c,
				{
					ar: $author$project$Ui$Screen$Drawn(
						_Utils_update(
							d,
							{
								aj: $elm$core$Maybe$Just(p)
							}))
				});
		} else {
			return c;
		}
	});
var $author$project$Layout$Page$pad = function (p) {
	if (!p.$) {
		switch (p.a.$) {
			case 8:
				var _v1 = p.a;
				var n = _v1.a;
				return $elm$core$Maybe$Just(n);
			case 0:
				var _v3 = p.a;
				return $elm$core$Maybe$Nothing;
			case 1:
				var _v4 = p.a;
				return $elm$core$Maybe$Nothing;
			case 2:
				return $elm$core$Maybe$Nothing;
			case 3:
				var _v5 = p.a;
				return $elm$core$Maybe$Nothing;
			case 4:
				var _v6 = p.a;
				return $elm$core$Maybe$Nothing;
			case 5:
				var _v7 = p.a;
				return $elm$core$Maybe$Nothing;
			case 6:
				return $elm$core$Maybe$Nothing;
			default:
				return $elm$core$Maybe$Nothing;
		}
	} else {
		switch (p.a.$) {
			case 9:
				var _v2 = p.a;
				var n = _v2.a;
				return $elm$core$Maybe$Just(n);
			case 0:
				var _v8 = p.a;
				return $elm$core$Maybe$Nothing;
			case 1:
				var _v9 = p.a;
				return $elm$core$Maybe$Nothing;
			case 2:
				var _v10 = p.a;
				return $elm$core$Maybe$Nothing;
			case 3:
				var _v11 = p.a;
				return $elm$core$Maybe$Nothing;
			case 4:
				var _v12 = p.a;
				return $elm$core$Maybe$Nothing;
			case 5:
				var _v13 = p.a;
				return $elm$core$Maybe$Nothing;
			case 6:
				var _v14 = p.a;
				return $elm$core$Maybe$Nothing;
			case 7:
				var _v15 = p.a;
				return $elm$core$Maybe$Nothing;
			default:
				var _v16 = p.a;
				return $elm$core$Maybe$Nothing;
		}
	}
};
var $author$project$Layout$Shared$screenConfig = F3(
	function (e, n, _v0) {
		var s = _v0;
		return A3(
			$elm$core$Basics$apR,
			A2(
				$elm$core$Maybe$map,
				$author$project$Ui$Screen$onPad,
				$author$project$Layout$Page$pad(s.bk)),
			$elm$core$Maybe$withDefault($elm$core$Basics$identity),
			A3(
				$elm$core$Basics$apR,
				A2($elm$core$Maybe$map, $author$project$Ui$Screen$fallback, s.a9),
				$elm$core$Maybe$withDefault($elm$core$Basics$identity),
				function () {
					var _v1 = s.ar;
					if (!_v1.$) {
						var shape = _v1.a;
						var f = _v1.b;
						return A3(
							$elm$core$Basics$apR,
							A2($elm$core$Maybe$map, $author$project$Ui$Screen$focus, f),
							$elm$core$Maybe$withDefault($elm$core$Basics$identity),
							A3($author$project$Ui$Screen$drawn, e, n, shape));
					} else {
						var f = _v1.a;
						return A3($author$project$Ui$Screen$gauge, e, n, f);
					}
				}()));
	});
var $author$project$Layout$Shared$screenPage = function (_v0) {
	var s = _v0;
	return s.bk;
};
var $author$project$Layout$Shared$screenReads = function (_v0) {
	var s = _v0;
	return A2($elm$core$List$filterMap, $elm$core$Result$toMaybe, s.aW);
};
var $author$project$Schema$addresses = function (_v0) {
	var s = _v0;
	return $elm$core$List$reverse(s.aU);
};
var $author$project$Schema$pageAddresses = F2(
	function (n, _v0) {
		var s = _v0;
		return $elm$core$List$reverse(
			A3(
				$elm$core$List$foldl,
				F2(
					function (a, _v1) {
						var seen = _v1.a;
						var out = _v1.b;
						return A2($elm$core$List$member, a, seen) ? _Utils_Tuple2(seen, out) : _Utils_Tuple2(
							A2($elm$core$List$cons, a, seen),
							A2($elm$core$List$cons, a, out));
					}),
				_Utils_Tuple2(_List_Nil, _List_Nil),
				A2(
					$elm$core$List$concatMap,
					A2(
						$elm$core$Basics$composeR,
						function ($) {
							return $.eO;
						},
						$elm$core$List$concatMap(
							A2(
								$elm$core$Basics$composeR,
								function ($) {
									return $.eP;
								},
								$elm$core$List$map(
									function ($) {
										return $.w;
									})))),
					A2(
						$elm$core$List$filter,
						function (pg) {
							return _Utils_eq(pg.eC, n);
						},
						s.aB))).b);
	});
var $author$project$Layout$Page$variantSelector = function (name) {
	var padOf = function (suffix) {
		return (A2($elm$core$String$startsWith, 'PAD', name) && A2($elm$core$String$endsWith, suffix, name)) ? A2(
			$elm$core$Maybe$andThen,
			function (n) {
				return $elm$core$List$head(
					A2(
						$elm$core$List$filter,
						function (q) {
							return _Utils_eq(
								$author$project$Ui$Pad$number(q),
								n);
						},
						$author$project$Ui$Pad$all));
			},
			$elm$core$String$toInt(
				A2(
					$elm$core$String$dropRight,
					$elm$core$String$length(suffix),
					A2($elm$core$String$dropLeft, 3, name)))) : $elm$core$Maybe$Nothing;
	};
	var numbered = F2(
		function (prefix, xs) {
			return A2($elm$core$String$startsWith, prefix, name) ? A2(
				$elm$core$Maybe$andThen,
				function (n) {
					return (n >= 1) ? $elm$core$List$head(
						A2($elm$core$List$drop, n - 1, xs)) : $elm$core$Maybe$Nothing;
				},
				$elm$core$String$toInt(
					A2(
						$elm$core$String$dropLeft,
						$elm$core$String$length(prefix),
						name))) : $elm$core$Maybe$Nothing;
		});
	var f = function (b) {
		return A2(
			$elm$core$Basics$composeR,
			$author$project$Addr$named(b),
			$elm$core$Result$toMaybe);
	};
	switch (name) {
		case 'FILTER':
			return A2(f, $author$project$Addr$Filter, 'KIND');
		case 'FX':
			return A2(f, $author$project$Addr$VoiceFx, 'TYPE');
		case 'RESONATOR':
			return A2(f, $author$project$Addr$Modal, 'MODE');
		case 'MACHINE':
			return A2(f, $author$project$Addr$Tape, 'MODEL');
		default:
			return $elm$core$List$head(
				A2(
					$elm$core$List$filterMap,
					$elm$core$Basics$identity,
					_List_fromArray(
						[
							A2(
							$elm$core$Maybe$andThen,
							function (e) {
								return A2(
									f,
									$author$project$Addr$EnvBlock(e),
									'TYPE');
							},
							A2(numbered, 'ENV', $author$project$Addr$envs)),
							A2(
							$elm$core$Maybe$andThen,
							function (l) {
								return A2(
									f,
									$author$project$Addr$LfoBlock(l),
									'TYPE');
							},
							A2(numbered, 'LFO', $author$project$Addr$lfos)),
							A2(
							$elm$core$Maybe$andThen,
							function (o) {
								return A2(
									f,
									$author$project$Addr$Op(o),
									'WAVE');
							},
							A2(numbered, 'OP', $author$project$Addr$operators)),
							A2(
							$elm$core$Maybe$andThen,
							function (p) {
								return A2(
									f,
									A2($author$project$Addr$Pad, p, $author$project$Addr$Voice),
									'MACHINE');
							},
							padOf('_MCH')),
							A2(
							$elm$core$Maybe$andThen,
							function (p) {
								return A2(
									f,
									A2($author$project$Addr$Pad, p, $author$project$Addr$PadFilter),
									'KIND');
							},
							padOf('_FLT'))
						])));
	}
};
var $author$project$View$EnginePage$screenVals = F3(
	function (m, n, reads) {
		var selectors = A2(
			$elm$core$List$filterMap,
			A2(
				$elm$core$Basics$composeR,
				function ($) {
					return $.aR;
				},
				$author$project$Layout$Page$variantSelector),
			A2(
				$elm$core$List$filter,
				function (pn) {
					return !_Utils_eq(pn.dT, $elm$core$Maybe$Nothing);
				},
				A2(
					$elm$core$List$concatMap,
					function ($) {
						return $.eO;
					},
					A2(
						$elm$core$List$filter,
						function (pg) {
							return _Utils_eq(pg.eC, n);
						},
						$author$project$Schema$pages(m.g)))));
		var own = A2($author$project$Schema$pageAddresses, n, m.g);
		var wanted = $elm$core$Set$fromList(
			A2(
				$elm$core$List$map,
				$author$project$Addr$key,
				_Utils_ap(
					own,
					_Utils_ap(selectors, reads))));
		return A2(
			$elm$core$List$filterMap,
			function (a) {
				return A2(
					$elm$core$Maybe$map,
					function (v) {
						return _Utils_Tuple2(a, v.cW);
					},
					A2($author$project$Model$shown, a, m));
			},
			A2(
				$elm$core$List$filter,
				function (a) {
					return A2(
						$elm$core$Set$member,
						$author$project$Addr$key(a),
						wanted);
				},
				$author$project$Schema$addresses(m.g)));
	});
var $author$project$Ui$Screen$values = F2(
	function (vs, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{K: vs});
	});
var $author$project$View$EnginePage$screenSpec = F3(
	function (m, e, sc) {
		return A2(
			$elm$core$Maybe$map,
			function (n) {
				return A2(
					$author$project$Ui$Screen$values,
					A3(
						$author$project$View$EnginePage$screenVals,
						m,
						n,
						$author$project$Layout$Shared$screenReads(sc)),
					A3($author$project$Layout$Shared$screenConfig, e, n, sc));
			},
			A2(
				$author$project$Layout$Page$resolve,
				$author$project$Layout$Shared$screenPage(sc),
				m.g));
	});
var $author$project$Ui$Module$summary = F2(
	function (s, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{cY: s});
	});
var $author$project$View$EnginePage$summaryOf = F2(
	function (ctx, i) {
		return _Utils_Tuple2(
			i.aO,
			$author$project$View$EnginePage$isChoice(i.bl) ? A2(
				$author$project$Ui$Control$choiceText,
				i.bl.bi,
				A2($author$project$View$EnginePage$chosen, ctx.q, i.bl)) : $author$project$Ui$Control$text(
				A2($author$project$View$EnginePage$reading, ctx.q, i.bl)));
	});
var $author$project$Layout$Shared$title = function (_v0) {
	var m = _v0;
	return m.b7;
};
var $author$project$View$EnginePage$moduleOf = F2(
	function (ctx, md) {
		var screen = A2(
			$elm$core$Maybe$withDefault,
			_List_Nil,
			A2(
				$elm$core$Maybe$map,
				function (sc) {
					return _List_fromArray(
						[
							A2(
							$author$project$Ui$Module$group,
							'',
							_List_fromArray(
								[
									$author$project$Ui$Screen$view(sc)
								]))
						]);
				},
				A2(
					$elm$core$Maybe$andThen,
					A2($author$project$View$EnginePage$screenSpec, ctx.q, ctx.t),
					$author$project$Layout$Shared$screen(md))));
		var headers = A2(
			$elm$core$List$filterMap,
			function (a) {
				return A2(
					$elm$core$Dict$get,
					$author$project$Addr$key(a),
					ctx.bP);
			},
			$author$project$Layout$Shared$header(md));
		var groups = A2($author$project$Layout$Shared$fill, ctx.bP, md);
		var nothing = ($elm$core$List$isEmpty(groups) && $elm$core$List$isEmpty(
			$author$project$Layout$Shared$extras(md))) ? _List_fromArray(
			[
				A2(
				$elm$html$Html$p,
				_List_fromArray(
					[
						$elm$html$Html$Attributes$class('pnote')
					]),
				_List_fromArray(
					[
						$elm$html$Html$text('NOTHING TO SET FOR THIS TYPE')
					]))
			]) : _List_Nil;
		return A2(
			$author$project$Ui$Module$body,
			_Utils_ap(
				($elm$core$List$isEmpty(screen) && $elm$core$List$isEmpty(groups)) ? _List_Nil : _List_fromArray(
					[
						$author$project$Ui$Module$panel(
						_Utils_ap(
							screen,
							A2(
								$elm$core$List$map,
								function (_v0) {
									var t = _v0.a;
									var xs = _v0.b;
									return A2(
										$author$project$Ui$Module$group,
										t,
										A2(
											$elm$core$List$map,
											$author$project$View$EnginePage$control(ctx),
											xs));
								},
								groups)))
					]),
				_Utils_ap(
					nothing,
					A2(
						$elm$core$List$map,
						$author$project$View$EnginePage$extra(ctx),
						$author$project$Layout$Shared$extras(md)))),
			($author$project$Layout$Shared$isWhole(md) ? $author$project$Ui$Module$full : $elm$core$Basics$identity)(
				A2(
					$author$project$Ui$Module$summary,
					A2(
						$elm$core$List$map,
						$author$project$View$EnginePage$summaryOf(ctx),
						A2(
							$elm$core$List$take,
							3,
							_Utils_ap(
								headers,
								A2(
									$elm$core$List$concatMap,
									A2(
										$elm$core$Basics$composeR,
										$elm$core$Tuple$second,
										$elm$core$List$map($elm$core$Tuple$first)),
									groups)))),
					A2(
						$author$project$Ui$Module$menus,
						A2(
							$elm$core$List$map,
							function (i) {
								return A3($author$project$View$EnginePage$menuOf, ctx, true, i);
							},
							headers),
						A2(
							$author$project$Ui$Module$note,
							$author$project$Layout$Shared$note(md),
							A2(
								$author$project$Ui$Module$new,
								$author$project$Layout$Shared$chip(md),
								$author$project$Layout$Shared$title(md)))))));
	});
var $author$project$Ui$Screen$Crop = function (a) {
	return {$: 0, a: a};
};
var $author$project$Ui$Screen$new = F2(
	function (e, g) {
		return {
			ar: $author$project$Ui$Screen$Crop(g),
			R: '',
			t: e,
			a9: $elm$core$Maybe$Nothing,
			K: _List_Nil
		};
	});
var $author$project$Ui$PadStrip$new = F2(
	function (kit, name) {
		return {
			cr: function (p) {
				return A2(
					$author$project$Ui$Screen$new,
					4,
					$author$project$Ui$Screen$PadIcon(p));
			},
			dn: kit,
			aR: name
		};
	});
var $author$project$Layout$Shared$Placed = function (a) {
	return {$: 0, a: a};
};
var $author$project$Layout$Shared$Unplaced = {$: 1};
var $author$project$Layout$Shared$addresses = function (_v0) {
	var m = _v0;
	return _Utils_ap(
		$author$project$Layout$Shared$header(m),
		_Utils_ap(
			A2(
				$elm$core$List$concatMap,
				A2(
					$elm$core$Basics$composeR,
					function ($) {
						return $.b3;
					},
					$elm$core$List$filterMap(
						A2(
							$elm$core$Basics$composeR,
							function ($) {
								return $.w;
							},
							$elm$core$Result$toMaybe))),
				m.av),
			A2(
				$elm$core$List$concatMap,
				function (x) {
					switch (x.$) {
						case 4:
							var p = x.a;
							return A2(
								$elm$core$List$concatMap,
								function (r) {
									return _List_fromArray(
										[r.cR, r.cl, r.cd]);
								},
								$author$project$Layout$Shared$padRoutes(p));
						case 0:
							return _List_Nil;
						case 1:
							return _List_Nil;
						case 2:
							return _List_Nil;
						default:
							return _List_Nil;
					}
				},
				m.a8)));
};
var $author$project$Layout$Shared$place = function (every) {
	var holder = A3(
		$elm$core$List$foldr,
		F2(
			function (m, acc) {
				return A3(
					$elm$core$List$foldl,
					function (a) {
						return A2(
							$elm$core$Dict$insert,
							$author$project$Addr$key(a),
							m);
					},
					acc,
					$author$project$Layout$Shared$addresses(m));
			}),
		$elm$core$Dict$empty,
		every);
	return function (item) {
		var _v0 = A2(
			$elm$core$Dict$get,
			$author$project$Addr$key(item.bl.w),
			holder);
		if (!_v0.$) {
			var m = _v0.a;
			return $author$project$Layout$Shared$Placed(m);
		} else {
			return $author$project$Layout$Shared$Unplaced;
		}
	};
};
var $author$project$View$EnginePage$other = F2(
	function (items, every) {
		var placed = $author$project$Layout$Shared$place(every);
		return A2(
			$elm$core$List$filter,
			function (i) {
				var _v0 = placed(i);
				if (!_v0.$) {
					return false;
				} else {
					return true;
				}
			},
			items);
	});
var $author$project$Ui$Chip$Other = 15;
var $author$project$View$EnginePage$otherModule = F2(
	function (ctx, items) {
		return A2(
			$author$project$Ui$Module$body,
			_List_fromArray(
				[
					$author$project$Ui$Module$panel(
					_List_fromArray(
						[
							A2(
							$author$project$Ui$Module$group,
							'',
							A2(
								$elm$core$List$map,
								function (i) {
									return A2(
										$author$project$View$EnginePage$control,
										ctx,
										_Utils_Tuple2(i, 0));
								},
								items))
						]))
				]),
			A2(
				$author$project$Ui$Module$note,
				'DESCRIBED BY THE UNIT, NOT YET PLACED',
				A2($author$project$Ui$Module$new, 15, 'OTHER')));
	});
var $author$project$View$EnginePage$machineOf = function (p) {
	return A2(
		$author$project$Addr$named,
		A2($author$project$Addr$Pad, p, $author$project$Addr$Voice),
		'MACHINE');
};
var $author$project$Ui$Screen$PadIconOf = function (a) {
	return {$: 2, a: a};
};
var $author$project$Ui$Screen$padIcon = F2(
	function (n, p) {
		return {
			ar: $author$project$Ui$Screen$Drawn(
				{
					ae: $elm$core$Maybe$Nothing,
					aj: $elm$core$Maybe$Just(p),
					bk: n,
					am: $author$project$Ui$Screen$PadIconOf(p),
					b1: 0
				}),
			R: '',
			t: 4,
			a9: $elm$core$Maybe$Just(
				$author$project$Ui$Screen$PadIcon(p)),
			K: _List_Nil
		};
	});
var $author$project$View$EnginePage$padIcon = F2(
	function (m, p) {
		return A2(
			$elm$core$Maybe$withDefault,
			A2(
				$author$project$Ui$Screen$new,
				4,
				$author$project$Ui$Screen$PadIcon(p)),
			A2(
				$elm$core$Maybe$map,
				function (_v0) {
					var n = _v0.a;
					var machine = _v0.b;
					return A2(
						$author$project$Ui$Screen$values,
						A2(
							$elm$core$Maybe$withDefault,
							_List_Nil,
							A2(
								$elm$core$Maybe$map,
								function (v) {
									return _List_fromArray(
										[
											_Utils_Tuple2(machine, v.cW)
										]);
								},
								A2($author$project$Model$shown, machine, m))),
						A2($author$project$Ui$Screen$padIcon, n, p));
				},
				A3(
					$elm$core$Maybe$map2,
					$elm$core$Tuple$pair,
					A2(
						$author$project$Layout$Page$resolve,
						$author$project$Layout$Page$Scoped(
							A2($author$project$Layout$Page$PadScoped, p, 0)),
						m.g),
					$elm$core$Result$toMaybe(
						$author$project$View$EnginePage$machineOf(p)))));
	});
var $author$project$View$EnginePage$padName = F2(
	function (m, p) {
		return A2(
			$elm$core$Maybe$withDefault,
			'--',
			A2(
				$elm$core$Maybe$map,
				function ($) {
					return $.aZ;
				},
				A2(
					$elm$core$Maybe$andThen,
					function (a) {
						return A2($author$project$Model$shown, a, m);
					},
					$elm$core$Result$toMaybe(
						$author$project$View$EnginePage$machineOf(p)))));
	});
var $author$project$Ui$Page$Elsewhere = 1;
var $author$project$Model$FollowPart = function (a) {
	return {$: 5, a: a};
};
var $author$project$View$EnginePage$partTabs = function (m) {
	return A2(
		$elm$core$List$map,
		function (pt) {
			return {
				c6: _Utils_eq(
					m.ak,
					$elm$core$Maybe$Just(pt)) ? 0 : 1,
				dg: $author$project$View$EnginePage$Unit(
					$author$project$Model$FollowPart(pt)),
				dl: 'P' + $elm$core$String$fromInt(
					$author$project$Unit$partNumber(pt)),
				aR: function () {
					var _v0 = _Utils_Tuple2(
						_Utils_eq(
							m.ak,
							$elm$core$Maybe$Just(pt)),
						m.t);
					if (_v0.a) {
						if (!_v0.b.$) {
							var e = _v0.b.a;
							return $author$project$Unit$engineName(e);
						} else {
							var _v1 = _v0.b;
							return 'PART';
						}
					} else {
						return 'PART';
					}
				}()
			};
		},
		$author$project$Unit$allParts);
};
var $author$project$Ui$Page$parts = F2(
	function (ts, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{cJ: ts});
	});
var $author$project$Ui$Page$strip = F2(
	function (s, _v0) {
		var c = _v0;
		return _Utils_update(
			c,
			{
				cX: _List_fromArray(
					[s])
			});
	});
var $author$project$Ui$PadStrip$PadTab = function (a) {
	return {$: 1, a: a};
};
var $author$project$Ui$PadStrip$Select = $elm$core$Basics$identity;
var $author$project$Ui$PadStrip$tab = F3(
	function (on, t, attrs) {
		return $elm$html$Html$button(
			_Utils_ap(
				_List_fromArray(
					[
						$elm$html$Html$Attributes$classList(
						_List_fromArray(
							[
								_Utils_Tuple2('pst', true),
								_Utils_Tuple2('on', on)
							])),
						A2($elm$html$Html$Attributes$attribute, 'role', 'tab'),
						A2(
						$elm$html$Html$Attributes$attribute,
						'aria-selected',
						on ? 'true' : 'false'),
						$elm$html$Html$Events$onClick(t)
					]),
				attrs));
	});
var $author$project$Ui$PadStrip$view = F2(
	function (_v0, shown) {
		var c = _v0;
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class('padstrip'),
					A2($elm$html$Html$Attributes$attribute, 'role', 'tablist'),
					A2($elm$html$Html$Attributes$attribute, 'aria-label', 'pads')
				]),
			A2(
				$elm$core$List$cons,
				A4(
					$author$project$Ui$PadStrip$tab,
					_Utils_eq(shown, $author$project$Ui$PadStrip$Kit),
					$author$project$Ui$PadStrip$Kit,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class('kit')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$b,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text('KIT')
								])),
							A2(
							$elm$html$Html$span,
							_List_Nil,
							_List_fromArray(
								[
									$elm$html$Html$text(c.dn)
								]))
						])),
				A2(
					$elm$core$List$map,
					function (p) {
						return A4(
							$author$project$Ui$PadStrip$tab,
							_Utils_eq(
								shown,
								$author$project$Ui$PadStrip$PadTab(p)),
							$author$project$Ui$PadStrip$PadTab(p),
							_List_Nil,
							_List_fromArray(
								[
									$author$project$Ui$Screen$view(
									c.cr(p)),
									A2(
									$elm$html$Html$span,
									_List_Nil,
									_List_fromArray(
										[
											A2(
											$elm$html$Html$b,
											_List_Nil,
											_List_fromArray(
												[
													$elm$html$Html$text(
													$author$project$Ui$Pad$label(p))
												])),
											$elm$html$Html$text(
											c.aR(p))
										]))
								]));
					},
					$author$project$Ui$Pad$all)));
	});
var $author$project$View$EnginePage$enginePage = F4(
	function (m, s, status, e) {
		var title = _Utils_ap(
			A2(
				$elm$core$Maybe$withDefault,
				'',
				A2(
					$elm$core$Maybe$map,
					function (pt) {
						return 'PART ' + ($elm$core$String$fromInt(
							$author$project$Unit$partNumber(pt)) + ' · ');
					},
					m.ak)),
			$author$project$Unit$engineName(e));
		var lay = A2($author$project$View$EnginePage$layout, e, s.bv);
		var items = A2($author$project$Layout$Shared$active, m.g, m.L);
		var rest = A2($author$project$View$EnginePage$other, items, lay.bK);
		var ctx = {
			t: e,
			bP: $author$project$Layout$Shared$index(items),
			q: m,
			bp: s
		};
		return A3(
			$author$project$Ui$Page$view,
			$author$project$View$EnginePage$PageMsg,
			s.bk,
			A2(
				$author$project$Ui$Page$modules,
				_Utils_ap(
					$author$project$View$EnginePage$saidModule(m),
					_Utils_ap(
						A2(
							$elm$core$List$map,
							$author$project$View$EnginePage$moduleOf(ctx),
							lay.b2),
						$elm$core$List$isEmpty(rest) ? _List_Nil : _List_fromArray(
							[
								A2($author$project$View$EnginePage$otherModule, ctx, rest)
							]))),
				function () {
					switch (e) {
						case 4:
							return $author$project$Ui$Page$strip(
								A2(
									$elm$html$Html$map,
									$author$project$View$EnginePage$PadMsg,
									A2(
										$author$project$Ui$PadStrip$view,
										A2(
											$author$project$Ui$PadStrip$icons,
											$author$project$View$EnginePage$padIcon(m),
											A2(
												$author$project$Ui$PadStrip$new,
												'DRUM',
												$author$project$View$EnginePage$padName(m))),
										s.bv)));
						case 0:
							return $elm$core$Basics$identity;
						case 2:
							return $elm$core$Basics$identity;
						case 1:
							return $elm$core$Basics$identity;
						default:
							return $elm$core$Basics$identity;
					}
				}()(
					A2(
						$author$project$Ui$Page$link,
						$author$project$Ui$Page$Linked(status),
						A2(
							$author$project$Ui$Page$parts,
							$author$project$View$EnginePage$partTabs(m),
							A2(
								$author$project$Ui$Page$meta,
								status,
								$author$project$Ui$Page$new(title)))))));
	});
var $author$project$Model$status = function (m) {
	return (_Utils_eq(
		m.aP,
		$elm$core$Maybe$Just(0)) && _Utils_eq(m.b, $author$project$Model$Following)) ? A3(
		$elm$core$Maybe$map2,
		F2(
			function (p, e) {
				return A2(
					$elm$core$String$join,
					' · ',
					_List_fromArray(
						[
							_Utils_eq(
							m.a0,
							$elm$core$Maybe$Just(1)) ? 'SIMULATOR' : 'UNIT',
							'PART ' + $elm$core$String$fromInt(
							$author$project$Unit$partNumber(p)),
							$author$project$Unit$engineName(e)
						]));
			}),
		m.ak,
		m.t) : $elm$core$Maybe$Nothing;
};
var $author$project$View$EnginePage$view = F2(
	function (m, s) {
		var _v0 = _Utils_Tuple3(
			$author$project$Model$notice(m),
			m.aJ,
			m.aP);
		if ((((_v0.a.$ === 1) && (!_v0.b.$)) && (!_v0.c.$)) && (!_v0.c.a)) {
			var _v1 = _v0.a;
			var e = _v0.b.a;
			var _v2 = _v0.c.a;
			return A4(
				$author$project$View$EnginePage$enginePage,
				m,
				s,
				A2(
					$elm$core$Maybe$withDefault,
					'READING THE UNIT',
					$author$project$Model$status(m)),
				e);
		} else {
			return A2($author$project$View$EnginePage$connectPage, m, s);
		}
	});
var $author$project$Main$view = function (app) {
	return A2(
		$elm$html$Html$map,
		$author$project$Main$Page,
		A2($author$project$View$EnginePage$view, app.ap, app.bk));
};
var $author$project$Main$main = $elm$browser$Browser$element(
	{
		et: $author$project$Main$init,
		eZ: function (app) {
			return $elm$core$Platform$Sub$batch(
				_List_fromArray(
					[
						A2($elm$core$Platform$Sub$map, $author$project$Main$Unit, $author$project$Model$subscriptions),
						A2(
						$elm$core$Platform$Sub$map,
						$author$project$Main$Page,
						$author$project$View$EnginePage$subscriptions(app.bk))
					]));
		},
		e5: $author$project$Main$update,
		e6: $author$project$Main$view
	});
_Platform_export({'Main':{'init':$author$project$Main$main($elm$json$Json$Decode$value)(0)}});}(this));