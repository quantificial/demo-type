let model = {
    'textbox1': 'this is test box 1',
    textbox2: 'this is test box 2',
    section2: {
        label1 : "this is label1",
        value : 99.99
    }
}

function greeter(person) {
    return "Hello, " + person;
}

function display_variable(a: any, b?: any, c?: any) {

    console.log("---------------------------------------");
    console.log("a: " + a);

    if(b != undefined) {
        console.log("b: " + b);
    }

    if(c != undefined) {
        console.log("c: " + c);
    }

}

function disp(name:string|string[]) { 
    if(typeof name == "string") { 
       console.log(name) 
    } else { 
       var i; 
       
       for(i = 0;i<name.length;i++) { 
          console.log(name[i])
       } 
    } 
 } 

let person = { 
    FirstName:"Tom", 
    LastName:"Hanks", 
    sayHi: ()=>{ return "Hi"} 
};

var user = "Jane User";

let a = 10.99;
let b = 20;

console.log(model);
console.log(a+b);

console.log(a==b);

display_variable(a);
display_variable(a,b);

disp(["aa","bb","cc"]);
