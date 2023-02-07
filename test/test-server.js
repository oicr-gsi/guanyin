process.env.NODE_ENV = 'test';

require('dotenv').config({ path: __dirname + '/.env' });
var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../app');
var should = chai.should(); // eslint-disable-line no-unused-vars

chai.use(chaiHttp);

describe('report', function() {
  it('should list ALL reports on /reportdb/reports GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/reports')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body[0].should.be.a('object');
        res.body[0].should.have.property('report_id');
        res.body[0].should.have.property('name');
        res.body[0].should.have.property('version');
        res.body[0].should.have.property('category');
        res.body[0].should.have.property('permitted_parameters');
        res.body.should.have.length(4);
        done();
      });
  });

  it('should list a single report on /reportdb/report/:id GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/report/1')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('report_id');
        res.body.should.have.property('name');
        res.body.should.have.property('version');
        res.body.should.have.property('category');
        res.body.should.have.property('permitted_parameters');
        res.body.report_id.should.equal(1);
        done();
      });
  });

  it('should fail to list a single report on /reportdb/report/:id GET when :id is not a number', function(done) {
    chai
      .request(server)
      .get('/reportdb/report/one')
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.not.have.property('report_id');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('must be a number');
        done();
      });
  });

  it('should fail to list a single report on /reportdb/report/:id GET when :id does not exist', function(done) {
    chai
      .request(server)
      .get('/reportdb/report/100')
      .end(function(err, res) {
        res.should.have.status(404);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.not.have.property('report_id');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('could not be found');
        done();
      });
  });

  it('should list reports on /reportdb/report?name={name} GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/report?name=jsonReport')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body[0].should.be.a('object');
        res.body[0].should.have.property('report_id');
        res.body[0].should.have.property('name');
        res.body[0].should.have.property('version');
        res.body[0].should.have.property('category');
        res.body[0].should.have.property('permitted_parameters');
        res.body[0].should.have.property('lims_entity');
        res.body[0].name.should.equal('jsonReport');
        done();
      });
  });

  it('should list ALL reports on /reportdb/report?name={name} GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/report?name=jsonReport')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.should.have.length(2);
        done();
      });
  });

  it('should list no reports on /reportdb/report?name={name} GET when {name} does not exist', function(done) {
    chai
      .request(server)
      .get('/reportdb/report?name=pretendReport')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.should.have.length(0);
        done();
      });
  });

  it('should add a SINGLE report on /reportdb/report POST', function(done) {
    chai
      .request(server)
      .post('/reportdb/report')
      .send({
        name: 'jsonReport',
        version: '2.0',
        category: 'report',
        permitted_parameters: {
          Instrument: { type: 's', required: false },
          runName: { type: 's', required: false }
        }
      })
      .end(function(err, res) {
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('report_id');
        done();
      });
  });

it('should FAIL to remove a report on /reportdb/report POST when reportid is linked to report records', function(done) {
  chai
    .request(server)
    .delete('/reportdb/report/1')
    .send({
      name: 'jsonReport',
      version: '2.0',
      category: 'report',
      permitted_parameters: {
        Instrument: { type: 's', required: false },
        runName: { type: 's', required: false }
      }
    })
    .end(function(err, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.keys('status', 'message');
      res.body.message.should.have.string('associated');
      done();
    });
});

});

/* NOT doing what is in swagger api docs
it('should FAIL to remove a report on /reportdb/report POST without reportid', function(done) {
  chai
    .request(server)
    .delete('/reportdb/report')
    .send({
      name: 'jsonReport',
      version: '2.0',
      category: 'report',
      permitted_parameters: {
        Instrument: { type: 's', required: false },
        runName: { type: 's', required: false }
      }
    })
    .end(function(err, res) {
      res.should.have.status(400);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.keys('status', 'message');
      res.body.message.should.have.string('missing');
      done();
    });
});

it('should FAIL to remove a report on /reportdb/report POST without existing reportid', function(done) {
  chai
    .request(server)
    .delete('/reportdb/report/100')
    .send({
      name: 'jsonReport',
      version: '2.0',
      category: 'report',
      permitted_parameters: {
        Instrument: { type: 's', required: false },
        runName: { type: 's', required: false }
      }
    })
    .end(function(err, res) {
      res.should.have.status(404);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.keys('status', 'message');
      res.body.message.should.have.string('Not Found');
      done();
    });
});
*/

describe('report_record', function() {
  it('should list ALL report records for id on /reportdb/report/{report_id}/records GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/report/1/records')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body[0].should.have.property('report_record_id');
        res.body[0].should.have.property('report_id');
        res.body[0].should.have.property('date_generated');
        res.body[0].should.have.property('freshest_input_date');
        res.body[0].should.have.property('files_in');
        res.body[0].should.have.property('report_path');
        res.body[0].should.have.property('notification_targets');
        res.body[0].should.have.property('notification_message');
        res.body[0].should.have.property('notification_done');
        res.body[0].should.have.property('parameters');
        res.body.should.have.length(1);
        done();
      });
  });

  it('should return an empty list of all report records for id on /reportdb/report/{report_id}/records GET if id doesn’t exist', function(done) {
    chai
      .request(server)
      .get('/reportdb/report/100/records')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.should.have.length(0);
        done();
      });
  });

  it('should list ALL report records on /reportdb/records GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/records')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body[0].should.have.property('report_record_id');
        res.body[0].should.have.property('report_id');
        res.body[0].should.have.property('date_generated');
        res.body[0].should.have.property('freshest_input_date');
        res.body[0].should.have.property('files_in');
        res.body[0].should.have.property('report_path');
        res.body[0].should.have.property('notification_targets');
        res.body[0].should.have.property('notification_message');
        res.body[0].should.have.property('notification_done');
        res.body[0].should.have.property('parameters');
        done();
      });
  });

  it('should list a single report record on /reportdb/record/:id GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/record/1')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('report_record_id');
        res.body.should.have.property('report_id');
        res.body.should.have.property('date_generated');
        res.body.should.have.property('freshest_input_date');
        res.body.should.have.property('files_in');
        res.body.should.have.property('report_path');
        res.body.should.have.property('notification_targets');
        res.body.should.have.property('notification_message');
        res.body.should.have.property('notification_done');
        res.body.should.have.property('parameters');
        res.body.report_record_id.should.equal(1);
        done();
      });
  });

  it('should FAIL to list a single report record on /reportdb/record/:id GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/record/100')
      .end(function(err, res) {
        res.should.have.status(404);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.not.have.property('report_id');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('could not be found');
        done();
      });
  });

  it('should list reports on /reportdb/report?notification_done={notification_done} GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/record?notification_done=false')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body[0].should.have.property('report_record_id');
        res.body[0].should.have.property('report_id');
        res.body[0].should.have.property('date_generated');
        res.body[0].should.have.property('freshest_input_date');
        res.body[0].should.have.property('files_in');
        res.body[0].should.have.property('report_path');
        res.body[0].should.have.property('notification_targets');
        res.body[0].should.have.property('notification_message');
        res.body[0].should.have.property('notification_done', false);
        res.body[0].should.have.property('parameters');
        res.body[0].notification_done.should.equal(false);
        done();
      });
  });

  it('should not list reports on /reportdb/report?notification_done={notification_done} GET', function(done) {
    chai
      .request(server)
      .get('/reportdb/record?notification_done=true')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.should.deep.equal([]);
        done();
      });
  });

  it('should FAIL to list reports on /reportdb/report?notification_done={notification_done} GET when not true or false', function(done) {
    chai
      .request(server)
      .get('/reportdb/record?notification_done=f')
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.not.have.property('report_id');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('must be a boolean');
        done();
      });
  });

  it('should add a single minimal report record on /reportdb/record_start?report={report_id} POST', done => {
    chai
      .request(server)
      .post('/reportdb/record_start?report=1')
      .send({
        parameters: {
          runName: '180909_D00335_0267_ACB5BQAFXX',
          instrument: 'HiSeq'
        }
      })
      .end((err, res) => {
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('report_record_id');
        done();
      });
  });

  it('should FAIL to update a SINGLE report record on /reportdb/record PATCH if missing parameters', function(done) {
    chai
      .request(server)
      .patch('/reportdb/record/5')
      .send({
        files_in: ['p1'],
        notification_targets: {},
        notification_message: 'bleck'
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('required');
        done();
      });
  });

  it('should FAIL to update a SINGLE report record on /reportdb/record PATCH id does not exist', function(done) {
    chai
      .request(server)
      .patch('/reportdb/record/100')
      .send({
        files_in: ['p1'],
        freshest_input_date: '2018-01-19T14:43:12.518Z',
        report_path: 'bleck',
        notification_targets: {},
        notification_message: 'bleck'
      })
      .end(function(err, res) {
        res.should.have.status(404);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('could not be found');
        done();
      });
  });

  it('should FAIL to update a SINGLE report record on /reportdb/record PATCH id is finished', function(done) {
    chai
      .request(server)
      .patch('/reportdb/record/1')
      .send({
        files_in: ['p1'],
        freshest_input_date: '2018-01-19T14:43:12.518Z',
        report_path: 'bleck',
        notification_targets: {},
        notification_message: 'bleck'
      })
      .end(function(err, res) {
        res.should.have.status(404);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('could not be found');
        done();
      });
  });

  it('should update a SINGLE report record on /reportdb/record PATCH', function(done) {
    chai
      .request(server)
      .patch('/reportdb/record/5')
      .send({
        files_in: ['p1'],
        freshest_input_date: '2018-01-19T14:43:12.518Z',
        report_path: 'bleck',
        notification_targets: {},
        notification_message: 'bleck'
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('Updated report record');
        done();
      });
  });

  it('should FAIL to add a single minimal report record on /reportdb/record_start/{report_id} POST when parameters are not provided', done => {
    chai
      .request(server)
      .post('/reportdb/record_start?report_id=1')
      .send({})
      .end((err, res) => {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('message');
        done();
      });
  });

  it('should add a SINGLE report record on /reportdb/record POST', function(done) {
    chai
      .request(server)
      .post('/reportdb/record')
      .send({
        report_id: 1,
        date_generated: '2018-01-19T14:43:12.518Z',
        freshest_input_date: '2018-01-19T14:43:12.518Z',
        files_in: ['p1', 'p2', 'p3', 'p4'],
        report_path:
          'https://www.hpc.oicr.on.ca/archive/web/runReports/180109_D00331_0293_BCC5BJANXX/180109_D00331_0293_BCC5BJANXX_report.html',
        notification_targets: {
          email: [
            'seqprodbio@lists.oicr.on.ca',
            'GenomeTechnologies@oicr.on.ca'
          ]
        },
        notification_message:
          'Here is the report: https://www.hpc.oicr.on.ca/archive/web/runReports/180109_D00331_0293_BCC5BJANXX/180109_D00331_0293_BCC5BJANXX_report.html',
        parameters: {
          runName: '180109_D00331_0293_BCC5BJANXX',
          instrument: 'HiSeq'
        }
      })
      .end(function(err, res) {
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('report_record_id');
        done();
      });
  });

  it('should FAIL to add a SINGLE report record on /reportdb/record  when report_id does not exist', function(done) {
    chai
      .request(server)
      .post('/reportdb/record')
      .send({
        report_id: 100,
        date_generated: '2018-01-19T14:43:12.518Z',
        freshest_input_date: '2018-01-19T14:43:12.518Z',
        files_in: ['p1', 'p2', 'p3', 'p4'],
        report_path:
          'https://www.hpc.oicr.on.ca/archive/web/runReports/180109_D00331_0293_BCC5BJANXX/180109_D00331_0293_BCC5BJANXX_report.html',
        notification_targets: {
          email: [
            'seqprodbio@lists.oicr.on.ca',
            'GenomeTechnologies@oicr.on.ca'
          ]
        },
        notification_message:
          'Here is the report: https://www.hpc.oicr.on.ca/archive/web/runReports/180109_D00331_0293_BCC5BJANXX/180109_D00331_0293_BCC5BJANXX_report.html',
        parameters: {
          runName: '180109_D00331_0293_BCC5BJANXX',
          instrument: 'HiSeq'
        }
      })
      .end(function(err, res) {
        res.should.have.status(404);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('could not be found');
        done();
      });
  });

  it('should FAIL to add a SINGLE report record on /reportdb/record  when missing parameters', function(done) {
    chai
      .request(server)
      .post('/reportdb/record')
      .send({
        report_id: 1,
        date_generated: '2018-01-19T14:43:12.518Z'
      })
      .end(function(err, res) {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.keys('status', 'message');
        done();
      });
  });

  it('should update a SINGLE report record on /reportdb/record/{report_record_id}/notification PUT', function(done) {
    chai
      .request(server)
      .put('/reportdb/record/1/notification')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('status');
        res.body.should.have.property('message');
        res.body.status.should.equal('success');
        res.body.message.should.equal('Updated report record');
        done();
      });
  });

  it('should FAIL to update a SINGLE report record on /reportdb/record/{report_record_id}/notification PUT when id does not exist', function(done) {
    chai
      .request(server)
      .put('/reportdb/record/100/notification')
      .end(function(err, res) {
        res.should.have.status(404);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.keys('status', 'message');
        res.body.message.should.have.string('could not be found');
        done();
      });
  });

  it('should get report records by given name, version and files_in', function(done) {
    chai
      .request(server)
      .post('/reportdb/record_files?name=jsonReport&version=1.1')
      .send({
        files_in: ['p1', 'p2']
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body[0].should.have.property('report_record_id');
        res.body[0].should.have.property('report_id');
        res.body[0].should.have.property('date_generated');
        res.body[0].should.have.property('freshest_input_date');
        res.body[0].should.have.property('files_in');
        res.body[0].should.have.property('report_path');
        res.body[0].should.have.property('notification_targets');
        res.body[0].should.have.property('notification_message');
        res.body[0].should.have.property('notification_done');
        res.body[0].should.have.property('parameters');
        done();
      });
  });

  it('should not find report records by non-existent given name, version and files_in', function(done) {
    chai
      .request(server)
      .post('/reportdb/record_files?name=jsonReport&version=1.1')
      .send({
        files_in: ['p1', 'p2', 'p3', 'p5']
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.should.deep.equal([]);
        done();
      });
  });

  it('should get report records by given name, version and parameters', function(done) {
    chai
      .request(server)
      .post('/reportdb/record_parameters?name=jsonReport&version=1.0')
      .send({
        parameters: {
          runName: '170623_D00331_0244_BCB1LMANXX',
          instrument: 'HiSeq'
        }
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body[0].should.have.property('report_record_id');
        res.body[0].should.have.property('report_id');
        res.body[0].should.have.property('date_generated');
        res.body[0].should.have.property('freshest_input_date');
        res.body[0].should.have.property('files_in');
        res.body[0].should.have.property('report_path');
        res.body[0].should.have.property('notification_targets');
        res.body[0].should.have.property('notification_message');
        res.body[0].should.have.property('notification_done');
        res.body[0].should.have.property('parameters');
        done();
      });
  });

  it('should not find get report records by non-existent given name, version and parameters', function(done) {
    chai
      .request(server)
      .post('/reportdb/record_parameters?name=jsonReport&version=1.0')
      .send({
        parameters: {
          runName: '170623_D00331_0244_BCB1LMANXX',
          instrument: 'MiSeq'
        }
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        res.body.should.deep.equal([]);
        done();
      });
  });
});
