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

    public generateTokens(): any {

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


export class Parser {
    
    private pointer = 0;
    private c;
    private tokens: any = [];

    private symbols = {};
        
    constructor(tokens: any) {
        this.tokens = tokens;        
    }

    // lbp is left binding power, 
    // if the processing operator "lbp" is equal or smaller than the left node
    // the current operator node will not be binded to the left side
    //   
    //           -  <- lbp 3 , equal to lbp of '+'
    //          /  \ 
    //   lbp 3 +     3 
    //       /  \
    //      1    2  <-- lbp is 3, transferring from operator '+'
    //          
    //    lbp 3 +     
    //         /  \
    //        1    *   <-- lpb 4  (lbp is greater than the left node)
    //            / \
    //  lbp 3 -> 2   3
    //
    // nud is null denotative function
    // led is left denotative function 
    private createSymbol(id, lbp, nud, led) {
        if (!this.symbols[id]) {
            this.symbols[id] = {
                lbp: lbp,
                nud: nud,
                led: led
            };
        }
        else {
            if (nud) this.symbols[id].nud = nud;
            if (led) this.symbols[id].led = led;
            if (lbp) this.symbols[id].lbp = lbp;
        }
    };

    private interpretToken (token) {
        var F = function() {};

        if(token.type=='operator') {
            F.prototype = this.symbols[token.value];
        }else{
            F.prototype = this.symbols[token.type]
        }
        var sym = new F;
        sym.type = token.type;
        sym.value = token.value;
        return sym;
    };    


    public generateTree() {

        this.createSymbol(1,2,3,4)
        console.log(this.symbols);        
    }

    
}








//let lexer = new Lexer("(!true)&&!(false)");
let lexer = new Lexer("!!!!!false");
let tokens = lexer.generateTokens();
console.log(tokens)
let tree = new Parser(tokens)
console.log(tree.generateTree());


