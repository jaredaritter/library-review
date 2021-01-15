const { DateTime } = require('luxon');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxlength: 100 },
  family_name: { type: String, required: true, maxlength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtuals
AuthorSchema.virtual('name').get(function () {
  return `${this.family_name}, ${this.first_name}`;
});

AuthorSchema.virtual('date_of_birth_formatted').get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : 'Unknown';
});

AuthorSchema.virtual('date_of_death_formatted').get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : 'Unknown';
});

AuthorSchema.virtual('date_of_birth_ISODate').get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toISODate()
    : '';
});

AuthorSchema.virtual('date_of_death_ISODate').get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toISODate()
    : '';
});

AuthorSchema.virtual('lifespan').get(function () {
  const birth = this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : 'Unknown';
  const death = this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : 'Unknown';
  return `${birth} - ${death}`;
});

AuthorSchema.virtual('url').get(function () {
  return `/catalog/author/${this._id}`;
});

// Export module
module.exports = mongoose.model('Author', AuthorSchema);
