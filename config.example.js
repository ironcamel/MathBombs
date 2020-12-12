
module.exports = {

  admin_email: 'admin@mathbombs.org',
  admin_password: '...',

  base_url: 'https://mathbombs.org',

  email: {
    from: 'notifications@mathbombs.org',
    nodemailer: {
      host: 'smtp.mailgun.org',
      port: 587,
      auth: {
        user: '...',
        pass: '...',
      },
    },
  },

  powerups: {
    1: { probability: 10 },
    2: { probability: 2  },
  },

};
