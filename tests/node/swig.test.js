var require = require('./testutils').require,
  expect = require('expect.js'),
  swig = require('../../lib/swig');

describe('swig.init', function () {

  it('accepts custom filters', function () {
    swig.init({ filters: {
      foo: function (input) {
        return 'bar';
      }
    }});
    expect(swig.compile('{{ asdf|foo }}')({ asdf: 'blah' })).to.equal('bar');
  });

  it('accepts custom extensions', function (done) {
    swig.init({
      allowErrors: true,
      extensions: { foobar: function () { done(); } },
      tags: {
        foo: function (indent) {
          return '_ext.foobar();';
        }
      }
    });
    expect(function () { swig.compile('{% foo %}')(); }).to.not.throwException();
  });

  it('accepts simpleTags - custom tag functions that return html', function (done) {
    swig.init({
      allowErrors: true,
      simpleTags: {
        foo: function (args) {
          return "Hello, World's : " + args[0];
        }
      }
    });
    expect(function () { swig.compile('{% foo %}')(); }).to.not.throwException();
    expect(swig.compile('{% foo 3 %}')()).to.match(/Hello, World's : 3/);
    done();
  });

  it('simpleTags can have default content', function (done) {
    var notablock = function () {return "Hi"; },
      notablock2 = function () {};

    notablock.ends = true;
    notablock2.ends = true;

    swig.init({
      allowErrors: true,
      simpleTags: {
        notablock: notablock,
        notablock2: notablock2
      }
    });
    expect(function () { swig.compile('{% notablock %}foo{% endnotablock %}')(); }).to.not.throwException();
    expect(swig.compile('{% notablock %}Foo{% endnotablock %}{% notablock2 %}!{% endnotablock2 %}')()).to.match(/Hi!/);
    done();
  });

  describe('allowErrors', function () {
    it('throws errors when true', function () {
      swig.init({ allowErrors: true });
      expect(function () { swig.compileFile('barfoo.html'); }).to.throwException();
    });

    if (typeof window === 'undefined') {
      it('does not throw when false, renders instead', function () {
        swig.init({
          root: __dirname + '/templates',
          allowErrors: false
        });
        expect(swig.compileFile('foobar.html').render())
          .to.match(/<pre>Error\: ENOENT, no such file or directory/i);
        expect(swig.compileFile('includes_notfound.html').render())
          .to.match(/<pre>Error\: ENOENT, no such file or directory/i);
      });
    }
  });
});


describe('swig.compileFile', function () {

  if (typeof window === 'undefined') {
    it('compiles a template from a file', function () {
      swig.init({
        root: __dirname + '/templates',
        allowErrors: true
      });
      expect(swig.compileFile('included_2.html').render({ array: [1, 1] }))
        .to.equal('2');
    });
    it('accepts an array in root config', function () {
      swig.init({
        root: ["/", __dirname + '/templates'],
        allowErrors: true
      });
      expect(swig.compileFile('included_2.html').render({ array: [1, 1] }))
        .to.equal('2');
    });
    it('accepts an array in root config and does not hangs on missing file', function () {
      swig.init({
        root: ["/", __dirname + '/templates'],
        allowErrors: true
      });
      expect(function () { swig.compileFile('notexistingFile.html').render({ array: [1, 1] }); })
        .to.throwException();
    });
    it('can use an absolute path', function () {
      swig.init({
        root: __dirname + '/templates',
        allowErrors: true
      });
      expect(swig.compileFile(__dirname + '/templates/included_2.html').render({ array: [1, 1] }))
        .to.equal('2');
    });
  }

  it('throws in a browser context', function () {
    swig.init({});
    global.window = true;
    expect(function () { swig.compileFile('foobar'); }).to.throwException();
    delete global.window;
  });

  it('can render without context', function () {
    expect(swig.compile('{% set foo = "foo" %}{{ foo }}')()).to.equal('foo');
  });
});
