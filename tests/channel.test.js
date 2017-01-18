/* global describe, it */

'use strict'

let amqp = require('amqplib')
let reekoh = require('../app.js')
let isEqual = require('lodash.isequal')

describe('Channel Plugin Test', () => {
  // --- preparation

  process.env.LOGGERS = ''
  process.env.EXCEPTION_LOGGERS = ''
  process.env.INPUT_PIPE = 'demo.pipe.channel'
  process.env.PLUGIN_ID = 'demo.plugin.channel'
  process.env.BROKER = 'amqp://guest:guest@127.0.0.1/'

  let _channel = null
  let _plugin = new reekoh.plugins.Channel()

  // -- err msgs

  const ERR_RETURN_UNMATCH = 'Returned value not matched.'
  const ERR_EXPECT_REJECTION = 'Expecting rejection. Check your test data.'
  const ERR_NOT_ERRINSTANCE = 'Kindly specify a valid error to log'
  const ERR_EMPTY_LOG_DATA = 'Kindly specify the data to log'

  const ERR_EMPTY_CMD_TO_SEND = 'Kindly specify the command/message to send'
  const ERR_EMPTY_DEVICE_OR_DEVICE_TYPES = 'Kindly specify the target device types or devices'

  // -- tester connection

  amqp.connect(process.env.BROKER)
    .then((conn) => {
      return conn.createChannel()
    }).then((channel) => {
      _channel = channel
    }).catch((err) => {
      console.log(err)
    })

  // --- tests

  describe('#spawn', () => {
    it('should spawn the class without error', (done) => {
      _plugin.once('ready', () => {
        done()
      })
    })
  })

  describe('#events', () => {
    it('should rcv `data` event', (done) => {
      let dummyData = { 'foo': 'bar' }
      _channel.sendToQueue(process.env.INPUT_PIPE, new Buffer(JSON.stringify(dummyData)))

      _plugin.on('data', (data) => {
        if (!isEqual(data, dummyData)) {
          done(new Error(ERR_RETURN_UNMATCH))
        } else {
          done()
        }
      })
    })
  })

  describe('#relayMessage()', () => {
    it('should throw error if message is empty', (done) => {
      _plugin.relayMessage('', '', '')
        .then(() => {
          done(new Error(ERR_EXPECT_REJECTION))
        }).catch((err) => {
          if (!isEqual(err.message, ERR_EMPTY_CMD_TO_SEND)) {
            done(new Error(ERR_RETURN_UNMATCH))
          } else {
            done()
          }
        })
    })

    it('should throw error if device or deviceTypes is empty', (done) => {
      _plugin.relayMessage('test', '', '')
        .then(() => {
          done(new Error(ERR_EXPECT_REJECTION))
        }).catch((err) => {
          if (!isEqual(err.message, ERR_EMPTY_DEVICE_OR_DEVICE_TYPES)) {
            done(new Error(ERR_RETURN_UNMATCH))
          } else {
            done()
          }
        })
    })

    it('should publish a message to pipeline', (done) => {
      _plugin.relayMessage('test', ['a'], ['b'])
        .then(() => {
          done()
        }).catch((err) => {
          done(err)
        })
    })
  })

  describe('#logging', () => {
    describe('.log()', () => {
      it('should throw error if logData is empty', (done) => {
        _plugin.log('')
          .then(() => {
            done(new Error(ERR_EXPECT_REJECTION))
          }).catch((err) => {
            if (!isEqual(err.message, ERR_EMPTY_LOG_DATA)) {
              done(new Error(ERR_RETURN_UNMATCH))
            } else {
              done()
            }
          })
      })

      it('should send a log to logger queues', (done) => {
        _plugin.log('dummy log data')
          .then(() => {
            done()
          }).catch((err) => {
            done(err)
          })
      })
    })

    describe('.logException()', () => {
      it('should throw error if param is not an Error instance', (done) => {
        _plugin.logException('')
          .then(() => {
            done(new Error(ERR_EXPECT_REJECTION))
          }).catch((err) => {
            if (!isEqual(err.message, ERR_NOT_ERRINSTANCE)) {
              done(new Error(ERR_RETURN_UNMATCH))
            } else {
              done()
            }
          })
      })
      it('should send an exception log to exception logger queues', (done) => {
        _plugin.logException(new Error('test'))
          .then(() => {
            done()
          }).catch((err) => {
            done(err)
          })
      })
    })
  })
})
