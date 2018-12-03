import { compileTemplate } from 'test-utils';
import { createElement, LightningElement } from '../../main';
import wire from "../wire";

const emptyTemplate = compileTemplate(`<template></template>`);

describe('wire.ts', () => {
    describe('integration', () => {
        it('should support setting a wired property in constructor', () => {
            expect.assertions(3);

            const o = { x: 1 };
            class MyComponent extends LightningElement {
                constructor() {
                    super();
                    expect('foo' in this).toBe(true);
                    this.foo = o;

                    expect(this.foo).toEqual(o);
                    expect(this.foo).not.toBe(o);
                }
            }
            MyComponent.wire = { foo: {} };

            const elm = createElement('x-foo', { is: MyComponent });
            document.body.appendChild(elm);
        });

        it('should support wired properties', () => {
            expect.assertions(2);

            const o = { x: 1 };
            class MyComponent extends LightningElement {
                injectFoo(v) {
                    this.foo = v;
                    expect(this.foo).toEqual(o);
                    expect(this.foo).not.toBe(o);
                }
            }
            MyComponent.wire = { foo: {} };
            MyComponent.publicMethods = ['injectFoo'];

            const elm = createElement('x-foo', { is: MyComponent });
            document.body.appendChild(elm);
            elm.injectFoo(o);
        });

        it('should make wired properties reactive', () => {
            let counter = 0;
            class MyComponent extends LightningElement {
                injectFoo(v) {
                    this.foo = v;
                }
                constructor() {
                    super();
                    this.foo = { x: 1 };
                }
                render() {
                    counter++;
                    this.foo.x;
                    return emptyTemplate;
                }
            }
            MyComponent.wire = { foo: {} };
            MyComponent.publicMethods = ['injectFoo'];

            const elm = createElement('x-foo', { is: MyComponent });
            document.body.appendChild(elm);
            elm.injectFoo({ x: 2 });

            return Promise.resolve().then(() => {
                expect(counter).toBe(2);
            });
        });

        it('should make properties of a wired object property reactive', () => {
            let counter = 0;
            class MyComponent extends LightningElement {
                injectFooDotX(x) {
                    this.foo.x = x;
                }
                constructor() {
                    super();
                    this.foo = { x: 1 };
                }
                render() {
                    counter++;
                    this.foo.x;
                    return emptyTemplate;
                }
            }
            MyComponent.wire = { foo: {} };
            MyComponent.publicMethods = ['injectFooDotX'];

            const elm = createElement('x-foo', { is: MyComponent });
            document.body.appendChild(elm);
            elm.injectFooDotX(2);

            return Promise.resolve().then(() => {
                expect(counter).toBe(2);
            });
        });

        it('should not proxify primitive value', function() {
            expect.assertions(1);

            class MyComponent extends LightningElement {
                injectFoo(v) {
                    this.foo = v;
                    expect(this.foo).toBe(1);
                }
            }
            MyComponent.wire = { foo: {  } };
            MyComponent.publicMethods = ['injectFoo'];

            const elm = createElement('x-foo', { is: MyComponent });
            document.body.appendChild(elm);
            elm.injectFoo(1);
        });

        it('should proxify plain arrays', function() {
            expect.assertions(2);

            const a = [];
            class MyComponent extends LightningElement {
                injectFoo(v) {
                    this.foo = v;
                    expect(this.foo).toEqual(a);
                    expect(this.foo).not.toBe(a);
                }
            }
            MyComponent.wire = { foo: {  } };
            MyComponent.publicMethods = ['injectFoo'];

            const elm = createElement('x-foo', { is: MyComponent });
            document.body.appendChild(elm);
            elm.injectFoo(a);
        });

        it('should not proxify exotic objects', function() {
            expect.assertions(2);

            class MyComponent extends LightningElement {
                injectFoo(v) {
                    this.foo = v;
                    expect(this.foo).toBe(d);
                }
            }
            MyComponent.wire = { foo: {  } };
            MyComponent.publicMethods = ['injectFoo'];

            const elm = createElement('x-foo', { is: MyComponent });
            document.body.appendChild(elm);

            const d = new Date();
            expect(() => {
                elm.injectFoo(d);
            }).toLogWarning(
                'is set to a non-trackable object'
            );
        });

        it('should not proxify non-observable object', function() {
            expect.assertions(2);

            class MyComponent extends LightningElement {
                injectFoo(v) {
                    this.foo = v;
                    expect(this.foo).toBe(o);
                }
            }
            MyComponent.wire = { foo: {  } };
            MyComponent.publicMethods = ['injectFoo'];

            const elm = createElement('x-foo', { is: MyComponent });
            document.body.appendChild(elm);

            const o = Object.create({});
            expect(() => {
                elm.injectFoo(o);
            }).toLogWarning(
                'is set to a non-trackable object'
            );
        });

        it('should not throw an error if wire is observable object', function() {
            class MyComponent extends LightningElement {
                injectFoo(v) {
                    this.foo = v;
                }
            }
            MyComponent.wire = { foo: {  } };
            MyComponent.publicMethods = ['injectFoo'];
            const elm = createElement('x-foo', { is: MyComponent });
            document.body.appendChild(elm);
            expect(() => {
                elm.injectFoo({});
            }).not.toThrow();
        });

        it('should throw a wire property is mutated during rendering', function() {
            class MyComponent extends LightningElement {
                render() {
                    this.foo = 1;
                    return emptyTemplate;
                }
            }
            MyComponent.wire = { foo: {  } };
            const elm = createElement('x-foo', { is: MyComponent });
            expect(() => {
                document.body.appendChild(elm);
            }).toThrow();
        });

    });

    describe('@wire misuse', () => {
        it('should throw when invoking wire without adapter', () => {
            class MyComponent extends LightningElement {
                constructor() {
                    super();
                    wire();
                }
            }
            expect(() => {
                createElement('x-foo', { is: MyComponent });
            }).toThrow('@wire(adapter, config?) may only be used as a decorator.');
        });
    });

});