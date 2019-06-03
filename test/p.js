var model = {
    message: "this is the message",
    section: {
        label1: "this is a new label",
        value1: 12345,
        enabled: false
    },
    visible: true,
    deep: {
        level: 1,
        deeper: {
            level: 2
        }
    }
};
var formState = {};
//console.log(JSON.stringify(model));
var expression = '!$model.section.enabled==true';
function funcCheckExpression(expressoin, model, formState) {
    var tokens = expression.split("&&");
    var result = true;
    console.log("result: " + result);
}
function parseAtom(expression) {
    return Number(expression);
}
//console.log(parseAtom('1234'));
//funcCheckExpression(expression, model, formState);
function lex(input) {
    var tokens = [];
    // tokenize
    return tokens;
}
var Magic = /** @class */ (function () {
    function Magic(input) {
        this.tokens = [];
        this.i = 0; // internal iterator
        this.input = input;
    }
    Magic.prototype.isOperator = function (c) { return /[+\-*\/\^%=()!,]/.test(c); };
    ;
    Magic.prototype.isDigit = function (c) { return /[0-9]/.test(c); };
    ;
    Magic.prototype.isWhiteSpace = function (c) { return /\s/.test(c); };
    ;
    Magic.prototype.isIdentifier = function (c) { return typeof c === "string" && !this.isOperator(c) && !this.isDigit(c) && !this.isWhiteSpace(c); };
    ;
    Magic.prototype.advance = function () { return this.c = this.input[++this.i]; };
    Magic.prototype.addToken = function (type, value) { this.tokens.push({ type: type, value: value }); };
    Magic.prototype.tokenize = function () {
        // process all the characters
        while (this.i < this.input.length) {
            this.c = this.input[this.i];
            if (this.isWhiteSpace(this.c)) {
                // check if it is white space and advance
                this.advance();
            }
            else if (this.isOperator(this.c)) {
                // check if it is operatgor and advance
                this.addToken("operator", this.c);
                this.advance();
            }
            else if (this.isDigit(this.c)) {
                // check if it is digit
                var num = this.c;
                while (this.isDigit(this.advance())) {
                    num += this.c;
                }
                if (this.c === ".") {
                    do {
                        num += this.c;
                    } while (this.isDigit(this.advance()));
                }
                var fnum = parseFloat(num);
                if (!isFinite(fnum))
                    throw "Number is too large or too small for a 64-bit double.";
                this.addToken("number", fnum);
            }
            else if (this.isIdentifier(this.c)) {
                // check if it is a identifier
                var idn = this.c;
                while (this.isIdentifier(this.advance()))
                    idn += this.c;
                this.addToken("identifier", idn);
            }
            else
                throw "Unrecognized token.";
        }
        this.addToken("system", "(end)");
        return this.tokens;
    };
    Magic.prototype.parse = function (tokens) {
        var parseTree = [];
        var symbols = {};
        var i = 0;
        function symbol(id, nud, lbp, led) {
            var sym = symbols[id] || {};
            symbols[id] = {
                lbp: sym.lbp || lbp,
                nud: sym.nud || nud,
                led: sym.led || led
            };
        }
        ;
        function interpretToken(token) {
            var sym = Object.create(symbols[token.type]);
            sym.type = token.type;
            sym.value = token.value;
            return sym;
        }
        ;
        function token() {
            return interpretToken(tokens[i]);
        }
        function advance() {
            i++;
            return token();
        }
        function expression(rbp) {
            var left, t = token();
            advance();
            if (!t.nud)
                throw "Unexpected token: " + t.type;
            left = t.nud(t);
            while (rbp < token().lbp) {
                t = token();
                advance();
                if (!t.led)
                    throw "Unexpected token: " + t.type;
                left = t.led(left);
            }
            return left;
        }
        function infix(id, lbp, rbp, led) {
            rbp = rbp || lbp;
            symbol(id, null, lbp, led || function (left) {
                return {
                    type: id,
                    left: left,
                    right: expression(rbp)
                };
            });
        }
        function prefix(id, rbp) {
            symbol(id, function () {
                return {
                    type: id,
                    right: expression(rbp)
                };
            });
        }
        ;
        prefix("-", 7);
        infix("^", 6, 5);
        infix("*", 4);
        infix("/", 4);
        infix("%", 4);
        infix("+", 3);
        infix("-", 3);
        symbol(",");
        symbol(")");
        symbol("(end)");
        symbol("(", function () {
            var value = expression(2);
            if (token().type !== ")")
                throw "Expected closing parenthesis ')'";
            advance();
            return value;
        });
        symbol("identifier", function (name) {
            if (token().type === "(") {
                var args = [];
                if (tokens[i + 1].type === ")")
                    advance();
                else {
                    do {
                        advance();
                        args.push(expression(2));
                    } while (token().type === ",");
                    if (token().type !== ")")
                        throw "Expected closing parenthesis ')'";
                }
                advance();
                return {
                    type: "call",
                    args: args,
                    name: name.value
                };
            }
            return name;
        });
        infix("=", 1, 2, function (left) {
            if (left.type === "call") {
                for (var i = 0; i < left.args.length; i++) {
                    if (left.args[i].type !== "identifier")
                        throw "Invalid argument name";
                }
                return {
                    type: "function",
                    name: left.name,
                    args: left.args,
                    value: expression(2)
                };
            }
            else if (left.type === "identifier") {
                return {
                    type: "assign",
                    name: left.value,
                    value: expression(2)
                };
            }
            else
                throw "Invalid lvalue";
        });
        while (token().type !== "(end)") {
            parseTree.push(expression(0));
        }
        return parseTree;
    };
    return Magic;
}());
var magic = new Magic('1+2/3=4');
var tokens = magic.tokenize();
var parseTree = magic.parse(tokens);
console.log(tokens);
console.log(parseTree);
