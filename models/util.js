const nodemailer = require('nodemailer');
const config = require('../config.js');

exports.irand = (max) => {
  return Math.floor(Math.random() * max) + 1;
};

exports.sendEmail = (fields) => {
  fields.from = fields.from || config.email.from ||
    'notifications@mathbombs.org';
  const transport = nodemailer.createTransport(config.email.nodemailer);
  transport.sendMail(fields);
};
