
var lex = function(input) {
    var isOperator = function(c) {
        return /[+\-*\/\^%=(),!&\|]/.test(c);
    },
    isComplexOperator = function(input) {
        var result = /^(&{2})$|^(\|{2})$|^(={2})$/.test(input) && !(/[!]{2,}/.test(input));
        return result;
    },
        isDigit = function(c) {
            return /[0-9]/.test(c);
        },
        isWhiteSpace = function(c) {
            return /\s/.test(c);
        },
        isDoubleQuote = function(c) {
            return /\"/.test(c);
        },
        isIdentifier = function(c) {
            return typeof c === "string" && !isDoubleQuote(c) && !isOperator(c) && !isDigit(c) && !isWhiteSpace(c);
        }
        ;

    var tokens = [],
        c, i = 0;
    var advance = function() {
        return c = input[++i];
    };
    var addToken = function(type, value) {
        tokens.push({
            type: type,
            value: value
        });
    };

    while (i < input.length) {
        c = input[i];
        if (isWhiteSpace(c)) advance();
        else if (isOperator(c)) {
            
            var idn = c;

            // check && and ||
            var nextidn = c + input[i+1];

            while(isComplexOperator(idn+input[i+1])) {
                advance()
                idn +=c;
            } 
            addToken('operator',idn);
            advance();
        }
        else if (isDigit(c)) {
            var num = c;
            while (isDigit(advance())) num += c;
            if (c === ".") {
                do num += c;
                while (isDigit(advance()));
            }
            num = parseFloat(num);
            if (!isFinite(num)) throw "Number is too large or too small for a 64-bit double.";
            addToken("number", num);
        }
        else if (isIdentifier(c)) {
            var idn = c;
            //while (isIdentifier(advance())) idn += c;
            //while (!isOperator(advance())) idn += c;

            do {
                advance();            
                if(!isOperator(c) && isIdentifier(c)) {
                    idn+=c;
                }else{
                    break;
                }
            }while(true)

            if(String(idn).toLowerCase() == "true" || String(idn).toLowerCase() == "false") {
                addToken("boolean", String(idn).toLowerCase());
            }else {
                addToken("identifier", idn);
            }
            
        }else if(isDoubleQuote(c)) {
            var idn = '';
            while (!isDoubleQuote(advance())) idn += c;
            addToken("label", idn);
            advance();
        }
        else throw "Unrecognized token.";
    }
    addToken("(end)");
    return tokens;
};

var parse = function(tokens) {

    testModel = {
        "message" : "message1"
    };

    
    var symbols = {},    
        // lbp is left binding power
        // nud is null denotative function
        // led is left denotative function 
        symbol = function(id, lbp, nud, led) {
            if (!symbols[id]) {
                symbols[id] = {
                    lbp: lbp,
                    nud: nud,
                    led: led
                };
            }
            else {
                if (nud) symbols[id].nud = nud;
                if (led) symbols[id].led = led;
                if (lbp) symbols[id].lbp = lbp;
            }
        };

    var interpretToken = function(token) {
        var F = function() {};

        if(token.type=='operator') {
            F.prototype = symbols[token.value];
        }else{
            F.prototype = symbols[token.type]
        }
        var sym = new F;
        sym.type = token.type;
        sym.value = token.value;
        return sym;
    };

    var i = 0,
        token = function() {
            return interpretToken(tokens[i]);
        };
    var advance = function() {
        i++;
        return token();
    };

    var infix = function(id, lbp, rbp, led) {
        rbp = rbp || lbp;
        symbol(id, lbp, null, led ||
        function(left) {
            return {
                type: id,
                left: left,
                right: expression(rbp)
            };
        });
    }

    var prefix = function(id, rbp, nud) {
        symbol(id, null, nud ||
        function() {
            return {
                type: id,
                right: expression(rbp)
            };
        });
    };

    var expression = function(rbp) {
        var left, t = token();
        advance();
        console.log("debug: " + JSON.stringify(t));
        if (!t.nud) throw "Unexpected token: " + t.type;
        left = t.nud(t); // call nud function to convert into 
        while (rbp < token().lbp) { // weight is lower...
            t = token();
            advance();
            if (!t.led) throw "Unexpected token: " + t.type;
            left = t.led(left);
        }
        return left;
    };

    symbol(",");
    symbol(")");
    symbol("(end)");
    
    prefix("number", 9, function(number) {
        return number;
    });

    prefix("boolean", 9, function(x) {
        return x;
    });

    prefix("label", 9, function(label) {
        return label;
    });

    prefix("identifier", 9, function(name) {
        if (token().value === "(") {
            var args = [];
            if (tokens[i + 1].value === ")") advance();
            else {
                do {
                    advance();
                    args.push(expression(2));
                } while (token().value === ",");
                if (token().value !== ")") throw "Expected closing parenthesis ')'";
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

    prefix("(", 8, function() {
        value = expression(2);
        if (token().value !== ")") throw "Expected closing parenthesis ')'";
        advance();
        return value;
    });

    prefix("!", 7);
    prefix("-", 7);
    infix("^", 6, 5);
    infix("*", 4);
    infix("/", 4);
    infix("%", 4);
    infix("+", 3);
    infix("-", 3);
    infix("==",3);
    infix("||",3);
    infix("&&",3);
   
    infix("=", 1, 2, function(left) {
        if (left.type === "call") {
            for (var i = 0; i < left.args.length; i++) {
                if (left.args[i].type !== "identifier") throw "Invalid argument name";
            }
            return {
                type: "function",
                name: left.name,
                args: left.args,
                value: expression(2)
            };
        } else if (left.type === "identifier") {
            return {
                type: "assign",
                name: left.value,
                value: expression(2)
            };
        }
        else throw "Invalid lvalue";
    });



    var parseTree = [];
    while (token().type !== "(end)") {
        parseTree.push(expression(0));
    }

    return parseTree;
};


var evaluate = function(parseTree, data) {

    var operators = {
        "+": function(a, b) {
            return a + b;
        },
        "-": function(a, b) {
            if (typeof b === "undefined") return -a;
            return a - b;
        },
        "!": function(a, b) {
            if(typeof b === "undefined") return !a;
        },
        "*": function(a, b) {
            return a * b;
        },
        "/": function(a, b) {
            return a / b;
        },
        "%": function(a, b) {
            return a % b;
        },
        "^": function(a, b) {
            return Math.pow(a, b);
        },
        "==": function(a,b) {
            return a==b;
        },
        "&&": function(a,b) {
            return a&&b;
        },
        "||": function(a,b) {
            return a||b;
        }
    };

    var variables = {
        pi: Math.PI,
        e: Math.E
    };

    var functions = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.cos,
        asin: Math.asin,
        acos: Math.acos,
        atan: Math.atan,
        abs: Math.abs,
        round: Math.round,
        ceil: Math.ceil,
        floor: Math.floor,
        log: Math.log,
        exp: Math.exp,
        sqrt: Math.sqrt,
        max: Math.max,
        min: Math.min,
        random: Math.random,
        not: (x) => {return !x;},
        model:(x) => { 
            return testModel[x]==null? false: testModel[x];
        },
        modelExists: (x) => {
            return testModel[x]==null || testModel[x] == "" ? false: true;
        }
    };
    var args = {};

    var parseNode = function(node) {
        if (node.type === "number") return node.value;
        else if(node.type === "label") return node.value;
        else if(node.type === "boolean") {
            return node.value == "true";
        }
        else if (operators[node.type]) {
            if (node.left) return operators[node.type](parseNode(node.left), parseNode(node.right));
            return operators[node.type](parseNode(node.right));
        }
        else if (node.type === "identifier") {
            var value = args.hasOwnProperty(node.value) ? args[node.value] : variables[node.value];

            if (typeof value === "undefined") {
                // search data 

                var searchKeyArray = String(node.value).split(".");

                var result = data;

                for(var i=0;i<searchKeyArray.length;i++) {
                    try {
                        result = result[searchKeyArray[i]];
                    } catch(e) {
                        value = undefined;
                        break;
                    }
                }

                value = result;
            }

            if (typeof value === "undefined") throw node.value + " is undefined";
            return value;
        }
        else if (node.type === "assign") {
            variables[node.name] = parseNode(node.value);
        }
        else if (node.type === "call") {
            for (var i = 0; i < node.args.length; i++) node.args[i] = parseNode(node.args[i]);
            return functions[node.name].apply(null, node.args);
        }
        else if (node.type === "function") {
            functions[node.name] = function() {
                for (var i = 0; i < node.args.length; i++) {
                    args[node.args[i].value] = arguments[i];
                }
                var ret = parseNode(node.value);
                args = {};
                return ret;
            };
        }
    };

    var output = "";
    console.log("tree size: " + parseTree.length)
    for (var i = 0; i < parseTree.length; i++) {
        var value = parseNode(parseTree[i]);
        if (typeof value !== "undefined") output += value + "\n";
    }
    return output;
};
var calculate = function(input) {
    try {
        var tokens = lex(input);
        var parseTree = parse(tokens);
        var output = evaluate(parseTree);
        return output;
    } catch (e) {
        return e;
    }
};

testjson = {
    "formState" : {
        "mainModel" : {
            "formId_12" : {
                "$c83d81a6a3de4531a46a1148d091c841" : 100
            }
        }
    }
}

//tokens = lex('(1==2) || false || modelExists("messagex")');
// tokens = lex(`
// a = 3
// h(x) = x / 100
// h(50)
// ! ! true
// `)
//tokens = lex('1+2-3')

// (!formState.mainModel.formId_12.$c83d81a6a3de4531a46a1148d091c841)
tokens = lex(`
!false && !!!false
`)
//sin(formState.mainModel.formId_12.$c83d81a6a3de4531a46a1148d091c841)
console.log('## LEX #########################################################')
console.log(JSON.stringify(tokens,null,2));

parseTree = parse(tokens);
console.log("");
console.log('## TREE #########################################################')
console.log(JSON.stringify(parseTree,null,2));

output = evaluate(parseTree, testjson);
console.log("");
console.log('## RESULT #########################################################')
console.log(output);


// l0 = testjson;
// console.log(l0);
// l1 = testjson["formState"];
// console.log(l1);
// l2 = l1["model"];
// console.log(l2);
// l3 = l2["formId_12"];
// console.log(l3);
// l4 = l3["$c83d81a6a3de4531a46a1148d091c841"];
// console.log(l4);
