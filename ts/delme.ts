class Foo {
  foo:string = 'bar';
  constructor () {
    console.log("constructor")    
  }
  
  sayhi () {
    console.log(this.foo);
  }
    
}
