var Foo = (function () {
    function Foo() {
        this.foo = 'bar';
        console.log("constructor");
    }
    Foo.prototype.sayhi = function () {
        console.log(this.foo);
    };
    return Foo;
})();
