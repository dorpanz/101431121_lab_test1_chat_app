const mongoose = require('mongoose')
const studentUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  password: { type: String, required: true },
  createon: { type: String, default: new Date().toLocaleString() }
})
module.exports = mongoose.model('StudentUser', studentUserSchema)
