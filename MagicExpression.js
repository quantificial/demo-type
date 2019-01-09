"use strict";
exports.__esModule = true;
var Lexer = /** @class */ (function () {
    function Lexer(expression) {
        this.pointer = 0;
        this.tokens = [];
        this.token = null;
        this.expression = expression;
        console.log("input lexer: " + expression);
    }
    Lexer.prototype.isOperator = function (c) {
        return /[+\-*\/\^%=(),!&\|]/.test(c);
    };
    Lexer.prototype.isComplexOperator = function (input) {
        var result = /^(&{2})$|^(\|{2})$|^(={2})$/.test(input) && !(/[!]{2,}/.test(input));
        return result;
    };
    Lexer.prototype.isDigit = function (c) {
        return /[0-9]/.test(c);
    };
    Lexer.prototype.isWhiteSpace = function (c) {
        return /\s/.test(c);
    };
    Lexer.prototype.isDoubleQuote = function (c) {
        return /\"/.test(c);
    };
    Lexer.prototype.isIdentifier = function (c) {
        return typeof c === "string" && !this.isDoubleQuote(c) && !this.isOperator(c) && !this.isDigit(c) && !this.isWhiteSpace(c);
    };
    Lexer.prototype.advance = function () {
        this.pointer++;
        this.c = this.expression[this.pointer];
        return this.c;
    };
    Lexer.prototype.addToken = function (type, value) {
        this.tokens.push({
            type: type,
            value: value
        });
    };
    Lexer.prototype.getResult = function () {
        this.pointer = 0;
        while (this.pointer < this.expression.length) {
            this.c = this.expression[this.pointer]; // current char
            // if it is white space, ignore and advance to next character
            if (this.isWhiteSpace(this.c))
                this.advance();
            else if (this.isOperator(this.c)) {
                var idn = this.c;
                // check && and ||
                var nextIdentifier = this.c + this.expression[this.pointer + 1];
                while (this.isComplexOperator(idn + this.expression[this.pointer + 1])) {
                    this.advance();
                    idn += this.c;
                }
                this.addToken('operator', idn);
                this.advance();
            }
            else if (this.isDigit(this.c)) {
                var num = this.c;
                while (this.isDigit(this.advance()))
                    num += this.c;
                if (this.c === ".") {
                    do
                        num += this.c;
                    while (this.isDigit(this.advance()));
                }
                var numFloat = parseFloat(num);
                if (!isFinite(numFloat))
                    throw "Number is too large or too small for a 64-bit double.";
                this.addToken("number", numFloat);
            }
            else if (this.isIdentifier(this.c)) {
                var idn = this.c;
                //while (!this.isOperator(this.advance())) idn += this.c;
                do {
                    this.advance();
                    if (!this.isOperator(this.c) && this.isIdentifier(this.c)) {
                        idn += this.c;
                    }
                    else {
                        break;
                    }
                } while (true);
                if (String(idn).toLowerCase() == "true" || String(idn).toLowerCase() == "false") {
                    this.addToken("boolean", String(idn).toLowerCase());
                }
                else {
                    this.addToken("identifier", idn);
                }
            }
            else if (this.isDoubleQuote(this.c)) {
                var idn = '';
                while (!this.isDoubleQuote(this.advance()))
                    idn += this.c;
                this.addToken("label", idn);
                this.advance();
            }
            else
                throw "Unrecognized token.";
        }
        this.addToken("(end)", "(end)");
        return this.tokens;
    };
    return Lexer;
}());
exports.Lexer = Lexer;
//let lexer = new Lexer("(!true)&&!(false)");
var lexer = new Lexer("!!!!!false");
console.log(lexer.getResult());
console.log(lexer.getResult());
console.log(lexer.getResult());
