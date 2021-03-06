"use scrict";

const request = require('supertest');
const should = require('should');
const createServer = require('./server');
const migrate = require('./migrate');

describe('Create server', function () {
  "use strict";

  let App;

  before(function (done) {
    migrate.start()
    .then(function () {
      App = createServer();
      done()
    })
    .catch(function (error) {
      done(error);
    });
  });

  describe('#Model.extend()', function() {
    it('should create a User model and save a record', function(done) {
       let testModel = App.Model.extend({

         tableName: 'users',

         // set slug
         creating: function (model, attributes, options) {
           return this.generateSlug(this.get('first_name'))
           .then((slug) => {
             console.log(slug)
             this.set('slug', slug);
           })
           .catch(function (error) {
             done(error);
           });
         }
       });

       App.addModel('Test', testModel);

       let test = new testModel({
         first_name: 'Que',
         last_name: 'Mlilo',
         email: 'que@gmail.com'
       });

       test.should.be.an.instanceOf(testModel).and.have.property('get');
       test.getTableName().should.be.eql('users');

       test.save()
       .then(function (model) {
         model.get('slug').should.be.eql('que');
         done();
       })
       .catch(function (error) {
         done(error);
       });

    });
  });

  describe('#getModel()', function() {
    it('should return a created model', function() {
       let testModel = App.getModel('Test');
       let test = new testModel();

       test.should.have.property('get');
    });
  });

  describe('#Collection.extend()', function() {
    it('should create a collection', function() {
       let testModel = App.getModel('Test');
       let testCollection = App.Collection.extend({
         model: testModel
       });
       let collection = new testCollection();

       App.addCollection('Tests', testCollection);

       // checkif pagination plugin is working
       collection.should.have.property('fetchPage');

       collection.should.be.an.instanceOf(testCollection).and.have.property('add');
    });
  });

  describe('#getCollection()', function() {
    it('should return a previously created collection', function() {
       let testCollection = App.getCollection('Tests');
       let collection = new testCollection();

       collection.should.have.property('add');
    });
  });

  describe('#Controller.extend()', function() {
    it('should create a collection', function() {
       let testController = App.Controller.extend({
         getMyName: function () {
           return 'Que';
         },

         homePage: function (req, res) {
           res.status(200).json({title: 'Home page'});
         }
       });
       let controller = new testController();
       let myname = controller.getMyName();

       App.addController('Test', testController);

       controller.should.be.an.instanceOf(testController).and.have.property('getMyName');
       myname.should.be.eql('Que');
    });
  });

  describe('#getController()', function() {
    it('should return a previously created controller', function() {
       let controller = App.getController('Test');
       let myname = controller.getMyName();

       myname.should.be.eql('Que');
    });
  });

  describe('#get()', function(done) {
    it('should be created a get route', function() {

      App.get('/', function (req, res) {
        res.send('Home page');
      });

      request(App.server)
        .get('/')
        .expect('Home page', done);
    });
  });

  describe('#post()', function(done) {
    it('should be created a post route', function() {
      let controller = App.getController('Test');

      App.post('/user', function (req, res) {
        res.send(req.body.name);
      });

      request(App.server)
        .post('/user')
        .send({ name: 'Que' })
        .expect('Que', done);
    });
  });

  describe('#getConfig()', function() {
    it('should return server port', function() {
       let port = App.getConfig('port');

       port.should.be.eql(3000);
    });
  });

  describe('#hasController()', function() {
    it('should return true', function() {
       let hasTest = App.hasController('Test', 'getMyName');

       hasTest.should.be.true();
    });
  });

  after(function (done) {
    migrate.reset()
    .then(function () {
      require('fs').unlinkSync('./test.sqlite');
      console.log(' > Database reset complete');
      done();
    })
    .catch(function (error) {
      require('fs').unlinkSync('./test.sqlite');
      done(error);
    });
  });
});
