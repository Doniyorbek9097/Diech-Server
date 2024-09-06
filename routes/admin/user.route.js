const tokenModel = require("../../models/token.model");
const otpModel = require("../../models/otp.model");
const userModel = require("../../models/user.model");
const crypto = require("crypto");
const bcrypt = require("bcrypt")
const sendEmail = require("../../utils/sendEmail");
const { sendSms } = require("../../utils/sendSms");
const { generateOTP } = require("../../utils/otpGenrater");
const { generateToken } = require("../../utils/generateToken")
const { checkToken } = require("../../middlewares/authMiddleware");

const userRoutes = async(fastify, options) => {
try {
        // GET /user/:id
fastify.get('/user/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
      const user = await userModel.findById(req.params.id)
        .populate({
          path: 'shop',
          populate: {
            path: 'products',
          },
        });
  
      if (!user) {
        return reply.status(500).send({
          message: 'Token xato',
        });
      } else {
        return  reply.send({
          message: 'success',
          data: user,
        });
      }
    } catch (error) {
      console.log(error);
      return reply.status(500).send('Serverda Xatolik ' + error.message);
    }
  });
  
  // GET /users
  fastify.get('/users', { preHandler: checkToken }, async (req, reply) => {
    try {
      const users = await userModel.find().populate('shop');
      return reply.send(users);
    } catch (error) {
      return reply.status(500).send(`Serverda xatosi: ${error.message}`);
    }
  });
  
  // POST /user-add
  fastify.post('/user-add', { preHandler: checkToken }, async (req, reply) => {
    try {
      let user = await userModel.findOne({ username: req.body?.username });
      if (user) return reply.send({ message: 'bunday username mavjud boshqa username kiriting' });
  
      user = await userModel.findOne({ phone_number: req.body?.phone_number });
      if (user) return reply.send({ message: 'bunday telefon raqam mavjud boshqa raqam kiriting' });
  
      let newUser = new userModel(req.body);
      newUser.verified = true;
      const saltPassword = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(newUser.password, saltPassword);
      newUser.token = await generateToken({
        _id: newUser._id,
        phone_number: newUser.phone_number,
        role: newUser.role,
      });
      newUser = await newUser.save();
      return reply.send({
        message: 'success created',
        data: newUser,
      });
    } catch (error) {
      console.log(error);
      return reply.status(500).send('Serverda Xatolik');
    }
  });
  
  // PUT /user-update/:id
  fastify.put('/user-update/:id', async (req, reply) => {
    try {
      let user = await userModel.findOne({ username: req.body?.username });
      if (user) return reply.send({ message: 'bunday username mavjud boshqa username kiriting' });
  
      user = await userModel.findOne({ phone_number: req.body?.phone_number });
      if (user) return reply.send({ message: 'bunday telefon raqam mavjud boshqa raqam kiriting' });
  
      const updated = await userModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return reply.send({
        message: 'success updated',
        data: updated,
      });
    } catch (error) {
      console.log(error);
      return reply.status(500).send('Serverda Xatolik');
    }
  });
  
  // DELETE /user-delete/:id
  fastify.delete('/user-delete/:id', { preHandler: checkToken }, async (req, reply) => {
    try {
      const deleted = await userModel.findByIdAndDelete(req.params.id);
      return reply.send({ data: deleted });
    } catch (error) {
      console.log(error);
      return  reply.status(500).send(`Server xatosi: ${error.message}`);
    }
  });
} catch (error) {
    console.log(error);
}

}

module.exports = userRoutes;



