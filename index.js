/*jslint node: true*/

'use strict';

var proxyquire = require('proxyquire'),
    rocambole = proxyquire('rocambole', {
        'esprima': require('esprima-fb')
    });

function before(code) {
    var ast,
        ranges = [];

    ast = rocambole.parse(code);

    rocambole.recursive(ast, function (node) {
        if (node.type === 'XJSElement' && node.parent.type !== 'XJSElement') {
            ranges.push(node.range);
        }
    });

    if (ranges.length) {
        ranges = ranges.shift();
        code = [
            code.substring(0, ranges[0]),
            'null /*@XJS__START__XJS@',
            code.substring(ranges[0], ranges[1]).replace(/\*\//g, '@XJS__CONTINUE__XJS@'),
            '@XJS__END__XJS@*/',
            code.substring(ranges[1])
        ];

        code = code.join('');
        code = before(code);
    }

    return code;
}

function after(code) {
    return code
        .replace(/@XJS__CONTINUE__XJS@/g, '*/')
        .replace(/null(|;?)\ ?\/\*@XJS__START__XJS@([^]+?)@XJS__END__XJS@\*\/\ ?/g, function (all, $1, $2) {
            return $2 + ($1 || '');
        });
}

// Export the plugin
module.exports = {
    stringBefore: function (code) {
        return before(code);
    },
    stringAfter: function (code) {
        return after(code);
    }
};
