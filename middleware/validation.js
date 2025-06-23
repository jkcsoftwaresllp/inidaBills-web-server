const Joi = require('joi');

const validateRegistration = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().min(2).max(255).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateDemoRequest = (req, res, next) => {
  const schema = Joi.object({
    organization: Joi.object({
      name: Joi.string().max(255).optional(),
      business_name: Joi.string().optional(),
      about: Joi.string().optional(),
      tagline: Joi.string().optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
      address_line: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      pin_code: Joi.string().optional(),
      timezone: Joi.string().optional()
    }).optional(),
    user: Joi.object({
      email: Joi.string().email().optional(),
      full_name: Joi.string().max(255).optional(),
      name: Joi.string().max(255).optional(),
      username: Joi.string().min(3).max(100).pattern(/^[a-zA-Z0-9_]+$/).optional(),
      password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).optional(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
      job_title: Joi.string().optional(),
      department: Joi.string().optional()
    }).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateDemoRequest
};