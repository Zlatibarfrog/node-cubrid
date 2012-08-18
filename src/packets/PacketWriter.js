var DATA_TYPES = require('./../constants/DataTypes');

module.exports = PacketWriter;

/**
 * Create a new instance
 * @constructor
 */
function PacketWriter() {
  this._buffer = new Buffer(0);
  this._offset = 0;
}

/**
 * Write the current buffer content
 * @return {*}
 */
PacketWriter.prototype._toBuffer = function () {
  return this._buffer.slice(0, this._offset);
};

/**
 * Write a byte value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeByte = function (value) {
  this._allocate(DATA_TYPES.BYTE_SIZEOF);

  this._buffer[this._offset++] = value & 0xFF;
};

/**
 * Write a char value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeChar = function (value) {
  this._allocate(DATA_TYPES.BYTE_SIZEOF);

  this._buffer[this._offset++] = value.charCodeAt(0);
};

/**
 * Write a bytes array to the internal buffer
 * @param bytesCount
 * @param value
 */
PacketWriter.prototype._writeBytes = function (bytesCount, value) {
  this._allocate(bytesCount);

  for (var i = 0; i < bytesCount; i++) {
    this._buffer[this._offset++] = value[i] & 0xFF;
  }
};

/**
 * Write a short value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeShort = function (value) {
  this._allocate(DATA_TYPES.SHORT_SIZEOF);

  this._writeByte((value >> 8) & 0xFF);
  this._writeByte((value >> 0) & 0xFF);
};

/**
 * Write a integer value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeInt = function (value) {
  this._allocate(DATA_TYPES.INT_SIZEOF);

  this._writeByte((value >> 24) & 0xFF);
  this._writeByte((value >> 16) & 0xFF);
  this._writeByte((value >> 8) & 0xFF);
  this._writeByte((value >> 0) & 0xFF);
};

/**
 * Write the specified value to the internal buffer
 * @param bytesCount
 * @param fillerValue
 */
PacketWriter.prototype._writeFiller = function (bytesCount, fillerValue) {
  var fillerVal;
  this._allocate(bytesCount);

  fillerValue = typeof fillerValue != 'undefined' ? fillerValue : 0x00;

  if (typeof fillerValue == 'string') {
    fillerVal = fillerValue.charCodeAt(0);
  } else {
    fillerVal = fillerValue & 0xFF;
  }

  for (var i = 0; i < bytesCount; i++) {
    this._buffer[this._offset++] = fillerVal;
  }
};

/**
 * Write a null-terminate string to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeNullTerminatedString = function (value) {
  //Typecast undefined into '' and numbers into strings
  value = value || '';
  value = value + '';

  var count = DATA_TYPES.INT_SIZEOF + value.length + DATA_TYPES.BYTE_SIZEOF;
  this._allocate(count);

  //Write length
  this._writeInt(value.length + 1);

  //Write string content
  for (var i = 0; i < value.length; i++) {
    this._buffer[this._offset++] = value.charCodeAt(i);
  }

  //Write null-terminate
  this._buffer[this._offset++] = 0;
};

/**
 * Write a fixed-length string to the internal buffer
 * @param value
 * @param fillerValue
 * @param fixedLength
 */
PacketWriter.prototype._writeFixedLengthString = function (value, fillerValue, fixedLength) {
  var fillerVal;
  //Typecast undefined into '' and numbers into strings
  value = value || '';
  value = value + '';

  var count = value.length;
  if (count >= fixedLength) {
    count = fixedLength;
  }

  this._allocate(fixedLength);

  for (var i = 0; i < value.length; i++) {
    this._buffer[this._offset++] = value[i].charCodeAt(0);
  }

  if (typeof fillerValue == 'string') {
    fillerVal = fillerValue.charCodeAt(0);
  } else {
    fillerVal = fillerValue & 0xFF;
  }

  for (var j = 1; j <= fixedLength - count; j++) {
    this._buffer[this._offset++] = fillerVal;
  }
};

PacketWriter.prototype._writeDate = function (year, month, day) {
  this._allocate(DATA_TYPES.DATETIME_SIZEOF);

  this._writeShort(year);
  this._writeShort(month);
  this._writeShort(day);
  this._writeShort(0);
  this._writeShort(0);
  this._writeShort(0);
  this._writeShort(0);
};

PacketWriter.prototype._writeDateTime = function (year, month, day, hour, min, sec, msec) {
  this._allocate(DATA_TYPES.DATETIME_SIZEOF);

  this._writeShort(year);
  this._writeShort(month);
  this._writeShort(day);
  this._writeShort(hour);
  this._writeShort(min);
  this._writeShort(sec);
  this._writeShort(msec);
};

PacketWriter.prototype._writeTime = function (hour, min, sec) {
  this._allocate(DATA_TYPES.DATETIME_SIZEOF);

  this._writeShort(0);
  this._writeShort(0);
  this._writeShort(0);
  this._writeShort(hour);
  this._writeShort(min);
  this._writeShort(sec);
  this._writeShort(0);
};

PacketWriter.prototype._writeTimestamp = function (year, month, day, hour, min, sec) {
  this._allocate(DATA_TYPES.DATETIME_SIZEOF);

  this._writeShort(year);
  this._writeShort(month);
  this._writeShort(day);
  this._writeShort(hour);
  this._writeShort(min);
  this._writeShort(sec);
  this._writeShort(0);
};

/**
 * Write a generic object value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeBuffer = function (value) {
  var count = value.length;

  this._allocate(count);
  value.copy(this._buffer, this._offset);
  this._offset += count;
};

//TODO Optimize the performance of this function
/**
 * Allocate space to the internal buffer
 * @param count
 * @private
 */
PacketWriter.prototype._allocate = function (count) {
  if (!this._buffer) {
    this._buffer = new Buffer(count);
    return;
  }

  //Verify if we need to allocate more space
  var bytesRemaining = this._buffer.length - this._offset;
  if (bytesRemaining >= count) {
    return;
  }

  var oldBuffer = this._buffer;
  this._buffer = new Buffer(oldBuffer.length + count);
  oldBuffer.copy(this._buffer);
};