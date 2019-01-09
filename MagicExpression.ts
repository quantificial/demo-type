export class Lexer {

    private expression: String;
    private pointer = 0;
    private c;
    private tokens: any = [];
    private token: any = null;

    constructor(expression: String) {
        this.expression = expression;

        console.log("input lexer: " + expression);
    }

    private isOperator(c) {
        return /[+\-*\/\^%=(),!&\|]/.test(c);
    }

    private isComplexOperator(input) {
        var result = /^(&{2})$|^(\|{2})$|^(={2})$/.test(input) && !(/[!]{2,}/.test(input));
        return result;
    }

    private isDigit(c) {
        return /[0-9]/.test(c);
    }

    private isWhiteSpace(c) {
        return /\s/.test(c);
    }

    private isDoubleQuote(c) {
        return /\"/.test(c);
    }

    private isIdentifier(c) {
        return typeof c === "string" && !this.isDoubleQuote(c) && !this.isOperator(c) && !this.isDigit(c) && !this.isWhiteSpace(c);
    }

    private advance() {
        this.pointer++;
        this.c = this.expression[this.pointer];
        return this.c;
    }

    private addToken(type: any, value: any) {

        this.tokens.push({
            type: type,
            value: value
        });
    }

    public process(): any {

        this.pointer = 0;

        while (this.pointer < this.expression.length) {

            this.c = this.expression[this.pointer]; // current char

            // if it is white space, ignore and advance to next character
            if (this.isWhiteSpace(this.c)) this.advance();

            else if (this.isOperator(this.c)) {
                let idn = this.c;

                // check && and ||
                let nextIdentifier = this.c + this.expression[this.pointer + 1];

                while (this.isComplexOperator(idn + this.expression[this.pointer + 1])) {
                    this.advance()
                    idn += this.c;
                }
                this.addToken('operator', idn);
                this.advance();
            }
            else if (this.isDigit(this.c)) {
                let num = this.c;
                while (this.isDigit(this.advance())) num += this.c;
                if (this.c === ".") {
                    do num += this.c;
                    while (this.isDigit(this.advance()));
                }
                let numFloat = parseFloat(num);
                if (!isFinite(numFloat)) throw "Number is too large or too small for a 64-bit double.";
                this.addToken("number", numFloat);
            }
            else if (this.isIdentifier(this.c)) {
                let idn = this.c;
                //while (!this.isOperator(this.advance())) idn += this.c;

                do {
                    this.advance();            
                    if(!this.isOperator(this.c) && this.isIdentifier(this.c)) {
                        idn+=this.c;
                    }else{
                        break;
                    }
                }while(true)

                if (String(idn).toLowerCase() == "true" || String(idn).toLowerCase() == "false") {
                    this.addToken("boolean", String(idn).toLowerCase());
                } else {
                    this.addToken("identifier", idn);
                }
            }
            else if (this.isDoubleQuote(this.c)) {
                let idn = '';
                while (!this.isDoubleQuote(this.advance())) idn += this.c;
                this.addToken("label", idn);
                this.advance();
            }
            else throw "Unrecognized token.";            
        }

        this.addToken("(end)", "(end)");            
        return this.tokens;
    }
}



//let lexer = new Lexer("(!true)&&!(false)");
let lexer = new Lexer("!!!!!false");
console.log(lexer.process())


