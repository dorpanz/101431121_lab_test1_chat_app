const mongoose = require('mongoose')
const studentPrivateMessageSchema = new mongoose.Schema({
  from_user: { type: String, required: true },
  to_user: { type: String, required: true },
  message: { type: String, required: true },
  date_sent: { type: String, default: new Date().toLocaleString() }
})
module.exports = mongoose.model('StudentPrivateMessage', studentPrivateMessageSchema)
